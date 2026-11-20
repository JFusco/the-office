import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { dismissalLapse, invalidateDismissals } from '../../../server/incidents/dismissal-validity';
import { candidate, later } from './incident-fixture';
import { cite, GUARD, ledgerOf, manifest, OTHER } from './dismissal-fixture';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const same = sourceVersions(manifest());
const both = [candidate({ id: 'job-1' }), candidate({ id: 'job-2' })];
function dismissed() { const l = ledgerOf(dbs, both); l.dismiss('cli-dismiss-1'); return l; }

test('a dismissal holds while the cited code and the covered stops stay the same', () => {
    const l = dismissed(), saved = l.saved();
    expect(dismissalLapse(l.ledger.get(l.id)!, same)).toBeNull();
    expect(invalidateDismissals(l.ledger, same, later(5))).toEqual([]);
    // A file the verdict did not cite may change.
    expect(invalidateDismissals(l.ledger, sourceVersions(manifest({ [OTHER]: 'f'.repeat(64), 'server/new.ts': 'e'.repeat(64) })), later(5))).toEqual([]);
    expect(l.saved()).toBe(saved);
    // A covered subject that clears is not new evidence, nor is the incident with nothing open.
    l.observe([both[0]], 6);
    l.observe([], 7);
    expect(invalidateDismissals(l.ledger, same, later(8))).toEqual([]);
    expect(l.ledger.get(l.id)).toMatchObject({ state: 'dismissed', dismissals: [{ event: 'cli-dismiss-1' }] });
    expect(l.ledger.get(l.id)!.dismissals![0].lapsed).toBeUndefined();
});

test('a cited file that changes or leaves the running release lapses the dismissal, once', () => {
    for (const [files, reason] of [[{ [GUARD]: 'f'.repeat(64) }, `cited source changed: ${GUARD} is not the version the running release holds`], [null, `cited source changed: ${GUARD} is not a file of the running release`]] as const) {
        const l = dismissed(), before = l.ledger.get(l.id)!, versions = sourceVersions(files ? manifest(files) : manifest().filter(file => file.path !== GUARD));
        expect(invalidateDismissals(l.ledger, versions, later(5))).toEqual([l.id]);
        const after = l.ledger.get(l.id)!, event = l.ledger.events(l.id).at(-1)!;
        expect(after).toMatchObject({ state: 'observed', revision: before.revision + 1 });
        expect(after.dismissals).toEqual([{ ...before.dismissals![0], lapsed: { event: event.id, reason, at: later(5).toISOString() } }]);
        expect(event).toMatchObject({ kind: 'dismissal-invalidated', body: { dismissal: 'cli-dismiss-1', reason, from: 'dismissed', to: 'observed', revision: after.revision } });
        const saved = l.saved();
        expect(invalidateDismissals(l.ledger, versions, later(6))).toEqual([]);
        expect(l.saved()).toBe(saved);
    }
});

test('a new subject, a new episode, or a covered subject that stands differently lapses the dismissal', () => {
    const cases: [ReturnType<typeof candidate>[], string][] = [
        [[...both, candidate({ id: 'job-3' })], 'brain/delivery/job-3 stopped after the dismissal and was not part of it'],
        [[candidate({ id: 'job-1', episode: 'e2' }), both[1]], 'brain/delivery/job-1 stopped again or stands differently than when it was dismissed'],
        [[candidate({ id: 'job-1', head: 'moved' }), both[1]], 'brain/delivery/job-1 stopped again or stands differently than when it was dismissed'],
    ];
    for (const [next, reason] of cases) {
        const l = dismissed();
        l.observe(next, 3);
        expect(l.ledger.get(l.id)!.state).toBe('dismissed');
        expect(dismissalLapse(l.ledger.get(l.id)!, same)).toBe(reason);
        expect(invalidateDismissals(l.ledger, same, later(4))).toEqual([l.id]);
        expect(l.ledger.get(l.id)).toMatchObject({ state: 'observed', dismissals: [{ lapsed: { reason } }] });
    }
    // A covered subject that cleared and came back is a new episode.
    const l = dismissed();
    l.observe([both[1]], 3);
    l.observe(both, 4);
    expect(invalidateDismissals(l.ledger, same, later(5))).toEqual([l.id]);
});

test('an incident whose dismissal lapsed can be dismissed again, and both stay on record', () => {
    const l = dismissed();
    l.observe([...both, candidate({ id: 'job-3' })], 3);
    invalidateDismissals(l.ledger, same, later(4));
    l.dismiss('cli-dismiss-2', { minutes: 5 });
    const incident = l.ledger.get(l.id)!;
    expect(incident.state).toBe('dismissed');
    expect(incident.dismissals!.map(dismissal => [dismissal.event, !!dismissal.lapsed, dismissal.subjects.length])).toEqual([['cli-dismiss-1', true, 2], ['cli-dismiss-2', false, 3]]);
    expect(invalidateDismissals(l.ledger, same, later(6))).toEqual([]);
    expect(l.packet().dismissals).toMatchObject({ total: 2, recent: [{ event: 'cli-dismiss-1', lapsed: { reason: expect.stringContaining('job-3') } }, { event: 'cli-dismiss-2', lapsed: null }] });
});

test('only dismissed incidents are examined, and observation keeps a dismissal through later passes', () => {
    const l = ledgerOf(dbs, both), saved = l.saved();
    expect(invalidateDismissals(l.ledger, sourceVersions([]), later(1))).toEqual([]);
    expect(l.saved()).toBe(saved);
    l.dismiss('cli-dismiss-1', { cited: [cite()] });
    const dismissal = l.ledger.get(l.id)!.dismissals;
    l.observe(both, 2);
    l.observe([both[0]], 3);
    expect(l.ledger.get(l.id)).toMatchObject({ state: 'dismissed', dismissals: dismissal });
});

test('when every covered subject clears and the cause returns, the incident is found again and its dismissal lapses', () => {
    const l = dismissed();
    l.observe([], 3);
    expect(l.ledger.get(l.id)).toMatchObject({ state: 'dismissed' });
    expect(l.ledger.current()).toEqual([]);
    l.observe([both[0]], 4);
    expect(l.ledger.list()).toHaveLength(1);
    expect(dismissalLapse(l.ledger.get(l.id)!, same)).toBe('brain/delivery/job-1 stopped again or stands differently than when it was dismissed');
    expect(invalidateDismissals(l.ledger, same, later(5))).toEqual([l.id]);
});

test('the same stop written with its fields in another order is the same stop', () => {
    const stopped = [candidate({ id: 'job-1', stop: { kind: 'failed', at: '2026-11-20T11:00:00.000Z' } })];
    const l = ledgerOf(dbs, stopped);
    l.dismiss('cli-dismiss-1');
    const incident = l.ledger.get(l.id)!;
    const reordered = { ...incident, subjects: incident.subjects.map(subject => ({ ...subject, stop: { at: subject.stop!.at, kind: subject.stop!.kind } })) };
    expect(JSON.stringify(reordered.subjects[0].stop)).not.toBe(JSON.stringify(incident.subjects[0].stop));
    expect(dismissalLapse(reordered, same)).toBeNull();
    expect(dismissalLapse({ ...incident, subjects: incident.subjects.map(subject => ({ ...subject, stop: { kind: 'failed', at: '2026-11-20T11:30:00.000Z' } })) }, same)).toMatch(/stands differently/);
});
