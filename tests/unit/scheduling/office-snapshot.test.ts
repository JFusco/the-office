import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Offices } from '../../../server/scheduling/offices';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { Coordinator, coordination } from '../../../server/scheduling/coordination';
import { SessionBridge } from '../../../server/workers/session-bridge';
import { officeCapacity, projectById } from '../../../server/office/projects';
import { enqueueRequest } from '../../../server/scheduling/requests';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
/** An Office of two projects with what a snapshot reads: no control store, preferences or sessions of its own. */
function office() {
    const value = Object.create(Offices.prototype) as Offices;
    value.capacity = officeCapacity(1); value.entries = new Map(); value.serviceInstanceId = crypto.randomUUID(); value.snapshotSequence = 0;
    value.control = { summaries: () => [], knowledge: () => undefined } as never;
    value.preferences = { read: () => ({}) } as never;
    value.sessions = new SessionBridge(() => [...value.entries.values()].map(entry => entry.store));
    for (const id of ['brain', 'cms-field-vocabulary']) {
        const root = mkdtempSync(resolve(tmpdir(), 'office-snapshot-')); roots.push(root);
        const store = new Store(':memory:', projectById(id), root); stores.push(store);
        store.state.coordination = { ...coordination(), enabled: true };
        const engine = new Engine(store, value.capacity);
        value.entries.set(id, { store, engine, conversations: new Conversations(store, engine, root), coordinator: new Coordinator(store, engine) });
    }
    return value;
}

test('a snapshot computes each project\'s queue once and reports it in both places it appears', () => {
    const value = office();
    enqueueRequest(value.get('brain').store, 'refresh');
    enqueueRequest(value.get('cms-field-vocabulary').store, 'refresh');
    enqueueRequest(value.get('cms-field-vocabulary').store, 'poll');
    const projection = vi.spyOn(value, 'projection');
    const snapshot = value.snapshot('brain') as unknown as { progression: { work: { projectId: string } }[]; projects: { id: string; queued: number; working: number }[] };
    expect(projection).toHaveBeenCalledTimes(2);
    expect(projection.mock.calls.map(([entry]) => entry.store.project.id)).toEqual(['brain', 'cms-field-vocabulary']);
    projection.mockRestore();
    // The same figures as computing them separately, as before.
    expect(snapshot.projects).toEqual(value.summaries());
    expect(snapshot.progression.map(item => item.work.projectId)).toEqual([...value.entries.values()].flatMap(entry => value.projection(entry)).map(item => item.work.projectId));
    expect(snapshot.projects.map(project => project.id)).toEqual(['brain', 'cms-field-vocabulary']);
});

test('project summaries on their own still compute each project\'s queue', () => {
    const value = office(), projection = vi.spyOn(value, 'projection');
    expect(value.summaries().map(project => project.id)).toEqual(['brain', 'cms-field-vocabulary']);
    expect(projection).toHaveBeenCalledTimes(2);
});
