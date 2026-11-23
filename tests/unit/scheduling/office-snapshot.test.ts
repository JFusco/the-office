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

const job = (id: string, key: string) => ({ id, key, requestedAt: '2026-11-22T10:00:00Z', status: 'queued', stage: 'implement', detail: 'Queued', head: 'a'.repeat(40), worktree: '', branch: '', pr: 0, prUrl: '', steps: [] }) as never;

test('a snapshot computes each project\'s queue once and reports it in both places it appears', () => {
    const value = office();
    value.get('brain').store.state.coordination!.jobs = [job('brain-1', 'GH-1')];
    value.get('cms-field-vocabulary').store.state.coordination!.jobs = [job('cms-1', 'GH-2'), job('cms-2', 'GH-3')];
    const projection = vi.spyOn(value, 'projection');
    const snapshot = value.snapshot('brain') as unknown as { progression: { work: { projectId: string; id: string } }[]; projects: { id: string; queued: number; working: number }[] };
    expect(projection).toHaveBeenCalledTimes(2);
    expect(projection.mock.calls.map(([entry]) => entry.store.project.id)).toEqual(['brain', 'cms-field-vocabulary']);
    projection.mockRestore();
    // Each project's own work, in project order: the queues differ, so a mix-up between projects would show.
    const jobs = (project: string) => snapshot.progression.filter(item => item.work.projectId === project && /^(brain|cms)-\d$/.test(item.work.id)).map(item => item.work.id);
    expect(jobs('brain')).toEqual(['brain-1']);
    expect(jobs('cms-field-vocabulary')).toEqual(['cms-1', 'cms-2']);
    // The same figures as computing them separately, as before.
    expect(snapshot.projects).toEqual(value.summaries());
    expect(snapshot.progression.map(item => `${item.work.projectId}:${item.work.id}`)).toEqual([...value.entries.values()].flatMap(entry => value.projection(entry)).map(item => `${item.work.projectId}:${item.work.id}`));
});

test('project summaries on their own still compute each project\'s queue', () => {
    const value = office(), projection = vi.spyOn(value, 'projection');
    expect(value.summaries().map(project => project.id)).toEqual(['brain', 'cms-field-vocabulary']);
    expect(projection).toHaveBeenCalledTimes(2);
});
