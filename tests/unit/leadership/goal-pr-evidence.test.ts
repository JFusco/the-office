import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { saveGoal } from '../../../server/leadership/goals';
import { applyGoalReview, workEvidence } from '../../../server/leadership/goal-reviews';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
const HEAD = 'a'.repeat(40), COLLECTED = '2026-11-20T21:58:23.060Z', LATER = '2026-11-20T22:01:40.000Z', TICKET_UPDATED = '2026-11-20T08:38:06.947-0500';

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

test('a stale ticket reference still refuses the whole update', () => {
    const { store, goal, pr, work, update } = setup();
    expect(() => applyGoalReview(store, 'review-1', update([pr, { ...work, version: '2026-11-19T00:13:24.266-0500' }]))).toThrow('stale or unsupported');
    expect(goal.status).toBe('active');
});
