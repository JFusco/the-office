import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest, ownedPath } from '../../store/readback-evidence';
import { workKey, type HarnessRequest, type TicketJob } from '../../../src/shared';
import { withHarnessWork } from '../harness/harness-work';
import { assertPacked165Original, packed165Original } from './packed165-intent';
import { packed165Admitted, retainedPacked165Effect } from './packed165-evidence';
import { makePacked165Candidate, packed165CandidateIdentity } from './packed165-candidate';
import { readPacked165Provider } from './packed165-provider';
import { packed165PRContent } from './packed165-pr-content';
import { PACKED165, packed165EffectId, type Packed165Policy } from './packed165-policy';
import type { GitHubDelivery } from '../pipeline/github-delivery';

const history = (job: TicketJob) => structuredClone({ steps: job.steps, approach: job.approach, decisions: job.decisions,
    skippedStages: job.skippedStages, retry: job.retry, repairCycle: job.repairCycle, ciRepairs: job.ciRepairs });

/** No new model stage or old push replay. The one approved repair is a distinct source revision and publication. */
export async function admitPacked165(delivery: GitHubDelivery, request: HarnessRequest, p: Packed165Policy = PACKED165) {
    const { store } = delivery, job = packed165Original(store, p);
    if (request.action !== p.action || request.key !== p.key || request.head !== p.head) throw new Error('Exact approved #165 request is required');
    if (packed165Admitted(store, job, p)) {
        if (job.packedPublicationRepair!.requestId !== request.id) throw new Error('The original admission owns this repair');
        return;
    }
    const preservedHistory = history(job), preservedDigest = digest(preservedHistory), original = { head: job.head, branch: job.branch, worktree: job.worktree };
    const guard = () => {
        const claim = assertPacked165Original(store, job, request, p);
        if (digest(history(job)) !== preservedDigest) throw new Error('Original #165 accepted work or budgets changed');
        const rows = store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: p.project, kind: 'delivery', id: job.id })) as { body: string }[];
        if (rows.some(row => { const e = JSON.parse(row.body); return e.id !== packed165EffectId(p) && e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt); }))
            throw new Error('An unrelated unresolved write still requires read-back');
        return claim!;
    };
    guard();
    const next = packed165CandidateIdentity(job, request.id), before = await readPacked165Provider(delivery, job, next.branch, p);
    const root = resolve(store.dataRoot, 'ticket-work', job.id, `packed165-${request.id}`);
    const candidate = await withHarnessWork(delivery, job, 'developer', 'harness-packed165-forward-source',
        control => makePacked165Candidate(delivery, job, request.id, root, control, guard, p));
    guard();
    const after = await readPacked165Provider(delivery, job, next.branch, p);
    if (after.fingerprint !== before.fingerprint) throw new Error('Provider assignment, board or baseline changed; preserve the fresh repair for read-back');
    const contentRoot = resolve(root, 'metadata'); mkdirSync(contentRoot, { mode: 0o700 }); ownedPath(store, contentRoot);
    writeFileSync(resolve(contentRoot, 'pr.json'), JSON.stringify(packed165PRContent(candidate.head, p.head), null, 2), { flag: 'wx', mode: 0o600 });
    const claim = guard(), proofPath = resolve(root, 'admission.json');
    const effect = retainedPacked165Effect(store, job, p);
    writeFileSync(proofPath, JSON.stringify({ kind: 'joe-forward-only-packed165', requestId: request.id, claimId: claim.id, jobId: job.id,
        ...candidate, patch: undefined, beforeSha256: p.beforeSha256, afterSha256: p.afterSha256, original, preservedHistory,
        contentRoot, contentSha256: artifact(store, resolve(contentRoot, 'pr.json')).sha256,
        originalEffectId: effect.id, originalEffectSha256: digest(effect), historicalOutcome: 'retained-uncertain-not-replayed',
        providerObservations: [before, after], approval: 'Joe: Approve fresh #165 recovery; no additional model review/local QA; required GitHub checks and rules remain.',
        at: store.clock.now().toISOString() }, null, 2), { flag: 'wx', mode: 0o600 });
    const proof = artifact(store, proofPath);
    store.transition('packed165-forward-repair-admitted', request.detail, () => {
        guard();
        job.packedPublicationRepair = { requestId: request.id, claimId: claim.id, proofPath, proofSha256: proof.sha256, contentRoot,
            head: candidate.head, branch: candidate.branch, worktree: candidate.worktree, originalEffectId: effect.id,
            originalEffectSha256: digest(effect), original };
        Object.assign(job, { head: candidate.head, branch: candidate.branch, worktree: candidate.worktree, stage: 'draft', status: 'queued',
            detail: 'Fresh #165 pnpm repair is committed; original candidate and uncertain push remain retained. Office publishes this distinct revision through normal hosted checks.',
            mergeApprovalRequired: false, mergeAuthorization: { head: candidate.head, at: store.clock.now().toISOString() } });
        job.approach = { plan: 'none', review: 'none', validation: 'developer-checks', checks: ['Required current-head GitHub checks and repository merge rules'],
            reason: 'Joe explicitly approved the bound one-time pnpm repair without another model review or local QA cycle. Native repository hooks remain enabled; no original failure was reclassified.' };
        (job.decisions ??= []).push({ role: 'pm', stage: 'packed165-forward-admission', at: store.clock.now().toISOString(), approach: job.approach });
        job.skippedStages = { ...job.skippedStages, review: job.approach.reason, validate: job.approach.reason };
        delete job.reviewContext; delete job.reviewInputSha256;
    }, 'pm', job.key);
}
