import { afterEach, expect, test } from 'vitest';
import { workerFailures } from '../../../../server/incidents/sources/worker-failures';
import type { Store } from '../../../../server/store/store';
import { AT, later, observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
const ended = (minutesAgo: number) => new Date(AT.getTime() - minutesAgo * 60_000).toISOString();

test('a dispatched failure is counted by its category for 24 hours', () => {
    const s = store();
    const run = (over: Record<string, unknown>) => ({ id: 'run-1', status: 'failed', stage: 'review', provider: 'claude', endedAt: ended(10), failure: { category: 'timeout', detail: 'Error: no output for 600 s on GH-12', dispatched: true }, ...over });
    s.state.workLog = [
        run({}), run({ id: 'run-2', status: 'interrupted', failure: { category: 'invalid-output', detail: 'schema mismatch', dispatched: true, code: 'surviving-subprocesses' } }),
        run({ id: 'old', endedAt: ended(25 * 60) }), run({ id: 'undispatched', failure: { category: 'timeout', detail: 'x', dispatched: false } }),
        run({ id: 'cancelled', failure: { category: 'cancelled', detail: 'x', dispatched: true } }), run({ id: 'accepted', completionAccepted: true }),
        run({ id: 'fine', status: 'completed', failure: undefined }), run({ id: 'auth', failure: { category: 'authentication', detail: 'login expired', dispatched: true } }),
    ] as any;
    const found = workerFailures(observe(s));
    expect(found.map(f => f.subject.id)).toEqual(['run-1', 'run-2', 'auth']);
    expect(found[0]).toMatchObject({ subject: { kind: 'worker', episode: ended(10), stage: 'review', lastWorker: 'run-1' }, cause: { source: 'worker-failure', provider: 'claude', kind: 'timeout', text: 'no output for <n> s on <key>', author: 'harness' }, expected: null });
    expect(found[1].cause.kind).toBe('surviving-subprocesses');
    expect(found[2].expected).toBe('authentication');
    expect(workerFailures(observe(s, [], later(24 * 60)))).toEqual([]);
});
