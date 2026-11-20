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

test('the event history answers how often a subject was observed and when first', () => {
    const ledger = new IncidentLedger(memory());
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-1')).toBeNull();
    const seen = (id: string, kind: 'subject-observed' | 'episode-observed' | 'subject-cleared', at: string, subject = 'brain/delivery/job-1') => event(id, { kind, at, body: { subject } });
    ledger.record({ events: [event('e0'), seen('e1', 'subject-observed', '2026-11-20T12:00:00.000Z'), seen('e2', 'subject-cleared', '2026-11-20T12:01:00.000Z'), seen('e3', 'subject-observed', '2026-11-20T12:02:00.000Z'), seen('e4', 'episode-observed', '2026-11-20T12:03:00.000Z'), seen('e5', 'subject-observed', '2026-11-20T12:04:00.000Z', 'brain/delivery/job-2')], incidents: [incident()] });
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-1')).toEqual({ episodes: 3, firstObservedAt: '2026-11-20T12:00:00.000Z' });
    expect(ledger.subjectHistory('inc-0000000000000001', 'brain/delivery/job-9')).toBeNull();
    expect(ledger.subjectHistory('inc-ffffffffffffffff', 'brain/delivery/job-1')).toBeNull();
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
