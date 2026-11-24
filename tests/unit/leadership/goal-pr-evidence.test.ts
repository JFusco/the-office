import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { saveGoal } from '../../../server/leadership/goals';
import { coordination } from '../../../server/scheduling/coordination';
import { applyGoalReview, workEvidence } from '../../../server/leadership/goal-reviews';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
const HEAD = 'a'.repeat(40), COLLECTED = '2026-11-20T21:58:23.060Z', LATER = '2026-11-20T22:01:40.000Z', TICKET_UPDATED = '2026-11-20T08:38:06.947-0500';
const STALE_PR_VERSION = '2026-11-19T21:59:28.675Z';

/** An active CEC goal, its ticket complete with staging QA passed, and its pull request seen by a later provider read. */
function setup(ticket: Record<string, unknown> = {}) {
    const store = new Store(':memory:', projectById('cec')); stores.push(store);
    const goal = saveGoal(store, { id: crypto.randomUUID(), expectedUpdatedAt: '', project: store.project.name, title: 'Open the first delivery PR', detail: 'Complete when the PR is open against staging', priority: 2, status: 'active' });
    store.state.azure.observedAt = LATER; store.state.azure.error = '';
    store.state.azure.prs = [{ id: 41448, title: 'CEC-154', status: 'completed', draft: false, source: 'refs/heads/feature', target: 'refs/heads/staging', commit: HEAD, mergeCommit: '', url: '', policies: [] } as any];
    store.state.tickets.push({ key: 'CEC-154', summary: '', type: 'Improvement', status: 'Ready for Production', statusId: '', assignee: '', subtask: false, boardMember: true, url: '', updated: TICKET_UPDATED, stage: 'complete', activity: 'idle', blocker: '', runId: 'r', attempt: 0,
        commit: HEAD, branch: '', worktree: '', previewUrl: '', prId: 41448, results: { 'staging-qa': { outcome: 'passed' } }, findings: [], evidence: [], pilot: true, observedAt: '', ...ticket } as any);
    const pr = { projectId: 'cec', kind: 'pr' as const, id: '41448', version: COLLECTED, head: HEAD };
    const work = { projectId: 'cec', kind: 'ticket' as const, id: 'CEC-154', version: TICKET_UPDATED, head: HEAD };
    const update = (evidence: unknown[], extra: Record<string, unknown> = {}) => ({ projectId: 'cec', goalId: goal.id, expectedUpdatedAt: goal.updatedAt, progress: 'Milestone complete.', blockers: [], evidence, linkedWork: evidence, rationale: 'Verified', status: 'done', ...extra }) as any;
    return { store, goal, pr, work, update };
}

function setupBlocked() {
    const fixture = setup();
    const { goal, pr, work } = fixture;
    goal.status = 'blocked';
    goal.progress = { note: 'Waiting', blockers: ['Target branch unverified'], evidence: [pr, work], linkedWork: [pr, work], lastReviewId: 'earlier', reviewedAt: '' };
    return fixture;
}

test('a pull request cited from an earlier provider read is current while the provider still shows it at that head', () => {
    const { store, pr } = setup();
    expect(workEvidence(store, pr)).toEqual({ started: true, accepted: false });
    expect(workEvidence(store, { ...pr, version: LATER })).toEqual({ started: true, accepted: false });
});

test.each<[string, (f: ReturnType<typeof setup>) => unknown]>([
    ['the head moved', f => workEvidence(f.store, { ...f.pr, head: 'b'.repeat(40) })],
    ['the pull request is not in the provider read', f => workEvidence(f.store, { ...f.pr, id: '99999' })],
    ['the cited read is later than the provider\'s latest', f => workEvidence(f.store, { ...f.pr, version: '2026-11-20T22:30:00.000Z' })],
    ['the cited read is not a time', f => workEvidence(f.store, { ...f.pr, version: 'stale' })],
    ['the cited read is only a year', f => workEvidence(f.store, { ...f.pr, version: '2026' })],
    ['the cited read is a loose date', f => workEvidence(f.store, { ...f.pr, version: 'Nov 20, 2026' })],
    ['the cited read has no zone', f => workEvidence(f.store, { ...f.pr, version: '2026-11-20T21:58:23' })],
    ['the cited read is weeks old', f => workEvidence(f.store, { ...f.pr, version: '2026-10-31T10:19:49.757Z' })],
    ['the provider read failed', f => { f.store.state.azure.error = 'Unavailable'; return workEvidence(f.store, f.pr); }],
    ['the provider was never read', f => { f.store.state.azure.observedAt = ''; return workEvidence(f.store, f.pr); }],
])('a pull request reference is refused when %s', (_name, read) => {
    expect(read(setup())).toBeNull();
});

test('done is applied with accepted work beside a pull request observation', () => {
    const { store, goal, pr, work, update } = setup();
    applyGoalReview(store, 'review-1', update([pr, work]));
    expect(goal.status).toBe('done');
    expect(goal.progress?.evidence).toEqual([pr, work]);
});

test('done is refused on pull request observations alone, on work that is not accepted, and with a blocker', () => {
    const only = setup();
    expect(() => applyGoalReview(only.store, 'review-1', only.update([only.pr]))).toThrow('lacks scope acceptance');
    const unaccepted = setup({ stage: 'staging-qa', results: {} });
    expect(() => applyGoalReview(unaccepted.store, 'review-1', unaccepted.update([unaccepted.pr, unaccepted.work]))).toThrow('lacks scope acceptance');
    const blocked = setup();
    expect(() => applyGoalReview(blocked.store, 'review-1', blocked.update([blocked.pr, blocked.work], { blockers: ['Target branch unverified'] }))).toThrow('lacks scope acceptance');
    for (const f of [only, unaccepted, blocked]) expect(f.goal.status).toBe('active');
});

test('done stands on the accepted ticket when a cited pull request observation is no longer current, and the record lists what was left out', () => {
    // The 2026-11-23 proposal: the ticket at its current version, beside PR 41448 re-cited from the 2026-11-19 read.
    const { store, goal, pr, work, update } = setup();
    store.state.azure.observedAt = '2026-11-23T22:00:00.000Z';
    store.state.azure.prs = [];
    const old = { ...pr, version: STALE_PR_VERSION };
    const application = applyGoalReview(store, 'review-1', update([work, old]));
    expect(goal.status).toBe('done');
    expect(goal.progress).toMatchObject({ evidence: [work], linkedWork: [work] });
    expect(application.dropped).toEqual([{ ref: old, reason: 'not a current provider observation of this pull request' }]);
    expect(store.state.events[0].message).toContain('no longer current was left out');
});

test('done stands on the accepted ticket when the Azure read reports an error, and the record says so', () => {
    const failed = setup();
    failed.store.state.azure.error = 'Running staging version not refreshed';
    const application = applyGoalReview(failed.store, 'review-1', failed.update([failed.pr, failed.work]));
    expect(application.dropped).toEqual([{ ref: failed.pr, reason: 'the provider read reported an error when the review was applied' }]);
    expect(failed.goal.status).toBe('done');
});

test('an update resting only on pull request observations that are no longer current is refused as before', () => {
    const { store, goal, pr, update } = setup();
    expect(() => applyGoalReview(store, 'review-1', update([{ ...pr, version: STALE_PR_VERSION }]))).toThrow('stale or unsupported');
    expect(goal.status).toBe('active');
});

test('a stale citation of another project\'s pull request still refuses the whole update', () => {
    const { store, goal, pr, work, update } = setup();
    expect(() => applyGoalReview(store, 'review-1', update([work, { ...pr, projectId: 'brain' }]))).toThrow('stale or unsupported');
    expect(goal.status).toBe('active');
});

test('a stale ticket reference still refuses the whole update', () => {
    const { store, goal, pr, work, update } = setup();
    expect(() => applyGoalReview(store, 'review-1', update([pr, { ...work, version: '2026-11-19T00:13:24.266-0500' }]))).toThrow('stale or unsupported');
    expect(goal.status).toBe('active');
});

test('a blocked goal whose earlier links included the pull request can leave blocked when it and the accepted work are cited again', () => {
    const { store, goal, pr, work, update } = setupBlocked();
    applyGoalReview(store, 'review-2', update([pr, work]));
    expect(goal.status).toBe('done');
    // An earlier link that is not cited again still holds it.
    const again = setupBlocked();
    expect(() => applyGoalReview(again.store, 'review-2', again.update([again.work]))).toThrow('lack positive resolution evidence');
    // A stale citation alone cannot resolve the earlier pull request link.
    const stale = setupBlocked();
    expect(() => applyGoalReview(stale.store, 'review-2', stale.update([{ ...stale.pr, version: STALE_PR_VERSION }, stale.work]))).toThrow('lack positive resolution evidence');
    expect(stale.goal.status).toBe('blocked');
});

test.each(['stale first', 'current first'])('a current pull request citation resolves a blocked goal link with mixed versions (%s)', order => {
    const { store, goal, pr, work, update } = setupBlocked();
    const stale = { ...pr, version: STALE_PR_VERSION };
    const [first, second] = order === 'stale first' ? [stale, pr] : [pr, stale];
    const application = applyGoalReview(store, 'review-2', update([first, work], { linkedWork: [second, work] }));
    expect(goal.status).toBe('done');
    expect(application.dropped).toEqual([{ ref: stale, reason: 'not a current provider observation of this pull request' }]);
});

test('a review that stays blocked can remove a stale pull request link before a later review completes the goal', () => {
    const { store, goal, pr, work, update } = setupBlocked();
    const stale = { ...pr, version: STALE_PR_VERSION };
    applyGoalReview(store, 'review-2', update([stale, work], { status: 'blocked', blockers: goal.progress!.blockers }));
    expect(goal.status).toBe('blocked');
    expect(goal.progress?.linkedWork).toEqual([work]);
    applyGoalReview(store, 'review-3', update([work]));
    expect(goal.status).toBe('done');
});

function setupBrainDelivery() {
    const store = new Store(':memory:', projectById('brain')); stores.push(store);
    const goal = saveGoal(store, { id: crypto.randomUUID(), expectedUpdatedAt: '', project: store.project.name, title: 'Ship it', detail: '', priority: 2, status: 'active' });
    store.state.coordination = coordination();
    const closeout = { stage: 'closeout', result: { outcome: 'passed', receipts: [{ id: 'r', action: 'x', target: '', verified: true, uncertain: false, detail: '' }] } };
    const delivering = { id: 'job-1', key: 'GH-1', pr: 12, head: HEAD, mergeCommit: '', updatedAt: '2026-11-20T20:00:00.000Z', stage: 'lead-pr', status: 'watching', steps: [{ stage: 'review', result: { outcome: 'passed', receipts: [] } }] } as any;
    const accepted = { id: 'job-2', key: 'GH-2', pr: 13, head: 'c'.repeat(40), mergeCommit: '', updatedAt: '2026-11-20T20:00:00.000Z', stage: 'closeout', status: 'completed', steps: [closeout] } as any;
    store.state.coordination.jobs = [delivering, accepted];
    store.state.github = { status: 'idle', observedAt: LATER, error: '', issues: [], runs: [], prs: [{ number: 12, title: '', state: 'OPEN', draft: false, author: '', head: HEAD, base: 'main', url: '', mergedAt: '', mergeable: true, reviews: [], checks: [] }] } as any;
    // Cited at a provider time, not the job's own: it reaches the provider read, and is still judged as the job's work.
    const cited = { projectId: 'brain', kind: 'pr' as const, id: '12', version: COLLECTED, head: HEAD };
    const other = { projectId: 'brain', kind: 'job' as const, id: 'job-2', version: accepted.updatedAt, head: accepted.head };
    const update = { projectId: 'brain', goalId: goal.id, expectedUpdatedAt: goal.updatedAt, progress: 'Done.', blockers: [], evidence: [cited, other], linkedWork: [], rationale: '', status: 'done' } as any;
    return { store, goal, cited, delivering, closeout, update };
}

test('a pull request the Office is delivering is that delivery\'s work however it is cited, and vetoes done until the delivery is accepted', () => {
    const { store, goal, cited, delivering, closeout, update } = setupBrainDelivery();
    expect(workEvidence(store, cited)).toEqual({ started: true, accepted: false });
    expect(() => applyGoalReview(store, 'review-1', update)).toThrow('lacks scope acceptance');
    Object.assign(delivering, { stage: 'closeout', status: 'completed', steps: [closeout] });
    applyGoalReview(store, 'review-1', update);
    expect(goal.status).toBe('done');
});

test('an unresolved pull request owned by an unaccepted Office delivery still vetoes done', () => {
    const { store, goal, update } = setupBrainDelivery();
    store.state.github!.error = 'Unavailable';
    expect(() => applyGoalReview(store, 'review-1', update)).toThrow('stale or unsupported');
    expect(goal.status).toBe('active');
});
