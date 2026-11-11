import { assertAutomationEffects } from '../readiness/automation-effects';
import { green156Admitted, green156Subject, GREEN156, retainedGreen156Audit } from './green156-evidence';
import { stoppedBaseClaim } from './stopped-base-claim';
import { saveStoppedBaseArtifact } from './stopped-base-disposition';
import { digest } from '../../store/readback-evidence';
import { type HarnessRequest } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';

export function enqueueGreen156(store: Store, key: string, head: string) {
    const jobs = store.state.coordination?.jobs?.filter(j => j.key === key && j.status !== 'cancelled') || [], job = jobs[0];
    if (jobs.length !== 1 || !green156Subject(store, job) || head !== GREEN156.original) throw Error('Only Joe’s exact original #156 job is authorized');
    retainedGreen156Audit(store, job);
    const prior = store.state.coordination!.requests?.find(r => r.action === 'authorize-green-merge-156' && r.key === key && r.head === head);
    if (prior) return prior; // Never duplicate an uncertain or blocked admission.
    return store.transaction(() => {
        const request: HarnessRequest = { id: crypto.randomUUID(), action: 'authorize-green-merge-156', key, head, lane: 'delivery',
            status: 'queued', requestedAt: store.clock.now().toISOString(), detail: 'Joe authorized #156 to merge through Office when GitHub checks are green, without extra review or local QA.' };
        (store.state.coordination!.requests ??= []).push(request); store.emit('green-merge-156-authorized', request.detail, 'pm', key); return request;
    });
}
/** Scheduler-owned administrative disposition only; no model, source/package command or provider write. */
export async function admitGreen156(delivery: GitHubDelivery, request: HarnessRequest) {
    const { store } = delivery, job = delivery.jobs.find(j => j.key === request.key && j.status !== 'cancelled');
    if (!job || !green156Subject(store, job) || request.head !== GREEN156.original) throw Error('Exact original #156 required');
    if (green156Admitted(store, job)) { if (job.stoppedBaseUpdate!.greenMerge!.requestId !== request.id) throw Error('Admission belongs to its original request'); return; }
    const assertCurrent = () => {
        const claim = stoppedBaseClaim(store, job, request);
        if (request.action !== 'authorize-green-merge-156' || job.stoppedBaseUpdate!.greenMerge || job.stage !== 'update-base' ||
            !['interrupted', 'blocked'].includes(job.status) || job.mergeIntentId || job.mergeAttempt || job.mergeCommit ||
            job.stoppedBaseUpdate!.phase !== 'audit') throw Error('Original interrupted attempt changed');
        retainedGreen156Audit(store, job); assertAutomationEffects(store, job); return claim;
    };
    assertCurrent();
    const pr = await delivery.verifyPR(job, true);
    if (pr.state !== 'open' || pr.draft || pr.head.sha !== GREEN156.head || pr.number !== GREEN156.pr) throw Error('Approved prospective PR head changed');
    const pages = JSON.parse(await delivery.execute('gh', ['api', `repos/${store.project.repository}/pulls/${job.pr}/files?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, readOnly: true }));
    if (!Array.isArray(pages) || !pages.length || pages.some(p => !Array.isArray(p)) || pages.flat().length !== 2 ||
        new Set(pages.flat().map(f => f.filename)).size !== 2 || pages.flat().some(f => !['package.json', 'pnpm-lock.yaml'].includes(f.filename)))
        throw Error('Only the approved two-file dependency update is authorized');
    const preservedCandidate = structuredClone({ head: job.head, branch: job.branch, worktree: job.worktree,
        adoptedRepairCheckout: job.adoptedRepairCheckout, repairCycle: job.repairCycle, approach: job.approach,
        decisions: job.decisions, reviewContext: job.reviewContext, reviewInputSha256: job.reviewInputSha256, lastPRFingerprint: job.lastPRFingerprint });
    const file = saveStoppedBaseArtifact(store, job, `joe-green-only-${GREEN156.original}.json`, { kind: 'joe-green-only-156', jobId: job.id,
        requestId: request.id, originalWorkId: GREEN156.original, head: GREEN156.head, auditSha256: GREEN156.audit, preservedCandidate,
        direction: 'Joe: no additional review or local QA; merge #156 through Office when required GitHub checks and merge rules pass. Old interrupted attempt and negative audit remain abandoned history.' }, true);
    store.transition('green-merge-156-admitted', request.detail, () => {
        const claim = assertCurrent();
        job.stoppedBaseUpdate!.greenMerge = { path: file.path, sha256: file.sha256, requestId: request.id, claimId: claim.id,
            preservedCandidateSha256: digest(preservedCandidate) };
        job.worktree = ''; delete job.adoptedRepairCheckout; delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
        job.head = GREEN156.head; job.branch = pr.head.ref; job.prUrl = pr.html_url;
        job.mergeApprovalRequired = false; job.mergeAuthorization = { head: GREEN156.head, at: store.clock.now().toISOString() };
        job.stage = 'merge'; job.status = 'queued'; job.detail = request.detail;
    }, 'pm', job.key);
}
