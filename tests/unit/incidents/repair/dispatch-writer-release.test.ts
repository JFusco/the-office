import { afterEach, expect, test } from 'vitest';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { canonical } from '../../../../server/incidents/canonical-json';
import { admitResume } from '../../../../server/incidents/repair/dispatch-resume';
import { admitWriterRelease } from '../../../../server/incidents/repair/dispatch-writer-release';
import { REPAIR_WAIT_MS } from '../../../../server/incidents/repair/repair-wait';
import { resumeIdentity } from '../../../../server/incidents/repair/resume-binding';
import type { Store } from '../../../../server/store/store';
import type { RepairRoute, SubjectFix } from '../../../../src/contracts/incidents';
import { later } from './repair-wait-fixture';
import { deployedWorld, FIX, OPERATION, RELEASE } from './resume-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
const ONE = 'cms-field-vocabulary/delivery/1', HEAD = 'a'.repeat(40), gone = () => false;
type World = Awaited<ReturnType<typeof releases>>;
const route = (jobId: string): RepairRoute => ({ action: 'release-writer', payload: { key: `GH-${jobId}`, head: `run-${jobId}` }, expectedStage: 'implement' });
const leaving = (bound: SubjectFix): SubjectFix => bound.disposition === 'route' ? { ...bound, boundary: { kind: 'stage-left', stage: 'implement' } } : bound;
/**
 * Hands-off jobs whose implement run died of its own process (a timeout), stopped as the harness
 * labels that and bound to `release-writer` for that run: the state in which the release is due.
 */
async function releases(ids = ['1', '2'], over: (jobId: string) => RepairRoute = route) {
    const w = await deployedWorld(stores, dbs, ids, over, { job: { stage: 'implement', stop: { kind: 'uncertain-effect', at: 't1' }, branch: 'codex/1-fix', worktree: '/tmp/office-worktree-1', head: HEAD, steps: [] }, declare: leaving });
    w.store.state.workLog = ids.map(id => ({ id: `run-${id}`, requestId: id, stage: 'github-implement', status: 'failed', processId: 4242, startedAt: later(-20).toISOString(), endedAt: later(-10).toISOString(), failure: { category: 'uncertain-effect', dispatched: true, detail: 'codex timed out' } }) as any);
    w.store.save();
    return w;
}
const admit = (w: World, jobId = '1', minutes = 5, alive: (pid: number) => boolean = gone) => admitWriterRelease(w.store, w.intent(jobId), later(minutes), undefined, alive);
/** Everything the project holds, saved and in memory, and its events: the same before and after means nothing was written. */
const untouched = (w: World) => { const before = [w.saved(), JSON.stringify(w.store.state)]; return () => expect([w.saved(), JSON.stringify(w.store.state)]).toEqual(before); };

test('a due writer release saves one grant and one completed receipt, lifts that wait alone and restarts nothing', async () => {
    const w = await releases(), before = w.admissions();
    expect(Object.keys(w.waits())).toEqual(['delivery/1', 'delivery/2']);
    const outcome = admit(w) as { admitted: Record<string, any>; replayed: boolean };
    expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'release-writer', key: 'GH-1', head: '', lane: 'delivery', status: 'completed', requestedAt: later(5).toISOString() } });
    const identity = resumeIdentity(w.id, ONE, 'cli-bind-1');
    expect(w.jobs()[0].repairRelease).toEqual({ id: identity, incident: w.id, subject: ONE, fix: 'cli-bind-1', commit: FIX, workId: 'run-1', stage: 'implement', accepted: HEAD, grantedAt: later(5).toISOString() });
    // The job stays stopped, with its counters and stop as they were: the harness's own restart spends the grant.
    expect(w.jobs()[0]).toMatchObject({ status: 'blocked', stage: 'implement', stop: { kind: 'uncertain-effect', at: 't1' } });
    expect(w.jobs()[0].writerRestarts).toBeUndefined();
    const admitted = w.store.state.events.filter(event => event.ticket === 'GH-1');
    expect(admitted.map(event => [event.kind, event.message])).toEqual([['repair-resume-admitted', `GH-1: one more implement restart granted after harness fix ${FIX.slice(0, 7)} (${w.id}).`]]);
    expect(outcome.admitted.repairResume).toEqual({ id: identity, incident: w.id, subject: ONE, digest: w.binding('1').digest, fix: 'cli-bind-1', commit: FIX, action: 'release-writer',
        payload: createHash('sha256').update(canonical({ key: 'GH-1', head: 'run-1' })).digest('hex'), release: { commit: RELEASE, operation: OPERATION }, admittedAt: later(5).toISOString(),
        stood: { steps: 0, stage: 'implement', event: admitted[0].id } });
    // One receipt and no queued work.
    expect(w.requests()).toEqual([outcome.admitted]);
    expect(w.admissions()).toEqual(before);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
    expect(w.jobs()[1].repairRelease).toBeUndefined();
    const saved = w.savedState().coordination!;
    expect(saved.requests![0]).toMatchObject({ status: 'completed', head: '', repairResume: { stood: outcome.admitted.repairResume.stood } });
    expect(saved.jobs![0]).toMatchObject({ status: 'blocked', repairRelease: { id: identity, workId: 'run-1', accepted: HEAD } });
    // Bound once: a later pass answers with the same receipt and writes nothing, before and after a restart of the service, on either path.
    const unchanged = untouched(w);
    expect(admit(w, '1', 6)).toEqual({ admitted: outcome.admitted, replayed: true });
    unchanged();
    w.reload();
    const reloaded = untouched(w);
    expect(admit(w, '1', 7)).toMatchObject({ replayed: true, admitted: { id: outcome.admitted.id } });
    expect(admitResume(w.store, w.intent('1'), later(7))).toMatchObject({ replayed: true, admitted: { id: outcome.admitted.id } });
    reloaded();
});

test('a fresh writer release is not the generic job path\'s to queue', async () => {
    const w = await releases(['1']), unchanged = untouched(w);
    expect(admitResume(w.store, w.intent('1'), later(5))).toEqual({ refused: 'not-dispatchable', detail: 'This release does not dispatch release-writer with a head.' });
    unchanged();
});

test('a release names the dead run exactly, by the ticket\'s key: anything else is refused and writes nothing', async () => {
    const cases: [string, (jobId: string) => RepairRoute, string][] = [
        ['another run', jobId => ({ ...route(jobId), payload: { key: `GH-${jobId}`, head: 'run-9' } }), 'head-mismatch'],
        ['the run with space around it', jobId => ({ ...route(jobId), payload: { key: `GH-${jobId}`, head: ` run-${jobId}` } }), 'head-mismatch'],
        ['another key', jobId => ({ ...route(jobId), payload: { key: 'GH-9', head: `run-${jobId}` } }), 'key-mismatch'],
    ];
    for (const [name, bound, code] of cases) {
        const w = await releases(['1'], bound), unchanged = untouched(w);
        expect(admit(w), name).toMatchObject({ refused: code });
        unchanged();
    }
    // A fix cannot bind a release without the run, and the admission refuses one handed to it all the same.
    const w = await releases(['1']), unchanged = untouched(w);
    for (const payload of [{ key: 'GH-1' }, { key: 'GH-1', head: '  ' }, { key: 'GH-1', head: 'run-1', extra: true }]) {
        const binding = { ...w.binding('1'), route: { ...w.binding('1').route, payload } };
        expect(admitWriterRelease(w.store, w.intent('1', { binding }), later(5), undefined, gone), JSON.stringify(payload)).toMatchObject({ refused: 'not-dispatchable' });
    }
    unchanged();
});

test('a job resume\'s refusals hold for a release too, and none of them writes anything', async () => {
    const cases: [string, (w: World) => void, string][] = [
        ['paused', w => { w.store.state.paused = true; }, 'project-paused'],
        ['draining', w => { w.store.state.draining = true; }, 'project-paused'],
        ['a request pending for the key', w => { w.store.state.coordination!.requests = [{ id: 'r', key: 'GH-1', action: 'reconcile-review', status: 'queued', head: '', requestedAt: 't' } as any]; }, 'request-pending'],
        ['a claim on the job', w => { w.store.claimWork({ projectId: w.store.project.id, kind: 'delivery', id: '1' }, 'scheduler', 'implement', 'delivery'); }, 'request-pending'],
        ['a changed stop', w => { w.jobs()[0].stop = { kind: 'uncertain-effect', at: 't2' }; }, 'wait-ended'],
        ['an uncertain write for the job', w => { w.store.db.prepare("INSERT INTO effects(id, work_key, status, body) VALUES('e1', 'cms-field-vocabulary:delivery:1', 'uncertain', ?)").run(JSON.stringify({ attemptId: 'attempt-1' })); }, 'wait-ended'],
        ['a run that returned its verdict', w => { Object.assign(w.store.state.workLog![0], { status: 'blocked', executionStatus: 'completed' }); }, 'wait-ended'],
        ['a run already restarted', w => { w.jobs()[0].writerRestarts = [{ workId: 'run-1', stage: 'implement', at: 't', accepted: HEAD, abandoned: HEAD, ref: '' }]; }, 'head-mismatch'],
        ['a run declined', w => { w.jobs()[0].writerRestartDeclined = { workId: 'run-1', reason: 'moved', at: 't' }; }, 'head-mismatch'],
        ['no worktree', w => { w.jobs()[0].worktree = ''; }, 'head-mismatch'],
    ];
    for (const [name, arrange, code] of cases) {
        const w = await releases(['1']);
        arrange(w);
        const unchanged = untouched(w);
        expect(admit(w), name).toMatchObject({ refused: code });
        unchanged();
    }
    // A process the operating system still reports alive has not finished.
    const alive = await releases(['1']), unchanged = untouched(alive);
    expect(admit(alive, '1', 5, () => true)).toMatchObject({ refused: 'head-mismatch' });
    unchanged();
});

test('only a release of this project\'s delivery job is admitted here', async () => {
    const w = await releases(['1']), unchanged = untouched(w);
    const other = (over: Partial<ReturnType<World['binding']>>) => ({ ...w.binding('1'), ...over }) as ReturnType<World['binding']>;
    expect(admitWriterRelease(w.store, w.intent('1', { binding: other({ route: { ...w.binding('1').route, action: 'review-pr' } }) }), later(5), undefined, gone)).toMatchObject({ refused: 'not-dispatchable' });
    expect(admitWriterRelease(w.store, w.intent('1', { binding: other({ subject: 'brain/delivery/1' }) }), later(5), undefined, gone)).toMatchObject({ refused: 'no-record' });
    unchanged();
});

test('a wait that runs out while the admission reads, or before it commits, is over: nothing is written', async () => {
    for (const at of ['reads', 'commit', 'never'] as const) {
        const w = await releases(['1']), clock = w.store.clock;
        const when = new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS - 60_000);
        let elapsed = 0;
        w.store.clock = { now: clock.now, monotonic: () => elapsed };
        // The Effects read is the restart rule's last; the event is the commit's last write.
        const prepare = w.store.db.prepare.bind(w.store.db), emit = w.store.emit.bind(w.store);
        if (at === 'reads') w.store.db.prepare = ((sql: string) => { if (sql.startsWith('SELECT body FROM effects WHERE work_key')) elapsed = 60_000; return prepare(sql); }) as any;
        if (at === 'commit') w.store.emit = ((...args: Parameters<Store['emit']>) => { elapsed = 60_000; return emit(...args); }) as any;
        const unchanged = untouched(w), outcome = admitWriterRelease(w.store, w.intent('1'), when, undefined, gone);
        w.store.db.prepare = prepare; w.store.emit = emit;
        if (at === 'never') expect(outcome).toMatchObject({ replayed: false, admitted: { action: 'release-writer' } });
        else {
            expect(outcome, at).toMatchObject({ refused: 'wait-ended' });
            unchanged();
        }
    }
    // A wait that ran out while the rule read is over, whatever the rule said.
    const w = await releases(['1'], jobId => ({ ...route(jobId), payload: { key: `GH-${jobId}`, head: 'run-9' } })), clock = w.store.clock, prepare = w.store.db.prepare.bind(w.store.db);
    let elapsed = 0;
    w.store.clock = { now: clock.now, monotonic: () => elapsed };
    w.store.db.prepare = ((sql: string) => { if (sql.startsWith('SELECT body FROM effects WHERE work_key')) elapsed = 60_000; return prepare(sql); }) as any;
    const unchanged = untouched(w);
    expect(admitWriterRelease(w.store, w.intent('1'), new Date(Date.parse(w.waits()['delivery/1'].progressAt) + REPAIR_WAIT_MS - 60_000), undefined, gone)).toMatchObject({ refused: 'wait-ended' });
    w.store.db.prepare = prepare;
    unchanged();
});

test('the bound job is found by its ID: a sibling with the same key, listed first, receives nothing', async () => {
    const w = await releases(['2', '1']);
    w.jobs()[0].key = 'GH-1';
    w.store.save();
    expect(admit(w)).toMatchObject({ replayed: false, admitted: { key: 'GH-1' } });
    expect(w.jobs().map(job => [job.id, job.repairRelease?.workId ?? null])).toEqual([['2', null], ['1', 'run-1']]);
    expect(Object.keys(w.waits())).toEqual(['delivery/2']);
});
