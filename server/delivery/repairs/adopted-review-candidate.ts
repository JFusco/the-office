import { mkdirSync, writeFileSync, lstatSync } from 'node:fs';
import { resolve } from 'node:path';
import { containedFile } from '../../cec/workflow';
import { deliveryInputSha256 } from '../../github/github-context';
import { currentAssignment } from '../../workers/assignment-context';
import { assertDeliveryMayMutate } from '../harness/guards';
import { harnessDelivers } from '../harness/scope';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { repairFindingIds, verifyRepairCandidate } from './delivery-repairs';
import { conflictOnlyAssessment } from './conflict-repair';
import { ciCheckout, finishCISetup, verifyCIHooks } from './ci-checkout';
import { readInitialCheckout } from './read-initial-checkout';
import { removeAdoptedClone } from '../candidate/remove-adopted-clone';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

/** Supply an owned clone for an adopted PR's scoped repair, retaining its original assessment. */
export async function adoptedReviewCandidate(delivery: GitHubDelivery, job: TicketJob, result: StageResult, root: string) {
    const { store } = delivery, conflict = conflictOnlyAssessment(result);
    // A read-only reviewer may report the inspection checkout. It is never a repair candidate.
    if (!harnessDelivers(store, job) || !job.existingPR || job.stage !== 'lead-pr' || job.worktree ||
        !job.pr || result.prId !== job.pr || result.commit !== job.head || result.paidRuns !== 0 ||
        job.repairCycle?.pendingFindingIds.some(id => !result.findings.some(f => f.id === id)) ||
        (!repairFindingIds(result, true) && !conflict)) return result;
    if (result.worktree && result.worktree !== store.project.repo)
        throw new Error('Adopted repair cannot use an unowned reported checkout');
    const input = deliveryInputSha256(store, job.key), head = job.head, branch = job.branch, prId = job.pr;
    let candidate = job.adoptedRepairCheckout;
    const assertCurrent = () => {
        assertDeliveryMayMutate(store, delivery.jobs, job, head);
        if (store.state.draining || job.stage !== 'lead-pr' || job.status !== 'working' || job.branch !== branch || job.pr !== prId || job.adoptedRepairCheckout !== candidate || job.mergeAttempt || job.mergeIntentId || job.mergeApprovalRequired ||
            job.prerequisites?.length || deliveryInputSha256(store, job.key) !== input ||
            job.steps.some(s => hasUncertainEffects(s.stage, s.result)) ||
            store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id && c.id !== currentAssignment()?.claim.id))
            throw new Error('Adopted repair ownership, inputs or effects changed');
    };
    const guard = async () => {
        assertCurrent();
        const p = await delivery.verifyPR(job, true);
        if (p.state !== 'open' || p.merged_at || p.draft || p.head.sha !== head || p.head.ref !== job.branch ||
            p.head.repo?.full_name !== store.project.repository || p.head.ref === store.project.target || conflict && p.mergeable !== false)
            throw new Error('Adopted repair requires the unchanged same-repository PR and reported conflict');
    assertCurrent();
        return p;
    };
    const provider = await guard();
    const inputs = result.resolution?.evidenceIds.map(id => result.evidence.find(e => e.id === id)!) || [];
    if (!conflict && inputs.some(e => !containedFile(e.path, root) && !containedFile(e.path, store.project.repo)))
        throw new Error('Adopted repair diagnostic lies outside its project or saved artifacts');
    if (candidate && candidate.head !== head) {
        if (job.repairCycle || candidate.branch !== job.branch) throw new Error('Prior adopted candidate ownership changed; preserved');
        const removed = await removeAdoptedClone(store, delivery.execute, job, assertCurrent, '');
        mkdirSync(root, { recursive: true });
        writeFileSync(resolve(root, `superseded-checkout-${crypto.randomUUID()}.json`), JSON.stringify({ prior: candidate, newHead: head, removed, observedAt: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
        await guard();
        candidate = undefined;
    }
    let worktree: string;
    if (candidate) {
        const expected = resolve(store.dataRoot, 'ticket-work', job.id, `ci-${candidate.id}`, 'candidate');
        if (candidate.head !== head || candidate.branch !== job.branch || candidate.worktree && candidate.worktree !== expected)
            throw new Error('Prior adopted repair checkout identity changed; preserve for reconciliation');
        const present = lstatSync(expected, { throwIfNoEntry: false });
        if (!present) {
            // A failed local clone is safe to retry only after positively observing its exact path absent.
            mkdirSync(root, { recursive: true });
            writeFileSync(resolve(root, `absent-checkout-${crypto.randomUUID()}.json`), JSON.stringify({ prior: candidate, expected, observedAbsentAt: new Date().toISOString() }), { mode: 0o600, flag: 'wx' });
            candidate = undefined;
        } else {
            if (candidate.worktree !== expected || present.isSymbolicLink()) throw new Error('Prior adopted checkout path changed; preserved');
            const initial = await readInitialCheckout(store, delivery.execute, job, candidate);
            if (initial) {
                await guard();
                await finishCISetup(delivery, candidate, assertCurrent, initial.hooksConfigured);
            }
            await verifyRepairCandidate(store.project, { head, branch: candidate.branch, worktree: expected }, delivery.execute);
            await verifyCIHooks(delivery, { ...job, worktree: expected });
        }
    }
    if (candidate) worktree = candidate.worktree!;
    else {
        candidate = { id: `review-${crypto.randomUUID()}`, head, branch: job.branch };
        job.adoptedRepairCheckout = candidate; store.save();
        worktree = await ciCheckout(delivery, job, candidate, assertCurrent);
    }
    await guard();
    // This records a repair request and provider identity, never source acceptance.
    mkdirSync(root, { recursive: true });
    const id = `adopted-assessment:${crypto.randomUUID()}`, path = resolve(root, `${id.replace(':', '-')}.json`);
    writeFileSync(path, JSON.stringify({ reportedAssessment: result, provider }, null, 2), { mode: 0o600, flag: 'wx' });
    const view = structuredClone(result);
    view.evidence.push({ id, kind: 'review', summary: 'Original adopted PR repair assessment and exact provider readback', path, commit: head, environment: 'Office read-only assessment', url: job.prUrl, observedAt: new Date().toISOString() });
    view.resolution = { kind: 'source-repair', findingIds: conflict ? result.findings.filter(f => f.status === 'open').map(f => f.id) : result.resolution!.findingIds, evidenceIds: [id] };
    view.worktree = worktree; view.branch = job.branch;
    store.save();
    return view;
}
