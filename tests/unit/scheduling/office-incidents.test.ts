import { expect, test } from 'vitest';
import { resolve } from 'node:path';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { PROJECTS, projectData } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { Offices } from '../../../server/scheduling/offices';
import { admissionCursor } from '../../../server/store/admission-journal';
import { ControlStore } from '../../../server/store/control-store';
import { Store } from '../../../server/store/store';
import { timeLedger } from '../../../server/time/time-accounting';

const TOKEN = 'deploy-token-0123456789';
const tables = (store: Store) => JSON.stringify((store.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as { name: string }[]).map(({ name }) => [name, store.db.prepare(`SELECT * FROM "${name}"`).all()]));
function close(office: Offices) { office.dispose(); for (const { store } of office.entries.values()) store.close(); office.control.db.close(); }

/** A listener error saved before start-up: a stop the real projection and collectors can see. */
function seedListenerError() {
    const project = PROJECTS.find(project => project.id === 'brain')!, root = projectData(project);
    const store = new Store(resolve(root, 'office.sqlite'), project, root);
    // With a time ledger, so the operations projection reads hours and cost as it does in service.
    try { store.state.coordination ??= coordination(); store.state.coordination.listener.error = 'Error: GitHub returned 502 for project 8'; timeLedger(store); store.save(); }
    finally { store.close(); }
}

/** The real constructor against this test file's own data root, with the real scheduler projection of every lane. */
test('an Office under a held fence observes nothing and leaves the ledger empty', () => {
    seedListenerError();
    const prior = new ControlStore();
    new DeploymentFence(prior.db).acquire(TOKEN, 'release x');
    prior.db.close();
    const office = new Offices();
    try {
        expect(office.observeIncidents()).toBeUndefined();
        expect(office.incidents.list()).toEqual([]);
        // Not even the tables: a fenced start leaves the control database's schema as it found it.
        expect(office.control.db.prepare("SELECT name FROM sqlite_master WHERE name LIKE 'incident%'").all()).toEqual([]);
        office.fence.release(TOKEN);
    } finally { close(office); }
});

test('an open Office records what is stopped, changes no project store and admits nothing', () => {
    seedListenerError();
    const office = new Offices();
    try {
        const before = [...office.stores().values()].map(store => ({ tables: tables(store), memory: JSON.stringify(store.state), cursor: admissionCursor(store.db) }));
        const now = new Date('2026-11-20T12:00:00.000Z'), change = office.observeIncidents(now);
        const listener = office.incidents.list().find(incident => incident.cause.source === 'provider-error');
        expect(listener).toMatchObject({ state: 'observed', cause: { stage: 'assignment-listener', text: 'github returned 502 for project <n>' }, research: { eligible: true }, subjects: [{ projectId: 'brain', kind: 'provider', id: 'assignment-listener', status: 'open' }] });
        expect(change?.events.length).toBeGreaterThan(0);
        expect([...office.stores().values()].map(store => ({ tables: tables(store), memory: JSON.stringify(store.state), cursor: admissionCursor(store.db) }))).toEqual(before);
        // Unchanged, a second pass writes nothing.
        expect(office.observeIncidents(new Date('2026-11-20T12:01:00.000Z'))).toEqual({ events: [], incidents: [] });
    } finally { close(office); }
});
