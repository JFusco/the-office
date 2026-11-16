import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { unrecordedStageResult } from '../../../server/cec/unrecorded-result';
import { ticket, decision } from './parking/fixtures';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
/** A retest whose worker returned and whose attempt was saved, while the ticket still shows the previous retest. */
function lost() {
    let now = Date.parse('2026-11-16T21:03:00Z');
    const store = new Store(':memory:', projectById('cec'), undefined, { now: () => new Date(now), monotonic: () => now });
    stores.push(store);
    const t = ticket(); Object.assign(t, { stage: 'retest', activity: 'working' });
    t.results.retest = decision('', { outcome: 'failed', summary: 'Earlier retest', commit: 'b'.repeat(40) });
    store.state.tickets = [t];
    const attemptId = store.begin(t, 'retest');
    const returned = decision('', { outcome: 'blocked', summary: 'Needs a Target DXP and a second BA', commit: t.commit, paidRuns: 9, receipts: [] });
    const work: any = { id: 'run-1', ticket: t.key, stage: 'retest', role: 'qa', status: 'blocked', executionStatus: 'completed', startedAt: '2026-11-16T21:03:08Z', endedAt: '2026-11-16T22:15:05Z' };
    store.state.workLog = [work];
    now = Date.parse('2026-11-16T22:15:30Z');
    store.finish(attemptId, returned);
    return { store, t, attemptId, returned, work };
}

test('a result the worker returned and the attempt recorded, but the ticket never received, is found with its attempt', () => {
    const { store, t, attemptId, returned } = lost();
    expect(unrecordedStageResult(store, t, 'retest')).toEqual({ attemptId, result: returned });
});

test('a result already on the ticket, a run still going, or a run that did not return is not taken', () => {
    const cases: [string, (x: ReturnType<typeof lost>) => void][] = [
        ['already recorded', x => { x.t.results.retest = structuredClone(x.returned); }],
        ['ticket moved on', x => { x.t.stage = 'repair'; }],
        ['worker did not return', x => { delete x.work.executionStatus; x.work.status = 'failed'; x.work.failure = { category: 'uncertain-effect', dispatched: true, detail: 'timed out' }; }],
        ['worker finished after the attempt was recorded', x => { x.work.endedAt = '2026-11-16T22:20:00Z'; }],
        ['result for another commit', x => { x.t.commit = 'c'.repeat(40); }],
        ['a newer attempt is still running', x => { x.store.begin(x.t, 'retest'); }],
        ['no worker run', x => { x.store.state.workLog = []; }],
        ['a reroute, which never writes a ticket result', x => { x.store.db.prepare("UPDATE attempts SET status='reroute' WHERE id=?").run(x.attemptId); }],
        ['already applied once', x => { x.t.recoveredAttemptId = x.attemptId; }],
    ];
    for (const [name, arrange] of cases) { const x = lost(); arrange(x); expect(unrecordedStageResult(x.store, x.t, 'retest'), name).toBeUndefined(); }
    const other = lost();
    expect(unrecordedStageResult(other.store, other.t, 'qa')).toBeUndefined();
});
