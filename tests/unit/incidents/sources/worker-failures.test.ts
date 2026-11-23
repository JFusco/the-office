import { afterEach, expect, test } from 'vitest';
import { FAILURES_KEPT, workerFailures } from '../../../../server/incidents/sources/worker-failures';
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
    expect(found.some(f => 'foldedOnly' in f)).toBe(false);
    expect(workerFailures(observe(s, [], later(24 * 60)))).toEqual([]);
});

const limit = { category: 'other', detail: 'codex exited 1: You have hit your usage limit. Try again at Nov 24th, 2026 11:50 AM.', dispatched: true };
/** A failed run that ended `minutesAgo`; a lower number is a newer run. */
const failedRun = (id: string, minutesAgo: number, over: Record<string, unknown> = {}) => ({ id, status: 'failed', stage: 'it-investigation', provider: 'codex', endedAt: ended(minutesAgo), failure: limit, ...over });
const own = (found: ReturnType<typeof workerFailures>) => found.filter(f => !f.foldedOnly).map(f => f.subject.id);
const folded = (found: ReturnType<typeof workerFailures>) => found.filter(f => f.foldedOnly).map(f => f.subject.id);

test('of the failed runs of one cause only the newest are subjects of their own; each cause has its own count', () => {
    const s = store(), storm = Array.from({ length: FAILURES_KEPT + 5 }, (_, i) => failedRun(`limit-${i}`, i + 1));
    expect(FAILURES_KEPT).toBe(20);
    // Saved oldest first, as a work log is: the bound is by when a run ended, not by where it sits.
    s.state.workLog = [...storm].reverse().concat([
        failedRun('other-stage', 500, { stage: 'conversation-readback' }), failedRun('other-provider', 500, { provider: 'claude' }),
        failedRun('other-words', 500, { failure: { ...limit, detail: 'codex exited 1: stream closed' } }), failedRun('other-kind', 500, { failure: { ...limit, category: 'timeout' } }),
        failedRun('other-code', 500, { failure: { ...limit, code: 'surviving-subprocesses' } }),
    ]) as any;
    const found = workerFailures(observe(s));
    expect(found.map(f => f.subject.id)).toEqual((s.state.workLog as any[]).map(run => run.id));
    expect(folded(found)).toEqual(['limit-24', 'limit-23', 'limit-22', 'limit-21', 'limit-20']);
    expect(own(found)).toEqual([...Array.from({ length: FAILURES_KEPT }, (_, i) => `limit-${FAILURES_KEPT - 1 - i}`), 'other-stage', 'other-provider', 'other-words', 'other-kind', 'other-code']);
    // What is reported of a run past the newest is what was always reported of it, and the mark.
    expect(found[0]).toEqual({ ...workerFailures(observe(Object.assign(store(), { state: { ...s.state, workLog: [storm[24]] } }) as Store))[0], foldedOnly: true });
    // Exactly the bound is no storm: nothing is marked.
    s.state.workLog = storm.slice(0, FAILURES_KEPT) as any;
    expect(folded(workerFailures(observe(s)))).toEqual([]);
    expect(own(workerFailures(observe(s)))).toHaveLength(FAILURES_KEPT);
});

test('the bound is each project\'s own, and runs that ended at the same instant are ordered by ID', () => {
    const a = store('brain'), b = store('cms-field-vocabulary');
    a.state.workLog = Array.from({ length: FAILURES_KEPT + 1 }, (_, i) => failedRun(`a-${i}`, i + 1)) as any;
    b.state.workLog = Array.from({ length: FAILURES_KEPT }, (_, i) => failedRun(`b-${i}`, i + 1)) as any;
    expect(folded(workerFailures(observe(a)))).toEqual(['a-20']);
    expect(folded(workerFailures(observe(b)))).toEqual([]);
    // Twenty-two runs that ended together: the two with the greatest IDs are past the newest, whatever their place in the log.
    const tied = Array.from({ length: FAILURES_KEPT + 2 }, (_, i) => failedRun(`t-${String(i).padStart(2, '0')}`, 7));
    for (const log of [tied, [...tied].reverse()]) {
        a.state.workLog = log as any;
        expect(folded(workerFailures(observe(a))).sort()).toEqual(['t-20', 't-21']);
    }
});

test('an accepted result keeps its place: accepting a kept run later brings no older run back', () => {
    const s = store(), runs = Array.from({ length: FAILURES_KEPT + 1 }, (_, i) => failedRun(`run-${i}`, i + 1));
    s.state.workLog = runs as any;
    expect(folded(workerFailures(observe(s)))).toEqual(['run-20']);
    s.state.workLog = runs.map(run => run.id === 'run-3' ? { ...run, completionAccepted: true } : run) as any;
    const found = workerFailures(observe(s));
    expect(found.map(f => f.subject.id)).not.toContain('run-3');
    expect(folded(found)).toEqual(['run-20']);
    expect(own(found)).toHaveLength(FAILURES_KEPT - 1);
    // As the newest runs leave the 24 hours, the older ones have left before them: a run past the newest never becomes one of them.
    for (const minutes of [0, 600, 24 * 60 - 10, 24 * 60 - 2.5]) {
        const seen = workerFailures(observe(s, [], later(minutes)));
        expect(own(seen)).not.toContain('run-20');
    }
    expect(workerFailures(observe(s, [], later(24 * 60 - 2.5))).map(f => f.subject.id)).toEqual(['run-0', 'run-1']);
});
