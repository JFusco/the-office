import { intakePrompt } from './prompt';
import { IntakeRateLimit } from './rate-limits';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import type { KnowledgeRunner } from '../run-retrospective';
import { retryDelay } from '../run-retrospective';
import { collectionPolicy, collectionAllowed, readAuthority } from '../sources/collection-policy';
import type { SourceRegistry } from '../sources/registry';
import { IntakeBudget } from '../sources/launch-budget';
import { admitUnits, checkedReceipt, scanText, type SecretScanner } from '../sources/admission';
import { acceptEvidence, EvidenceResult } from '../sources/project-evidence';
import { admittedResult } from '../sources/admitted-result';
import { IntakeLedger } from './ledger';
import { LIMITS, IntakeResult, type Observation, type ReadTask, type SourceUnit } from './contracts';
import { observeRead, readArguments, readMethod } from './observations';
import { recordObservation, settlePage } from './collect';
import { acceptProposals } from './proposals';
import { annotateAuthoredUnits,independentIntakeResult } from '../digests/intake-authorship';
import { CommandFailure } from '../../workers/process';
export { readArguments } from './observations';
export async function runIntakeTask(store: Store, run: KnowledgeRunner, id: string, registry: SourceRegistry, sourceId: string, scan: SecretScanner = scanText): Promise<void> {
    const source = registry.get(sourceId); if (!source || source.homeProjectId !== store.project.id) return;
    const config = collectionPolicy(source), ledger = new IntakeLedger(store, source), task = ledger.get<ReadTask>('task', id);
    if (!collectionAllowed(registry, store, config) || !task || task.status !== 'pending' || task.sourceId !== sourceId || task.channel !== config.channels[0].id || task.sourceDigest !== config.sourceDigest) return;
    if (task.kind !== 'lookup' && ledger.get<{ sourceDigest: string }>('identity', task.channel)?.sourceDigest !== config.sourceDigest) return;
    const budget = new IntakeBudget(registry);
    if (task.failures >= 5 || Date.parse(task.nextAt) > store.clock.now().getTime()) return;
    // Successful partial pages keep cumulative failures without a current retry error.
    if (!task.nextAt) task.error = '';
    task.attempt = ledger.id(); task.status = 'running'; task.ownerClaim = store.activeClaims().find(c => c.work.id === `source:${sourceId}`)?.id || '';
    if (!budget.reserve(task.attempt, sourceId)) return;
    let cwd:string|undefined,readError:unknown,launched=false;
    const observations:Observation[]=[];
    const accept = async (result: unknown, units: SourceUnit[]) => {
        annotateAuthoredUnits(ledger,registry,config.workspace,units);
        await admitUnits(ledger, units, scan, () => collectionAllowed(registry, store, config));
        const admitted=admittedResult(ledger,config,result,units);
        const receipt = checkedReceipt(JSON.stringify(admitted.result), await scan(JSON.stringify(admitted.result)));
        ledger.put('classification-admission',task.attempt,{taskId:task.id,sourceId:config.sourceId,state:receipt.clean?'admitted':'blocked',receipt,at:store.clock.now().toISOString()});
        if(!receipt.clean){const deferred=admitted.units.map(unit=>({id:unit.id,outcome:'deferred' as const,reason:'Generated classification withheld by secret scanning; native evidence remains independently unverified'}));admitted.result=config.destination==='technical-brain'?{units:deferred,proposals:[]}:{units:deferred};}
        if (!collectionAllowed(registry, store, config)) throw Error('intake-authority-changed-after-read');
        if (config.destination === 'technical-brain') acceptProposals(ledger, config, task, independentIntakeResult(IntakeResult.parse(admitted.result),admitted.units), admitted.units);
        else {const parsed=EvidenceResult.parse(admitted.result);acceptEvidence(ledger, config, task, {...parsed,units:parsed.units.map(u=>admitted.units.some(unit=>unit.id===u.id&&unit.authorship)?{...u,outcome:'no-reusable-lesson',reason:'Confirmed Office-authored digest or identified repost; not independent corroboration'}:u)}, admitted.units);}
    };
    try {
        task.nextAt = new Date(store.clock.now().getTime() + LIMITS.timeout + retryDelay(task.failures + 1)).toISOString(); ledger.put('task',id,task);
        cwd=mkdtempSync(resolve(tmpdir(),'office-intake-read-'));
        let processing=(task.processing||[]).map(key=>ledger.get<SourceUnit>('unit',key)).filter((u):u is SourceUnit=>!!u);
        if (task.processing) {
            await admitUnits(ledger,processing,scan,()=>collectionAllowed(registry,store,config));
            processing=processing.filter(unit=>ledger.get<{state:string}>('admission',`${unit.id}:${unit.version}`)?.state==='admitted');
            if(!processing.length){const current=ledger.get<ReadTask>('task',id)!;current.status='complete';current.attempt='';current.ownerClaim='';ledger.put('task',id,current);return;}
        }
        const prompt=intakePrompt(ledger,config,task,processing);
        const result = await run<unknown>(prompt, config.destination === 'technical-brain' ? IntakeResult : EvidenceResult, { readOnly: true, effortKind: 'administrative', stage: 'knowledge-slack-intake', cwd, requestId: `source:${sourceId}`, ticket: '', enqueuedAt: task.createdAt, timeout: LIMITS.timeout, intakeConfig: readAuthority(config), intakeBinding: { registry, sourceId, sourceDigest: config.sourceDigest, homeProjectId: store.project.id, taskId: id, attempt: task.attempt }, intakeProcessing: !!task.processing,
            // Charge the actual launch to its own Eastern day, not the day the attempt was claimed.
            onIntakeLaunch: () => { launched = true; budget.launched(task.attempt); }, onIntakeNotSpawned: () => { if (!launched) budget.notSpawned(task.attempt); },
            onIntakeEvent: event => {
                let observation: Observation | undefined;
                try {
                    if (task.processing && (event as any)?.item?.type === 'mcp_tool_call') throw Error('classification-tool-forbidden');
                    observation = observeRead(event, config, task, store.clock.now().toISOString());
                } catch (error) { readError = error; throw error; }
                if (!observation) return;
                if (observations.length >= 1 || observation.bytes > LIMITS.bytes || observation.textBytes > LIMITS.text || observation.units.length > LIMITS.messages) throw Error('intake-read-budget');
                recordObservation(ledger, id, observation); observations.push(observation);
            } });
        if (task.processing) {
            // Only a still-deferred, unrequested version reopens; a stale duplicate task never resets a settled outcome.
            ledger.transaction(() => { for (const key of task.processing!) { const unit = ledger.get<SourceUnit>('unit', key); if (unit?.state === 'deferred' && !unit.requests.length) { unit.state = 'pending'; ledger.put('unit', key, unit); } } });
            await accept(result, processing);
            const current = ledger.get<ReadTask>('task', id)!; current.status = 'complete'; current.attempt = ''; current.ownerClaim = ''; ledger.put('task', id, current); return;
        }
        if (observations.length !== 1) throw Error('intake-read-unverified');
        await accept(result, observations[0].units);
        settlePage(ledger, config, task, observations[0]);
    } catch (error) {
        const current = ledger.get<ReadTask>('task', id);
        if (current?.attempt === task.attempt) {
            if (!collectionAllowed(registry, store, config)) { current.status = 'pending'; current.attempt = ''; current.ownerClaim = ''; current.nextAt = ''; current.error = 'Source changed during acquisition; retained observation not delivered'; ledger.put('task', id, current); return; }
            if (readError instanceof IntakeRateLimit) {
                current.status = 'pending'; current.attempt = ''; current.ownerClaim = ''; current.error = 'intake-rate-limited';
                current.nextAt = new Date(store.clock.now().getTime() + readError.retryAfter * 1000).toISOString();
                budget.defer(config.workspace, config.appId, readMethod(config, task.kind), current.nextAt); ledger.put('task', id, current); return;
            }
            // Operator pause or disable cancels the worker; progress and the failure allowance are retained.
            if (!readError && error instanceof CommandFailure && error.category === 'cancelled') {
                current.status = 'pending'; current.attempt = ''; current.ownerClaim = ''; current.nextAt = ''; current.error = 'intake-worker-cancelled';
                ledger.put('task', id, current); return;
            }
            // A rejected or expired continuation never changes the fixed time window. Replay deduplicates observations.
            // Capability preflight has not used the continuation. Preserve it until a reading worker actually launches.
            if (launched) delete current.cursor;
            current.failures++; current.status = current.failures >= 5 ? 'needs-attention' : 'pending'; current.attempt = ''; current.ownerClaim = '';
            current.error = String(error).slice(0, 1000); current.nextAt = new Date(store.clock.now().getTime() + retryDelay(current.failures)).toISOString();
            ledger.put('task', id, current);
        }
    } finally { if(!launched)budget.notSpawned(task.attempt);if(cwd)rmSync(cwd,{recursive:true,force:true}); }
}
