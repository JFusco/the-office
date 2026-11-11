import { saveStoppedBaseArtifact } from './stopped-base-disposition';
import { digest } from '../../store/readback-evidence';
import { randomUUID } from 'node:crypto';
import { ciCheckout, finishCISetup, verifyCIHooks } from '../repairs/ci-checkout';
import { readInitialCheckout } from '../repairs/read-initial-checkout';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { stoppedBaseReviewContext } from './stopped-base-review-context';
import { readStoppedBaseProviderContext } from './stopped-base-provider';
import { assertStoppedBaseApproach } from './stopped-base-gates';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob, WorkApproach } from '../../../src/shared';

/** Preserve the old clone; partial prospective clones are reconciled, never recreated. */
export async function stoppedBaseCheckout(delivery: GitHubDelivery, job: TicketJob) {
    const { store } = delivery, r = job.stoppedBaseUpdate!;
    const context = await stoppedBaseReviewContext(delivery, job), handoff = r.handoff;
    if (r.phase !== 'checkout' || !handoff || handoff.head !== context.provider.pr.head || handoff.providerVersion !== context.provider.version)
        throw new Error('Passed exact-head stopped-base handoff required before checkout');
    const beforeMutation = async () => {
        const provider = await readStoppedBaseProviderContext(delivery, job);
        if (provider.version !== r.providerVersion || provider.pr.head !== handoff.head)
            throw new Error('Stopped-base provider context changed before candidate mutation');
        context.assertCurrent();
    };
    let candidate = r.checkout;
    if (!candidate) {
        candidate = r.checkout = { id: randomUUID(), head: handoff.head, branch: context.provider.pr.branch }; store.save();
        await ciCheckout(delivery, job, candidate, beforeMutation);
    } else if (candidate.worktree) {
        const initial = await readInitialCheckout(store, delivery.execute, job, candidate);
        if (initial) await finishCISetup(delivery, candidate, beforeMutation, initial.hooksConfigured);
    } else throw new Error('Prospective clone reservation lacks a completed dispatch; Morgan must reconcile it without cloning again');
    if (!candidate.worktree || candidate.head !== handoff.head || candidate.branch !== context.provider.pr.branch)
        throw new Error('Prospective private candidate binding differs');
    await verifyRepairCandidate(store.project, { ...candidate, worktree: candidate.worktree }, delivery.execute);
    await verifyCIHooks(delivery, { ...job, worktree: candidate.worktree, adoptedRepairCheckout: candidate });
    await stoppedBaseReviewContext(delivery, job);
    const prior = job.approach;
    const approach: WorkApproach = { plan: prior?.plan || 'none', review: prior?.review === 'full' ? 'full' : 'focused',
        validation: prior?.validation === 'browser' ? 'browser' : 'independent-checks',
        checks: [...new Set([...(prior?.checks || []), 'test:packed', 'npm pack --dry-run --ignore-scripts'])],
        reason: 'Stopped original source work requires actual independent source review and QA on the freshly assessed private candidate; original findings, failures and consumed budgets remain retained.' };
    assertStoppedBaseApproach(job, approach);
    const binding = saveStoppedBaseArtifact(store, job, `stopped-base-candidate-${r.originalWorkId}.json`,
        { originalWorkId:r.originalWorkId, handoffWorkerId:handoff.workerId, handoffResultSha256:handoff.resultSha256, checkoutSha256:digest(candidate) }, true);
    store.transition('stopped-base-candidate', `${job.key}: fresh assessed private candidate bound for independent source review and QA.`, () => {
        context.assertCurrent();
        job.head = candidate!.head; job.branch = candidate!.branch; job.worktree = candidate!.worktree!; job.adoptedRepairCheckout = candidate;
        job.approach = approach; (job.decisions ??= []).push({ role: 'pm', stage: 'lead-pr', at: store.clock.now().toISOString(), approach });
        if (job.repairCycle) { job.repairCycle.phase = 'review'; job.repairCycle.publishedHead = candidate!.head; }
        delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
        r.candidateBinding = { path:binding.path, sha256:binding.sha256 }; r.phase = 'review'; job.stage = 'review'; job.status = 'queued'; job.detail = approach.reason;
    }, 'pm', job.key);
}
