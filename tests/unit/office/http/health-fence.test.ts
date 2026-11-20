import { afterEach, expect, test } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { apiRoute } from '../../../../server/office/http/api-routes';
import { DeploymentFence } from '../../../../server/office/deployment-fence';
import { InFlightOperations } from '../../../../server/office/in-flight-operations';
import { officeCapacity } from '../../../../server/office/projects';

const dbs: DatabaseSync[] = [];
afterEach(() => dbs.splice(0).forEach(db => db.close()));
/** An idle office with no projects: only the fence, Ellis's tick and in-flight operations can change health. */
function context() {
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    const offices = { fence: new DeploymentFence(db), operations: new InFlightOperations(), capacity: officeCapacity(), entries: new Map(), serviceInstanceId: 'instance', control: { summaries: () => [] }, stores: () => new Map() };
    const itSpecialist = { running: false };
    const store = { state: { startedAt: '2026-11-19T20:00:00.000Z', paused: false }, project: { id: 'cec' } };
    return { offices, itSpecialist, context: { offices, itSpecialist, loadedRevision: { hash: 'h' }, store, engine: { features: {} }, project: 'cec' } as any };
}
async function health(ctx: any) { const url = new URL('http://127.0.0.1:4318/api/health'); return (await apiRoute(new Request(url), url, ctx))!.json(); }

test('health reports the fence, and busy while Ellis is mid-tick or an operation is in flight', async () => {
    const { offices, itSpecialist, context: ctx } = context();
    expect(await health(ctx)).toMatchObject({ busy: false, fence: { status: 'open' } });
    offices.fence.acquire('deploy-token-0123456789', 'release x');
    expect(await health(ctx)).toMatchObject({ busy: false, fence: { status: 'held', deployment: 'release x' } });
    itSpecialist.running = true;
    expect((await health(ctx)).busy).toBe(true);
    itSpecialist.running = false;
    const end = offices.operations.begin();
    expect((await health(ctx)).busy).toBe(true);
    end();
    expect((await health(ctx)).busy).toBe(false);
});

test('health names the release it runs, or why it cannot, beside everything it reported before', async () => {
    const answer = await health(context().context);
    // A test process does not run from a release directory.
    expect(answer.release).toEqual({ status: 'unknown', reason: 'the service does not run from a release directory of its data root' });
    expect(answer).toMatchObject({ ok: true, loadedHash: 'h', serviceInstanceId: 'instance', busy: false, fence: { status: 'open' }, mode: 'running', projects: [] });
    for (const field of ['startedAt', 'readiness', 'dailyCTO', 'pid', 'uptime']) expect(answer).toHaveProperty(field);
});
