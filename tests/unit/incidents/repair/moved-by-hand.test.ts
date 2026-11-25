import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { APPROACH_GUARD_REJECTION, requeueWaitedImplement } from '../../../../server/delivery/recovery/implementation/requeue-waited-implement';
import { checkpointRetried, movedByHand, OPERATOR_MOVES, REVIEW_MOVES } from '../../../../server/incidents/repair/moved-by-hand';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { deferNonReady, preparePR, recheck, recheckCandidate, recheckPR, updateCandidateBase } from '../../../../server/scheduling/operator-commands';
import { Store } from '../../../../server/store/store';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function project(jobs: unknown[] = []) {
    const root = mkdtempSync(resolve(tmpdir(), 'moved-by-hand-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = { ...coordination(), jobs: jobs as never };
    return store;
}
const result = (over: Record<string, unknown> = {}) => ({ outcome: 'passed', summary: 'Fixture', commit: 'a'.repeat(40), evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '/wt', branch: 'codex/1', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '', ...over });

test('each command event for the ticket after the given event is a move, named with when it was recorded', () => {
    for (const kind of OPERATOR_MOVES) {
        const store = project(), before = store.emit('refresh', 'before', undefined, 'GH-1').id;
        expect(movedByHand(store, 'GH-1', before), kind).toBeNull();
        const event = store.emit(kind, 'an operator moved GH-1', 'lead', 'GH-1');
        expect(movedByHand(store, 'GH-1', before), kind).toEqual({ kind, at: event.at });
    }
});

test('a command before or at the given event, one for another ticket and any other event are not moves', () => {
    const store = project();
    const earlier = store.emit('pr-review-recheck', 'before the admission', 'lead', 'GH-1');
    const admission = store.emit('repair-resume-admitted', 'GH-1: queued', undefined, 'GH-1');
    store.emit('pr-review-recheck', 'another ticket', 'lead', 'GH-2');
    store.emit('pr-review-recheck', 'no ticket', 'lead');
    for (const kind of ['operation-finished', 'scope-repair-resumed', 'command-recorded', 'repair-resume-admitted', 'review-board-status']) store.emit(kind, 'not a command that moves a job', undefined, 'GH-1');
    expect(movedByHand(store, 'GH-1', admission.id)).toBeNull();
    // The earlier command is a move only for something before it.
    expect(movedByHand(store, 'GH-1', earlier.id)).toBeNull();
    expect(movedByHand(store, 'GH-1', earlier.id - 1)).toEqual({ kind: 'pr-review-recheck', at: earlier.at });
    expect(movedByHand(store, 'GH-2', admission.id)).toMatchObject({ kind: 'pr-review-recheck' });
});

test('of several moves the first after the given event is the one named', () => {
    const store = project(), admission = store.emit('repair-resume-admitted', 'GH-1: queued', undefined, 'GH-1');
    const first = store.emit('candidate-review-recheck', 'first', 'lead', 'GH-1');
    store.emit('implement-requeued', 'second', 'pm', 'GH-1');
    expect(movedByHand(store, 'GH-1', admission.id)).toEqual({ kind: 'candidate-review-recheck', at: first.at });
});

test('the five commands that move a delivery job emit exactly the events read here, each with the ticket key', () => {
    const seen: string[] = [];
    const moved = (job: Record<string, unknown>, command: (store: Store) => void) => {
        const store = project([{ id: 'job1', key: 'GH-1', detail: '', head: '', pr: 0, steps: [], ...job }]), before = store.state.revision;
        command(store);
        const move = movedByHand(store, 'GH-1', before);
        expect(move, JSON.stringify(job)).not.toBeNull();
        seen.push(move!.kind);
    };
    const self = (store: Store) => ({ state: store.state.coordination, store }) as never;
    moved({ stage: 'lead-pr', status: 'blocked', pr: 12 }, store => preparePR.call(self(store), 'GH-1'));
    moved({ stage: 'update-base', status: 'blocked', head: 'a'.repeat(40), worktree: '/wt', branch: 'codex/1', steps: [{ stage: 'validate', result: result({ findings: [{ id: 'delivery-baseline', status: 'open' }] }) }] }, store => updateCandidateBase.call(self(store), 'GH-1'));
    moved({ stage: 'review', status: 'blocked' }, store => recheckCandidate.call(self(store), 'GH-1'));
    moved({ stage: 'lead-pr', status: 'blocked', pr: 12 }, store => recheckPR.call(self(store), 'GH-1'));
    const small = { plan: 'brief', review: 'focused', validation: 'developer-checks', checks: ['pnpm run verify:ci'], reason: 'Data-only profile.' };
    moved({ stage: 'implement', status: 'blocked', detail: `Error: ${APPROACH_GUARD_REJECTION}`, worktree: '/wt', branch: 'codex/1',
        steps: [{ stage: 'implement', result: result({ outcome: 'blocked', resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [] } }) }, { stage: 'implement', result: result({ approach: small }) }] }, store => requeueWaitedImplement(store, 'GH-1'));
    expect(seen).toEqual(['pr-preparation-queued', 'candidate-base-update', 'candidate-review-recheck', 'pr-review-recheck', 'implement-requeued']);
    expect([...seen].sort()).toEqual([...OPERATOR_MOVES].sort());
});

test('the two commands that move an assignment review emit exactly the review moves, each with the ticket key, and the two lists share nothing', async () => {
    const reviewed = (status: string) => {
        const store = project();
        store.state.coordination!.listener.reviews = [{ id: 'review-1', key: 'GH-1', summary: '', url: '', queuedAt: '', startedAt: '', endedAt: '', status, detail: 'Error: stopped', owner: '' }] as never;
        return store;
    };
    const seen: string[] = [];
    const rechecked = reviewed('blocked'), before = rechecked.state.revision;
    recheck.call({ store: rechecked, state: rechecked.state.coordination } as never, 'GH-1');
    seen.push(movedByHand(rechecked, 'GH-1', before, REVIEW_MOVES)!.kind);
    const deferred = reviewed('blocked');
    await deferNonReady.call({ store: deferred, state: deferred.state.coordination, pickup: { status: 'Ready' }, readAssignments: async () => [{ key: 'GH-1', status: 'Backlog' }] } as never, 'GH-1');
    seen.push(movedByHand(deferred, 'GH-1', before, REVIEW_MOVES)!.kind);
    expect(seen).toEqual(['assignment-recheck', 'pickup-deferred']);
    expect([...seen].sort()).toEqual([...REVIEW_MOVES].sort());
    // A job is never moved by a review's command, nor a review by a job's.
    expect(movedByHand(rechecked, 'GH-1', before)).toBeNull();
    expect(movedByHand(deferred, 'GH-1', before)).toBeNull();
    const store = project(), admission = store.emit('repair-resume-admitted', 'GH-1: resumed', undefined, 'GH-1');
    for (const kind of OPERATOR_MOVES) store.emit(kind, 'a job command', 'lead', 'GH-1');
    expect(movedByHand(store, 'GH-1', admission.id, REVIEW_MOVES)).toBeNull();
    expect(REVIEW_MOVES.filter(kind => OPERATOR_MOVES.includes(kind))).toEqual([]);
});

test('a retry queued for a checkpoint\'s original run after the given event moves it, found by the run its message names, literally', () => {
    const store = project();
    const message = (run: string) => `Original maintenance ${run} reconciled. Brain checkpoint will retry after 2026-11-20T12:10:00.000Z; the nightly gate remains authoritative.`;
    const earlier = store.emit('checkpoint-retry-queued', message('original-1'), 'pm');
    const admission = store.emit('repair-resume-admitted', 'cp-1: queued');
    // Another run, a run whose ID only begins the same, a pattern that would match as LIKE, the same words under another kind, and the run named elsewhere in the message.
    for (const run of ['original-2', 'original-10', 'original_1', 'original%']) store.emit('checkpoint-retry-queued', message(run), 'pm');
    store.emit('checkpoint-native-reconciled', message('original-1'), 'pm');
    store.emit('checkpoint-retry-queued', `Retried: ${message('original-1')}`, 'pm');
    expect(checkpointRetried(store, 'original-1', admission.id)).toBeNull();
    expect(checkpointRetried(store, 'originalX1', admission.id)).toBeNull();
    // The earlier retry is a move only for something before it.
    expect(checkpointRetried(store, 'original-1', earlier.id - 1)).toEqual({ kind: 'checkpoint-retry-queued', at: earlier.at });
    const retried = store.emit('checkpoint-retry-queued', message('original-1'), 'pm');
    store.emit('checkpoint-retry-queued', message('original-1'), 'pm');
    expect(checkpointRetried(store, 'original-1', admission.id)).toEqual({ kind: 'checkpoint-retry-queued', at: retried.at });
    // An ID holding LIKE's wildcards matches only itself.
    expect(checkpointRetried(store, 'original_1', admission.id)).toMatchObject({ kind: 'checkpoint-retry-queued' });
    expect(checkpointRetried(store, 'original%', admission.id)).toMatchObject({ kind: 'checkpoint-retry-queued' });
    expect(checkpointRetried(store, 'original', admission.id)).toBeNull();
});
