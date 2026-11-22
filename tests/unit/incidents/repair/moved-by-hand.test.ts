import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { APPROACH_GUARD_REJECTION, requeueWaitedImplement } from '../../../../server/delivery/recovery/implementation/requeue-waited-implement';
import { movedByHand, OPERATOR_MOVES } from '../../../../server/incidents/repair/moved-by-hand';
import { projectById } from '../../../../server/office/projects';
import { coordination } from '../../../../server/scheduling/coordination';
import { preparePR, recheckCandidate, recheckPR, updateCandidateBase } from '../../../../server/scheduling/operator-commands';
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
