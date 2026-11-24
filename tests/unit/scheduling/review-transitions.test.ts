import { afterEach, expect, test, vi } from 'vitest';
import { HUMAN_MERGE } from '../../../server/delivery/readiness/merge-ceiling';
import * as policy from '../../../server/office/project-policy';
import { projectById } from '../../../server/office/projects';
import { recheckCandidate, recheckPR } from '../../../server/scheduling/operator-commands';
import { requeueCandidateReview, requeuePRReview } from '../../../server/scheduling/review-transitions';
import type { Store } from '../../../server/store/store';
import type { TicketJob } from '../../../src/shared';

afterEach(() => vi.restoreAllMocks());
const STORE = { project: projectById('cms-field-vocabulary') } as unknown as Store;
const step = (stage: string, receipts: unknown[] = []) => ({ stage, result: { outcome: 'passed', summary: 'ok', receipts } });
const job = (over: Record<string, unknown> = {}) => ({ id: 'job-1', key: 'GH-1', stage: 'lead-pr', status: 'blocked', detail: 'Error: stopped', steps: [step('review')], ...over }) as unknown as TicketJob;
const UNCERTAIN = [step('publish', [{ id: 'r', action: 'push', target: 'b', verified: false, uncertain: true, detail: 'unconfirmed' }])];
/** Calls `change` and says whether it threw, with the job exactly as it was when it did. */
const refuses = (change: (job: TicketJob) => unknown, held: TicketJob, message: string) => {
    const before = JSON.stringify(held);
    expect(() => change(held)).toThrow(message);
    expect(JSON.stringify(held)).toBe(before);
};

test('a stopped candidate review is requeued with its detail, and the detail is returned', () => {
    for (const status of ['blocked', 'interrupted']) {
        const held = job({ stage: 'review', status });
        expect(requeueCandidateReview(held)).toBe('Independent candidate review requeued; prior provider failures retained. No source work replayed.');
        expect(held).toMatchObject({ status: 'queued', detail: 'Independent candidate review requeued; prior provider failures retained. No source work replayed.' });
    }
});

test('a candidate review at another stage, still active, or with an uncertain effect is refused and left as it was', () => {
    const message = 'A certain inactive read-only candidate review is required';
    for (const over of [{ stage: 'lead-pr' }, { stage: 'review', status: 'working' }, { stage: 'review', status: 'queued' }, { stage: 'review', status: 'watching' }, { stage: 'review', steps: UNCERTAIN }])
        refuses(requeueCandidateReview, job(over), message);
});

test('a PR review, a merge preflight that sent nothing, and a post-merge CI recovery are each requeued with their own detail', () => {
    for (const status of ['blocked', 'interrupted', 'watching'])
        expect(requeuePRReview(STORE, job({ status }))).toBe('Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.');
    const preflight = job({ stage: 'merge' });
    expect(requeuePRReview(STORE, preflight)).toBe('Merge preflight queued; no prior merge request was sent. Current head and checks will be verified again.');
    expect(preflight.status).toBe('queued');
    for (const status of ['blocked', 'interrupted'])
        expect(requeuePRReview(STORE, job({ stage: 'ci-recovery', status, mergeCommit: 'm'.repeat(40) }))).toBe('Post-merge CI recovery queued; the harness verifies the original failure and bounded retry state before effects.');
    for (const phase of ['apply', 'publish'])
        expect(requeuePRReview(STORE, job({ ciRepairs: [{ phase }] }))).toBe('Saved CI repair requeued for guarded reconciliation; diagnosis and prior evidence retained.');
});

test('anything else is refused and left as it was: a merge already attempted, a recovery already followed up, an active or cancelled job, another stage', () => {
    const message = 'Only an inactive PR review or a merge preflight with no attempted write can be rechecked';
    for (const over of [{ stage: 'merge', mergeAttempt: { at: 't' } }, { stage: 'merge', status: 'interrupted' }, { stage: 'ci-recovery', mergeCommit: 'm'.repeat(40), ciFollowupKey: 'GH-9' }, { stage: 'ci-recovery' },
        { status: 'working' }, { status: 'queued' }, { status: 'cancelled' }, { stage: 'review' }, { stage: 'implement' }])
        refuses(held => requeuePRReview(STORE, held), job(over), message);
});

test('a merge preflight above the project\'s merge ceiling, and any review with an uncertain effect, are refused and left as they were', () => {
    refuses(held => requeuePRReview(STORE, held), job({ steps: UNCERTAIN }), 'Original effects must be reconciled before a new review');
    refuses(held => requeuePRReview(STORE, held), job({ stage: 'merge', steps: UNCERTAIN }), 'Original effects must be reconciled before a new review');
    const resolved = policy.resolveProjectPolicy;
    vi.spyOn(policy, 'projectPolicy').mockImplementation(project => ({ ...resolved(project), merge: 'human' }));
    refuses(held => requeuePRReview(STORE, held), job({ stage: 'merge' }), HUMAN_MERGE);
    // The ceiling is a merge's: a PR review below it is still requeued.
    expect(requeuePRReview(STORE, job())).toMatch(/^Read-only PR reassessment queued/);
});

test('the operator\'s recheck commands keep their refusals and emit their own event with the detail', () => {
    const emitted: [string, string, string, string][] = [];
    const coordinator = (...jobs: TicketJob[]) => ({ store: { ...STORE, emit: (kind: string, message: string, role: string, key: string) => emitted.push([kind, message, role, key]) }, state: { jobs } }) as never;
    const candidate = job({ stage: 'review' });
    recheckCandidate.call(coordinator(candidate), 'GH-1');
    expect(emitted.pop()).toEqual(['candidate-review-recheck', 'Independent candidate review requeued; prior provider failures retained. No source work replayed.', 'lead', 'GH-1']);
    const review = job();
    recheckPR.call(coordinator(review), 'GH-1');
    expect(emitted.pop()).toEqual(['pr-review-recheck', 'Read-only PR reassessment queued. Prior sessions and results retained; source/publication stages will not replay.', 'lead', 'GH-1']);
    // No job for the key, or only a cancelled one: the same refusals as before, and nothing emitted.
    expect(() => recheckCandidate.call(coordinator(), 'GH-1')).toThrow('A certain inactive read-only candidate review is required');
    expect(() => recheckCandidate.call(coordinator(job({ stage: 'lead-pr' })), 'GH-1')).toThrow('A certain inactive read-only candidate review is required');
    expect(() => recheckPR.call(coordinator(), 'GH-1')).toThrow('Only an inactive PR review or a merge preflight with no attempted write can be rechecked');
    expect(() => recheckPR.call(coordinator(job({ status: 'cancelled' })), 'GH-1')).toThrow('Only an inactive PR review or a merge preflight with no attempted write can be rechecked');
    expect(emitted).toEqual([]);
});
