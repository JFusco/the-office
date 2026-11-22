import { afterEach, expect, test } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { ControlStore } from '../../../server/store/control-store';
import type { Incident, IncidentEvent } from '../../../src/contracts/incidents';

const open: DatabaseSync[] = [];
afterEach(() => { open.splice(0).forEach(db => { try { db.close(); } catch { /* already closed */ } }); });
const memory = () => { const db = new DatabaseSync(':memory:'); open.push(db); return db; };

const incident = (revision = 1, over: Partial<Incident> = {}): Incident => ({
    id: 'inc-0000000000000001', fingerprint: 'f1', state: 'observed', revision,
    cause: { source: 'stopped-work', provider: 'github', stage: 'review', kind: 'unclassified', text: 'worktree is missing', author: 'harness' },
    expected: null, research: { eligible: false, reason: '', at: null }, firstObservedAt: 'a', lastObservedAt: 'a', subjects: [], ...over,
});
const subjectRecord = { projectId: 'brain', kind: 'delivery', id: 'job-1', episode: 'e1', stage: 'review', stop: null, lastWorker: '', head: '', unsettledEffect: false, expected: null, sources: ['stopped-work' as const], evidence: '', firstObservedAt: 'a', lastObservedAt: 'a', openedAt: 'a', clearedAt: null, episodes: ['e1'], episodeCount: 1 };
const event = (id: string, over: Partial<IncidentEvent> = {}): IncidentEvent => ({ id, incident: 'inc-0000000000000001', at: '2026-11-20T12:00:00.000Z', kind: 'incident-observed', body: {}, ...over });

test('a change is saved whole: events in order and the projection they leave', () => {
    const ledger = new IncidentLedger(memory());
    ledger.record({ events: [event('e1'), event('e2', { kind: 'subject-observed', body: { subject: 'brain/delivery/job-1' } })], incidents: [incident()] });
    expect(ledger.list()).toEqual([incident()]);
    expect(ledger.get('inc-0000000000000001')).toEqual(incident());
    expect(ledger.get('inc-ffffffffffffffff')).toBeNull();
    expect(ledger.events('inc-0000000000000001').map(e => e.id)).toEqual(['e1', 'e2']);
});

test('an event recorded twice with the same content is one event', () => {
    const ledger = new IncidentLedger(memory());
    ledger.record({ events: [event('e1')], incidents: [incident()] });
    ledger.record({ events: [event('e1')], incidents: [] });
    expect(ledger.events('inc-0000000000000001')).toHaveLength(1);
});

test('an event ID reused with different content refuses the whole change', () => {
    const ledger = new IncidentLedger(memory());
    ledger.record({ events: [event('e1')], incidents: [incident()] });
    expect(() => ledger.record({ events: [event('e2'), event('e1', { body: { other: true } })], incidents: [incident(2)] })).toThrow(/already recorded with different content/);
    expect(ledger.events('inc-0000000000000001').map(e => e.id)).toEqual(['e1']);
    expect(ledger.get('inc-0000000000000001')?.revision).toBe(1);
});

test('the same event with its properties in another order is the same event; a different value or array order is not', () => {
    const ledger = new IncidentLedger(memory());
    ledger.record({ events: [event('e1', { body: { subject: 'a', sources: ['x', 'y'], nested: { one: 1, two: 2 } } })], incidents: [incident()] });
    const reordered = { body: { nested: { two: 2, one: 1 }, sources: ['x', 'y'], subject: 'a' }, kind: 'incident-observed' as const, at: '2026-11-20T12:00:00.000Z', incident: 'inc-0000000000000001', id: 'e1' };
    ledger.record({ events: [reordered], incidents: [] });
    expect(ledger.events('inc-0000000000000001')).toHaveLength(1);
    expect(() => ledger.record({ events: [{ ...reordered, body: { ...reordered.body, sources: ['y', 'x'] } }], incidents: [] })).toThrow(/different content/);
    expect(() => ledger.record({ events: [{ ...reordered, body: { ...reordered.body, nested: { one: 1, two: 3 } } }], incidents: [] })).toThrow(/different content/);
});

test('one event is read back by its ID', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.event('e1')).toBeNull();
    ledger.record({ events: [event('e1', { body: { note: 'x' } })], incidents: [incident()] });
    expect(ledger.event('e1')).toEqual(event('e1', { body: { note: 'x' } }));
    expect(ledger.event('e2')).toBeNull();
});

test('the history of an incident is its event count and its most recent events, oldest first, without their bodies', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.history('inc-0000000000000001', 2)).toEqual({ total: 0, recent: [] });
    ledger.record({ events: [event('e1', { body: { large: 'x'.repeat(1000) } }), event('e2', { kind: 'subject-observed' }), event('e3', { kind: 'subject-cleared' }), event('other', { incident: 'inc-0000000000000002' })], incidents: [incident()] });
    expect(ledger.history('inc-0000000000000001', 2)).toEqual({ total: 3, recent: [{ id: 'e2', at: '2026-11-20T12:00:00.000Z', kind: 'subject-observed' }, { id: 'e3', at: '2026-11-20T12:00:00.000Z', kind: 'subject-cleared' }] });
    expect(ledger.history('inc-0000000000000001', 10).recent.map(e => e.id)).toEqual(['e1', 'e2', 'e3']);
});

test('the event history answers how often a subject was observed and when first', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-1')).toBeNull();
    const seen = (id: string, kind: 'subject-observed' | 'episode-observed' | 'subject-cleared', at: string, subject = 'brain/delivery/job-1') => event(id, { kind, at, body: { subject } });
    ledger.record({ events: [event('e0'), seen('e1', 'subject-observed', '2026-11-20T12:00:00.000Z'), seen('e2', 'subject-cleared', '2026-11-20T12:01:00.000Z'), seen('e3', 'subject-observed', '2026-11-20T12:02:00.000Z'), seen('e4', 'episode-observed', '2026-11-20T12:03:00.000Z'), seen('e5', 'subject-observed', '2026-11-20T12:04:00.000Z', 'brain/delivery/job-2')], incidents: [incident()] });
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-1')).toEqual({ episodes: 3, firstObservedAt: '2026-11-20T12:00:00.000Z' });
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-9')).toBeNull();
    expect(ledger.subjectHistory('inc-ffffffffffffffff', 'brain/delivery/job-1')).toBeNull();
});

test('the subjects that opened after given events are told by the order the ledger wrote them, not by their times', () => {
    const ledger = new IncidentLedger(memory()), ID = 'inc-0000000000000001', ONE = 'brain/delivery/job-1', TWO = 'brain/delivery/job-2';
    const seen = (id: string, kind: IncidentEvent['kind'], at: string, subject = ONE, incident = ID) => event(id, { kind, at, incident, body: { subject } });
    expect(ledger.openedAfter(ID, ['mark'])).toEqual([]);
    ledger.record({ events: [seen('e1', 'subject-observed', '2026-11-20T12:30:00.000Z'), event('mark', { kind: 'fix-deployed', at: '2026-11-20T12:04:00.000Z' })], incidents: [incident()] });
    // Dated after the mark, written before it: not after.
    expect(ledger.openedAfter(ID, ['mark'])).toEqual([]);
    // Dated before the mark, written after it: after. A clear, and an opening in another incident, are not openings here.
    ledger.record({ events: [seen('e2', 'episode-observed', '2026-11-20T12:01:00.000Z'), seen('e3', 'subject-cleared', '2026-11-20T12:02:00.000Z', TWO), seen('e4', 'subject-observed', '2026-11-20T12:03:00.000Z', TWO, 'inc-0000000000000002')], incidents: [] });
    expect(ledger.openedAfter(ID, ['mark'])).toEqual([{ subject: ONE, at: '2026-11-20T12:01:00.000Z' }]);
    // The latest opening of each subject, each subject once, in the order they first opened since.
    ledger.record({ events: [seen('e5', 'subject-observed', '2026-11-20T12:05:00.000Z', TWO), seen('e6', 'subject-observed', '2026-11-20T12:06:00.000Z'), event('admitted', { kind: 'resume-admitted', at: '2026-11-20T12:07:00.000Z' })], incidents: [] });
    expect(ledger.openedAfter(ID, ['mark'])).toEqual([{ subject: ONE, at: '2026-11-20T12:06:00.000Z' }, { subject: TWO, at: '2026-11-20T12:05:00.000Z' }]);
    // After every one of several events means after the last of them to be written.
    expect(ledger.openedAfter(ID, ['mark', 'admitted'])).toEqual([]);
    expect(ledger.openedAfter(ID, ['admitted', 'mark'])).toEqual([]);
    ledger.record({ events: [seen('e7', 'episode-observed', '2026-11-20T12:08:00.000Z', TWO)], incidents: [] });
    expect(ledger.openedAfter(ID, ['mark', 'admitted'])).toEqual([{ subject: TWO, at: '2026-11-20T12:08:00.000Z' }]);
    // An opening given as the event is not after itself.
    expect(ledger.openedAfter(ID, ['e7'])).toEqual([]);
    expect(ledger.openedAfter(ID, ['e6'])).toEqual([{ subject: TWO, at: '2026-11-20T12:08:00.000Z' }]);
    // An event the ledger does not hold is not waited for; with none held, or none given, nothing has opened since.
    expect(ledger.openedAfter(ID, ['admitted', 'never-recorded'])).toEqual([{ subject: TWO, at: '2026-11-20T12:08:00.000Z' }]);
    expect(ledger.openedAfter(ID, ['never-recorded'])).toEqual([]);
    expect(ledger.openedAfter(ID, [])).toEqual([]);
    expect(ledger.openedAfter('inc-0000000000000002', ['mark'])).toEqual([{ subject: TWO, at: '2026-11-20T12:03:00.000Z' }]);
});

test('the event history answers when a subject\'s standing last changed in any incident, in append order', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.subjectChangedAt('brain/delivery/job-1')).toBeNull();
    const seen = (id: string, kind: 'subject-observed' | 'episode-observed' | 'subject-cleared' | 'research-promoted', at: string, subject = 'brain/delivery/job-1', incident = 'inc-0000000000000001') => event(id, { kind, at, incident, body: { subject } });
    ledger.record({ events: [seen('e1', 'subject-observed', '2026-11-20T12:00:00.000Z')], incidents: [incident()] });
    expect(ledger.subjectChangedAt('brain/delivery/job-1')).toBe('2026-11-20T12:00:00.000Z');
    ledger.record({ events: [seen('e2', 'episode-observed', '2026-11-20T12:10:00.000Z')], incidents: [] });
    expect(ledger.subjectChangedAt('brain/delivery/job-1')).toBe('2026-11-20T12:10:00.000Z');
    // A clear is a change too, and the last one appended is the one given even when the clock stepped back.
    ledger.record({ events: [seen('e3', 'subject-cleared', '2026-11-20T12:02:00.000Z')], incidents: [] });
    expect(ledger.subjectChangedAt('brain/delivery/job-1')).toBe('2026-11-20T12:02:00.000Z');
    // In whichever incident it happened; other subjects and other kinds of event do not count.
    ledger.record({ events: [seen('e4', 'subject-observed', '2026-11-20T12:20:00.000Z', 'brain/delivery/job-1', 'inc-0000000000000002'), seen('e5', 'subject-observed', '2026-11-20T12:30:00.000Z', 'brain/delivery/job-2'), seen('e6', 'research-promoted', '2026-11-20T12:40:00.000Z')], incidents: [] });
    expect(ledger.subjectChangedAt('brain/delivery/job-1')).toBe('2026-11-20T12:20:00.000Z');
    expect(ledger.subjectChangedAt('brain/delivery/job-2')).toBe('2026-11-20T12:30:00.000Z');
    expect(ledger.subjectChangedAt('brain/delivery/job-9')).toBeNull();
});

test('one event follows another when the ledger wrote it later, whatever their times; an event it does not hold follows nothing', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.eventFollows('later', 'earlier')).toBe(false);
    // Written first with the later time on it, then the other with an earlier time.
    ledger.record({ events: [event('earlier', { at: '2026-11-20T12:30:00.000Z' }), event('later', { at: '2026-11-20T12:00:00.000Z' })], incidents: [incident()] });
    expect(ledger.eventFollows('later', 'earlier')).toBe(true);
    expect(ledger.eventFollows('earlier', 'later')).toBe(false);
    expect(ledger.eventFollows('later', 'later')).toBe(false);
    expect(ledger.eventFollows('later', 'never-recorded')).toBe(false);
    expect(ledger.eventFollows('never-recorded', 'earlier')).toBe(false);
});

test('a projection must carry the next revision; a stale or skipped one is refused and nothing is saved', () => {
    const ledger = new IncidentLedger(memory());
    expect(() => ledger.record({ events: [], incidents: [incident(2)] })).toThrow(/revision 0/);
    ledger.record({ events: [], incidents: [incident(1)] });
    expect(() => ledger.record({ events: [event('late')], incidents: [incident(1, { state: 'triaged' })] })).toThrow(/revision 1/);
    expect(ledger.events('inc-0000000000000001')).toEqual([]);
    ledger.record({ events: [], incidents: [incident(2, { state: 'triaged' })] });
    expect(ledger.get('inc-0000000000000001')).toMatchObject({ revision: 2, state: 'triaged' });
});

test('opening the ledger and reading it change nothing: the tables appear with the first recorded change', () => {
    const db = memory(), ledger = new IncidentLedger(db);
    const tables = () => (db.prepare("SELECT name FROM sqlite_master ORDER BY name").all() as { name: string }[]).map(row => row.name);
    expect([ledger.list(), ledger.current(['f1']), ledger.get('inc-0000000000000001'), ledger.events('inc-0000000000000001')]).toEqual([[], [], null, []]);
    ledger.record({ events: [], incidents: [] });
    expect(tables()).toEqual([]);
    expect(() => ledger.record({ events: [], incidents: [incident(2)] })).toThrow(/revision 0/);
    expect(tables()).toEqual([]);
    ledger.record({ events: [event('e1')], incidents: [incident()] });
    expect(tables().filter(name => !name.startsWith('sqlite_'))).toEqual(['incident_events', 'incident_events_incident', 'incidents', 'incidents_open']);
});

test('the incidents an observation can change are the open ones and those with an observed fingerprint', () => {
    const ledger = new IncidentLedger(memory());
    const open = { ...subjectRecord, status: 'open' as const }, cleared = { ...subjectRecord, status: 'cleared' as const };
    ledger.record({ events: [], incidents: [incident(1, { subjects: [open] }), incident(1, { id: 'inc-0000000000000002', fingerprint: 'f2', subjects: [cleared] }), incident(1, { id: 'inc-0000000000000003', fingerprint: 'f3', subjects: [] })] });
    expect(ledger.current().map(i => i.fingerprint)).toEqual(['f1']);
    expect(ledger.current(['f3', 'unknown']).map(i => i.fingerprint).sort()).toEqual(['f1', 'f3']);
    ledger.record({ events: [], incidents: [incident(2, { subjects: [cleared] })] });
    expect(ledger.current()).toEqual([]);
    expect(ledger.list()).toHaveLength(3);
});

test('an empty change opens no transaction', () => {
    const db = memory(), ledger = new IncidentLedger(db);
    db.exec('BEGIN IMMEDIATE');
    expect(() => ledger.record({ events: [], incidents: [] })).not.toThrow();
    db.exec('ROLLBACK');
});

test('the ledger lives on the control database, survives a restart and is untouched by lease recovery', () => {
    const path = join(mkdtempSync(join(process.env.OFFICE_DATA_ROOT!, 'ledger-')), 'office-control.sqlite');
    const first = new ControlStore(path);
    new IncidentLedger(first.db).record({ events: [event('e1')], incidents: [incident()] });
    first.close();
    const second = new ControlStore(path);
    try {
        second.recover();
        const ledger = new IncidentLedger(second.db);
        expect(ledger.list()).toEqual([incident()]);
        expect(ledger.events('inc-0000000000000001')).toHaveLength(1);
    } finally { second.close(); }
});
