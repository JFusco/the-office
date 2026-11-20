import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { canonical } from '../../../server/incidents/canonical-json';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { invalidateDismissals } from '../../../server/incidents/dismissal-validity';
import { evidencePacket, PACKET_BYTES, PACKET_EVENTS, PACKET_SUBJECTS } from '../../../server/incidents/evidence-packet';
import { recordIncidentEvent } from '../../../server/incidents/record-event';
import type { ReleaseIdentity } from '../../../server/office/release-identity';
import type { Incident } from '../../../src/contracts/incidents';
import { candidate, later } from './incident-fixture';
import { HASH, ledgerOf, manifest, unknownRelease } from './dismissal-fixture';
import { REPO, SHA } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
const verified: ReleaseIdentity = { status: 'verified', commit: SHA('e'), hash: HASH, manifestDigest: '2'.repeat(64), operation: 'deploy-20261120t030000z-0a0b0c0d', activatedAt: '2026-11-20T03:00:09.000Z' };

test('the packet states the incident, the release and each subject as the ledger holds them', () => {
    const l = ledgerOf(dbs, [candidate({ id: 'job-2', stage: 'validate', lastWorker: 'run-9', head: 'abc', stop: { kind: 'failed', at: '2026-11-20T11:00:00.000Z' } }), candidate({ id: 'job-1', stage: 'validate' })]);
    const incident = l.ledger.get(l.id)!, packet = l.packet(verified);
    expect(packet).toMatchObject({
        version: 1, incident: { id: l.id, fingerprint: incident.fingerprint, state: 'observed', revision: incident.revision, cause: incident.cause, research: incident.research },
        release: { loadedHash: HASH, status: 'verified', commit: SHA('e'), manifestDigest: '2'.repeat(64), operation: verified.operation, activatedAt: '2026-11-20T03:00:09.000Z', reason: null },
        subjects: { total: 2, open: 2 }, repair: null, fixes: { total: 0, recent: [] }, dismissals: { total: 0, recent: [] },
        events: { total: l.ledger.events(l.id).length },
    });
    expect(packet.subjects.included.map(subject => subject.subject)).toEqual(['brain/delivery/job-1', 'brain/delivery/job-2']);
    expect(packet.subjects.included[1]).toMatchObject({ status: 'open', stage: 'validate', lastWorker: 'run-9', head: 'abc', stop: { kind: 'failed', at: '2026-11-20T11:00:00.000Z' }, unsettledEffect: false, episodeCount: 1, evidence: 'Worktree is missing', digest: expect.stringMatching(/^[0-9a-f]{64}$/) });
    expect(packet.events.recent.map(event => event.kind)).toEqual(l.ledger.events(l.id).map(event => event.kind));
    expect(Object.keys(packet.events.recent[0]).sort()).toEqual(['at', 'id', 'kind']);
    expect(l.packet(unknownRelease).release).toEqual({ loadedHash: HASH, status: 'unknown', commit: null, manifestDigest: null, operation: null, activatedAt: null, reason: 'no deployment has recorded an active release' });
});

test('the same ledger state and release give the same bytes; a changed fact, revision or release gives another digest', () => {
    const stop = { kind: 'failed', at: '2026-11-20T11:00:00.000Z' };
    const l = ledgerOf(dbs, [candidate({ id: 'job-1', stop }), candidate({ id: 'job-2' })]), first = l.packet();
    expect(JSON.stringify(l.packet())).toBe(JSON.stringify(first));
    expect(first.digest).toMatch(/^[0-9a-f]{64}$/);
    // Subject order and saved stop property order do not affect the serialized packet.
    const incident = l.ledger.get(l.id)!, history = l.ledger.history(l.id, PACKET_EVENTS);
    expect(JSON.stringify(evidencePacket({ incident: { ...incident, subjects: [...incident.subjects].reverse() }, history, loadedHash: HASH, release: unknownRelease }))).toBe(JSON.stringify(first));
    const reordered = { ...incident, subjects: incident.subjects.map(subject => subject.stop ? { ...subject, stop: { at: stop.at, kind: stop.kind } } : subject) };
    const second = evidencePacket({ incident: reordered, history, loadedHash: HASH, release: unknownRelease });
    expect(JSON.stringify(second)).toBe(JSON.stringify(first));
    for (const { digest, ...body } of [first, second]) {
        expect(digest).toBe(createHash('sha256').update(canonical(body)).digest('hex'));
    }
    const digests = new Set([first.digest, l.packet(verified).digest, l.packet({ ...verified, manifestDigest: '5'.repeat(64) }).digest, l.packet({ ...verified, activatedAt: '2026-11-21T03:00:09.000Z' }).digest, l.packet({ ...verified, operation: 'deploy-20261121t030000z-0a0b0c0d' }).digest, l.packet(unknownRelease, '3'.repeat(64)).digest, l.packet({ status: 'unknown', reason: 'the deployment receipt names another runtime hash' }).digest]);
    expect(digests.size).toBe(7);
    l.observe([candidate({ id: 'job-1', episode: 'e2' }), candidate({ id: 'job-2' })], 1);
    expect(l.packet().incident.revision).toBe(first.incident.revision + 1);
    expect(digests.has(l.packet().digest)).toBe(false);
    const edited: Incident = { ...l.ledger.get(l.id)!, subjects: l.ledger.get(l.id)!.subjects.map((subject, n) => n ? subject : { ...subject, head: 'moved' }) };
    expect(evidencePacket({ incident: edited, history: l.ledger.history(l.id, PACKET_EVENTS), loadedHash: HASH, release: unknownRelease }).digest).not.toBe(l.packet().digest);
});

test('a thousand subjects and a long history give a bounded packet that states its totals', () => {
    const many = Array.from({ length: 1000 }, (_, n) => candidate({ id: `job-${String(n).padStart(4, '0')}` }, { evidence: 'x'.repeat(300) }));
    const l = ledgerOf(dbs, many);
    // Six passes in which half the subjects clear and return: thousands of events.
    for (let pass = 1; pass <= 6; pass++) l.observe(pass % 2 ? many.slice(0, 500) : many, pass);
    const packet = l.packet();
    expect(packet.subjects).toMatchObject({ total: 1000, open: 1000 });
    expect(packet.subjects.included).toHaveLength(PACKET_SUBJECTS);
    expect(packet.events.total).toBe(l.ledger.events(l.id).length);
    expect(packet.events.total).toBeGreaterThan(2000);
    expect(packet.events.recent).toHaveLength(PACKET_EVENTS);
    expect(packet.events.recent.at(-1)!.id).toBe(l.ledger.events(l.id).at(-1)!.id);
    expect(Buffer.byteLength(JSON.stringify(packet))).toBeLessThan(PACKET_BYTES);
});

test('subjects with very long IDs are taken whole for as long as they fit: the packet stays under its size and no key or digest is cut', () => {
    const l = ledgerOf(dbs, Array.from({ length: 60 }, (_, n) => candidate({ id: `${String(n).padStart(2, '0')}-${'i'.repeat(2700)}`, stage: 's'.repeat(2000), head: 'h'.repeat(2000), lastWorker: 'w'.repeat(2000) })));
    const incident = l.ledger.get(l.id)!, packet = l.packet();
    expect(Buffer.byteLength(JSON.stringify(packet))).toBeLessThanOrEqual(PACKET_BYTES);
    expect(packet.subjects).toMatchObject({ total: 60, open: 60 });
    expect(packet.subjects.included.length).toBeGreaterThan(5);
    expect(packet.subjects.included.length).toBeLessThan(PACKET_SUBJECTS);
    // A prefix of the ordered subjects, each exactly as the ledger holds it.
    packet.subjects.included.forEach((subject, n) => {
        expect(subject.id).toBe(`${String(n).padStart(2, '0')}-${'i'.repeat(2700)}`);
        expect(subject.subject).toBe(`brain/delivery/${subject.id}`);
        expect(incident.repair).toBeUndefined();
        expect(subject.digest).toMatch(/^[0-9a-f]{64}$/);
    });
    expect(JSON.stringify(l.packet())).toBe(JSON.stringify(packet));
});

test('an oversized cause stage leaves room for subjects and preserves totals', () => {
    const l = ledgerOf(dbs);
    const incident = l.ledger.get(l.id)!;
    const history = l.ledger.history(l.id, PACKET_EVENTS);
    const packet = evidencePacket({ incident: { ...incident, cause: { ...incident.cause, stage: 's'.repeat(PACKET_BYTES) } }, history, loadedHash: HASH, release: unknownRelease });
    const { digest, ...body } = packet;
    expect(Buffer.byteLength(JSON.stringify(packet))).toBeLessThan(PACKET_BYTES);
    expect(packet.subjects).toMatchObject({ total: 2, open: 2 });
    expect(packet.subjects.included).toHaveLength(2);
    expect(packet.events.total).toBe(history.total);
    expect(digest).toBe(createHash('sha256').update(canonical(body)).digest('hex'));
});

test('a lapse caused by an oversized subject key retains its explanation in a bounded packet', () => {
    const known = candidate({ id: 'job-1' });
    const l = ledgerOf(dbs, [known]);
    l.dismiss();
    l.observe([known, candidate({ id: 'z'.repeat(PACKET_BYTES - 'brain/delivery/'.length) })], 2);
    expect(invalidateDismissals(l.ledger, sourceVersions(manifest()), later(3))).toEqual([l.id]);

    const packet = l.packet();
    const { digest, ...body } = packet;
    expect(Buffer.byteLength(JSON.stringify(packet))).toBeLessThan(PACKET_BYTES);
    expect(packet.subjects).toMatchObject({ total: 2, open: 2 });
    expect(packet.subjects.included.map(subject => subject.id)).toEqual(['job-1']);
    expect(packet.dismissals).toMatchObject({ total: 1, recent: [{ lapsed: { reason: expect.stringMatching(/^brain\/delivery\/z+…z+ stopped after the dismissal and was not part of it$/) } }] });
    expect(packet.events.total).toBe(l.ledger.events(l.id).length);
    expect(digest).toBe(createHash('sha256').update(canonical(body)).digest('hex'));
});

test('the digest is of exactly what is handed out: credentials are removed from every string before it is taken', () => {
    const l = ledgerOf(dbs), slack = `xoxb-1-2-${'c'.repeat(20)}`;
    const history = { total: 2, recent: [{ id: 'cookie:rotation', at: '2026-11-20T12:00:00.000Z', kind: 'repair-started' as const }, { id: `cli-${slack}`, at: '2026-11-20T12:01:00.000Z', kind: 'fix-bound' as const }] };
    const packet = evidencePacket({ incident: l.ledger.get(l.id)!, history, loadedHash: HASH, release: unknownRelease });
    const { digest, ...rest } = packet;
    expect(digest).toBe(createHash('sha256').update(canonical(rest)).digest('hex'));
    expect(JSON.stringify(packet)).not.toContain(slack);
    // Sent through JSON and back, as the route does, it is the same packet with the same digest.
    const received = JSON.parse(JSON.stringify(packet));
    expect(createHash('sha256').update(canonical({ ...received, digest: undefined })).digest('hex')).toBe(digest);
});

test('open subjects come first, then the most recently cleared', () => {
    const all = ['a', 'b', 'c', 'd'].map(id => candidate({ id }));
    const l = ledgerOf(dbs, all);
    l.observe([all[0], all[1], all[3]], 1);
    l.observe([all[1], all[3]], 2);
    expect(l.packet().subjects.included.map(subject => `${subject.id}:${subject.status}`)).toEqual(['b:open', 'd:open', 'a:cleared', 'c:cleared']);
    expect(l.packet().subjects).toMatchObject({ total: 4, open: 2 });
});

test('the repair, the last fixes without their bindings and the last dismissals are summarised', () => {
    const l = ledgerOf(dbs);
    l.dismiss('cli-dismiss-1');
    l.observe([candidate({ id: 'job-1' }), candidate({ id: 'job-2' }), candidate({ id: 'job-3' })], 2);
    expect(l.packet().dismissals).toMatchObject({ total: 1, recent: [{ event: 'cli-dismiss-1', reason: 'the guard is right: the branch is not owned', packet: l.ledger.get(l.id)!.dismissals![0].packet, subjects: 2, loadedHash: HASH, lapsed: null }] });
    const incident = { ...l.ledger.get(l.id)!, state: 'observed' as const, revision: l.ledger.get(l.id)!.revision + 1 };
    l.ledger.record({ events: [], incidents: [incident] });
    recordIncidentEvent(l.ledger, l.id, 'cli-start-1', incident.revision, { kind: 'repair-started', request: { kind: 'repair-started', issue: 365 }, issue: { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` } }, new Date('2026-11-20T13:00:00.000Z'));
    const bindings = l.ledger.get(l.id)!.repair!.subjects.map(subject => ({ ...subject, disposition: 'no-route' as const, reason: 'nothing to resume' }));
    recordIncidentEvent(l.ledger, l.id, 'cli-bind-1', l.ledger.get(l.id)!.revision, { kind: 'fix-bound', request: { kind: 'fix-bound', reference: SHA('f'), bindings }, fix: { commit: SHA('f'), pullRequest: null, onMain: true } }, new Date('2026-11-20T13:01:00.000Z'));
    const packet = l.packet();
    expect(packet.repair).toEqual({ event: 'cli-start-1', issue: { repository: REPO, number: 365, url: `https://github.com/${REPO}/issues/365` }, startedAt: '2026-11-20T13:00:00.000Z', subjects: 3 });
    expect(packet.fixes).toEqual({ total: 1, recent: [{ event: 'cli-bind-1', commit: SHA('f'), pullRequest: null, onMain: true, boundAt: '2026-11-20T13:01:00.000Z', bindings: 3, deployed: null }] });
    expect(JSON.stringify(packet)).not.toContain('nothing to resume');
});

test('a credential in evidence or in a dismissal reason does not reach the packet', () => {
    const token = `ghp_${'a'.repeat(36)}`, slack = `xoxb-1-2-${'c'.repeat(20)}`;
    const l = ledgerOf(dbs);
    const incident = l.ledger.get(l.id)!;
    const leaky: Incident = {
        ...incident, subjects: incident.subjects.map(subject => ({ ...subject, evidence: `push failed with ${token}` })),
        dismissals: [{ event: 'cli-dismiss-1', reason: `checked with ${slack}`, reasonDigest: 'b'.repeat(64), packet: 'a'.repeat(64), cited: [], subjects: [], loadedHash: HASH, dismissedAt: '2026-11-20T12:01:00.000Z' }],
    };
    const text = JSON.stringify(evidencePacket({ incident: leaky, history: l.ledger.history(l.id, PACKET_EVENTS), loadedHash: HASH, release: unknownRelease }));
    expect(text).not.toContain(token);
    expect(text).not.toContain(slack);
    expect(text).toContain('push failed with');
});

test('an already-truncated credential value in saved subject evidence is masked', () => {
    const l = ledgerOf(dbs);
    const incident = l.ledger.get(l.id)!;
    const opaque = 'synthetic-value-123';
    const evidence = `request failed; response {"access_token":"${opaque}…`;
    l.ledger.record({ events: [], incidents: [{ ...incident, revision: incident.revision + 1, subjects: incident.subjects.map(subject => ({ ...subject, evidence })) }] });
    const packet = l.packet();
    expect(packet.subjects.included[0].evidence).toContain('request failed; response {"access_token":"[redacted]"');
    expect(JSON.stringify(packet)).not.toContain(opaque);
});
