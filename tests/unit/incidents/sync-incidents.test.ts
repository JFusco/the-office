import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { invalidateDismissals } from '../../../server/incidents/dismissal-validity';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import type { IncidentCollector } from '../../../server/incidents/observation';
import { outboxItems } from '../../../server/incidents/sources/outbox-items';
import { stoppedWork } from '../../../server/incidents/sources/stopped-work';
import { workerFailures } from '../../../server/incidents/sources/worker-failures';
import { repairSubject } from '../../../server/incidents/subject-digest';
import { syncIncidents } from '../../../server/incidents/sync-incidents';
import type { Store } from '../../../server/store/store';
import { AT, candidate, item, later, observe, office, projectStore } from './incident-fixture';
import { savedFingerprint } from '../store/saved-fingerprint-fixture';
import { savedStateText } from '../store/saved-state-fixture';
import { ledgerOf, manifest } from './dismissal-fixture';

vi.mock('../../../server/incidents/sources/worker-failures', { spy: true });

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

const LIMIT = 'Codex usage limit reached; try again at 13:00';
const minute = (n: number) => new Date(AT.getTime() + n * 60_000).toISOString();
const mailEvent = (s: Store, kind: string, at: string) => s.db.prepare('INSERT INTO events(body) VALUES(?)').run(JSON.stringify({ id: 0, at, kind, message: 'm' }));
const intakeRun = (id: string, startedAt: string, endedAt: string, over: Record<string, unknown> = {}) =>
    ({ id, stage: 'intake', status: 'failed', provider: 'codex', startedAt, endedAt, failure: { category: 'provider-limit', detail: LIMIT, dispatched: true }, ...over }) as any;
/** A Jira mailbox whose check failed at `at` minutes, with its intake run inside it. */
function failedCheck(s: Store, at: number, run = `run-${at}`, over: Record<string, unknown> = {}) {
    mailEvent(s, 'mail-check', minute(at - 4));
    s.state.workLog = [...(s.state.workLog ?? []), intakeRun(run, minute(at - 3), minute(at - 1), over)];
    mailEvent(s, 'mail-blocked', minute(at));
    s.state.intake = { status: 'blocked', lastChecked: minute(-600), error: `Error: ${LIMIT}` } as any;
    s.state.pendingMail = undefined;
}
const mailboxSubject = (l: IncidentLedger) => l.list().flatMap(i => i.subjects).find(s => s.kind === 'provider' && s.id === 'intake');

test('a failed intake run and the mailbox error it caused are one subject carrying the run and its wait, under the error\'s own cause', () => {
    const { ledger: l } = ledger(), s = store('cec');
    failedCheck(s, -10, 'run-i');
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(subjects(l)).toEqual(['provider/intake:open']);
    expect(mailboxSubject(l)).toMatchObject({ lastWorker: 'run-i', sources: ['provider-error', 'worker-failure'], expected: 'provider-wait' });
    // The cause is the error's, as it was before the run was bound.
    const { ledger: unbound } = ledger(), other = store('cec');
    other.state.intake = s.state.intake;
    syncIncidents(unbound, office(observe(other)), AT, undefined, loud);
    expect(l.list()[0].fingerprint).toBe(unbound.list()[0].fingerprint);
});

test('the run a failed check proved folds in even past the count of runs kept apart; one never dispatched contributes nothing', () => {
    const { ledger: l } = ledger(), s = store('cec');
    // Twenty newer runs of the same cause stand apart; the run the check proved is older than all of them.
    s.state.workLog = Array.from({ length: 20 }, (_, n) => intakeRun(`newer-${n}`, minute(-9), minute(-8 + n * 0.01)));
    failedCheck(s, -10, 'run-proved');
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(mailboxSubject(l)).toMatchObject({ lastWorker: 'run-proved', sources: ['provider-error', 'worker-failure'] });
    expect(subjects(l)).not.toContain('worker/run-proved:open');
    const { ledger: m } = ledger(), t = store('cec');
    failedCheck(t, -10, 'run-quiet', { failure: { category: 'provider-limit', detail: LIMIT, dispatched: false } });
    syncIncidents(m, office(observe(t)), AT, undefined, loud);
    expect(mailboxSubject(m)).toMatchObject({ lastWorker: 'run-quiet', sources: ['provider-error'], expected: null });
});

test('a Jira mailbox failure that persists across a check in progress is one episode', () => {
    const { ledger: l } = ledger(), s = store('cec');
    failedCheck(s, -10, 'run-a');
    s.state.azure = { ...s.state.azure, status: 'blocked', error: 'Error: Azure returned 503' } as any;
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(subjects(l)).toEqual(['provider/azure:open', 'provider/intake:open']);
    // A check is queued: the mailbox blanks its error before it reads anything. The Azure reader recovers meanwhile.
    s.state.intake = { ...s.state.intake, status: 'idle', error: '' };
    s.state.pendingMail = { id: 'mail-1', requestedAt: minute(1), scheduled: false } as any;
    s.state.azure = { ...s.state.azure, status: 'idle', error: '' } as any;
    const queued = syncIncidents(l, office(observe(s, [], later(1))), later(1), undefined, loud);
    expect(queued.events.filter(event => event.body.subject).map(event => [event.kind, event.body.subject])).toEqual([['subject-cleared', 'cec/provider/azure']]);
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', lastWorker: 'run-a', episodeCount: 1, sources: ['provider-error', 'worker-failure'] });
    // The check runs.
    s.state.intake = { ...s.state.intake, status: 'working' };
    s.state.pendingMail = undefined;
    expect(syncIncidents(l, office(observe(s, [], later(2))), later(2), undefined, loud)).toEqual({ events: [], incidents: [] });
    expect(subjects(l)).toEqual(['provider/azure:cleared', 'provider/intake:open']);
    // It fails the same way again: still the same episode, now bound to this check's run.
    failedCheck(s, 6, 'run-b');
    const again = syncIncidents(l, office(observe(s, [], later(7))), later(7), undefined, loud);
    expect(again.events.map(event => event.kind)).not.toContain('episode-observed');
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', lastWorker: 'run-b', episodeCount: 1 });
    // A failure that is present is read as usual while yet another check waits: its run is still its own.
    s.state.pendingMail = { id: 'mail-2', requestedAt: minute(8), scheduled: false } as any;
    syncIncidents(l, office(observe(s, [], later(8))), later(8), undefined, loud);
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', lastWorker: 'run-b', sources: ['provider-error', 'worker-failure'] });
    // A check that completes clears it.
    s.state.intake = { ...s.state.intake, status: 'idle', error: '', lastChecked: minute(9) };
    s.state.pendingMail = undefined;
    syncIncidents(l, office(observe(s, [], later(9))), later(9), undefined, loud);
    expect(mailboxSubject(l)?.status).toBe('cleared');
});

test.each([2, -20])('a success clears the Jira intake subject even if another check is queued (success timestamp offset: %s)', offset => {
    const { ledger: l } = ledger(), s = store('cec');
    failedCheck(s, -10);
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', episodeCount: 1 });

    // The clock may have stepped back since the failure was observed.
    mailEvent(s, 'mail-check', minute(offset - 1));
    mailEvent(s, 'mail-delivered', minute(offset));
    s.state.intake = { ...s.state.intake, status: 'idle', error: '', lastChecked: minute(offset) };
    s.state.pendingMail = { id: 'queued', requestedAt: minute(3), scheduled: false };
    const change = syncIncidents(l, office(observe(s, [], later(3))), later(3), undefined, loud);
    expect(change.events).toContainEqual(expect.objectContaining({ kind: 'subject-cleared', body: expect.objectContaining({ subject: 'cec/provider/intake' }) }));
    expect(mailboxSubject(l)?.status).toBe('cleared');

    failedCheck(s, 7);
    s.state.intake.lastChecked = minute(offset);
    syncIncidents(l, office(observe(s, [], later(8))), later(8), undefined, loud);
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', episodeCount: 2 });
});

test.each([false, true])('a queued check keeps an observed interrupted mailbox failure without a newer success (older success: %s)', olderSuccess => {
    const { ledger: l } = ledger(), s = store('cec');
    if (olderSuccess) mailEvent(s, 'mail-delivered', minute(-10));
    mailEvent(s, 'mail-check', minute(-5));
    s.state.intake = { ...s.state.intake, status: 'blocked', error: 'Previous mail check was interrupted. Safe to check again (read-only).' };
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    s.state.intake = { ...s.state.intake, status: 'idle', error: '' };
    s.state.pendingMail = { id: 'queued', requestedAt: minute(1), scheduled: false };
    expect(syncIncidents(l, office(observe(s, [], later(1))), later(1), undefined, loud)).toEqual({ events: [], incidents: [] });
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', episodeCount: 1 });
});

test('an intervening success already seen alongside an interrupted mailbox failure cannot clear it', () => {
    const { ledger: l } = ledger(), s = store('cec');
    const error = 'Previous mail check was interrupted. Safe to check again (read-only).';
    s.state.intake = { ...s.state.intake, status: 'blocked', error };
    syncIncidents(l, office(observe(s)), AT, undefined, loud);

    mailEvent(s, 'mail-delivered', minute(1));
    mailEvent(s, 'mail-check', minute(2));
    s.state.intake.lastChecked = minute(1);
    syncIncidents(l, office(observe(s, [], later(3))), later(3), undefined, loud);
    expect(mailboxSubject(l)).toMatchObject({ status: 'open', lastObservedAt: AT.toISOString(), episodeCount: 1 });

    s.state.intake = { ...s.state.intake, status: 'idle', error: '' };
    s.state.pendingMail = { id: 'queued', requestedAt: minute(4), scheduled: false };
    expect(syncIncidents(l, office(observe(s, [], later(4))), later(4), undefined, loud)).toEqual({ events: [], incidents: [] });
});

const NO_VISIBILITY = 'Office must restore complete session visibility; inventory unavailable';
const review = (id: string, detail = 'Scope needs a decision') => ({ id, key: `GH-${id}`, status: 'blocked', detail, queuedAt: 'q', endedAt: 'e', url: '' });
const reviewRun = (id: string) => ({ id: `run-${id}`, requestId: id, stage: 'assignment-review', status: 'failed', provider: 'claude', endedAt: AT.toISOString(), failure: { category: 'timeout', detail: 'no output', dispatched: true } }) as any;
const reviewing = (id: string) => item('intake', id, 'assignment-review', 'blocked', 'x', 'unclassified');
const withoutProgression = (observation: ReturnType<typeof observe>) => {
    Object.defineProperty(observation, 'progression', { get() { throw new Error('projection unavailable'); } });
    return observation;
};
const withoutOutbox = (observation: ReturnType<typeof observe>) => {
    Object.defineProperty(observation, 'state', { value: new Proxy(observation.state, { get(target, key) { if (key === 'outbox') throw new Error('outbox unreadable'); return Reflect.get(target, key); } }) });
    return observation;
};

test('while the outbox cannot be read, its saved item for a review stopped work now holds leaves, and its run folds into the review', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.listener.reviews = [review('11')] as any;
    s.state.coordination!.adoptions = [{ id: 'a', pr: 41, url: '', title: 't', issue: 0, status: 'refused', detail: 'refused', at: AT.toISOString() }] as any;
    s.state.workLog = [reviewRun('11')];
    // The scheduler first leaves the review out, so the outbox's item stands for it, with the review's run.
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(subjects(l)).toEqual(['outbox/assignment:11:open', 'outbox/dependabot:41:open']);
    const change = syncIncidents(l, office(withoutOutbox(observe(s, [reviewing('11')], later(1)))), later(1), undefined, () => {});
    expect(change.events.filter(event => event.kind === 'subject-cleared').map(event => event.body.subject)).toEqual(['cms-field-vocabulary/outbox/assignment:11']);
    expect(subjects(l)).toEqual(['intake/11:open', 'outbox/assignment:11:cleared', 'outbox/dependabot:41:open']);
    expect(l.list().flatMap(i => i.subjects).find(subject => subject.kind === 'intake')).toMatchObject({ lastWorker: 'run-11', sources: ['stopped-work', 'worker-failure'] });
});

test('an intake review is reported once, by stopped work when it can, and by the outbox when stopped work never could', () => {
    const first = ledger(), s = store();
    s.state.coordination!.listener.reviews = [review('12'), review('13', NO_VISIBILITY)] as any;
    syncIncidents(first.ledger, office(withoutProgression(observe(s))), AT, undefined, () => {});
    expect(subjects(first.ledger)).toEqual(['outbox/assignment:12:open', 'outbox/ownership-capability:open']);
    const later_ = ledger();
    syncIncidents(later_.ledger, office(observe(s, [reviewing('12'), reviewing('13')])), AT, undefined, loud);
    expect(subjects(later_.ledger)).toEqual(['intake/12:open', 'intake/13:open']);
    expect(syncIncidents(later_.ledger, office(withoutProgression(observe(s, [], later(1)))), later(1), undefined, () => {})).toEqual({ events: [], incidents: [] });
});

test('unreadable stopped work supplies no fresh coverage for an unreadable outbox', () => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.listener.reviews = [review('11')] as any;
    // Seed the historical coexistence of both subjects for the same review.
    syncIncidents(l, office(observe(s, [reviewing('11')])), AT, [stoppedWork, () => outboxItems(observe(s))], loud);
    expect(subjects(l)).toEqual(['intake/11:open', 'outbox/assignment:11:open']);

    const report = vi.fn(), observation = withoutOutbox(withoutProgression(observe(s, [], later(1))));
    const change = syncIncidents(l, office(observation), later(1), undefined, report);
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/stoppedWork.*projection unavailable/));
    expect(report).toHaveBeenCalledWith(expect.stringMatching(/outboxItems.*outbox unreadable/));
    expect(change.events.map(event => event.kind)).not.toContain('subject-cleared');
    expect(subjects(l)).toEqual(['intake/11:open', 'outbox/assignment:11:open']);
});

test.each([false, true])('only one review subject stands through a worker collector outage (review newly projected: %s)', nowProjected => {
    const { ledger: l } = ledger(), s = store();
    s.state.coordination!.listener.reviews = [review('11')] as any;
    s.state.workLog = [reviewRun('11')];
    syncIncidents(l, office(observe(s, nowProjected ? [] : [reviewing('11')])), AT, undefined, loud);
    expect(subjects(l)).toEqual([nowProjected ? 'outbox/assignment:11:open' : 'intake/11:open']);

    vi.mocked(workerFailures).mockImplementationOnce(() => { throw new Error('worker collection failed'); });
    const report = vi.fn();
    const change = syncIncidents(l, office(observe(s, nowProjected ? [reviewing('11')] : [], later(1))), later(1), undefined, report);
    expect(report).toHaveBeenCalledExactlyOnceWith(expect.stringContaining('worker collection failed'));
    expect(subjects(l).filter(row => row.endsWith(':open'))).toEqual(['intake/11:open']);
    if (nowProjected) expect(change.events).toContainEqual(expect.objectContaining({ kind: 'subject-cleared', body: expect.objectContaining({ subject: `${s.project.id}/outbox/assignment:11` }) }));
    else expect(l.list()[0].subjects[0]).toMatchObject({ sources: ['worker-failure'], unsettledEffect: false, expected: null });
});

const ticket = (over: Record<string, unknown> = {}) => ({
    key: 'CEC-7', pilot: false, stage: 'mailbox', activity: 'blocked', blocker: 'Error: Board read stopped',
    results: {}, url: '', commit: 'c7', runId: 'r', attempt: 1, ...over,
}) as Store['state']['tickets'][number];

test('a mirrored delivery request takes over the ticket stage worker when an unreadable fallback clears', () => {
    const { ledger: l } = ledger(), s = store('cec');
    s.state.tickets = [ticket()];
    s.state.workLog = [{ ...intakeRun('run-ticket', minute(-2), minute(-1)), ticket: 'CEC-7', stage: 'mailbox' }];
    syncIncidents(l, office(observe(s)), AT, undefined, loud);
    expect(subjects(l)).toEqual(['outbox/ticket:CEC-7:mailbox:open']);
    expect(l.list()[0].subjects[0]).toMatchObject({ lastWorker: 'run-ticket', sources: ['outbox', 'worker-failure'], expected: 'provider-wait' });

    s.state.deliveryQueue = [{ id: 'req-1', key: 'CEC-7', action: 'start-pilot', status: 'blocked', error: s.state.tickets[0].blocker, requestedAt: minute(-3) }] as Store['state']['deliveryQueue'];
    const progression = [item('delivery', 'req-1', 'start-pilot', 'blocked', 'x', 'unclassified', 'cec')];
    const sync = (n: number) => syncIncidents(l, office(withoutOutbox(observe(s, progression, later(n)))), later(n), undefined, () => {});
    const change = sync(1);
    expect(change.events).toContainEqual(expect.objectContaining({ kind: 'subject-cleared', body: expect.objectContaining({ subject: 'cec/outbox/ticket:CEC-7:mailbox' }) }));
    expect(subjects(l)).toEqual(['delivery/req-1:open', 'outbox/ticket:CEC-7:mailbox:cleared']);
    expect(l.list().flatMap(incident => incident.subjects).find(subject => subject.id === 'req-1')).toMatchObject({
        lastWorker: 'run-ticket', sources: ['stopped-work', 'worker-failure'], expected: 'provider-wait',
    });
    expect(sync(2)).toEqual({ events: [], incidents: [] });
});

test('filling historical fallback bindings lapses a matching dismissal without opening a new episode', () => {
    const s = store('cec');
    const stop = { kind: 'unclassified' as const, at: minute(-2) };
    s.state.tickets = [ticket({ stop })];
    const [current] = outboxItems(observe(s));
    const l = ledgerOf(dbs, [{ ...current, subject: { ...current.subject, stop: null, head: '' } }]);
    const before = l.packet(), repair = repairSubject(l.ledger.get(l.id)!.subjects[0]);
    expect(before.subjects.included[0]).toMatchObject({ digest: repair.digest, stop: null, head: '', episodeCount: 1 });
    const dismissed = l.dismiss();
    const versions = sourceVersions(manifest());
    expect(dismissed.incident.dismissals?.[0].subjects).toEqual([repair]);
    expect(invalidateDismissals(l.ledger, versions, later(1))).toEqual([]);

    const change = syncIncidents(l.ledger, office(observe(s, [], later(2))), later(2), undefined, loud);
    expect(change.events).toEqual([]);
    const corrected = l.ledger.get(l.id)!.subjects[0], after = l.packet();
    expect(corrected).toMatchObject({ stop, head: 'c7', status: 'open', episodeCount: 1, openedAt: AT.toISOString() });
    expect(repairSubject(corrected).digest).not.toBe(repair.digest);
    expect(after.subjects.included[0]).toMatchObject({ digest: repairSubject(corrected).digest, stop, head: 'c7' });
    expect(invalidateDismissals(l.ledger, versions, later(2))).toEqual([l.id]);
    expect(l.ledger.get(l.id)).toMatchObject({ state: 'observed', dismissals: [{ lapsed: { reason: expect.stringContaining('stands differently') } }] });
    expect(syncIncidents(l.ledger, office(observe(s, [], later(3))), later(3), undefined, loud)).toEqual({ events: [], incidents: [] });
});
