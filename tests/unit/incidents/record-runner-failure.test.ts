import { afterEach, expect, test, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { subjectKey } from '../../../src/contracts/incidents';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { replayed } from '../../../server/incidents/record-event';
import { recordRunnerFailure, RUNNER_INCIDENT, RUNNER_SUBJECT } from '../../../server/incidents/record-runner-failure';
import { failureDigest } from '../../../server/incidents/runner-report';
import { syncIncidents } from '../../../server/incidents/sync-incidents';
import { failure } from '../overseer/forward-world';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const ledger = () => { const db = new DatabaseSync(':memory:'); dbs.push(db); return new IncidentLedger(db); };
const AT = new Date('2026-11-26T12:00:00.000Z'), later = (minutes: number) => new Date(AT.getTime() + minutes * 60_000);
const subject = (incidents: IncidentLedger) => incidents.get(RUNNER_INCIDENT)?.subjects.find(item => subjectKey(item) === subjectKey(RUNNER_SUBJECT));
const runnerEvents = (incidents: IncidentLedger) => incidents.events(RUNNER_INCIDENT).filter(event => event.kind === 'runner-failure').map(event => event.id);
/** An observation pass that saw nothing anywhere: only the runner's own reports stand for its subject. */
const observeNothing = (incidents: IncidentLedger, at: Date) => syncIncidents(incidents, { observations: [], unreadable: [] }, at, [], () => {});

test('an outage forwarded whole before any observation is both journal IDs on one runner incident, its subject cleared, and observation leaves it as it is', () => {
    const incidents = ledger(), down = failure('service-down'), restored = failure('service-restored', down.episode, '2026-11-26T11:07:00.000Z');
    const first = recordRunnerFailure(incidents, down, AT), second = recordRunnerFailure(incidents, restored, later(1));
    expect(first).toEqual({ status: 'recorded', receipt: { eventId: down.id, incidentId: RUNNER_INCIDENT, digest: failureDigest(down), revision: 1 } });
    expect(second).toMatchObject({ status: 'recorded', receipt: { eventId: restored.id, revision: 2 } });
    expect(runnerEvents(incidents)).toEqual([down.id, restored.id]);
    expect(incidents.event(down.id)).toMatchObject({ incident: RUNNER_INCIDENT, kind: 'runner-failure', body: { failure: 'service-down', episode: down.episode, sourceAt: down.at, revision: 1 } });
    expect(subject(incidents)).toMatchObject({ status: 'cleared', episode: down.episode, stop: { kind: 'service-down', at: down.at }, sources: ['runner'] });
    // An unexplained stop is eligible for research at once, under the ordinary rule, and withdrawn when nothing is stopped.
    expect(incidents.events(RUNNER_INCIDENT).map(event => event.kind)).toEqual(['incident-observed', 'subject-observed', 'research-promoted', 'runner-failure', 'subject-cleared', 'research-withdrawn', 'runner-failure']);
    const before = incidents.get(RUNNER_INCIDENT), history = incidents.events(RUNNER_INCIDENT);
    observeNothing(incidents, later(2));
    expect(incidents.get(RUNNER_INCIDENT)).toEqual(before);
    expect(incidents.events(RUNNER_INCIDENT)).toEqual(history);
});

test('an open outage stays open through ordinary observation, and only its own restoration clears it', () => {
    const incidents = ledger(), down = failure('service-down');
    recordRunnerFailure(incidents, down, AT);
    observeNothing(incidents, later(1));
    expect(subject(incidents)).toMatchObject({ status: 'open', episode: down.episode });
    recordRunnerFailure(incidents, failure('service-restored'), later(2));
    expect(subject(incidents)?.status).toBe('open');
    recordRunnerFailure(incidents, failure('service-restored', down.episode), later(3));
    expect(subject(incidents)?.status).toBe('cleared');
});

test('a restoration that arrives first keeps its outage cleared when the outage arrives, and a newer outage is a new episode of the same subject', () => {
    const incidents = ledger(), down = failure('service-down');
    const history = vi.spyOn(incidents, 'events').mockImplementation(() => { throw new Error('Unexpected history scan'); });
    recordRunnerFailure(incidents, failure('service-restored', down.episode), AT);
    expect(subject(incidents)).toBeUndefined();
    recordRunnerFailure(incidents, down, later(1));
    expect(subject(incidents)).toMatchObject({ status: 'cleared', episode: down.episode, episodeCount: 1 });
    const next = failure('service-down', undefined, '2026-11-26T13:00:00.000Z');
    recordRunnerFailure(incidents, next, later(2));
    expect(subject(incidents)).toMatchObject({ status: 'open', episode: next.episode, episodeCount: 2, episodes: [down.episode, next.episode] });
    // An outage older than the one the subject stands for is history only.
    const older = failure('service-down', undefined, '2026-11-26T10:00:00.000Z');
    const before = subject(incidents);
    expect(recordRunnerFailure(incidents, older, later(3))).toMatchObject({ status: 'recorded' });
    expect(subject(incidents)).toEqual(before);
    expect(recordRunnerFailure(incidents, down, later(4))).toMatchObject({ status: 'replayed', receipt: { eventId: down.id, revision: 2 } });
    expect(history).not.toHaveBeenCalled();
    history.mockRestore();
    expect(runnerEvents(incidents)).toContain(older.id);
    expect(incidents.get(RUNNER_INCIDENT)!.revision).toBe(4);
});

test('the same failure sent again returns its original receipt even after the incident has moved on, whatever order its keys were in', () => {
    const incidents = ledger(), down = failure('service-down'), original = recordRunnerFailure(incidents, down, AT);
    recordRunnerFailure(incidents, failure('service-restored', down.episode), later(1));
    const reordered = JSON.parse(JSON.stringify({ evidence: down.evidence, detail: down.detail, episode: down.episode, at: down.at, kind: down.kind, id: down.id, version: 1 }));
    expect(recordRunnerFailure(incidents, reordered, later(2))).toEqual({ ...original, status: 'replayed' });
    expect(incidents.get(RUNNER_INCIDENT)!.revision).toBe(2);
});

test('the same ID with other content is occupied, even when both read the same once redacted, and nothing is written', () => {
    const incidents = ledger(), down = failure('service-down', undefined, undefined, 'token ghp_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa failed');
    recordRunnerFailure(incidents, down, AT);
    const other = { ...down, detail: 'token ghp_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb failed' };
    expect(failureDigest(other)).not.toBe(failureDigest(down));
    const before = incidents.events(RUNNER_INCIDENT);
    expect(recordRunnerFailure(incidents, other, later(1))).toMatchObject({ status: 'occupied' });
    expect(incidents.events(RUNNER_INCIDENT)).toEqual(before);
    // What is kept and served is redacted.
    expect(JSON.stringify(incidents.event(down.id))).not.toContain('ghp_aaaa');
    expect(JSON.stringify(incidents.get(RUNNER_INCIDENT))).not.toContain('ghp_aaaa');
});

test('distinct IDs take consecutive revisions when a competing event commits before the first write', () => {
    const incidents = ledger(), down = failure('service-down'), restored = failure('service-restored', down.episode);
    const record = incidents.record.bind(incidents);
    vi.spyOn(incidents, 'record').mockImplementationOnce(change => {
        expect(recordRunnerFailure(incidents, restored, AT)).toMatchObject({ status: 'recorded', receipt: { revision: 1 } });
        record(change);
    });
    expect(recordRunnerFailure(incidents, down, AT)).toMatchObject({ status: 'recorded', receipt: { revision: 2 } });
    expect(subject(incidents)).toMatchObject({ status: 'cleared', episode: down.episode });
    expect(recordRunnerFailure(incidents, restored, AT)).toMatchObject({ status: 'replayed', receipt: { revision: 1 } });
    expect(recordRunnerFailure(incidents, down, AT)).toMatchObject({ status: 'replayed', receipt: { revision: 2 } });

    const error = new Error('storage unavailable'), other = failure('service-down');
    const writes = vi.mocked(incidents.record);
    writes.mockClear().mockImplementationOnce(() => { throw error; });
    expect(() => recordRunnerFailure(incidents, other, AT)).toThrow(error);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(incidents.event(other.id)).toBeNull();
});

test.each([
    ['11:00:00Z', '11:00:00.500Z', true],
    ['11:00:00Z', '11:00:00.000Z', false],
    ['11:00:00.5000000Z', '11:00:00.5000001Z', true],
] as const)('orders outage starts at %s and %s in either delivery order', (earlier, laterAt, laterWins) => {
    const first = failure('service-down', '00000000-0000-4000-8000-000000000002', `2026-11-26T${earlier}`);
    const second = failure('service-down', '00000000-0000-4000-8000-000000000001', `2026-11-26T${laterAt}`);
    for (const order of [[first, second], [second, first]]) {
        const incidents = ledger();
        order.forEach(event => recordRunnerFailure(incidents, event, AT));
        expect(subject(incidents)?.episode).toBe((laterWins ? second : first).episode);
    }
});

test('the generic event route refuses a runner failure ID before reading any provider, a historical event under such an ID still replays, and the runner finds that ID occupied', () => {
    const incidents = ledger(), down = failure('service-down');
    recordRunnerFailure(incidents, failure('service-down'), AT);
    expect(() => replayed(incidents, RUNNER_INCIDENT, down.id, 1, { kind: 'repair-started', issue: 1 })).toThrow('reserved for the repair runner');
    // An event recorded under such an ID before 6d reserved it, through the generic route, as it was saved then.
    const id = 'overseer:service-down:00000000-0000-4000-8000-000000000001', incident = incidents.get(RUNNER_INCIDENT)!;
    incidents.record({ events: [{ id, incident: RUNNER_INCIDENT, at: later(1).toISOString(), kind: 'repair-started', body: { request: { kind: 'repair-started', issue: 7, expectedRevision: incident.revision }, revision: incident.revision + 1 } }], incidents: [{ ...incident, revision: incident.revision + 1 }] });
    expect(replayed(incidents, RUNNER_INCIDENT, id, incident.revision, { kind: 'repair-started', issue: 7 })).toMatchObject({ replayed: true });
    expect(() => replayed(incidents, RUNNER_INCIDENT, id, incident.revision, { kind: 'repair-started', issue: 8 })).toThrow('different content');
    expect(recordRunnerFailure(incidents, failure('service-down', '00000000-0000-4000-8000-000000000001'), later(2))).toMatchObject({ status: 'occupied' });
});
