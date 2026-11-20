import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { groupCandidates } from '../../../server/incidents/candidates';
import { IncidentLedger } from '../../../server/incidents/incident-ledger';
import { planSync } from '../../../server/incidents/plan-sync';
import { incidentsRoute } from '../../../server/incidents/routes';
import { AT, candidate, later } from './incident-fixture';

const WAIT = { expected: 'provider-wait' as const, cause: { source: 'stopped-work' as const, provider: 'github', stage: 'merge', kind: 'provider-checks', text: 'checks are running', author: 'harness' as const } };
const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
function seeded() {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const incidents = new IncidentLedger(db);
    incidents.record(planSync([], groupCandidates([candidate({ id: 'job-1' }), candidate({ id: 'job-2' }, WAIT)]), AT));
    incidents.record(planSync(incidents.list(), groupCandidates([candidate({ id: 'job-2' }, WAIT)]), later(1)));
    return { offices: { incidents } };
}
const call = (context: ReturnType<typeof seeded>, path: string, method = 'GET') => incidentsRoute(new Request(`http://127.0.0.1${path}`, { method }), new URL(`http://127.0.0.1${path}`), context);

test('other paths pass through', async () => {
    expect(await call(seeded(), '/api/health')).toBeUndefined();
    expect(await call(seeded(), '/api/incidentsx')).toBeUndefined();
});

test('the list returns every incident, or only open ones, or only those eligible for research', async () => {
    const context = seeded();
    const list = async (query = '') => ((await (await call(context, `/api/incidents${query}`))!.json()) as { incidents: { expected: string | null }[] }).incidents.map(i => i.expected).sort();
    expect(await list()).toEqual([null, 'provider-wait']);
    expect(await list('?open=1')).toEqual(['provider-wait']);
    // The unexplained stop cleared, so nothing is eligible for research now.
    expect(await list('?research=1')).toEqual([]);
    context.offices.incidents.record(planSync(context.offices.incidents.list(), groupCandidates([candidate({ id: 'job-2' }, WAIT), candidate({ id: 'job-3' })]), later(2)));
    expect(await list('?research=1')).toEqual([null]);
    expect(await list('?open=1&research=1')).toEqual([null]);
});

test('one incident is returned with its event history; an unknown or malformed ID is not found', async () => {
    const context = seeded(), id = context.offices.incidents.list().find(i => i.expected === null)!.id;
    const response = await call(context, `/api/incidents/${id}`);
    expect(response!.status).toBe(200);
    const body = await response!.json() as { incident: { id: string }; events: { kind: string }[] };
    expect(body.incident.id).toBe(id);
    expect(body.events.map(e => e.kind)).toEqual(['incident-observed', 'subject-observed', 'research-promoted', 'subject-cleared', 'research-withdrawn']);
    expect((await call(context, '/api/incidents/inc-ffffffffffffffff'))!.status).toBe(404);
    expect((await call(context, '/api/incidents/..%2Fhealth'))!.status).toBe(404);
    expect((await call(context, '/api/incidents/%E0%A4%A'))!.status).toBe(404);
});

test('the routes are read-only', async () => {
    const context = seeded(), before = JSON.stringify(context.offices.incidents.list());
    for (const method of ['POST', 'PUT', 'DELETE']) expect((await call(context, '/api/incidents', method))!.status).toBe(405);
    expect((await call(context, `/api/incidents/${context.offices.incidents.list()[0].id}`, 'POST'))!.status).toBe(405);
    expect(JSON.stringify(context.offices.incidents.list())).toBe(before);
});
