import {bindBrainAuditEffects} from '../../../maintenance/brain/brain-audit-effects';
import {readPriorBrainAudit,assertPriorBrainAudit} from '../../../maintenance/brain/brain-audit-reuse';
import { createHash, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, lstatSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import { containedFile } from '../../../cec/workflow';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { Store } from '../../../store/store';
import type { StageResult, TicketJob, WorkTime } from '../../../../src/shared';
import { workKey } from '../../../../src/shared';
import { recordJobApproach } from '../../pipeline/approach';
import { GitOperations } from '../../../github/git-operations';
import { processGroupAlive } from '../../../workers/process';
import { currentAssignment } from '../../../workers/assignment-context';
import { HOLDS } from '../../../office/config';
import { artifact, ownedPath, terminationObservation } from '../../../store/readback-evidence';
import { continuationScope, continuationWorkerProof, assertContinuationWorker, continuationJsonArtifact, continuationWorktree } from './continuation-evidence';
import { readValidationProviderContext, validationProviderVersion } from '../validation/validation-provider-context';
import { parseBrainStatus } from '../../../maintenance/brain/brain-status';

type Ownership = { complete: boolean; fresh: boolean; expiresAt?: string; ownership?: { status: string } };
const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const Readback = z.object({ outcome: z.enum(['passed', 'blocked']), originalWorkId: z.string(),
    verifiedNoEffects: z.boolean(), summary: z.string().trim().min(1),
    evidence: z.array(z.object({ path: z.string(), summary: z.string() }).strict()).min(1) }).strict();

/** Only known, certain implementation results qualify; native/held proposals retain their own gates. */
export function implementationRecoveryCandidate(store: Store, job: TicketJob): { kind: 'candidate' | 'preflight'; work: WorkTime; result: StageResult } | undefined {
    if (store.project.id === 'brain') return brainImplementationCandidate(store, job);
    if (store.project.provider !== 'github' || store.project.id === 'brain' ||
        job.candidateRecovery || job.implementationRecovery || job.existingPR || job.pr || job.head || job.worktree || job.branch ||
        job.mergeAttempt || job.mergeIntentId || job.stage !== 'implement' || !['blocked', 'interrupted'].includes(job.status) ||
        store.project.id === 'cms-field-vocabulary' && ['GH-91', 'GH-100'].includes(job.key) ||
        job.steps.length !== 1 || job.steps[0].stage !== 'implement' ||
        job.steps.some(step => step.result.receipts.some(receipt => !receipt.verified || receipt.uncertain)) ||
        store.activeClaims().some(claim => claim.work.id === job.id) ||
        store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status))) return;
    const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    if (effects.some(row => JSON.parse(row.body).status !== 'verified')) return;
    const work = store.state.workLog?.filter(work => work.requestId === job.id && work.stage === 'github-implement').at(-1), result = job.steps[0].result;
    if (!work?.sessionId || !work.endedAt || work.role !== 'developer' || work.ticket !== job.key || !/^[a-zA-Z0-9-]+$/.test(work.id) || work.processId && processGroupAlive(work.processId)) return;
    if (work.status === 'completed' && result.outcome === 'passed' && /^[a-f0-9]{40}$/.test(result.commit) && result.worktree && result.branch && !result.prId)
        return { kind: 'candidate', work, result };
    if (work.status === 'blocked' && result.outcome === 'blocked' && !result.commit && !result.worktree && !result.branch &&
        !result.prId && result.receipts.length === 0 && result.paidRuns === 0 && result.findings.length === 1 &&
        result.findings[0].id === 'missing-assignment-identity') return { kind: 'preflight', work, result };
}

/** Reconciles a stopped original, never reruns a writer with uncertain effects. */
export async function recoverImplementation(delivery: GitHubDelivery, key: string, originalWorkId: string,
    ownership: () => Promise<Ownership>): Promise<void> {
    if (delivery.store.project.id === 'brain') return recoverBrainImplementation(delivery, key, originalWorkId, ownership);
    const { store, engine } = delivery, job = delivery.jobs.find(job => job.key === key && job.status !== 'cancelled');
    const candidate = job && implementationRecoveryCandidate(store, job);
    if (!job || !candidate || candidate.work.id !== originalWorkId || store.state.paused)
        throw new Error('Certain stopped implementation identity is required');
    const expected = digest(job), prior = structuredClone(job);
    const original = { sessionId: candidate.work.sessionId, provider: candidate.work.provider, project: digest(store.project) };
    const originalRoot = resolve(store.dataRoot, 'sessions', candidate.work.id);
    const providerPath = resolve(originalRoot, 'provider.json'), resultPath = resolve(originalRoot, 'result.json');
    if (!containedFile(providerPath, store.dataRoot) || !containedFile(resultPath, store.dataRoot) || !lstatSync(originalRoot).isDirectory() ||
        !lstatSync(providerPath).isFile() || !lstatSync(resultPath).isFile()) throw new Error('Original provider and result artifacts are missing');
    const providerContents = readFileSync(providerPath, 'utf8'), resultContents = readFileSync(resultPath, 'utf8');
    const provider = JSON.parse(providerContents), saved = JSON.parse(resultContents);
    if (provider.project !== store.project.id || provider.repository !== store.project.repository || provider.role !== 'developer' ||
        provider.provider !== candidate.work.provider || saved.session !== candidate.work.sessionId || !isDeepStrictEqual(saved.result, candidate.result))
        throw new Error('Original provider/result does not match the stopped implementation');
    let readbackProof: { worker: WorkTime; paths: string[]; contents: string[] } | undefined;
    let beforeWorkers = new Set<string>();
    const assertCurrent = (current: Ownership) => {
        if (readbackProof) {
            const workers = (store.state.workLog || []).filter(work => work.stage === 'implementation-readback' && !beforeWorkers.has(work.id));
            if (workers.length !== 1 || !isDeepStrictEqual(workers[0], readbackProof.worker) ||
                readbackProof.paths.some((path, index) => !containedFile(path, store.dataRoot) || !lstatSync(path).isFile() || readFileSync(path, 'utf8') !== readbackProof!.contents[index]))
                throw new Error('Implementation identity or live ownership changed during read-back');
        }
        const selected = implementationRecoveryCandidate(store, job);
        if (store.state.paused || delivery.jobs.find(item => item.id === job.id) !== job || digest(job) !== expected ||
            !selected || selected.kind !== candidate.kind || selected.work.id !== originalWorkId ||
            selected.work.sessionId !== original.sessionId || selected.work.provider !== original.provider || digest(store.project) !== original.project ||
            !containedFile(providerPath, originalRoot) || !containedFile(resultPath, originalRoot) ||
            readFileSync(providerPath, 'utf8') !== providerContents || readFileSync(resultPath, 'utf8') !== resultContents ||
            !current.complete || !current.fresh || current.ownership?.status !== 'clear')
            throw new Error('Implementation identity or live ownership changed during read-back');
    };
    assertCurrent(await ownership());
    const issue = await delivery.api(`issues/${Number(key.slice(3))}`);
    if (issue.state !== 'open' || issue.pull_request || !issue.assignees?.some((person: any) => person.login === 'JFusco'))
        throw new Error('Original issue is no longer open and assigned');
    const local = candidate.kind === 'candidate' ? { issue: Number(key.slice(3)), head: candidate.result.commit,
        worktree: candidate.result.worktree, branch: candidate.result.branch, summary: candidate.result.summary } : null;
    if (local) await engine.maintenance.verifyCandidate(local);
    const root = resolve(store.dataRoot, 'ticket-work', job.id), id = randomUUID();
    mkdirSync(root, { recursive: true, mode: 0o700 });
    beforeWorkers = new Set((store.state.workLog || []).map(work => work.id));
    const assessment = await engine.agents.run('lead', `READ ONLY implementation recovery for ${key}, original worker ${candidate.work.id}, native session ${candidate.work.sessionId}.
Inspect the original saved provider/result and native session evidence under ${store.dataRoot}/sessions/${candidate.work.id}, the exact issue/comments/holds and current PR/worktree inventory. Do not message or resume another session. All prior receipts must be verified and certain. Missing evidence or an existing conflicting PR/owner blocks.
Recovery kind=${candidate.kind}. ${local ? `Verify this exact clean isolated candidate ${JSON.stringify(local)} is the saved implementation of this issue. Adoption only queues independent source review and QA; it does not approve, publish or resolve any original source finding. Preserve every finding ID and required acceptance gate.` : `Only the known missing-assignment-identity preflight may be recovered. Positively inspect the complete original native execution evidence: confirm no source/worktree/branch/issue/board/provider mutation was attempted, not merely absent from a search. Return verifiedNoEffects=true only with that proof; incomplete native evidence blocks. The harness now supplies the exact Claude --session-id identity before its first tool call. A new implement assignment remains subject to ownership/holds and all review/QA gates.`}
Return originalWorkId=${candidate.work.id}, passed only for the proven disposition, and concise evidence paths. No edits, checks/generators, source acceptance, provider writes, PRs, merges, sends or nested workers. Prior state: ${JSON.stringify(prior)}`, Readback,
        { readOnly: true, stage: 'implementation-readback', requestId: job.id, ticket: key, cwd: local?.worktree || store.project.repo });
    if (assessment.outcome !== 'passed' || assessment.originalWorkId !== candidate.work.id || candidate.kind === 'preflight' && !assessment.verifiedNoEffects)
        throw new Error(assessment.summary || 'Original implementation read-back is incomplete');
    const workers = (store.state.workLog || []).filter(work => work.stage === 'implementation-readback' && !beforeWorkers.has(work.id));
    const worker = workers[0];
    if (workers.length !== 1 || worker.requestId !== job.id || worker.role !== 'lead' || worker.ticket !== key || worker.status !== 'completed' || !worker.sessionId || !worker.endedAt ||
        worker.sessionId === candidate.work.sessionId || worker.processId && processGroupAlive(worker.processId) || !/^[a-zA-Z0-9-]+$/.test(worker.id))
        throw new Error('Exactly one completed independent read-back worker is required');
    const readbackPaths = ['provider.json', 'result.json'].map(name => resolve(store.dataRoot, 'sessions', worker.id, name));
    if (!lstatSync(resolve(store.dataRoot, 'sessions', worker.id)).isDirectory() || readbackPaths.some(path => !containedFile(path, store.dataRoot) || !lstatSync(path).isFile()))
        throw new Error('Owned read-back provider/result artifacts are missing');
    const contents = readbackPaths.map(path => readFileSync(path, 'utf8'));
    const readbackProvider = JSON.parse(contents[0]), readbackResult = JSON.parse(contents[1]);
    if (readbackProvider.project !== store.project.id || readbackProvider.repository !== store.project.repository || readbackProvider.role !== 'lead' ||
        readbackProvider.provider !== worker.provider || readbackProvider.readOnly !== true || readbackResult.session !== worker.sessionId ||
        !isDeepStrictEqual(Readback.parse(readbackResult.result), assessment))
        throw new Error('Owned read-back provider/result identity or assessment disagrees');
    readbackProof = { worker: structuredClone(worker), paths: readbackPaths, contents };
    const evidenceDigests = [providerPath, resultPath, ...readbackPaths].map((path, index) => ({ path,
        summary: index < 2 ? 'Original implementation artifact' : 'Independent read-back artifact',
        sha256: createHash('sha256').update([providerContents, resultContents, ...contents][index]).digest('hex') }));
    if (local) {
        await engine.maintenance.verifyCandidate(local);
        await new GitOperations(store, delivery.execute).candidate(local.worktree, local.head);
        const prs = JSON.parse(await delivery.execute('gh', ['pr', 'list', '--repo', store.project.repository, '--head', local.branch, '--state', 'all', '--json', 'number'], { cwd: store.project.repo, readOnly: true }));
        const remote = (await delivery.execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${local.branch}`], { cwd: local.worktree, readOnly: true })).trim();
        if (!Array.isArray(prs) || prs.length || remote)
            throw new Error('Candidate publication must be reconciled separately');
    }
    const fresh = await delivery.api(`issues/${Number(key.slice(3))}`);
    if (fresh.updated_at !== issue.updated_at || fresh.state !== 'open' || !fresh.assignees?.some((person: any) => person.login === 'JFusco'))
        throw new Error('Issue changed during implementation read-back');
    assertCurrent(await ownership());
    const path = resolve(root, `${id}-implementation-readback.json`), at = store.clock.now().toISOString();
    writeFileSync(path, JSON.stringify({ prior, originalWorkId, assessment, evidenceDigests, verifiedAt: at }, null, 2), { mode: 0o600, flag: 'wx' });
    store.transaction(() => {
        const old = job.approach || candidate.result.approach;
        recordJobApproach(job, { plan: old?.plan || 'none', review: old?.review === 'full' ? 'full' : 'focused',
            validation: old?.validation === 'browser' ? 'browser' : 'independent-checks', checks: old?.checks || ['Required repository checks on the exact candidate'],
            reason: 'Verified original implementation recovery; preserve independent review and QA before publication.' }, 'lead');
        job.implementationRecovery = { workId: originalWorkId, kind: candidate.kind, at };
        if (local) {
            Object.assign(job, { head: local.head, worktree: local.worktree, branch: local.branch });
            job.candidateRecovery = { head: local.head, findingIds: [...new Set(candidate.result.findings.map(finding => finding.id))], summary: assessment.summary };
            job.stage = 'review';
        }
        job.steps.push({ stage: 'implementation-readback', result: { outcome: 'passed', summary: assessment.summary,
            commit: local?.head || '', evidence: [{ id, kind: 'review', summary: assessment.summary, path, commit: local?.head || '', environment: 'Office independent read-back', url: '', observedAt: at }],
            findings: [], receipts: [{ id, action: 'implementation-readback', target: originalWorkId, verified: true, uncertain: false, detail: JSON.stringify(assessment) }],
            previewUrl: '', worktree: local?.worktree || '', branch: local?.branch || '', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '' } });
        job.status = 'queued';
        job.detail = local ? 'Original committed candidate verified; independent review and QA queued without reimplementation.' : 'Original identity preflight positively confirmed no attempted changes; a fresh implementation assignment is queued with its own identity.';
        store.emit('implementation-reconciled', job.detail, 'lead', key);
    });
}

function brainImplementationCandidate(store: Store, job: TicketJob): { kind: 'candidate'; work: WorkTime; result: StageResult } | undefined {
    try {
        if (store.project.provider !== 'github' || job.implementationContinuation || job.implementationRecovery || job.candidateRecovery ||
            job.existingPR || job.pr || job.head || job.worktree || job.branch || job.mergeAttempt || job.mergeIntentId || job.sourceAmendment ||
            job.stage !== 'implement' || !['blocked', 'interrupted'].includes(job.status) || HOLDS[job.key] ||
            job.boardUpdates?.some(update => update.status !== 'verified') || store.activeClaims().some(claim => claim.work.id === job.id) ||
            store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status)) ||
            job.steps.some(step => step.result.receipts.some(r => !r.verified || r.uncertain))) return;
        continuationScope(store, job);
        const history = [...(job.discoveryRecoveryHistory || []), ...(job.discoveryRecovery ? [job.discoveryRecovery] : [])];
        const works = store.state.workLog?.filter(work => work.requestId === job.id && work.stage === 'github-implement') || [];
        if (!history.length || job.steps.length !== history.length * 2 + 1 || works.length !== history.length + 1 ||
            new Set(works.map(work => work.id)).size !== works.length || job.steps.some((step, index) => step.stage !== (index % 2 ? 'discovery-readback' : 'implement'))) return;
        for (let index = 0; index < history.length; index++) {
            const recovery = history[index], work = works[index], prior = job.steps[index * 2].result, readback = job.steps[index * 2 + 1].result;
            if (recovery.originalWorkId !== work.id || recovery.originalSessionId !== work.sessionId || recovery.baseline !== prior.commit ||
                prior.outcome !== 'blocked' || prior.worktree || prior.branch || prior.prId || prior.receipts.length ||
                readback.outcome !== 'passed' || !readback.receipts.some(r => r.id === recovery.requestId && r.action === 'discovery-readback' && r.target === work.id && r.verified && !r.uncertain)) return;
        }
        const work = works.at(-1)!, result = job.steps.at(-1)!.result;
        if (work.role !== 'developer' || work.provider !== 'claude' || work.status !== 'completed' || !work.sessionId || !work.endedAt ||
            work.ticket !== job.key || result.outcome !== 'passed' || !/^[a-f0-9]{40}$/.test(result.commit) || !result.worktree || !result.branch ||
            result.prId || result.paidRuns !== null && result.paidRuns !== 0 || !result.findings.some(f => f.status === 'open') ||
            job.discoveryRecovery!.findingIds.some(id => !result.findings.some(f => f.id === id)) ||
            new Set(result.findings.map(f => f.id)).size !== result.findings.length || history.some(r => r.baseline === result.commit)) return;
        terminationObservation(store, work);
        if (!isDeepStrictEqual(continuationWorkerProof(store, job, work, false, store.project.repo).result, result)) return;
        const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
        if (effects.some(row => JSON.parse(row.body).status !== 'verified')) return;
        return { kind: 'candidate', work, result };
    } catch { return; }
}

const BrainReadback = Readback.extend({ nativeSessionId: z.string(), commit: z.string(), completeNativeExecution: z.boolean(),
    effectsVerified: z.boolean(), noPaidOperations: z.boolean(), noHumanHold: z.boolean(), nativeClaimsClear: z.boolean(), nativeSessionPath: z.string().min(1), nativeRecordCount: z.number().int().positive(),
    effects: z.array(z.object({ id: z.string().min(1), kind: z.enum(['source-commit', 'worktree', 'git-fetch', 'issue-comment', 'board-status', 'private-config-copy', 'private-diagnostic', 'native-claim']),
        target: z.string().min(1), verified: z.boolean(), uncertain: z.boolean(), evidence: z.string().min(1) }).strict()) }).strict();

/** Brain adoption is an audit of real effects, never the no-effect preflight path. */
async function recoverBrainImplementation(delivery: GitHubDelivery, key: string, originalWorkId: string, ownership: () => Promise<Ownership>) {
    const { store, engine } = delivery, jobs = delivery.jobs.filter(job => job.key === key && job.status !== 'cancelled');
    const job = jobs.length === 1 ? jobs[0] : undefined, candidate = job && brainImplementationCandidate(store, job);
    const assignment = currentAssignment(), claim = assignment ? structuredClone(assignment.claim) : undefined;
    const intents = store.state.coordination?.requests?.filter(r => r.action === 'reconcile-implementation' && r.key === key && r.head === originalWorkId && r.status === 'working') || [];
    const intent = intents[0];
    if (!job || !candidate || candidate.work.id !== originalWorkId || intents.length !== 1 || intent.lane !== 'delivery' ||
        !claim || assignment?.lane !== 'delivery' || claim.stage !== intent.action || claim.work.kind !== 'reconciliation' ||
        claim.work.id !== intent.id || claim.work.projectId !== store.project.id || claim.status !== 'running') throw new Error('Exact scheduler-owned stopped Brain implementation identity required');
    const prior = structuredClone(job), scope = continuationScope(store, job), expected = digest({ job, project: store.project, intent });
    const original = continuationWorkerProof(store, job, candidate.work, false, store.project.repo);
    const worktreeIdentity = continuationWorktree(candidate.result.worktree);
    if (!isDeepStrictEqual(original.result, candidate.result)) throw new Error('Original Brain result disagrees');
    const historyFiles: ReturnType<typeof artifact>[] = [];
    const history = [...(job.discoveryRecoveryHistory || []), job.discoveryRecovery!];
    for (const [index, step] of job.steps.filter(step => step.stage === 'discovery-readback').entries()) {
        if (!step.result.evidence.length) throw new Error('Discovery proof is missing');
        for (const evidence of step.result.evidence) {
            const {file, value: proof} = continuationJsonArtifact(store, evidence.path), recovery = history[index];
            const request = store.state.coordination!.requests!.find(r => r.id === recovery.requestId)!;
            const work = store.state.workLog!.find(w => w.id === recovery.originalWorkId)!;
            if (proof.assessment?.outcome !== 'passed' || proof.assessment.verifiedNoDeliveryEffects !== true || !proof.artifacts?.length ||
                proof.assessment.originalAttemptId !== work.id || proof.assessment.originalSessionId !== work.sessionId || proof.assessment.baselineCommit !== recovery.baseline ||
                !proof.assessment.nativeClaimsClear || !isDeepStrictEqual(proof.binding, request.discoveryResume) || !isDeepStrictEqual(proof.originalWork, work) ||
                digest(proof.prior) !== request.discoveryResume!.jobDigest || digest(work) !== request.discoveryResume!.workDigest) throw new Error('Discovery proof is incomplete or unbound');
            historyFiles.push(file);
            for (const bound of proof.artifacts) {
                const captured = artifact(store, bound.path);
                if (captured.sha256 !== bound.sha256) throw new Error('Discovery evidence changed');
                historyFiles.push(captured);
            }
        }
    }
    const effectRows = () => store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    const originalEffects = digest(effectRows());
    let reader: ReturnType<typeof continuationWorkerProof> | undefined;
    let beforeReaders = new Set<string>();
    let reused: ReturnType<typeof readPriorBrainAudit>;
    const assertCurrent = (live: Ownership) => {
        const currentIntents = store.state.coordination?.requests?.filter(r => r.action === 'reconcile-implementation' && r.key === key && r.head === originalWorkId && r.status === 'working') || [];
        if (store.state.paused || HOLDS[key] || !isDeepStrictEqual(currentAssignment()?.claim, claim) ||
            currentIntents.length !== 1 || currentIntents[0] !== intent || store.state.coordination!.requests!.filter(r => r.id === intent.id).length !== 1 ||
            !store.activeClaims().some(active => isDeepStrictEqual(active, claim)) ||
            delivery.jobs.find(j => j.id === job.id) !== job || !brainImplementationCandidate(store, job) ||
            digest({ job, project: store.project, intent }) !== expected || digest(continuationScope(store, job)) !== digest(scope) || digest(effectRows()) !== originalEffects ||
            !isDeepStrictEqual(continuationWorktree(candidate.result.worktree), worktreeIdentity) ||
            !live.complete || !live.fresh || !(Date.parse(live.expiresAt || '') > Date.now()) || live.ownership?.status !== 'clear') throw new Error('Brain implementation identity, scope, claim or live ownership changed');
        assertContinuationWorker(store, original);
        if (reader) {
            const currentReaders = (store.state.workLog || []).filter(w => !beforeReaders.has(w.id) && w.requestId === job.id && w.stage === 'implementation-readback');
            if (reused ? currentReaders.length !== 0 : currentReaders.length !== 1 || currentReaders[0].id !== reader.worker.id) throw new Error('Brain audit reader inventory changed');
            assertContinuationWorker(store, reader);
            if (reused) assertPriorBrainAudit(store,reused);
        }
        if (historyFiles.some(file => !isDeepStrictEqual(artifact(store, file.path), file))) throw new Error('Discovery evidence changed');
    };
    const local = { issue: Number(key.slice(3)), head: candidate.result.commit, worktree: candidate.result.worktree, branch: candidate.result.branch, summary: candidate.result.summary };
    const gitFence = async () => {
        await engine.maintenance.verifyCandidate(local);
        await new GitOperations(store, delivery.execute).candidate(local.worktree, local.head);
        const prs = JSON.parse(await delivery.execute('gh', ['pr', 'list', '--repo', store.project.repository, '--head', local.branch, '--state', 'all', '--json', 'number'], { cwd: store.project.repo, readOnly: true }));
        const remote = (await delivery.execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${local.branch}`], { cwd: local.worktree, readOnly: true })).trim();
        if (!Array.isArray(prs) || prs.length || remote) throw new Error('Candidate publication must be reconciled separately');
        if (parseBrainStatus(JSON.parse(await delivery.execute('node', ['scripts/nightly.mjs', 'status'], { cwd: store.project.repo, readOnly: true }))).active) throw new Error('Native Brain claim is active');
        for (const [args, expected] of [[['rev-parse', 'HEAD'], local.head], [['branch', '--show-current'], local.branch], [['status', '--porcelain=v1', '--untracked-files=all'], '']] as [string[], string][]) {
            if ((await delivery.execute('git', args, { cwd: local.worktree, readOnly: true })).trim() !== expected) throw new Error('Brain candidate changed');
        }
    };
    assertCurrent(await ownership());
    const providerBefore = await readValidationProviderContext(delivery, key);
    await gitFence(); assertCurrent(await ownership());
    const before = new Set(store.state.workLog?.map(w => w.id));
    beforeReaders = before;
    const knownEffects = [...candidate.result.receipts, ...effectRows().map(row => JSON.parse(row.body))];
    reused = readPriorBrainAudit(store,job,intent,{prior,scope,local,knownEffects,original,provider:providerBefore});
    if(reused&&effectRows().length)throw new Error('Existing effect rows require a fresh separately bound audit');
    const assessment = reused ? reused.proof.result : await engine.agents.run('lead', `READ ONLY complete original native execution audit for Brain candidate recovery. Original worker ${originalWorkId}, session ${candidate.work.sessionId}, exact candidate ${JSON.stringify(local)}. Bound human scope ${JSON.stringify(scope.notes)}. Current provider facts ${JSON.stringify(providerBefore)}. Owned original evidence ${JSON.stringify(original.files)}; terminated group ${JSON.stringify(terminationObservation(store, candidate.work))}.
Read the COMPLETE native session and EVERY tool command, output and background operation. Positively account for all source commits, isolated branch/worktree, issue comments, configured board updates, native claims and private config/diagnostic copies, including administrative effects. Enumerate each known effect with exact target and native evidence; every saved receipt/effect ID must appear. Unknown commands, incomplete/denied native coverage, missing completions, unknown effects or human holds block. Preserve private data; never include secret contents. Do not assert verifiedNoEffects for a source writer. The historical paidRuns counter may be null: preserve that unknown measurement. Independently inspect every native operation and set noPaidOperations=true only when the complete execution positively proves no external paid QA/tool operation was attempted; absence of a model count is not that proof. Model-token usage is accounted separately. No source acceptance, live probes/sync/registration, edits, checks, writes, nested workers or resume/replay. Return completeNativeExecution/effectsVerified/noHumanHold/nativeClaimsClear only with positive full evidence, actual nativeSessionPath and nativeRecordCount. Adoption ONLY preserves this unaccepted candidate for a normal independent technical review; all OPEN source findings and old failures remain unchanged. Prior state ${JSON.stringify(prior)}`, BrainReadback,
        { readOnly: true, effortKind: 'administrative', stage: 'implementation-readback', requestId: job.id, ticket: key, cwd: local.worktree });
    const workers = (store.state.workLog || []).filter(w => !before.has(w.id) && w.requestId === job.id && w.stage === 'implementation-readback');
    if (!reused && (workers.length !== 1 || workers[0].role !== 'lead' || workers[0].status !== 'completed' || workers[0].sessionId === candidate.work.sessionId)) throw new Error('One independent completed Brain audit required');
    reader = reused?.proof || continuationWorkerProof(store, job, workers[0], true, local.worktree, 'reconciliation');
    const checked = BrainReadback.parse(assessment);
    if (!isDeepStrictEqual(reader.result, assessment) || reader.assignment.work.id !== (reused?.old.id || intent.id) || reader.assignment.claimId !== (reused?.claim.id || claim.id) || checked.outcome !== 'passed' ||
        checked.originalWorkId !== originalWorkId || checked.nativeSessionId !== candidate.work.sessionId || checked.commit !== local.head || checked.verifiedNoEffects ||
        !checked.completeNativeExecution || !checked.effectsVerified || !checked.noPaidOperations || !checked.noHumanHold || !checked.nativeClaimsClear ||
        !checked.effects.length || checked.effects.some(e => !e.verified || e.uncertain) || new Set(checked.effects.map(e => e.id)).size !== checked.effects.length ||
        !checked.effects.some(e => e.kind === 'source-commit' && [local.head,`${local.branch}@${local.head}`].includes(e.target)) || !checked.effects.some(e => e.kind === 'worktree' && e.target === local.worktree)) throw new Error('Positive complete Brain native effects audit required');
    const effectBindings=bindBrainAuditEffects({worktree:local.worktree,branch:local.branch,commit:local.head},knownEffects,checked.effects);
    const providerAfter = await readValidationProviderContext(delivery, key);
    await gitFence();
    if (validationProviderVersion(providerBefore) !== validationProviderVersion(providerAfter)) throw new Error('Issue/comments/holds/board changed during Brain audit');
    const live = await ownership();
    assertCurrent(live);
    const root = resolve(store.dataRoot, 'ticket-work', job.id), path = resolve(root, `${intent.id}-implementation-readback.json`), at = store.clock.now().toISOString();
    mkdirSync(root, { recursive: true, mode: 0o700 }); ownedPath(store, root);
    writeFileSync(path, JSON.stringify({ prior, originalWorkId, scope, original, reader, worktreeIdentity, assessment: checked, effectBindings, auditReuse:reused?{originalIntent:reused.old,originalClaim:reused.claim,nativeInput:reused.file,sourceNative:reused.sourceFile,otherCompletedAudits:reused.alternates.map(a=>({originalIntent:a.old,reader:a.proof}))}:null, historyFiles, providerBefore, providerAfter, verifiedAt: at }, null, 2), { flag: 'wx', mode: 0o600 });
    const proof = artifact(store, path);
    store.transaction(() => {
        assertCurrent(live);
        if (!isDeepStrictEqual(artifact(store, path), proof)) throw new Error('Brain audit changed before adoption');
        recordJobApproach(job, { plan: job.approach?.plan || 'none', review: 'full', validation: job.approach?.validation === 'browser' ? 'browser' : 'independent-checks',
            checks: job.approach?.checks || ['Required repository checks on the exact candidate'], reason: 'Saved unaccepted Brain candidate requires independent technical review, then source review and QA.' }, 'lead');
        job.implementationRecovery = { kind: 'candidate', workId: originalWorkId, at };
        job.candidateRecovery = { head: local.head, findingIds: [...new Set([...job.steps.flatMap(s => s.result.findings.map(f => f.id))])], summary: assessment.summary };
        job.implementationContinuation = { originalWorkId, originalHead: local.head, noteIds: scope.noteIds, scopeSha256: scope.scopeSha256, proofPath: path, proofSha256: proof.sha256,
            phase: 'technical-review', pendingFindingIds: candidate.result.findings.filter(f => f.status === 'open').map(f => f.id), repairFindingIds: candidate.result.findings.filter(f => f.status !== 'open').map(f => f.id), round: 0, maxRounds: 3 };
        Object.assign(job, { head: local.head, worktree: local.worktree, branch: local.branch, stage: 'review', status: 'queued', detail: 'Unaccepted saved candidate preserved; Sam technical review queued. Source activation and acceptance remain pending.' });
        job.steps.push({ workerId: reader!.worker.id, stage: 'implementation-readback', result: { ...structuredClone(candidate.result), findings: [], receipts: [], evidence: [{ id: intent.id, kind: 'review', path, commit: local.head, summary: assessment.summary, environment: 'Office administrative native audit', url: '', observedAt: at }] } });
        intent.status = 'completed'; intent.detail = job.detail;
        store.emit('implementation-reconciled', job.detail, 'lead', key);
    });
}

/** Original findings stay required through independent review and QA. */
export function recoveredFindingsResolved(job: TicketJob, stage: string, result: StageResult): boolean {
    return job.implementationRecovery?.kind !== 'candidate' || !['review', 'validate'].includes(stage) ||
        !job.candidateRecovery?.findingIds.some(id => !result.findings.some(finding => finding.id === id &&
            (stage === 'validate' ? finding.status === 'verified' : finding.status !== 'open')));
}
