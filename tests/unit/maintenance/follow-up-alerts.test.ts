import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { projectOutbox } from '../../../server/conversations/outbox';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(s => s.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function fixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-maintenance-alert-')); roots.push(root);
    const store = new Store(':memory:', projectById('cms-field-vocabulary'), root); stores.push(store);
    store.state.coordination = coordination();
    store.state.maintenance = { runs: [2, 3].map(day => ({ id: `run-${day}`, requestedAt: `2026-11-0${day}T20:00:00Z`, status: 'blocked', stage: 'vendor-review', error: `Source read denied on November ${day}` })), lastDaily: '', lastWeekly: '', ledger: '' } as any;
    store.state.coordination.checkpoints = [2, 3].map(day => ({ id: `checkpoint-${day}`, date: `2026-11-0${day}`, runId: `run-${day}`, status: 'blocked', detail: `Source read denied on November ${day}` })) as any;
    return store;
}
test('each failed run has one maintenance action; duplicate checkpoint alerts resolve with history preserved', () => {
    const store = fixture(), state = store.state;
    const history = structuredClone({ runs: state.maintenance!.runs, checkpoints: state.coordination!.checkpoints });
    state.outbox = state.coordination!.checkpoints.map(c => ({ id: `checkpoint:${c.id}`, title: 'Daily checkpoint needs follow-up', detail: c.detail, status: 'open', role: 'pm', ticket: '', url: '', createdAt: '', updatedAt: '' }));
    store.emit('test', 'Refresh alerts');
    expect(state.outbox.filter(a => a.status === 'open').map(a => a.id).sort()).toEqual(['maintenance:run-2', 'maintenance:run-3']);
    expect(state.outbox.filter(a => a.id.startsWith('checkpoint:')).every(a => a.status === 'resolved')).toBe(true);
    expect({ runs: state.maintenance!.runs, checkpoints: state.coordination!.checkpoints }).toEqual(history);
    expect(projectOutbox(state).filter(a => a.status === 'open')).toHaveLength(2);
});
test('an independent checkpoint failure or repair follow-up is still visible', () => {
    const state = fixture().state;
    state.coordination!.checkpoints[0].runId = 'missing-run';
    state.coordination!.checkpoints[1].repairResume = { needsFollowup: true } as any;
    expect(projectOutbox(state).filter(a => a.status === 'open')).toHaveLength(4);
});
test('only successful later maintenance resolves old source failures', () => {
    const state = fixture().state;
    const later = { id: 'later', requestedAt: '2026-11-04T20:00:00Z', stage: 'vendor-review', status: 'working' } as any;
    state.maintenance!.runs.push(later);
    expect(projectOutbox(state).filter(a => a.status === 'open')).toHaveLength(2);
    later.status = 'completed'; later.stage = 'complete';
    state.coordination!.checkpoints.push({ id: 'later-checkpoint', date: '2026-11-04', status: 'completed', runId: 'later' } as any);
    expect(projectOutbox(state).filter(a => a.status === 'open')).toEqual([]);
});
