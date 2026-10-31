import { HOLDS } from '../../office/config';
import { dependencyEligibility, validatePrerequisites, type DependencyStores } from '../pipeline/dependencies';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import type { AssignedIssue, AssignmentReview, Coordination, PickupPolicy, Prerequisite } from '../../../src/shared';

export interface IntakeContext { store: Store; state: Coordination; pickup: PickupPolicy; dependencyStores: () => DependencyStores }
export interface Admission { status: 'ready' | 'owned' | 'held'; detail: string; owner: string }

/** Deterministic replacement for the model intake: owners, holds and structured prerequisites decide. */
export function admit(context: IntakeContext, delivery: GitHubDelivery, input: { key: string; workRequested?: 'automatic' | 'manual'; prerequisites: Prerequisite[] }, now: Date): Admission {
    const { store, state } = context;
    if (HOLDS[input.key])
        return { status: 'held', detail: HOLDS[input.key], owner: '' };
    const job = state.jobs?.find(candidate => candidate.key === input.key && candidate.status !== 'cancelled');
    if (job)
        return { status: 'owned', detail: `Office delivery ${job.id} owns ${input.key} at ${job.stage}${job.pr ? ` (PR #${job.pr})` : ''}.`, owner: job.id };
    const pilot = store.state.tickets.find(ticket => ticket.key === input.key && ticket.pilot);
    if (pilot)
        return { status: 'owned', detail: 'Existing Office delivery owns this ticket.', owner: pilot.runId };
    if (!input.workRequested)
        return { status: 'held', detail: `${input.key} is not in ${context.pickup.status}; waiting for the pickup lane or an explicit Start.`, owner: '' };
    if (input.prerequisites.length) {
        const invalid = validatePrerequisites(input.prerequisites, { projectId: store.project.id, kind: 'issue', id: input.key.replace(/^GH-/, '') }, context.dependencyStores());
        if (invalid)
            return { status: 'held', detail: invalid, owner: '' };
        const waiting = dependencyEligibility(input.prerequisites, context.dependencyStores(), now);
        if (waiting)
            return { status: 'held', detail: waiting.reason, owner: '' };
    }
    delivery.enqueue(input.key, 0, input.workRequested === 'automatic' ? context.pickup.status : undefined);
    const queued = state.jobs!.find(candidate => candidate.key === input.key && candidate.status !== 'cancelled')!;
    if (input.prerequisites.length)
        queued.prerequisites = input.prerequisites;
    return { status: 'ready', detail: 'Harness intake: no owner, linked PR, hold or unmet prerequisite. Implementation queued for Alex.', owner: '' };
}

const WAIT_STATUSES = new Set(['queued', 'working', 'blocked', 'interrupted', 'owned']);

/** Poll-time admission for cards in the pickup lane. Appends at most one row per real change. */
export function admitReadyCards(context: IntakeContext, delivery: GitHubDelivery, assigned: AssignedIssue[], now: Date): void {
    const { store, state, pickup } = context;
    if (!pickup.enabled) return;
    for (const issue of assigned.filter(issue => (issue.pickupStatus ?? issue.status) === pickup.status)) {
        const latest = state.listener.reviews.slice().reverse().find(review => review.key === issue.key);
        if (latest && WAIT_STATUSES.has(latest.status)) continue;
        if (state.jobs?.some(job => job.key === issue.key && job.status !== 'cancelled')) continue;
        if (latest?.prerequisiteError) continue;
        const prerequisites = latest?.prerequisites || [];
        const outcome = admit(context, delivery, { key: issue.key, workRequested: 'automatic', prerequisites }, now);
        if (outcome.status !== 'ready' && latest?.status === outcome.status && latest.detail === outcome.detail) continue;
        const at = now.toISOString();
        const row: AssignmentReview = { id: crypto.randomUUID(), key: issue.key, summary: issue.summary, url: issue.url, queuedAt: at, startedAt: at, endedAt: at, status: outcome.status, detail: outcome.detail, owner: outcome.owner, workRequested: 'automatic', prerequisites, ...(latest ? { parentReviewId: latest.id } : {}) };
        state.listener.reviews.push(row);
        store.emit('assignment-reviewed', `${issue.key}: ${outcome.status}. ${outcome.detail}`, 'pm', issue.key);
    }
}
