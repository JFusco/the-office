import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { sourceVersions } from '../../../server/incidents/cited-sources';
import { invalidateDismissals } from '../../../server/incidents/dismissal-validity';
import { incidentsRoute, type IncidentsRouteContext } from '../../../server/incidents/routes';
import { candidate, later } from './incident-fixture';
import { cite, GUARD, HASH, ledgerOf, manifest, unknownRelease } from './dismissal-fixture';
import { fakeGitHub } from './github-fake';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function seeded(files: Record<string, string> = {}) {
    const l = ledgerOf(dbs), github = fakeGitHub({});
    const context: IncidentsRouteContext = { offices: { incidents: l.ledger }, loadedRevision: { hash: HASH, manifest: manifest(files) }, release: () => unknownRelease, execute: github.execute, now: () => later(1) };
    const get = async (path: string) => { const response = (await incidentsRoute(new Request(`http://127.0.0.1${path}`), new URL(`http://127.0.0.1${path}`), context))!; return { status: response.status, body: await response.json() }; };
    const post = async (body: Record<string, unknown>) => {
        const text = JSON.stringify(body), path = `/api/incidents/${l.id}/events`;
        const response = (await incidentsRoute(new Request(`http://127.0.0.1${path}`, { method: 'POST', body: text, headers: { 'content-length': String(Buffer.byteLength(text)) } }), new URL(`http://127.0.0.1${path}`), context))!;
        return { status: response.status, body: await response.json() };
    };
    const dismissal = (over: Record<string, unknown> = {}) => ({ kind: 'dismissed', eventId: 'cli-dismiss-1', expectedRevision: l.ledger.get(l.id)!.revision, reason: 'the guard is right', packet: l.packet().digest, cited: [cite()], ...over });
    return { ...l, github, context, get, post, dismissal };
}

test('the evidence route returns the packet the ledger and the running release give, and only reads', async () => {
    const s = seeded(), saved = s.saved();
    const { status, body } = await s.get(`/api/incidents/${s.id}/evidence`);
    expect(status).toBe(200);
    expect(body.packet).toEqual(JSON.parse(JSON.stringify(s.packet())));
    expect(JSON.stringify(body.packet)).toBe(JSON.stringify(s.packet()));
    expect(body.packet.release).toMatchObject({ loadedHash: HASH, status: 'unknown' });
    expect((await s.get('/api/incidents/inc-ffffffffffffffff/evidence')).status).toBe(404);
    expect((await s.get(`/api/incidents/${s.id}/evidence/more`)).status).toBe(404);
    const path = `/api/incidents/${s.id}/evidence`;
    expect((await incidentsRoute(new Request(`http://127.0.0.1${path}`, { method: 'POST', body: '{}' }), new URL(`http://127.0.0.1${path}`), s.context))!.status).toBe(405);
    expect(s.saved()).toBe(saved);
    expect(s.github.calls).toEqual([]);
});

test('a dismissal posted with the packet just read and code the service runs is recorded, without asking GitHub', async () => {
    const s = seeded(), packet = (await s.get(`/api/incidents/${s.id}/evidence`)).body.packet.digest;
    const { status, body } = await s.post(s.dismissal({ packet }));
    expect(status).toBe(200);
    expect(body).toMatchObject({ replayed: false, incident: { state: 'dismissed', dismissals: [{ event: 'cli-dismiss-1', reason: 'the guard is right', packet, cited: [{ path: GUARD, sha256: 'a'.repeat(64) }], loadedHash: HASH }] } });
    // Sent again after the incident moved on: the saved result, not a new check against a packet that has changed.
    const again = await s.post(s.dismissal({ packet, expectedRevision: body.revision - 1 }));
    expect(again.body).toMatchObject({ replayed: true, revision: body.revision });
    expect(s.github.calls).toEqual([]);
});

test('a dismissal that the Office cannot tie to its own evidence and code is refused and saves nothing', async () => {
    const s = seeded(), saved = s.saved();
    const route = (body: Record<string, unknown>) => s.post(body);
    await expect(route(s.dismissal({ packet: 'f'.repeat(64) }))).rejects.toThrow(/read the evidence again/);
    await expect(route(s.dismissal({ cited: [cite(GUARD, 'c'.repeat(64))] }))).rejects.toThrow(/is not the version the running release holds/);
    await expect(route(s.dismissal({ cited: [cite('server/unknown.ts')] }))).rejects.toThrow(/is not a file of the running release/);
    await expect(route(s.dismissal({ expectedRevision: 99 }))).rejects.toThrow(/read it again/);
    for (const malformed of [s.dismissal({ cited: [] }), s.dismissal({ cited: Array.from({ length: 21 }, () => cite()) }), s.dismissal({ reason: '   ' }), s.dismissal({ packet: 'short' }), s.dismissal({ cited: [{ path: GUARD }] }), s.dismissal({ verdict: 'real' })])
        expect((await route(malformed)).status).toBe(400);
    expect(s.saved()).toBe(saved);
    // A service that does not know what it loaded can verify no citation.
    const blind = seeded();
    delete blind.context.loadedRevision;
    await expect(blind.post(blind.dismissal({ packet: (await blind.get(`/api/incidents/${blind.id}/evidence`)).body.packet.digest }))).rejects.toThrow(/is not a file of the running release/);
});

test('a reason is stored as one bounded line with credentials removed, and a repeat of the same words is the same request', async () => {
    const s = seeded(), token = `ghp_${'a'.repeat(36)}`, reason = `the guard is right; checked with ${token}\nsecond line ${'x'.repeat(3000)}`;
    const first = await s.post(s.dismissal({ reason }));
    const stored = first.body.incident.dismissals[0].reason as string;
    expect(stored).toContain('the guard is right; checked with');
    expect(stored).not.toContain('second line');
    expect(JSON.stringify([s.ledger.list(), s.ledger.events(s.id)])).not.toContain(token);
    expect((await s.post(s.dismissal({ reason, expectedRevision: first.body.revision - 1, packet: first.body.incident.dismissals[0].packet }))).body.replayed).toBe(true);
    expect((await s.get(`/api/incidents/${s.id}/evidence`)).body.packet.dismissals.recent[0].reason).toBe(stored);
    // Other words under the same first line are another verdict: the saved event ID cannot be reused for them.
    await expect(s.post(s.dismissal({ reason: `${reason} and more`, expectedRevision: first.body.revision - 1, packet: first.body.incident.dismissals[0].packet }))).rejects.toThrow(/already recorded with different content/);
    // A credential pasted as a JSON property is removed too.
    const t = seeded(), pasted = await t.post(t.dismissal({ reason: 'the guard is right; response was {"access_token":"opaque-value-123","scope":"repo"}' }));
    expect(pasted.body.incident.dismissals[0].reason).toBe('the guard is right; response was {"access_token":"[redacted]","scope":"repo"}');
    expect(JSON.stringify([t.ledger.list(), t.ledger.events(t.id)])).not.toContain('opaque-value-123');
});

test('the research listing leaves out a dismissed incident and lists it again once its dismissal lapses', async () => {
    const s = seeded(), listed = async () => (await s.get('/api/incidents?research=1')).body.incidents.map((incident: { id: string }) => incident.id);
    expect(await listed()).toEqual([s.id]);
    await s.post(s.dismissal());
    expect(await listed()).toEqual([]);
    expect((await s.get('/api/incidents?open=1')).body.incidents).toHaveLength(1);
    expect(s.ledger.get(s.id)!.research.eligible).toBe(true);
    s.observe([candidate({ id: 'job-1' }), candidate({ id: 'job-2' }), candidate({ id: 'job-3' })], 2);
    expect(invalidateDismissals(s.ledger, sourceVersions(manifest()), later(3))).toEqual([s.id]);
    expect(await listed()).toEqual([s.id]);
});
