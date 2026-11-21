import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { eventId } from '../../../server/incidents/event-id';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { resumeIdentity } from '../../../server/incidents/repair/resume-binding';
import { ResumeControl } from '../../../server/incidents/repair/resume-control';
import { incidentsRoute } from '../../../server/incidents/routes';
import { repairSubject } from '../../../server/incidents/subject-digest';
import type { Incident } from '../../../src/contracts/incidents';
import { AT, candidate, later } from './incident-fixture';

const PATH = '/api/incidents/resumes';
const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function seeded(withSwitch = true) {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const incidents = new IncidentLedger(db), resumes = new ResumeControl(db);
    incidents.record(planSync([], groupCandidates([candidate({ id: 'job-1' }), candidate({ id: 'job-2' })]), AT));
    return { db, incidents, resumes, context: { offices: withSwitch ? { incidents, resumes } : { incidents }, now: () => later(1) } };
}
type Seeded = ReturnType<typeof seeded>;
const call = (s: Seeded, path: string, method = 'GET') => incidentsRoute(new Request(`http://127.0.0.1${path}`, { method }), new URL(`http://127.0.0.1${path}`), s.context);
const post = (s: Seeded, body: unknown, headers?: Record<string, string>) => {
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return incidentsRoute(new Request(`http://127.0.0.1${PATH}`, { method: 'POST', body: text, headers: headers ?? { 'content-length': String(Buffer.byteLength(text)) } }), new URL(`http://127.0.0.1${PATH}`), s.context);
};
const state = (s: Seeded) => JSON.stringify([s.resumes.read(), s.incidents.list(), (s.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map(row => row.name)]);

test('the switch is read without being written, and reads as never enabled where there is none', async () => {
    const s = seeded(), before = state(s);
    expect(await (await call(s, PATH))!.json()).toEqual({ resumes: { enabled: false, revision: 0, reason: 'Automatic repair resumes have never been enabled.', at: null } });
    expect(state(s)).toBe(before);
    expect(await (await call(seeded(false), PATH))!.json()).toEqual({ resumes: { enabled: false, revision: 0, reason: 'Automatic repair resumes have never been enabled.', at: null } });
});

test('a pause needs nothing; enabling names the revision that was read', async () => {
    const s = seeded();
    expect(await (await post(s, { enabled: false, reason: 'looking at CEC-154' }))!.json()).toEqual({ resumes: { enabled: false, revision: 1, reason: 'looking at CEC-154', at: later(1).toISOString() } });
    expect(await (await post(s, { enabled: false }))!.json()).toMatchObject({ resumes: { enabled: false, revision: 2, reason: 'Paused by request.' } });
    await expect(post(s, { enabled: true, expectedRevision: 1, reason: 'go' })).rejects.toThrow('The resume switch is at revision 2, not 1; read it again');
    expect(s.resumes.read()).toMatchObject({ enabled: false, revision: 2 });
    const enabled = await post(s, { enabled: true, expectedRevision: 2, reason: 'go' });
    expect(enabled!.status).toBe(200);
    expect(await enabled!.json()).toEqual({ resumes: { enabled: true, revision: 3, reason: 'go', at: later(1).toISOString() } });
    expect(await (await call(s, PATH))!.json()).toMatchObject({ resumes: { enabled: true, revision: 3 } });
});

test('a switch nobody has changed is enabled at revision 0', async () => {
    const s = seeded();
    expect(await (await post(s, { enabled: true, expectedRevision: 0 }))!.json()).toEqual({ resumes: { enabled: true, revision: 1, reason: 'Enabled by request.', at: later(1).toISOString() } });
});

test('a change that is malformed, undeclared, oversized or sent with another method is refused and changes nothing', async () => {
    const s = seeded(), before = state(s);
    for (const body of ['{not json', {}, { enabled: 'yes' }, { enabled: true }, { enabled: true, expectedRevision: -1 }, { enabled: true, expectedRevision: 1.5 }, { enabled: true, expectedRevision: '0' },
        { enabled: false, expectedRevision: 0 }, { enabled: false, reason: 7 }, { enabled: false, extra: true }, { enabled: false, reason: 'r'.repeat(2001) }])
        expect((await post(s, body))!.status).toBe(400);
    expect((await post(s, { enabled: false }, {}))!.status).toBe(411);
    expect((await post(s, { enabled: false }, { 'content-length': '4097' }))!.status).toBe(413);
    for (const method of ['PUT', 'DELETE', 'PATCH']) expect((await call(s, PATH, method))!.status).toBe(405);
    expect(state(s)).toBe(before);
    // An Office built without a switch has nothing to change.
    expect((await post(seeded(false), { enabled: false }))!.status).toBe(404);
});

test('the path is the switch\'s alone: it is never read as an incident, and an incident\'s routes are unchanged', async () => {
    const s = seeded(), id = s.incidents.list()[0].id;
    expect((await call(s, `${PATH}/events`))!.status).toBe(404);
    expect((await call(s, `/api/incidents/${id}`))!.status).toBe(200);
    expect((await call(s, '/api/incidents'))!.status).toBe(200);
});

test('one incident states how each bound subject stands once its fix is found in the running release, and nothing before', async () => {
    const s = seeded(), observed = s.incidents.list()[0], [one, two] = observed.subjects.map(repairSubject);
    const read = async () => (await (await call(s, `/api/incidents/${observed.id}`))!.json()) as { incident: Incident; resumes: unknown };
    expect((await read()).resumes).toBeNull();
    const release = { commit: 'c'.repeat(40), hash: 'h'.repeat(64), operation: 'op-1', activatedAt: later(5).toISOString() };
    const deployed: Incident = { ...observed, state: 'deployed', revision: observed.revision + 1, fixes: [{ event: 'cli-bind-1', commit: 'b'.repeat(40), pullRequest: null, onMain: true, boundAt: later(2).toISOString(),
        bindings: [{ ...one, disposition: 'route', route: { action: 'reconcile-review', payload: { key: 'GH-12' }, expectedStage: 'review' }, boundary: { kind: 'record-settled' } }, { ...two, disposition: 'no-route', reason: 'fixed by hand' }],
        deployed: { event: 'e-deployed', release, at: later(6).toISOString() } }] };
    s.incidents.record({ events: [], incidents: [deployed] });
    const before = state(s);
    expect((await read()).resumes).toEqual({ fix: 'cli-bind-1', commit: 'b'.repeat(40), release, subjects: [
        { subject: 'brain/delivery/job-1', standing: 'held', reason: 'Automatic repair resumes are paused: Automatic repair resumes have never been enabled.', action: 'reconcile-review' },
        { subject: 'brain/delivery/job-2', standing: 'no-route', reason: 'The fix declared no route: fixed by hand' },
    ] });
    // Reading it wrote nothing: not the ledger, not the switch.
    expect(state(s)).toBe(before);
    // The reading follows the switch, and then the ledger's own record of an admission.
    s.resumes.enable(0, 'go', later(7));
    expect(((await read()).resumes as { subjects: { standing: string }[] }).subjects.map(subject => subject.standing)).toEqual(['due', 'no-route']);
    s.incidents.record({ events: [{ id: eventId(observed.id, 'resume-admitted', resumeIdentity(observed.id, 'brain/delivery/job-1', 'cli-bind-1')), incident: observed.id, at: later(8).toISOString(), kind: 'resume-admitted', body: { subject: 'brain/delivery/job-1' } }], incidents: [] });
    expect(((await read()).resumes as { subjects: { standing: string }[] }).subjects.map(subject => subject.standing)).toEqual(['admitted', 'no-route']);
});
