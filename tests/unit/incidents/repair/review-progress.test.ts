import { expect, test } from 'vitest';
import { reviewProgress } from '../../../../server/incidents/repair/review-progress';
import { coordination } from '../../../../server/scheduling/coordination';
import type { RepairBoundary } from '../../../../src/contracts/incidents';
import type { AssignmentReview, OfficeSnapshot, TicketJob } from '../../../../src/shared';

const STOOD = { steps: 0, stage: 'assignment-review', event: 7 };
const LEFT: RepairBoundary = { kind: 'stage-left', stage: 'assignment-review' }, SETTLED: RepairBoundary = { kind: 'record-settled' }, PASSED: RepairBoundary = { kind: 'stage-result-passed', stage: 'assignment-review' };
const review = (status: AssignmentReview['status'], id = 'review-1') => ({ id, key: 'GH-1', status }) as AssignmentReview;
const job = (status: TicketJob['status'], key = 'GH-1', id = 'job-1') => ({ id, key, status, stage: 'implement' }) as TicketJob;
/** A project holding these reviews and jobs. */
const state = (reviews: AssignmentReview[], jobs: TicketJob[] = []) => {
    const c = { ...coordination(), jobs };
    c.listener.reviews = reviews;
    return { coordination: c } as Pick<OfficeSnapshot, 'coordination'>;
};
const read = (held: Pick<OfficeSnapshot, 'coordination'>, boundary: RepairBoundary, stood = STOOD) => reviewProgress(held, 'review-1', 'GH-1', boundary, stood, false);
const DELIVERED = { crossed: true, detail: 'Delivery took GH-1 after its resume (job job-1, implement).' };

test('stage-left is crossed by the review leaving ready, or by delivery taking its ticket', () => {
    expect(read(state([review('ready')]), LEFT)).toEqual({ status: 'ready', crossing: { crossed: true, detail: 'The review left assignment-review ready for delivery after its resume.' } });
    for (const status of ['queued', 'working', 'blocked', 'interrupted', 'owned', 'held'] as const)
        expect(read(state([review(status)]), LEFT), status).toEqual({ status, crossing: { crossed: false } });
    for (const status of ['queued', 'working', 'blocked', 'completed'] as const)
        expect(read(state([review('blocked')], [job(status)]), LEFT), status).toEqual({ status: 'blocked', crossing: DELIVERED });
});

test('delivery holding the ticket proves the ticket left intake even once the review was cancelled or is gone', () => {
    expect(read(state([review('cancelled')], [job('queued')]), LEFT)).toEqual({ status: 'cancelled', crossing: DELIVERED });
    expect(read(state([], [job('working')]), LEFT)).toEqual({ crossing: DELIVERED });
    // A cancelled job, or another ticket's, is no delivery of this one.
    expect(read(state([review('cancelled')], [job('cancelled'), job('working', 'GH-2', 'job-2')]), LEFT)).toEqual({ status: 'cancelled', crossing: { crossed: false } });
    expect(read(state([], [job('cancelled')]), LEFT)).toEqual({ crossing: { crossed: false } });
});

test('record-settled is crossed only by the bound review\'s own decision', () => {
    for (const status of ['ready', 'owned', 'held'] as const)
        expect(read(state([review(status)]), SETTLED), status).toEqual({ status, crossing: { crossed: true, detail: `The review reached its decision (${status}) after its resume.` } });
    for (const status of ['queued', 'working', 'blocked', 'interrupted', 'cancelled'] as const)
        expect(read(state([review(status)]), SETTLED), status).toEqual({ status, crossing: { crossed: false } });
    // Owned or held with no delivery at all is still a decision.
    expect(read(state([review('owned')], []), SETTLED).crossing).toMatchObject({ crossed: true });
    // Delivery, or a later review of the same ticket that decided, is not this review's decision.
    expect(read(state([review('cancelled')], [job('working')]), SETTLED)).toEqual({ status: 'cancelled', crossing: { crossed: false } });
    expect(read(state([], [job('completed')]), SETTLED)).toEqual({ crossing: { crossed: false } });
    expect(read(state([review('blocked'), review('ready', 'review-2')]), SETTLED)).toEqual({ status: 'blocked', crossing: { crossed: false } });
    expect(read(state([review('ready', 'review-2')]), SETTLED)).toEqual({ crossing: { crossed: false } });
});

test('a review is read by its own ID: a later review of the same ticket leaving ready does not cross stage-left for it', () => {
    expect(read(state([review('blocked'), review('ready', 'review-2')]), LEFT)).toEqual({ status: 'blocked', crossing: { crossed: false } });
});

test('a passed stage result, another stage to leave and a baseline at another stage cannot be judged, whatever the review did', () => {
    for (const held of [state([review('ready')], [job('working')]), state([])]) {
        expect(read(held, PASSED).crossing).toEqual({ unjudged: 'An assignment review saves no stage results; only stage-left and record-settled can be judged for it.' });
        expect(read(held, { kind: 'stage-left', stage: 'review' }).crossing).toEqual({ unjudged: 'An assignment review has only assignment-review to leave, not review.' });
        expect(read(held, LEFT, { ...STOOD, stage: 'review' }).crossing).toEqual({ unjudged: 'The review was at review, not assignment-review, when it was resumed.' });
    }
});

test('the reading changes nothing it was given', () => {
    const held = state([review('ready')], [job('working')]), before = JSON.stringify(held);
    for (const boundary of [LEFT, SETTLED, PASSED]) read(held, boundary);
    expect(JSON.stringify(held)).toBe(before);
});
