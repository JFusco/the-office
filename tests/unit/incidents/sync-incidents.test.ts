import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import type { IncidentCollector } from '../../../server/incidents/observation';
import { workerFailures } from '../../../server/incidents/sources/worker-failures';
import { syncIncidents } from '../../../server/incidents/sync-incidents';
import type { Store } from '../../../server/store/store';
import { AT, candidate, item, later, observe, office, projectStore } from './incident-fixture';
import { savedFingerprint } from '../store/saved-fingerprint-fixture';
import { savedStateText } from '../store/saved-state-fixture';

const stores: Store[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); dbs.splice(0).forEach(db => db.close()); });
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }
function ledger() { const db = new DatabaseSync(':memory:'); dbs.push(db); return { db, ledger: new IncidentLedger(db) }; }
const job = (id: string, over: Record<string, unknown> = {}) => ({ id, key: `GH-${id}`, status: 'blocked', stage: 'review', detail: `Error: Worktree /tmp/w/${id} is missing`, head: 'abc1234', requestedAt: 'r', updatedAt: 'u', steps: [{ stage: 'review', result: { outcome: 'passed', blocker: '', summary: 'ok', evidence: [], findings: [], receipts: [] } }], stop: { kind: 'unclassified', at: 't1' }, ...over }) as any;
const loud = (message: string) => { throw new Error(message); };
const blocked = (id: string, projectId?: string) => item('delivery', id, 'review', 'blocked', 'Blocked', 'unclassified', projectId);
function deepFreeze<T>(value: T): T { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.freeze(value); Object.values(value).forEach(deepFreeze); } return value; }
const rows = (db: DatabaseSync, table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

test('the same cause in two projects becomes one incident, recorded once however often it is observed', () => {
    const { db, ledger: l } = ledger(), a = store('brain'), b = store('cms-field-vocabulary');
    a.state.coordination!.jobs = [job('1')]; b.state.coordination!.jobs = [job('2')];
    const observations = () => office(observe(a, [blocked('1', 'brain')]), observe(b, [blocked('2')]));
    const first = syncIncidents(l, observations(), AT, undefined, loud);
    expect(first.incidents).toHaveLength(1);
    expect(l.list()[0]).toMatchObject({ revision: 1, research: { eligible: true }, cause: { text: 'worktree <path> is missing' } });
    expect(l.list()[0].subjects.map(s => `${s.projectId}/${s.id}`)).toEqual(['brain/1', 'cms-field-vocabulary/2']);
    const events = rows(db, 'incident_events');
    expect(syncIncidents(l, observations(), later(1), undefined, loud)).toEqual({ events: [], incidents: [] });
    expect(rows(db, 'incident_events')).toBe(events);
    expect(l.list()[0].revision).toBe(1);
});

test('a run failure and the stop of the job it ran for are one subject', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1')];
    s.state.workLog = [{ id: 'run-1', requestId: '1', ticket: 'GH-1', status: 'failed', stage: 'review', provider: 'claude', endedAt: AT.toISOString(), failure: { category: 'timeout', detail: 'no output', dispatched: true } }] as any;
    syncIncidents(l, office(observe(s, [blocked('1')])), AT, undefined, loud);
    expect(l.list()).toHaveLength(1);
    expect(l.list()[0].subjects).toEqual([expect.objectContaining({ kind: 'delivery', id: '1', sources: ['stopped-work', 'worker-failure'] })]);
});

test('a storm of one failure holds the newest twenty runs as subjects, clears the rest once, and keeps the run a stopped job belongs to', () => {
    const { db, ledger: l } = ledger(), s = store();
    const run = (id: string, minutesAgo: number, over: Record<string, unknown> = {}) => ({ id, requestId: 'x', ticket: '', status: 'failed', stage: 'review', provider: 'claude', endedAt: later(-minutesAgo).toISOString(), failure: { category: 'timeout', detail: 'no output', dispatched: true }, ...over });
    const storm = Array.from({ length: 25 }, (_, i) => run(`run-${String(i).padStart(2, '0')}`, i + 1));
    s.state.workLog = storm as any;
    const workers = () => l.list().flatMap(incident => incident.subjects).filter(subject => subject.kind === 'worker');
    const open = () => workers().filter(subject => subject.status === 'open').map(subject => subject.id).sort();
    // A ledger from before the bound: every run is an open subject.
    const unbounded: IncidentCollector = observation => workerFailures(observation).map(({ foldedOnly: _, ...rest }) => rest);
    syncIncidents(l, office(observe(s)), AT, [unbounded], loud);
    expect(open()).toHaveLength(25);
    const first = syncIncidents(l, office(observe(s)), later(1), undefined, loud);
    expect(first.events.map(event => event.kind)).toEqual(Array.from({ length: 5 }, () => 'subject-cleared'));
    expect(open()).toEqual(storm.slice(0, 20).map(r => r.id));
    const events = rows(db, 'incident_events');
    expect(syncIncidents(l, office(observe(s)), later(2), undefined, loud)).toEqual({ events: [], incidents: [] });
    expect(rows(db, 'incident_events')).toBe(events);
    // One more failure: it is observed, and the oldest of the twenty gives way.
    s.state.workLog = [run('run-new', -2.5), ...storm] as any;
    expect(syncIncidents(l, office(observe(s)), later(3), undefined, loud).events.map(event => [event.kind, event.body.subject])).toEqual([['subject-observed', 'cms-field-vocabulary/worker/run-new'], ['subject-cleared', 'cms-field-vocabulary/worker/run-19']]);
    expect(open()).toHaveLength(20);
    // The oldest run of all is the one a stopped job last ran: it is past the newest twenty and still part of that job's subject.
    s.state.coordination!.jobs = [job('1')];
    s.state.workLog = [run('run-new', -2.5), ...storm.slice(0, 24), run('run-24', 25, { requestId: '1', ticket: 'GH-1' })] as any;
    syncIncidents(l, office(observe(s, [blocked('1')])), later(4), undefined, loud);
    expect(l.list().flatMap(incident => incident.subjects).find(subject => subject.kind === 'delivery')).toMatchObject({ id: '1', status: 'open', sources: ['stopped-work', 'worker-failure'], lastWorker: 'run-24' });
    expect(open()).toHaveLength(20);
    expect(open()).not.toContain('run-24');
});

test('a sync reads project state and leaves every project store byte-identical', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1'), job('2', { status: 'watching', stop: { kind: 'provider-checks', at: 't0' } })];
    s.state.coordination!.listener.error = 'Error: GitHub returned 502';
    s.state.workLog = [{ id: 'run-9', status: 'failed', stage: 'review', provider: 'claude', endedAt: AT.toISOString(), failure: { category: 'timeout', detail: 'no output', dispatched: true } }] as any;
    s.state.it = { recoveries: { 'implementation:1': { attempts: 3, nextAt: '', status: 'needs-human', detail: 'gave up' } }, reports: [], investigations: [] } as any;
    s.state.slackDeliveries = [{ id: 'd', requestId: 'm', targetType: 'person', targetName: 'Joe', status: 'uncertain', error: 'unconfirmed', createdAt: 'c' }] as any;
    s.save();
    // Everything saved for the project, every row of every table, as one digest.
    const before = { memory: JSON.stringify(s.state), state: savedStateText(s), saved: savedFingerprint(s) };
    deepFreeze(s.state);
    const change = syncIncidents(l, office(observe(s, [blocked('1'), item('delivery', '2', 'merge', 'waiting', 'Work is watching')])), AT, undefined, loud);
    expect(change.incidents.length).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(s.state)).toBe(before.memory);
    expect(savedStateText(s)).toBe(before.state);
    expect(savedFingerprint(s)).toBe(before.saved);
});

test('a subject cleared and stopped again for the same cause is a new episode of the same incident', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1')];
    syncIncidents(l, office(observe(s, [blocked('1')])), AT, undefined, loud);
    s.state.coordination!.jobs[0].status = 'working';
    syncIncidents(l, office(observe(s, [item('delivery', '1', 'review', 'running', 'Work is working')])), later(1), undefined, loud);
    expect(l.list()[0].subjects[0].status).toBe('cleared');
    Object.assign(s.state.coordination!.jobs[0], { status: 'blocked', stop: { kind: 'unclassified', at: 't2' } });
    syncIncidents(l, office(observe(s, [blocked('1')])), later(2), undefined, loud);
    expect(l.list()).toHaveLength(1);
    expect(l.list()[0].subjects[0]).toMatchObject({ status: 'open', episodes: ['t1', 't2'], episodeCount: 2 });
    expect(l.events(l.list()[0].id).map(e => e.kind)).toEqual(['incident-observed', 'subject-observed', 'research-promoted', 'subject-cleared', 'research-withdrawn', 'subject-observed', 'research-promoted']);
});

test('a paused project is one subject and keeps the subjects it already had open', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1'), job('2')];
    syncIncidents(l, office(observe(s, [blocked('1'), blocked('2')])), AT, undefined, loud);
    s.state.paused = true;
    const paused = [item('delivery', '1', 'review', 'blocked', 'Project is paused', 'paused'), item('delivery', '2', 'review', 'blocked', 'Project is paused', 'paused')];
    const change = syncIncidents(l, office(observe(s, paused)), later(1), undefined, loud);
    expect(change.events.map(e => e.kind)).toEqual(['incident-observed', 'subject-observed']);
    const [pause, stopped] = [l.list().find(i => i.expected === 'pause')!, l.list().find(i => i.expected === null)!];
    expect(pause.subjects).toEqual([expect.objectContaining({ kind: 'project', status: 'open' })]);
    expect(stopped.subjects.map(s => s.status)).toEqual(['open', 'open']);
    s.state.paused = false;
    const resumed = syncIncidents(l, office(observe(s, [blocked('1'), blocked('2')])), later(2), undefined, loud);
    expect(resumed.events.map(e => e.kind)).toEqual(['subject-cleared']);
    expect(l.list().find(i => i.cause.kind !== 'paused')!.subjects.map(s => s.episodeCount)).toEqual([1, 1]);
    // With its subject cleared the pause incident explains nothing now.
    expect(l.list().find(i => i.cause.kind === 'paused')).toMatchObject({ expected: null, research: { eligible: false } });
});

test('a collector that cannot read a project is reported, and only its own subjects there are kept open', () => {
    const { ledger: l } = ledger(), a = store('brain'), b = store('cms-field-vocabulary');
    const outbox = (projectId: string) => candidate({ projectId, kind: 'outbox', id: `item-${projectId}` }, { cause: { source: 'outbox', provider: 'github', stage: 'x', kind: 'x', text: 'needs a look', author: 'harness' } });
    const steady: IncidentCollector = ({ projectId }) => [candidate({ projectId, id: `job-${projectId}` }), outbox(projectId)];
    syncIncidents(l, office(observe(a), observe(b)), AT, [steady]);
    const report = vi.fn();
    const change = syncIncidents(l, office(observe(a), observe(b)), later(1), [function failing({ projectId }) { if (projectId === 'brain') throw new Error(`unreadable state: Bearer abc.def and github_pat_${'Z'.repeat(40)}`); return []; }], report);
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/failing could not read brain.*Bearer \[redacted\]/));
    expect(report.mock.calls.flat().join(' ')).not.toContain('github_pat_');
    // A collector with no declared source freezes every source of that project.
    expect(change.events.map(e => e.body.subject).sort()).toEqual(['cms-field-vocabulary/delivery/job-cms-field-vocabulary', 'cms-field-vocabulary/outbox/item-cms-field-vocabulary']);
});

test('a failing built-in collector freezes only its own source for that project', () => {
    const { ledger: l } = ledger(), a = store('brain');
    a.state.coordination!.jobs = [job('1')];
    a.state.coordination!.listener.error = 'Error: GitHub returned 502';
    syncIncidents(l, office(observe(a, [blocked('1', 'brain')])), AT, undefined, loud);
    expect(l.list().flatMap(i => i.subjects).map(s => [s.kind, s.status]).sort()).toEqual([['delivery', 'open'], ['provider', 'open']]);
    // The job is running again and the listener recovered, but the stopped-work collector cannot read the project.
    a.state.coordination!.listener.error = '';
    const report = vi.fn(), observation = observe(a, [blocked('1', 'brain')], later(1));
    Object.defineProperty(observation, 'progression', { get() { throw new Error('projection unavailable'); } });
    syncIncidents(l, office(observation), later(1), undefined, report);
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/stoppedWork could not read brain/));
    expect(l.list().flatMap(i => i.subjects).map(s => [s.kind, s.status]).sort()).toEqual([['delivery', 'open'], ['provider', 'cleared']]);
});

test('a project that could not be read at all keeps every subject it had', () => {
    const { ledger: l } = ledger(), a = store('brain'), b = store('cms-field-vocabulary');
    a.state.coordination!.listener.error = 'Error: GitHub returned 502'; b.state.coordination!.listener.error = 'Error: GitHub returned 502';
    syncIncidents(l, office(observe(a), observe(b)), AT, undefined, loud);
    a.state.coordination!.listener.error = ''; b.state.coordination!.listener.error = '';
    const report = vi.fn();
    syncIncidents(l, { observations: [observe(b, [], later(1))], unreadable: [{ projectId: 'brain', error: 'Error: store is locked' }] }, later(1), undefined, report);
    expect(report).toHaveBeenCalledWith('Incident observation could not read brain: Error: store is locked');
    expect(l.list()[0].subjects.map(s => [s.projectId, s.status])).toEqual([['brain', 'open'], ['cms-field-vocabulary', 'cleared']]);
});

const failedRun = (id: string, requestId: string) => ({ id, requestId, ticket: `GH-${requestId}`, status: 'failed', stage: 'github-review', provider: 'claude', endedAt: AT.toISOString(), failure: { category: 'timeout', detail: 'no output', dispatched: true } }) as any;
const subjects = (l: IncidentLedger) => l.list().flatMap(i => i.subjects).map(s => `${s.kind}/${s.id}:${s.status}`).sort();

test('pausing a project adds only the pause: a run already folded into its job does not become a subject', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1')];
    s.state.workLog = [failedRun('run-1', '1')];
    syncIncidents(l, office(observe(s, [blocked('1')])), AT, undefined, loud);
    expect(subjects(l)).toEqual(['delivery/1:open']);
    s.state.paused = true;
    const change = syncIncidents(l, office(observe(s, [item('delivery', '1', 'review', 'blocked', 'Project is paused', 'paused')])), later(1), undefined, loud);
    expect(change.events.map(e => e.kind)).toEqual(['incident-observed', 'subject-observed']);
    expect(subjects(l)).toEqual(['delivery/1:open', `project/${s.project.id}:open`]);
    // A job first seen stopped while paused is hidden too, and its run folds into the pause.
    s.state.coordination!.jobs.push(job('2'));
    s.state.workLog.push(failedRun('run-2', '2'));
    expect(syncIncidents(l, office(observe(s, [item('delivery', '1', 'review', 'blocked', 'Project is paused', 'paused'), item('delivery', '2', 'review', 'blocked', 'Project is paused', 'paused')])), later(2), undefined, loud).events).toEqual([]);
    expect(subjects(l)).toEqual(['delivery/1:open', `project/${s.project.id}:open`]);
});

test('a project that is paused and then drained is still one project subject', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.paused = true;
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    s.state.draining = true;
    const change = syncIncidents(l, office(observe(s, [], later(1))), later(1), undefined, loud);
    expect(change.events).toEqual([]);
    expect(l.list()).toHaveLength(1);
    expect(l.list()[0].subjects).toEqual([expect.objectContaining({ kind: 'project', status: 'open', evidence: 'Office is draining', episodeCount: 1 })]);
    expect(syncIncidents(l, office(observe(s, [], later(2))), later(2), undefined, loud)).toEqual({ events: [], incidents: [] });
});

test('while the stopped-work collector cannot read a project, a run it had folded stays with its job; an unrelated failure is still reported', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1')];
    s.state.workLog = [failedRun('run-1', '1')];
    syncIncidents(l, office(observe(s, [blocked('1')])), AT, undefined, loud);
    s.state.workLog.push(failedRun('run-9', 'gone'));
    const observation = observe(s, [], later(1));
    Object.defineProperty(observation, 'progression', { get() { throw new Error('projection unavailable'); } });
    syncIncidents(l, office(observation), later(1), undefined, () => {});
    expect(subjects(l)).toEqual(['delivery/1:open', 'worker/run-9:open']);
});

test('a failed conversation and its unconfirmed Slack delivery are one subject that knows the write is unsettled', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.messages = [{ id: 'msg-1', requestId: 'msg-1', from: 'human', to: 'pm', status: 'failed', error: 'Slack delivery could not be confirmed', body: 'PRIVATE', createdAt: 'c', ticket: '', actionId: '', recipients: [], receipts: [], question: '' }] as any;
    s.state.slackDeliveries = [{ id: 'd-1', requestId: 'msg-1', targetType: 'person', targetId: 'U1', targetName: 'Joe', workspaceId: 'W', status: 'uncertain', error: 'Slack read-back did not match', createdAt: 'c', updatedAt: 'u' }] as any;
    const change = syncIncidents(l, office(observe(s, [item('conversation', 'msg-1', 'conversation:pm', 'blocked', 'Failed, not retried', 'failed')])), AT, undefined, loud);
    expect(change.events.map(e => e.kind)).toEqual(['incident-observed', 'subject-observed']);
    expect(l.list()).toHaveLength(1);
    expect(l.list()[0]).toMatchObject({ expected: 'uncertain-effect', research: { eligible: false }, subjects: [{ kind: 'conversation', id: 'msg-1', sources: ['stopped-work', 'slack-delivery'], expected: 'uncertain-effect', unsettledEffect: true }] });
});

test('a subject the projection dropped keeps its episode count when it returns', () => {
    const { ledger: l } = ledger(), s = store();
    const steady = (ids: number[]): IncidentCollector => ({ projectId }) => ids.map(n => candidate({ projectId, id: `job-${n}` }, { expected: 'provider-wait' }));
    syncIncidents(l, office(observe(s)), AT, [steady(Array.from({ length: 101 }, (_, n) => n))]);
    syncIncidents(l, office(observe(s)), later(1), [steady([])]);
    const kept = new Set(l.list()[0].subjects.map(subject => subject.id)), dropped = Array.from({ length: 101 }, (_, n) => n).find(n => !kept.has(`job-${n}`))!;
    syncIncidents(l, office(observe(s)), later(2), [steady([dropped])]);
    expect(l.list()[0].subjects.find(subject => subject.id === `job-${dropped}`)).toMatchObject({ status: 'open', episodeCount: 2, firstObservedAt: AT.toISOString() });
});

test('while the Slack collector cannot read a project, a conversation keeps the uncertainty its delivery had contributed', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.messages = [{ id: 'msg-1', requestId: 'msg-1', from: 'human', to: 'pm', status: 'failed', error: 'Slack delivery could not be confirmed', body: 'PRIVATE', createdAt: 'c', ticket: '', actionId: '', recipients: [], receipts: [], question: '' }] as any;
    s.state.slackDeliveries = [{ id: 'd-1', requestId: 'msg-1', targetType: 'person', targetId: 'U1', targetName: 'Joe', workspaceId: 'W', status: 'uncertain', error: 'Slack read-back did not match', createdAt: 'c', updatedAt: 'u' }] as any;
    const conversation = [item('conversation', 'msg-1', 'conversation:pm', 'blocked', 'Failed, not retried', 'failed')];
    syncIncidents(l, office(observe(s, conversation)), AT, undefined, loud);
    const observation = observe(s, conversation, later(1));
    // Only the Slack collector reads this field through the observation's state.
    Object.defineProperty(observation, 'state', { value: new Proxy(s.state, { get(target, key) { if (key === 'slackDeliveries') throw new Error('deliveries unreadable'); return Reflect.get(target, key); } }) });
    const report = vi.fn();
    expect(syncIncidents(l, office(observation), later(1), undefined, report)).toEqual({ events: [], incidents: [] });
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/slackDeliveries could not read/));
    expect(l.list()[0].subjects[0]).toMatchObject({ sources: ['stopped-work', 'slack-delivery'], expected: 'uncertain-effect', unsettledEffect: true });
    // Read again and found settled, the contribution goes.
    s.state.slackDeliveries![0].status = 'confirmed';
    syncIncidents(l, office(observe(s, conversation, later(2))), later(2), undefined, loud);
    expect(l.list()[0].subjects[0]).toMatchObject({ sources: ['stopped-work'], expected: null, unsettledEffect: false });
});

test('evidence is sanitized and bounded before it is stored', () => {
    const { db, ledger: l } = ledger(), s = store();
    s.state.coordination!.jobs = [job('1', { detail: `Error: push refused with token ghp_${'a'.repeat(36)} or github_pat_${'B'.repeat(40)} via xoxb-123-456-${'c'.repeat(20)} ${'x'.repeat(900)}` })];
    syncIncidents(l, office(observe(s, [blocked('1')])), AT, undefined, loud);
    const stored = JSON.stringify([db.prepare('SELECT body FROM incidents').all(), db.prepare('SELECT body FROM incident_events').all()]);
    for (const secret of ['ghp_', 'github_pat_', 'xoxb-']) expect(stored).not.toContain(secret);
    expect(l.list()[0].subjects[0].evidence.length).toBeLessThanOrEqual(301);
    expect(l.list()[0].cause.text.length).toBeLessThanOrEqual(200);
});
