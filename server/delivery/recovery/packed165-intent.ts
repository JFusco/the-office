import { HOLDS } from '../../office/config';
import { requireDeliveryAuthority } from '../harness/delivery-authority';
import { packed165Subject, retainedPacked165Effect } from './packed165-evidence';
import { PACKED165, type Packed165Policy } from './packed165-policy';
import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob } from '../../../src/shared';

export function packed165Original(store: Store, p: Packed165Policy = PACKED165): TicketJob {
    const jobs = store.state.coordination?.jobs?.filter(job => job.key === p.key && job.status !== 'cancelled') || [], job = jobs[0];
    if (jobs.length !== 1 || !job || !packed165Subject(store, job, p)) throw new Error('Exact original #165 job is required');
    return job;
}

export function assertPacked165Original(store: Store, job: TicketJob, request?: HarnessRequest, p: Packed165Policy = PACKED165) {
    retainedPacked165Effect(store, job, p);
    if (store.state.paused || store.state.draining && !request || HOLDS[job.key] || job.packedPublicationRepair || job.head !== p.head ||
        job.branch !== p.branch || !job.worktree || job.stage !== 'draft' || !['blocked', 'interrupted'].includes(job.status) ||
        job.pr || job.existingPR || job.prUrl || job.mergeIntentId || job.mergeAttempt || job.mergeCommit || job.parked ||
        job.sourceAmendment || job.stoppedBaseUpdate || job.featureBinding || job.prerequisites?.length || job.repairCycle ||
        job.boardUpdates?.some(update => update.status !== 'verified') ||
        job.steps.at(-1)?.stage !== 'review' || job.steps.at(-1)?.result.outcome !== 'passed' || job.steps.at(-1)?.result.commit !== p.head ||
        job.steps.some(step => step.result.receipts.some(receipt => receipt.uncertain || !receipt.verified)))
        throw new Error('Original #165 disposition, holds or accepted work changed');
    const authority = request ? requireDeliveryAuthority(store, job, { request }) : undefined;
    if (store.state.workLog?.some(work => work.requestId === job.id && ['running', 'stopping'].includes(work.status) && work.claimId !== authority?.claim?.id) ||
        store.state.coordination?.requests?.some(other => other.key === job.key && other.id !== request?.id && ['queued', 'working'].includes(other.status)))
        throw new Error('Original #165 already has active work');
    return authority?.claim;
}

export function enqueuePacked165(store: Store, key: string, head: string) {
    if (store.project.id !== PACKED165.project || store.project.repository !== PACKED165.repository || key !== PACKED165.key || head !== PACKED165.head)
        throw new Error('Only Joe’s exact approved #165 repair is authorized');
    const prior = store.state.coordination?.requests?.filter(r => r.action === PACKED165.action && r.key === key && r.head === head) || [];
    if (prior.length > 1) throw new Error('Ambiguous original #165 authorization');
    if (prior[0]) return prior[0]; // Includes blocked/interrupted/completed: never duplicate an uncertain command.
    const job = packed165Original(store);
    assertPacked165Original(store, job);
    return store.transaction(() => {
        const request: HarnessRequest = { id: crypto.randomUUID(), action: PACKED165.action, key, head, lane: 'delivery', status: 'queued',
            requestedAt: store.clock.now().toISOString(), detail: 'Joe approved one fresh #165 tooling revision; preserve the original uncertain attempt and use required GitHub checks without another model review or local QA cycle.' };
        (store.state.coordination!.requests ??= []).push(request);
        store.emit('packed165-forward-repair-authorized', request.detail, 'pm', key);
        return request;
    });
}
