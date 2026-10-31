import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { coordination } from '../../../server/scheduling/coordination';
import { captureTime, timeLedger, TimeLedger } from '../../../server/time/time-ledger';
import { projectById } from '../../../server/office/projects';
import type { WorkTime } from '../../../src/shared';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(s => s.close()));
function setup(project = 'brain') { const store = new Store(':memory:', projectById(project)); stores.push(store); store.state.coordination = coordination(); timeLedger(store).activatedAt = '2026-10-28T00:00:00Z'; return store; }
function work(id: string, startedAt: string, elapsedMs: number, extra: Partial<WorkTime> = {}): WorkTime { return { id, role: 'developer', task: 'Synthetic', ticket: 'GH-999', stage: 'implement', requestId: '', sessionId: '', provider: 'fixture', model: '', effort: '', status: 'completed', startedAt, lastHeartbeatAt: startedAt, endedAt: new Date(Date.parse(startedAt) + elapsedMs).toISOString(), elapsedMs, queuedMs: 999999, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: startedAt, ...extra }; }
test('time excludes queue/CI/uncertain history, unions overlaps, splits Eastern midnight, and never duplicates', () => {
    const store = setup('cec');
    store.state.workLog = [work('1', '2026-10-28T14:00:00Z', 60000), work('2', '2026-10-28T14:00:30Z', 60000), work('3', '2026-10-28T14:00:00Z', 999999, { durationUncertain: true }), work('4', '2026-10-29T03:59:30Z', 60000)];
    captureTime(store);
    captureTime(store);
    const entries = timeLedger(store).entries;
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.seconds)).toEqual([120, 30]);
    expect(entries.every(e => e.status === 'pending')).toBe(true);
    expect(entries[0].detail).toContain('not submitted');
});
test('GitHub numeric total preserves baseline, reads back exact value and blocks outside edits', async () => {
    const store = setup();
    store.state.workLog = [work('1', '2026-10-28T14:00:00Z', 60000)];
    captureTime(store);
    let value: number | null = 2, writes = 0;
    const execute = async (_bin: string, _args: string[], opts: any) => {
        const { query, variables } = JSON.parse(opts.input);
        if (query.includes('user(login:'))
            return JSON.stringify({ data: { user: { projectV2: { id: 'PROJECT', fields: { nodes: [{ id: 'FIELD', name: 'Time Spent (Hours)', dataType: 'NUMBER' }], pageInfo: { hasNextPage: false } } } } } });
        if (query.includes('items(first:'))
            return JSON.stringify({ data: { node: { items: { nodes: [{ id: 'ITEM', content: { number: 999, repository: { nameWithOwner: 'JFusco/brain' } }, fieldValues: { nodes: [{ number: value, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } }], pageInfo: { hasNextPage: false } } } } });
        if (query.includes('mutation')) {
            expect(typeof variables.hours).toBe('number');
            value = variables.hours;
            writes++;
            return JSON.stringify({ data: { updateProjectV2ItemFieldValue: { projectV2Item: { id: 'ITEM' } } } });
        }
        return JSON.stringify({ data: { node: { fieldValues: { nodes: [{ number: value, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } } } });
    };
    const ledger = new TimeLedger(store, execute as any);
    await ledger.sync();
    expect(value).toBe(2.0167);
    expect(timeLedger(store).entries[0].status).toBe('posted');
    await ledger.sync();
    expect(writes).toBe(1);
    store.state.workLog.push(work('2', '2026-10-28T15:00:00Z', 60000));
    captureTime(store);
    value = 7;
    await ledger.sync();
    expect(writes).toBe(1);
    expect(timeLedger(store).entries[0].status).toBe('uncertain');
    expect(timeLedger(store).entries[0].detail).toContain('changed outside');
});
test('uncertain hours reconcile by read-back and never repeat a write', async () => {
    const store = setup(), l = timeLedger(store);
    l.entries = [{ id: 'e', key: 'GH-999', date: '2026-10-28', seconds: 3600, sourceIds: [], status: 'uncertain', detail: 'Interrupted', url: '' }];
    l.baselines = { 'GH-999': { baseline: 2, lastWritten: 2, itemId: 'ITEM' } };
    l.publications = [{ id: 'frozen', provider: 'github', key: 'GH-999', status: 'uncertain', projectId: 'brain', itemId: 'ITEM', fieldId: 'FIELD', worklogId: '', baseline: 2, previousValue: 2, intendedValue: 3, covered: [{ id: 'e', revision: 1, seconds: 3600 }], payload: { hours: 3 }, createdAt: '', detail: '' }];
    let value = 3;
    const execute = async (_b: string, _a: string[], opts: any) => { const { query } = JSON.parse(opts.input); expect(query).not.toContain('mutation'); return JSON.stringify({ data: query.includes('user(login:') ? { user: { projectV2: { id: 'PROJECT', fields: { nodes: [{ id: 'FIELD', name: 'Time Spent (Hours)', dataType: 'NUMBER' }], pageInfo: { hasNextPage: false } } } } } : { node: { items: { nodes: [{ id: 'ITEM', content: { number: 999, repository: { nameWithOwner: 'JFusco/brain' } }, fieldValues: { nodes: [{ number: value, field: { id: 'FIELD' } }], pageInfo: { hasNextPage: false } } }], pageInfo: { hasNextPage: false } } } } }); };
    const ledger = new TimeLedger(store, execute as any);
    await ledger.sync('GH-999');
    expect(l.entries[0].status).toBe('posted');
    l.entries[0].status = 'uncertain';
    l.publications[0].status = 'uncertain';
    value = 9;
    await ledger.sync('GH-999');
    expect(l.entries[0].status).toBe('uncertain');
    expect(l.entries[0].detail).toContain('differ');
});
