import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Offices } from '../../../server/scheduling/offices';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { Coordinator } from '../../../server/scheduling/coordination';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { enqueueRequest } from '../../../server/scheduling/requests';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { InFlightOperations } from '../../../server/office/in-flight-operations';
import { admissionCursor } from '../../../server/store/admission-journal';
import { initializeLanes } from '../../fixtures/scheduler';

const TOKEN = 'deploy-token-0123456789';
const stores: Store[] = [], roots: string[] = [], dbs: DatabaseSync[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(s => s.close()); dbs.splice(0).forEach(db => db.close()); roots.splice(0).forEach(r => rmSync(r, { recursive: true, force: true })); });
function offices() {
    const office = Object.create(Offices.prototype) as Offices;
    office.capacity = officeCapacity(1);
    initializeLanes(office);
    office.entries = new Map();
    office.sessions = new SessionBridge(() => [...office.entries.values()].map(e => e.store));
    const db = new DatabaseSync(':memory:'); dbs.push(db);
    office.fence = new DeploymentFence(db);
    for (const id of ['cec', 'cms-field-vocabulary']) {
        const root = mkdtempSync(resolve(tmpdir(), 'office-fenced-')); roots.push(root);
        const s = new Store(':memory:', projectById(id), root); stores.push(s);
        const engine = new Engine(s, office.capacity);
        office.entries.set(id, { store: s, engine, conversations: new Conversations(s, engine, s.dataRoot), coordinator: new Coordinator(s, engine) });
    }
    return office;
}
function ticket(s: Store, key = 'CEC-999') {
    const t = { key, summary: 'Synthetic fence fixture', type: 'Bug', status: 'To Do', statusId: '10000', assignee: 'office-account', subtask: false, boardMember: true, url: '', updated: '', stage: 'mailbox' as const, activity: 'waiting' as const, blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' };
    s.state.tickets.push(t);
    return t;
}
const cursors = (office: Offices) => [...office.entries.values()].map(e => admissionCursor(e.store.db));
const claimRows = (office: Offices) => [...office.entries.values()].reduce((n, e) => n + Number((e.store.db.prepare('SELECT COUNT(*) AS n FROM work_claims').get() as { n: number }).n), 0);

test('a fenced office claims nothing and admits nothing across repeated pumps and ticks', async () => {
    const office = offices(), cec = office.get('cec');
    ticket(cec.store);
    let observed = 0, delivered = 0;
    cec.engine.observe = async () => { observed++; };
    cec.engine.startPilot = async () => { delivered++; };
    // Work queued before the deployment took the fence stays queued, unclaimed.
    const refresh = enqueueRequest(cec.store, 'refresh');
    const pilot = cec.engine.requestDelivery('CEC-999', 'start-pilot');
    office.fence.acquire(TOKEN, 'release x');
    const before = cursors(office);
    const coordinatorTick = vi.spyOn(Coordinator.prototype, 'tick');
    for (let i = 0; i < 5; i++) { await office.pump(); await office.tick(); }
    expect(claimRows(office)).toBe(0);
    expect(cursors(office)).toEqual(before);
    expect([observed, delivered]).toEqual([0, 0]);
    expect([refresh.status, pilot.status]).toEqual(['queued', 'queued']);
    expect(coordinatorTick).not.toHaveBeenCalled();
});

test('releasing the fence lets the queued work run, once', async () => {
    const office = offices(), cec = office.get('cec');
    let observed = 0;
    cec.engine.observe = async () => { observed++; };
    office.fence.acquire(TOKEN, 'release x');
    const refresh = enqueueRequest(cec.store, 'refresh');
    await office.pump();
    expect(observed).toBe(0);
    office.fence.release(TOKEN);
    await office.pump();
    await office.pump();
    expect(observed).toBe(1);
    expect(refresh.status).toBe('completed');
});

test('a stopping worker is still settled while fenced, so owned work drains', async () => {
    const office = offices(), cms = office.get('cms-field-vocabulary'), store = cms.store;
    const claim = store.claimWork({ projectId: store.project.id, kind: 'issue', id: 'GH-1' }, 'owner', 'implement')!;
    store.state.workLog = [{ id: 'w1', role: 'developer', stage: 'implement', ticket: 'GH-1', status: 'stopping', processId: 2 ** 22 + 12345, claimId: claim.id, startedAt: new Date().toISOString(), elapsedMs: 0 } as any];
    vi.spyOn(process, 'kill').mockImplementation(() => { throw Object.assign(new Error('gone'), { code: 'ESRCH' }); });
    office.fence.acquire(TOKEN, 'release x');
    await office.pump();
    expect(store.state.workLog![0].status).toBe('interrupted');
    expect(store.activeClaims()).toEqual([]);
});

test('fixtures without a fence object stay unfenced', () => {
    const office = offices();
    (office as { fence?: DeploymentFence }).fence = undefined;
    expect(office.fenced()).toBe(false);
});

test('a tick that began before the fence was taken is counted in flight until it ends', async () => {
    const office = offices();
    office.operations = new InFlightOperations();
    office.dailyCTO = { pending: () => undefined, collect: () => undefined } as any;
    let release!: () => void;
    office.sessions.refresh = () => new Promise<void>(done => { release = done; }) as any;
    const tick = office.tick();
    office.fence.acquire(TOKEN, 'release x');
    expect(office.operations.count).toBe(1);
    release(); await tick;
    expect(office.operations.count).toBe(0);
    // A tick that starts while fenced registers nothing.
    await office.tick();
    expect(office.operations.count).toBe(0);
});
