import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import type { Store } from '../../../store/store';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { HarnessRequest, StageResult, TicketJob, WorkTime } from '../../../../src/shared';
import { workKey } from '../../../../src/shared';
import { processGroupAlive } from '../../../workers/process';
import { parseBrainStatus } from '../../../maintenance/brain/brain-status';
import { GitHubOperations } from '../../../github/github-operations';
import { recordJobApproach } from '../../pipeline/approach';

const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rawHash = (value: string) => createHash('sha256').update(value).digest('hex');
export const DiscoveryResumeInput = z.object({ noteId: z.string().uuid() }).strict();
const Assessment = z.object({ contract: z.literal('discovery-delivery-effects-v3'), outcome: z.enum(['passed', 'blocked']), originalAttemptId: z.string(),
    originalSessionId: z.string(), verifiedNoDeliveryEffects: z.boolean(), baselineCommit: z.string(),
    administrativeEffects: z.array(z.object({ kind: z.enum(['git-fetch', 'private-diagnostic-file', 'private-diagnostic-directory']), target: z.string(), status: z.enum(['succeeded', 'failed', 'unknown']), summary: z.string().min(1) }).strict()).max(12),
    nativeClaimsClear: z.boolean(), summary: z.string().min(1),
    findings: z.array(z.object({ id: z.string(), disposition: z.string().min(1) }).strict()).min(1),
    references: z.array(z.object({ locator: z.string(), summary: z.string() }).strict()).min(1) }).strict();
type Ownership = { complete: boolean; fresh: boolean; ownership?: { status: string } };

/** An article-access preflight may be resumed; a stopped native run or source candidate may not. */
export function discoveryRecoveryCandidate(store: Store, job: TicketJob): { work: WorkTime; result: StageResult } | undefined {
    if (store.project.provider !== 'github' || store.project.id !== 'brain' || job.implementationRecovery ||
        job.candidateRecovery || job.existingPR || job.pr || job.head || job.branch || job.worktree || job.mergeIntentId || job.mergeAttempt ||
        job.stage !== 'implement' || job.status !== 'blocked' || !job.steps.length || job.steps.at(-1)?.stage !== 'implement' ||
        job.boardUpdates?.some(update => update.status !== 'verified') || store.activeClaims().some(claim => claim.work.id === job.id) ||
        store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status))) return;
    const recoveries = [...(job.discoveryRecoveryHistory || []), ...(job.discoveryRecovery ? [job.discoveryRecovery] : [])];
    const implementationSteps = job.steps.filter(step => step.stage === 'implement');
    // Every earlier attempt must have exactly one completed harness continuation, in order.
    if (job.steps.length !== recoveries.length * 2 + 1 || implementationSteps.length !== recoveries.length + 1 ||
        job.steps.some((step, index) => step.stage !== (index % 2 ? 'discovery-readback' : 'implement')) ||
        new Set(recoveries.map(recovery => recovery.originalWorkId)).size !== recoveries.length) return;
    const result = job.steps.at(-1)!.result;
    if (result.outcome !== 'blocked' || !/^[a-f0-9]{40}$/.test(result.commit) || result.worktree || result.branch || result.prId ||
        result.previewUrl || result.receipts.length || result.paidRuns !== 0 || !result.findings.length) return;
    const works = store.state.workLog?.filter(work => work.requestId === job.id && work.stage === 'github-implement') || [];
    if (works.length !== implementationSteps.length) return;
    for (let index = 0; index < recoveries.length; index++) {
        const recovery = recoveries[index], request = store.state.coordination!.requests?.find(request => request.id === recovery.requestId);
        const readback = job.steps[index * 2 + 1].result, original = works[index];
        if (recovery.originalWorkId !== original.id || recovery.originalSessionId !== original.sessionId ||
            !request || request.status !== 'completed' || request.action !== 'resume-discovery' || request.key !== job.key ||
            request.head !== original.id || !request.discoveryResume || request.discoveryResume.noteId !== recovery.noteId ||
            readback.outcome !== 'passed' || !readback.receipts.some(receipt => receipt.id === request.id &&
                receipt.action === 'discovery-readback' && receipt.target === original.id && receipt.verified && !receipt.uncertain)) return;
    }
    const work = works.at(-1)!;
    if (recoveries.some(recovery => recovery.originalWorkId === work.id)) return;
    if (work.role !== 'developer' || work.provider !== 'claude' || work.status !== 'blocked' || !work.sessionId || !work.endedAt ||
        work.processId && processGroupAlive(work.processId)) return;
    const effects = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[];
    // A discovery continuation never reconciles or replays ANY recorded effect.
    if (effects.length) return;
    return { work, result };
}
function ownedArtifact(store: Store, workId: string, name: string) {
    if (!/^[a-zA-Z0-9-]+$/.test(workId)) throw new Error('Invalid worker artifact identity');
    const root = realpathSync(store.dataRoot), path = resolve(root, 'sessions', workId, name);
    const parts = relative(root, path).split(sep);
    let current = root;
    for (const part of parts) { current = resolve(current, part); if (lstatSync(current).isSymbolicLink()) throw new Error('Symlinked worker artifact'); }
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.size > 8 * 1024 * 1024 || !realpathSync(path).startsWith(root + sep)) throw new Error('Invalid owned worker artifact');
    const body = readFileSync(path, 'utf8'); return { path, sha256: rawHash(body), body, value: JSON.parse(body) };
}
function diagnosticProof(store: Store, job: TicketJob, target: string, directory: boolean) {
    const dataRoot = resolve(store.dataRoot), root = resolve(dataRoot, 'ticket-work', job.id), path = resolve(target);
    if (directory ? path !== root : !job.steps.at(-1)!.result.evidence.some(evidence => resolve(evidence.path) === path) || !path.startsWith(root + sep)) throw new Error('Administrative evidence is outside the original job');
    let current = dataRoot;
    for (const part of relative(dataRoot, path).split(sep)) { current = resolve(current, part); if (lstatSync(current).isSymbolicLink()) throw new Error('Administrative evidence is symlinked'); }
    const stat = lstatSync(path);
    if (!realpathSync(path).startsWith(realpathSync(store.dataRoot) + sep)) throw new Error('Administrative evidence escaped its owning store');
    if (directory ? !stat.isDirectory() : !stat.isFile() || stat.size > 8 * 1024 * 1024) throw new Error('Administrative evidence type or size differs');
    return { path, directory, sha256: directory ? null : createHash('sha256').update(readFileSync(path)).digest('hex') };
}
function scopeNote(store: Store, job: TicketJob, work: WorkTime, noteId: string) {
    const note = store.state.projectNotes.find(note => note.id === noteId && note.ticket === job.key);
    const original = note && store.state.messages.find(message => message.id === note.requestId && message.from === 'human' &&
        message.to === 'pm' && message.ticket === job.key && message.status === 'answered');
    const prior = job.discoveryRecovery && store.state.coordination!.requests?.find(request => request.id === job.discoveryRecovery!.requestId);
    const inherited = !!note && !!original && prior?.status === 'completed' && prior.action === 'resume-discovery' &&
        prior.key === job.key && prior.head === job.discoveryRecovery!.originalWorkId && prior.discoveryResume?.noteId === noteId &&
        prior.discoveryResume.scopeDigest === hash({ note, original });
    if (!note || !original || !Number.isFinite(Date.parse(note.createdAt)) || !Number.isFinite(Date.parse(work.endedAt)) ||
        Date.parse(note.createdAt) <= Date.parse(work.endedAt) && !inherited || original.error ||
        original.receipts.some(receipt => !receipt.verified || receipt.uncertain)) throw new Error('A newer confirmed human discovery instruction is required');
    return { note, original };
}
export function bindDiscoveryResume(store: Store, key: string, workId: string, input: unknown) {
    const { noteId } = DiscoveryResumeInput.parse(input), jobs = store.state.coordination!.jobs!.filter(job => job.key === key && job.status !== 'cancelled');
    const candidate = jobs.length === 1 && discoveryRecoveryCandidate(store, jobs[0]);
    if (!candidate || candidate.work.id !== workId || store.state.paused || store.state.draining) throw new Error('An inactive discovery-only original is required');
    const note = scopeNote(store, jobs[0], candidate.work, noteId);
    return { noteId, scopeDigest: hash(note), jobDigest: hash(jobs[0]), workDigest: hash(candidate.work) };
}

/** Scheduler-owned, read-only reconciliation; a successful receipt queues exactly one fresh delivery attempt. */
export async function recoverDiscovery(delivery: GitHubDelivery, request: HarnessRequest, ownership: () => Promise<Ownership>) {
    const { store, engine } = delivery, jobs = delivery.jobs.filter(job => job.key === request.key && job.status !== 'cancelled');
    const job = jobs.length === 1 ? jobs[0] : undefined, candidate = job && discoveryRecoveryCandidate(store, job), binding = request.discoveryResume;
    if (!job || !candidate || candidate.work.id !== request.head || !binding || hash(job) !== binding.jobDigest ||
        hash(candidate.work) !== binding.workDigest) throw new Error('Discovery resume identity changed');
    const scope = scopeNote(store, job, candidate.work, binding.noteId);
    if (hash(scope) !== binding.scopeDigest) throw new Error('Discovery scope changed');
    const prior = structuredClone(job), projectDigest = hash(store.project), originalWork = structuredClone(candidate.work);
    const artifacts = [ownedArtifact(store, candidate.work.id, 'provider.json'), ownedArtifact(store, candidate.work.id, 'result.json')];
    const provider = artifacts[0].value, saved = artifacts[1].value;
    if (provider.project !== store.project.id || provider.repository !== store.project.repository || provider.role !== 'developer' ||
        provider.provider !== candidate.work.provider || saved.session !== candidate.work.sessionId || !isDeepStrictEqual(saved.result, candidate.result)) throw new Error('Original discovery provider/result mismatch');
    const api = new GitHubOperations(store, delivery.execute), number = Number(job.key.slice(3));
    const issue = await api.issue(number), comments = await api.comments(number), board = await engine.github.board();
    const liveFence = async () => {
        const visibility = await ownership();
        if (!visibility.complete || !visibility.fresh || visibility.ownership?.status !== 'clear') throw new Error('Discovery ownership is not clear');
        const status = parseBrainStatus(JSON.parse(await delivery.execute('node', ['scripts/nightly.mjs', 'status'], { cwd: store.project.repo, readOnly: true, timeout: 60000 })));
        if (status.active) throw new Error('A native Brain run is active; preserve its authority');
    };
    const administrativeProofs: ReturnType<typeof diagnosticProof>[] = [];
    let fetchConfiguration: { origin: string; refspec: string } | undefined;
    const readFetchConfiguration = async () => {
        const options = { cwd: store.project.repo, readOnly: true, timeout: 10000 };
        const origin = (await delivery.execute('git', ['remote', 'get-url', 'origin'], options)).trim();
        const refspec = (await delivery.execute('git', ['config', '--get-all', 'remote.origin.fetch'], options)).trim();
        if (origin !== `https://github.com/${store.project.repository}.git` || refspec !== '+refs/heads/*:refs/remotes/origin/*') throw new Error('Unproven ordinary fetch configuration');
        return { origin, refspec };
    };
    const assertCurrent = () => {
        if (store.state.paused || store.state.draining || hash(store.project) !== projectDigest || hash(job) !== binding.jobDigest ||
            delivery.jobs.find(value => value.id === job.id) !== job || !discoveryRecoveryCandidate(store, job) ||
            hash(store.state.workLog?.find(work => work.id === originalWork.id)) !== hash(originalWork) ||
            hash(scopeNote(store, job, originalWork, binding.noteId)) !== binding.scopeDigest) throw new Error('Discovery original or scope changed during reconciliation');
        for (const proof of administrativeProofs) if (!isDeepStrictEqual(diagnosticProof(store, job, proof.path, proof.directory), proof)) throw new Error('Administrative evidence changed');
        for (const artifact of artifacts) if (ownedArtifact(store, artifact.path.split(sep).at(-2)!, artifact.path.split(sep).at(-1)!).sha256 !== artifact.sha256) throw new Error('Discovery evidence changed');
    };
    if (issue.state !== 'open' || !issue.assignees?.some((person: any) => person.login === 'JFusco') || !board || board.error ||
        !['Ready', 'In progress'].includes(board.items.find(item => item.repository === store.project.repository && item.number === number)?.status || '')) throw new Error('Discovery issue, assignment or lane changed');
    await liveFence(); assertCurrent();
    const before = new Set(store.state.workLog?.map(work => work.id));
    const administrativeTargets = [...new Set([store.project.repo, resolve(store.dataRoot, 'ticket-work', job.id), ...candidate.result.evidence.map(evidence => evidence.path)])] as [string, ...string[]];
    const assessmentSchema = Assessment.extend({ originalAttemptId: z.literal(candidate.work.id), originalSessionId: z.literal(candidate.work.sessionId), administrativeEffects: z.array(Assessment.shape.administrativeEffects.element.extend({ target: z.enum(administrativeTargets) })).max(12) });
    const assessment = await engine.agents.run('lead', `READ ONLY stopped discovery reconciliation for ${job.key}. The actual original is ${candidate.work.id}, native session ${candidate.work.sessionId}. Read its complete native execution evidence and the saved Office provider/result under ${store.dataRoot}/sessions/${candidate.work.id}. Positively prove NO DELIVERY EFFECT: no source edits, worktree or local delivery-branch creation/change, issue/comment/board mutation, outbound provider write, native Brain claim, or source candidate creation/attempt. Ordinary git fetch origin (local remote-ref/object-cache refresh only) and writes/creation of the ORIGINAL job private diagnostic files/directory are permitted administrative preflight effects ONLY when fully enumerated from complete native execution. For every administrative effect record status=succeeded,failed,or unknown. A positively identified ordinary git fetch origin may have status=failed or unknown when its individual exit code was masked: that refreshes only remote refs/object cache, does not itself create a delivery candidate, and MUST NOT be called an uncertain delivery write. Its full command and matching terminal tool result must still prove no source/local delivery-branch change, remote write, lingering operation or other side effect. Preserve the fetch outcome uncertainty explicitly. Private diagnostic effects require status=succeeded and positive actual saved-file evidence. For git-fetch the target MUST be the absolute repository directory ${store.project.repo}; for private-diagnostic-file choose the exact original evidence path, and for private-diagnostic-directory use ${resolve(store.dataRoot, 'ticket-work', job.id)}. List every such administrative effect with exact target,status,and evidence summary. Unknown command identity, incomplete native history, an unterminated operation, or any uncertain DELIVERY effect blocks. An unknown git-fetch exit alone does not block when that exact read/cache operation is positively isolated; do not infer that the fetch succeeded. A claim of no delivery effects must not deny these real administrative effects. Absence from a search or a model summary alone is insufficient. Its commit ${candidate.result.commit} is a pre-existing baseline, never a candidate. Incomplete native evidence blocks. Do not resume or message any other session.
The newer human instruction and durable project note are ${JSON.stringify(scope)}. Read current issue/comments and holds: ${JSON.stringify({ issue, comments })}. Explain disposition of EVERY original finding by ID against that revised discovery instruction; do not claim source access or catalog acceptance from scope permission. Earlier429evidence stays unchanged. Confirm source work may be attempted under the revised instruction, not that it will succeed. No new probes, edits, checks/generators, native claims, external writes, PRs, sends or nested workers. Return originalAttemptId=${candidate.work.id} (worker attempt, NOT job/request ${job.id}), originalSessionId=${candidate.work.sessionId}, baselineCommit=${candidate.result.commit} and verifiedNoDeliveryEffects/nativeClaimsClear only with positive evidence; references are semantic locators and are not files to open or hash. Original result: ${JSON.stringify(candidate.result)}`, assessmentSchema,
        { readOnly: true, effortKind: 'administrative', stage: 'discovery-readback', requestId: job.id, ticket: job.key, cwd: store.project.repo });
    if (assessment.outcome !== 'passed' || !assessment.verifiedNoDeliveryEffects || !assessment.nativeClaimsClear || assessment.originalAttemptId !== originalWork.id ||
        assessment.originalSessionId !== originalWork.sessionId || assessment.baselineCommit !== candidate.result.commit ||
        assessment.findings.length !== candidate.result.findings.length || new Set(assessment.findings.map(finding => finding.id)).size !== assessment.findings.length ||
        candidate.result.findings.some(finding => !assessment.findings.some(value => value.id === finding.id))) throw new Error(assessment.summary || 'Discovery no-effect proof is incomplete');
    const administrativeKeys = new Set<string>();
    for (const effect of assessment.administrativeEffects) {
        const key = `${effect.kind}:${effect.target}`;
        if (administrativeKeys.has(key)) throw new Error('Duplicate administrative effect');
        administrativeKeys.add(key);
        if (effect.status !== 'succeeded' && !(effect.kind === 'git-fetch' && ['failed', 'unknown'].includes(effect.status))) throw new Error('Administrative diagnostic completion is unproven');
        if (effect.kind === 'git-fetch') {
            if (resolve(effect.target) !== resolve(store.project.repo)) throw new Error('Administrative fetch belongs to another repository');
            if (effect.status !== 'succeeded') fetchConfiguration = await readFetchConfiguration();
        } else administrativeProofs.push(diagnosticProof(store, job, effect.target, effect.kind === 'private-diagnostic-directory'));
    }
    const matchingReadbacks = () => (store.state.workLog || []).filter(work => !before.has(work.id) && work.requestId === job.id && work.stage === 'discovery-readback');
    const readbacks = matchingReadbacks();
    if (readbacks.length !== 1) throw new Error('Exactly one correlated independent discovery readback is required');
    const reader = structuredClone(readbacks[0]);
    if (reader.role !== 'lead' || reader.provider !== 'codex' || reader.status !== 'completed' || !reader.endedAt || !reader.sessionId ||
        reader.processId && processGroupAlive(reader.processId)) throw new Error('Independent discovery readback is not terminated');
    const independent = [ownedArtifact(store, reader.id, 'provider.json'), ownedArtifact(store, reader.id, 'result.json'), ownedArtifact(store, reader.id, 'assignment-identity.json')];
    if (independent[0].value.project !== store.project.id || independent[0].value.repository !== store.project.repository || independent[0].value.role !== 'lead' ||
        independent[0].value.provider !== 'codex' || independent[0].value.readOnly !== true || independent[1].value.session !== reader.sessionId ||
        !isDeepStrictEqual(independent[1].value.result, assessment) || independent[2].value.threadId !== reader.sessionId || independent[2].value.requestId !== job.id ||
        independent[2].value.projectId !== store.project.id || independent[2].value.role !== 'lead') throw new Error('Independent discovery artifact correlation failed');
    artifacts.push(...independent);
    const assertReader = () => {
        const current = matchingReadbacks();
        if (current.length !== 1 || !isDeepStrictEqual(current[0], reader)) throw new Error('Exactly one unchanged independent discovery readback is required');
    };
    await liveFence();
    const [freshIssue, freshComments, freshBoard] = await Promise.all([api.issue(number), api.comments(number), engine.github.board()]);
    if (hash(freshIssue) !== hash(issue) || hash(freshComments) !== hash(comments) || !freshBoard || freshBoard.error ||
        hash(freshBoard.items.filter(item => item.number === number && item.repository === store.project.repository)) !== hash(board.items.filter(item => item.number === number && item.repository === store.project.repository))) throw new Error('Discovery issue/comments/board changed during reconciliation');
    if (fetchConfiguration && !isDeepStrictEqual(await readFetchConfiguration(), fetchConfiguration)) throw new Error('Administrative fetch configuration changed');
    assertCurrent(); assertReader();
    const at = store.clock.now().toISOString(), root = resolve(store.dataRoot, 'ticket-work', job.id);
    mkdirSync(root, { recursive: true, mode: 0o700 });
    const path = resolve(root, `discovery-resume-${request.id}.json`);
    writeFileSync(path, JSON.stringify({ prior, binding, originalWork, reader, assessment, administrativeProofs, fetchConfiguration, artifacts: artifacts.map(({ path, sha256 }) => ({ path, sha256 })), verifiedAt: at }, null, 2), { mode: 0o600, flag: 'wx' });
    store.transaction(() => {
        assertCurrent(); assertReader();
        const old = job.approach;
        recordJobApproach(job, { plan: old?.plan || 'none', review: old?.review === 'full' ? 'full' : 'focused', validation: old?.validation === 'browser' ? 'browser' : 'independent-checks', checks: old?.checks || ['Required repository checks on the exact candidate'], reason: 'Reconciled discovery continuation retains independent review and QA.' }, 'lead');
        if (job.discoveryRecovery) (job.discoveryRecoveryHistory ||= []).push(structuredClone(job.discoveryRecovery));
        job.discoveryRecovery = { requestId: request.id, originalWorkId: originalWork.id, originalSessionId: originalWork.sessionId, baseline: candidate.result.commit, noteId: binding.noteId, findingIds: [...new Set([...(job.discoveryRecovery?.findingIds || []), ...candidate.result.findings.map(finding => finding.id)])], at };
        job.steps.push({ stage: 'discovery-readback', result: { outcome: 'passed', summary: assessment.summary, commit: '', branch: '', worktree: '', prId: 0, previewUrl: '', qaRunDir: '', paidRuns: 0, findings: [], evidence: [{ id: request.id, kind: 'review', summary: 'Original no-effect discovery reconciled; baseline is not a candidate.', path, commit: '', environment: 'Office read-only continuation', url: '', observedAt: at }], receipts: [{ id: request.id, action: 'discovery-readback', target: originalWork.id, verified: true, uncertain: false, detail: assessment.summary }], blocker: '' } });
        job.status = 'queued'; job.detail = 'Original discovery reconciled; one fresh Alex attempt queued with the revised scope. Earlier failures retained.';
        store.emit('discovery-resumed', `${job.key}: original discovery reconciled; Alex will continue through delivery capacity.`, 'pm', job.key);
    });
}

export function discoveryReviewSatisfied(job: TicketJob, stage: string, result: StageResult) {
    if (!job.discoveryRecovery || !['review', 'validate'].includes(stage)) return true;
    if (result.approach && (result.approach.review === 'none' || result.approach.validation === 'developer-checks')) return false;
    return job.discoveryRecovery.findingIds.every(id => result.findings.some(finding => finding.id === id &&
        (stage === 'validate' ? finding.status === 'verified' : finding.status !== 'open')));
}
