import { addDays,easternDay,easternInstant } from '../../office/clock';
import { reconcileIntakeStatus } from './operational-status';
import { scanText, type SecretScanner } from '../sources/admission';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { KnowledgeRunner } from '../run-retrospective';
import type { SourceRegistry } from '../sources/registry';
import type { KnowledgeSource } from '../sources/source-record';
import { collectionPolicy, collectionAllowed } from '../sources/collection-policy';
import { IntakeBudget } from '../sources/launch-budget';
import { IntakeLedger } from './ledger';
import { initialize, refresh } from './windows';
import { queueReconsideration } from './reconsider';
import { runSlackLinks, type LinkRecord } from './read-links';
import { runIntakeTask } from './run';
import { readMethod } from './observations';
import { lastFriday } from '../weekly-rollup';
import { LIMITS, type ReadTask } from './contracts';
import { publicSourceWork } from '../sources/public-source';
export { retrySlackIntake } from './retry';

function sourceWork(store: Store, run: KnowledgeRunner, now: Date, registry: SourceRegistry, source: KnowledgeSource, scan: SecretScanner): ScheduledWork | undefined {
    const policy = collectionPolicy(source), ledger = new IntakeLedger(store, source), budget = new IntakeBudget(registry);
    const allowed = () => collectionAllowed(registry, store, policy);
    const homeReady = () => !store.state.paused && !store.state.draining;
    const item = (key: string, at: string, execute: () => Promise<unknown>, reason: string, ready = true): ScheduledWork => ({
        store, work: { projectId: store.project.id, kind: 'knowledge-slack-intake', id: `source:${source.id}` }, stage: 'knowledge-slack-intake', rank: 5, enqueuedAt: at,
        eligibility: { state: allowed() ? ready ? 'runnable' : 'waiting' : 'blocked', reason, owner: 'Harper', nextCheckAt: ready?null:easternInstant(addDays(easternDay(now),1)).toISOString() },
        identity: () => JSON.stringify([key, registry.get(source.id)?.revision, ledger.revision(), allowed(), homeReady(), budget.used(),budget.limit(source.id)]),
        claimEligible: () => ready && allowed(),
        execute: async () => { registry.setMeta(`rotation:${store.project.id}`, source.id); await execute(); },
    });
    if (!allowed()) return;
    const tasks = ledger.all<ReadTask>('task');
    if (tasks.some(t => t.status !== 'complete' && (t.sourceDigest !== policy.sourceDigest || t.sourceId !== source.id || t.channel !== policy.channels[0].id))) {
        const blocked = item('authority', now.toISOString(), async () => undefined, 'Retained source work needs authority reconciliation', false);
        blocked.eligibility.state = 'blocked';blocked.eligibility.nextCheckAt=null; return blocked;
    }
    if (!ledger.get('channel', policy.channels[0].id)) {
        if (source.cadence === 'manual' && !source.refreshRequestedAt) return;
        return item('initialize', source.createdAt, async () => { if (allowed()) initialize(ledger, policy, now); }, 'Preparing source collection');
    }
    refresh(ledger, policy, now, source.cadence, source.refreshRequestedAt);
    if (source.refreshRequestedAt && ledger.get('meta', 'refresh-consumed') === source.refreshRequestedAt) registry.update(source.id, source.revision, s => { delete s.refreshRequestedAt; });
    queueReconsideration(ledger, policy, lastFriday(now), now.toISOString());
    const capacity = budget.used() < budget.limit(source.id);
    const links = ledger.all<LinkRecord>('link').filter(l => l.state === 'pending' && (!l.nextAt || Date.parse(l.nextAt) <= now.getTime()));
    if (links.length) return item('links', now.toISOString(), () => runSlackLinks(store, policy, run, links.slice(0, LIMITS.links), `source:${source.id}`, registry, scan), capacity ? 'Reading permitted public references' : 'Office intake launch allowance reached', capacity);
    const task = ledger.all<ReadTask>('task').filter(t => t.status === 'pending' && t.sourceId === source.id && t.sourceDigest === policy.sourceDigest && t.channel === policy.channels[0].id
        && (t.kind === 'lookup' || ledger.get<{ sourceDigest: string }>('identity', t.channel)?.sourceDigest === policy.sourceDigest)
        && (!t.nextAt || Date.parse(t.nextAt) <= now.getTime())
        && (t.processing || Date.parse(budget.backoff(policy.workspace, policy.appId, readMethod(policy, t.kind)) || '') <= now.getTime() || !budget.backoff(policy.workspace, policy.appId, readMethod(policy, t.kind))))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))[0];
    if (!task) return;
    return item(task.id, task.createdAt, () => runIntakeTask(store, run, task.id, registry, source.id, scan), capacity ? 'Source collection is due' : 'Office intake launch allowance reached', capacity);
}
export function scheduledSlackIntake(store: Store, run: KnowledgeRunner, now: Date, registry?: SourceRegistry, scan: SecretScanner = scanText): ScheduledWork[] {
    // Missing registry never falls back to config.json.
    if (!registry || registry.meta<{ state: string }>('cutover')?.state !== 'ready') {reconcileIntakeStatus(store,[],now,registry);return [];}
    const sources = registry.home(store.project.id).filter(s => s.kind === 'slack'||s.kind==='link');
    const previous = sources.findIndex(s => s.id === registry.meta<string>(`rotation:${store.project.id}`));
    const rotated = [...sources.slice(previous + 1), ...sources.slice(0, previous + 1)];
    let invalid=false;
    const work=rotated.flatMap(source => {
        try { const work = source.kind==='link'?publicSourceWork(store,run,now,registry,source,scan):sourceWork(store, run, now, registry, source, scan); return work ? [work] : []; }
        catch { invalid=true;return [{ store, work: { projectId: store.project.id, kind: 'knowledge-slack-intake' as const, id: `source:${source.id}` }, stage: 'knowledge-slack-intake', rank: 5, enqueuedAt: source.createdAt,
            eligibility: { state: 'blocked' as const, reason: 'Source configuration needs attention', owner: 'Harper', nextCheckAt: null }, identity: () => `invalid:${source.id}:${source.revision}`, execute: async () => undefined }]; }
    });
    reconcileIntakeStatus(store,work,now,registry,invalid);return work;
}
