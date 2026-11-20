import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { dismiss, DISMISSAL_CITATIONS, DISMISSAL_REASON, dismissalRequest, storedReason } from '../../../server/incidents/dismissal';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { replayed } from '../../../server/incidents/record-event';
import { candidate, later } from './incident-fixture';
import { cite, GUARD, HASH, ledgerOf, manifest, OTHER, REASON } from './dismissal-fixture';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));

test('a dismissal records the verdict against the packet, the cited code and the subjects open at that revision', () => {
    const l = ledgerOf(dbs), before = l.ledger.get(l.id)!, packet = l.packet().digest;
    const saved = l.dismiss('cli-dismiss-1', { cited: [cite(GUARD, 'a'.repeat(64), 41), cite(OTHER, 'b'.repeat(64))] });
    expect(saved).toMatchObject({ replayed: false, revision: before.revision + 1, incident: { state: 'dismissed', revision: before.revision + 1 }, event: { id: 'cli-dismiss-1', kind: 'dismissed', body: { from: 'observed', to: 'dismissed', revision: before.revision + 1 } } });
    expect(saved.incident.dismissals).toEqual([{
        event: 'cli-dismiss-1', reason: REASON, reasonDigest: createHash('sha256').update(REASON).digest('hex'), packet, loadedHash: HASH, dismissedAt: later(1).toISOString(),
        cited: [{ path: GUARD, sha256: 'a'.repeat(64), line: 41 }, { path: OTHER, sha256: 'b'.repeat(64) }],
        subjects: [{ subject: 'brain/delivery/job-1', digest: expect.stringMatching(/^[0-9a-f]{64}$/) }, { subject: 'brain/delivery/job-2', digest: expect.stringMatching(/^[0-9a-f]{64}$/) }],
    }]);
    expect(l.ledger.get(l.id)).toEqual(saved.incident);
});

test('a dismissal formed on other evidence, or citing code the service does not run, is refused and nothing is saved', () => {
    const l = ledgerOf(dbs), saved = l.saved();
    expect(() => l.dismiss('cli-dismiss-1', { packet: 'f'.repeat(64) })).toThrow(/is not the evidence of incident .* as it stands; read the evidence again/);
    expect(() => l.dismiss('cli-dismiss-1', { cited: [cite('server/gone.ts')] })).toThrow('A dismissal cites code the service does not run: server/gone.ts is not a file of the running release');
    expect(() => l.dismiss('cli-dismiss-1', { cited: [cite(), cite(OTHER, 'c'.repeat(64))] })).toThrow(`${OTHER} is not the version the running release holds`);
    expect(() => l.dismiss('cli-dismiss-1', { files: { [GUARD]: 'd'.repeat(64) } })).toThrow(`${GUARD} is not the version the running release holds`);
    expect(() => l.dismiss('cli-dismiss-1', { cited: [] })).toThrow();
    expect(() => l.dismiss('cli-dismiss-1', { cited: Array.from({ length: DISMISSAL_CITATIONS + 1 }, () => cite()) })).toThrow();
    expect(() => l.dismiss('cli-dismiss-1', { revision: l.ledger.get(l.id)!.revision + 1 })).toThrow(/read it again/);
    expect(l.saved()).toBe(saved);
    // A packet read before the incident changed is stale.
    const stale = l.packet().digest;
    l.observe([candidate({ id: 'job-1', episode: 'e2' }), candidate({ id: 'job-2' })], 1);
    expect(() => l.dismiss('cli-dismiss-1', { packet: stale, minutes: 2 })).toThrow(/read the evidence again/);
});

test('an incident is dismissed only while observed, triaged or recurred', () => {
    const l = ledgerOf(dbs);
    l.dismiss('cli-dismiss-1');
    expect(() => l.dismiss('cli-dismiss-2', { minutes: 2 })).toThrow('An incident that is dismissed cannot record dismissed; it must be observed or triaged or recurred');
    for (const state of ['fixing', 'shipped', 'deployed', 'verified'] as const) {
        const other = ledgerOf(dbs), incident = other.ledger.get(other.id)!;
        other.ledger.record({ events: [], incidents: [{ ...incident, state, revision: incident.revision + 1 }] });
        expect(() => other.dismiss()).toThrow(`An incident that is ${state} cannot record dismissed`);
    }
});

test('the same dismissal sent again returns what was saved; the same ID with other content is refused', () => {
    const l = ledgerOf(dbs), packet = l.packet().digest, revision = l.ledger.get(l.id)!.revision;
    const first = l.dismiss('cli-dismiss-1'), saved = l.saved();
    const request = { kind: 'dismissed' as const, ...dismissalRequest({ reason: REASON, packet, cited: [cite()] }) };
    expect(replayed(l.ledger, l.id, 'cli-dismiss-1', revision, request)).toMatchObject({ replayed: true, revision: first.revision, event: first.event });
    expect(() => replayed(l.ledger, l.id, 'cli-dismiss-1', revision, { ...request, ...dismissalRequest({ reason: 'another reason', packet, cited: [cite()] }) })).toThrow(/already recorded with different content/);
    // The same first line with other words after it is another verdict, although the stored line is the same.
    const longer = dismissalRequest({ reason: `${REASON}\nbut only for forks`, packet, cited: [cite()] });
    expect(longer.reason).toBe(request.reason);
    expect(() => replayed(l.ledger, l.id, 'cli-dismiss-1', revision, { kind: 'dismissed', ...longer })).toThrow(/already recorded with different content/);
    expect(() => replayed(l.ledger, l.id, 'cli-dismiss-1', revision, { ...request, cited: [cite(OTHER, 'b'.repeat(64))] })).toThrow(/already recorded with different content/);
    expect(l.saved()).toBe(saved);
});

test('a reason is stored as its first line, without credentials, never longer than the limit, whatever the line endings', () => {
    expect(storedReason('first\rsecond')).toBe('first');
    expect(storedReason('\r\n  first  \r\nsecond')).toBe('first');
    expect(storedReason('first\nsecond')).toBe('first');
    const long = storedReason('x'.repeat(DISMISSAL_REASON + 500));
    expect(long).toHaveLength(DISMISSAL_REASON);
    expect(long.endsWith('…')).toBe(true);
    expect(storedReason('x'.repeat(DISMISSAL_REASON))).toBe('x'.repeat(DISMISSAL_REASON));
    expect(storedReason(`checked with {"access_token":"opaque-value-123"} and ghp_${'a'.repeat(36)}`)).toBe('checked with {"access_token":"[redacted]"} and [redacted]');
    for (const separator of ['\r', '\u2028', '\u2029']) {
        const reason = `first${separator}second`;
        expect(storedReason(reason)).toBe('first');
        const request = dismissalRequest({ reason, packet: 'a'.repeat(64), cited: [cite()] });
        expect(request).toEqual({ reason: 'first', reasonDigest: createHash('sha256').update(reason).digest('hex'), packet: 'a'.repeat(64), cited: [cite()] });
    }
    expect(storedReason('token="fixture\u2028continued" second line')).toBe('token="[redacted]"');
});

test('a reason that is not in its stored form is refused however the dismissal is recorded', () => {
    const l = ledgerOf(dbs), incident = l.ledger.get(l.id)!, facts = { loadedHash: HASH, versions: sourceVersions(manifest()), packet: l.packet().digest };
    const request = dismissalRequest({ reason: REASON, packet: facts.packet, cited: [cite()] });
    expect(dismiss(incident, 'cli-dismiss-1', request, facts, later(1).toISOString()).next.state).toBe('dismissed');
    for (const reason of ['two\nlines', 'a lone\rreturn', 'first\u2028second', 'first\u2029second', 'x'.repeat(DISMISSAL_REASON + 1), `token ghp_${'a'.repeat(36)}`, '  padded  '])
        expect(() => dismiss(incident, 'cli-dismiss-1', { ...request, reason }, facts, later(1).toISOString())).toThrow();
});

test('a long reason cut at a credential is stored in a form that storing again does not change, and is accepted', () => {
    for (const tail of [' token=abcdefgh rest', ' {"access_token":"abcdefgh-opaque"} rest', ` ghp_${'a'.repeat(36)} rest`, ' password: abcdefgh, rest']) {
        for (const lead of [DISMISSAL_REASON - 10, DISMISSAL_REASON - 22, DISMISSAL_REASON - 4]) {
            const sent = `${'x'.repeat(lead)}${tail}${' and more'.repeat(10)}`, stored = storedReason(sent);
            expect(stored.length).toBeLessThanOrEqual(DISMISSAL_REASON);
            expect(stored.endsWith('…')).toBe(true);
            expect(stored).not.toContain('abcdefgh');
            expect(storedReason(stored)).toBe(stored);
            const l = ledgerOf(dbs);
            expect(l.dismiss('cli-dismiss-1', { reason: sent }).incident.dismissals![0].reason).toBe(stored);
        }
    }
});
