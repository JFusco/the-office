import { expect, test, vi } from 'vitest';
import { resolve } from 'node:path';
import { createFeature, featureById } from '../../../server/features/commands';
import { stageBudget } from '../../../server/features/progression/attempt-budget';
import { beginReader } from '../../../server/features/reader-attempts';
import { PROJECTS, projectData } from '../../../server/office/projects';
import { Offices } from '../../../server/scheduling/offices';
import { ControlStore } from '../../../server/store/control-store';
import { DeploymentFence } from '../../../server/office/deployment-fence';
import { Coordinator } from '../../../server/scheduling/coordination';
import { admissionCursor } from '../../../server/store/admission-journal';
import { Store } from '../../../server/store/store';

const TOKEN = 'deploy-token-0123456789';

function admissionState(store: Store) {
    return {
        project: store.project.id,
        cursor: admissionCursor(store.db),
        claims: store.db.prepare('SELECT id FROM work_claims ORDER BY id').all(),
        effects: store.db.prepare('SELECT id FROM effects ORDER BY id').all(),
        requests: (store.state.coordination?.requests ?? []).map(request => request.id).sort(),
        deliveries: (store.state.deliveryQueue ?? []).map(request => request.id).sort(),
    };
}

function seedStartup() {
    const stores = PROJECTS.map(project => {
        const root = projectData(project);
        return new Store(resolve(root, 'office.sqlite'), project, root);
    });
    try {
        const store = stores.find(store => store.project.id === 'brain')!;
        const feature = createFeature(store, { action: 'create', requestId: 'create', title: 'Search', intent: 'Find content' });
        feature.baseline = { path: store.dataRoot, repository: store.project.repository, sha: 'base', ref: 'main', scope: [], files: {} };
        const budget = structuredClone(stageBudget(feature, feature.phase));
        const reader = beginReader(store, feature);
        return { admissions: stores.map(admissionState), featureId: feature.id, readerId: reader.id, attemptCount: feature.attempts.length, budget };
    } finally {
        for (const store of stores) store.close();
    }
}

/**
 * The real constructor, against this test file's own data root: a release that starts while a deployment
 * still holds the fence must come up fenced and admit nothing until the fence is released.
 */
test('an Office started with a persisted fence comes up fenced and admits nothing across pumps and ticks', async () => {
    const prior = new ControlStore();
    new DeploymentFence(prior.db).acquire(TOKEN, 'release x');
    prior.db.close();
    const before = seedStartup();
    const office = new Offices();
    try {
        expect(office.fenced()).toBe(true);
        expect(office.fence.read()).toMatchObject({ status: 'held', deployment: 'release x' });
        const checkState = () => {
            expect([...office.stores().values()].map(admissionState)).toEqual(before.admissions);
            const feature = featureById(office.get('brain').store, before.featureId);
            expect(feature.status).toBe('blocked');
            expect(feature.attempts.find(attempt => attempt.id === before.readerId)?.status).toBe('interrupted');
            expect(feature.attempts).toHaveLength(before.attemptCount);
            expect(feature.recovery).toEqual(before.budget);
        };
        checkState();
        const coordinatorTick = vi.spyOn(Coordinator.prototype, 'tick');
        for (let i = 0; i < 5; i++) { await office.pump(); await office.tick(); }
        checkState();
        expect(coordinatorTick).not.toHaveBeenCalled();
    } finally {
        vi.restoreAllMocks();
        office.dispose();
        for (const { store } of office.entries.values()) store.close();
        office.control.db.close();
    }
});
