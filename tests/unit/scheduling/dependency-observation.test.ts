import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Coordinator } from '../../../server/scheduling/coordination';
import { projectById } from '../../../server/office/projects';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const prerequisite = { target: { projectId: 'brain', kind: 'pr', id: '117' }, condition: 'pr-merged', evidence: 'Synthetic' } as any;
function coordinator() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-deps-')), store = new Store(':memory:', projectById('brain'), root);
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    const c = new Coordinator(store, new Engine(store));
    c.activate(new Date('2026-10-31T00:00:00Z'));
    c.state.listener.nextCheckAt = '2099-01-01T00:00:00Z';
    return c;
}
const observations = (c: Coordinator) => (c.state.requests || []).filter(r => r.action === 'observe-dependencies');
test('finished or cancelled work does not trigger dependency observation', async () => {
    const c = coordinator();
    c.state.jobs = [{ id: 'old', key: 'GH-100', status: 'cancelled', stage: 'prepare-pr', prerequisites: [prerequisite], steps: [] } as any];
    c.state.listener.reviews.push({ id: 'r', key: 'GH-1', status: 'ready', prerequisites: [prerequisite] } as any);
    await c.tick(new Date('2026-10-31T00:01:00Z'));
    expect(observations(c)).toHaveLength(0);
});
test('live work with prerequisites still triggers dependency observation', async () => {
    const c = coordinator();
    c.state.jobs = [{ id: 'live', key: 'GH-2', status: 'queued', stage: 'implement', prerequisites: [prerequisite], steps: [] } as any];
    await c.tick(new Date('2026-10-31T00:01:00Z'));
    expect(observations(c)).toHaveLength(1);
});
