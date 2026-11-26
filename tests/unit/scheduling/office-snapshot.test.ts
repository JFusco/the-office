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
    // An empty control database: no runner incident and no halt report, so no notices.
    value.incidents = { get: () => null } as never;
    value.runnerReports = { halt: () => null } as never;
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

test('the Overseer runner\'s notices appear once in every project\'s served outbox and count, even under a fence, and saved copies never show', async () => {
    const { DatabaseSync } = await import('node:sqlite');
    const { IncidentLedger } = await import('../../../server/incidents/incident-ledger');
    const { RunnerReports } = await import('../../../server/incidents/runner-reports');
    const { recordRunnerFailure, RUNNER_INCIDENT } = await import('../../../server/incidents/record-runner-failure');
    const value = office(), db = new DatabaseSync(':memory:');
    value.incidents = new IncidentLedger(db);
    value.runnerReports = new RunnerReports(db);
    const episode = '00000000-0000-4000-8000-0000000000aa', at = new Date('2026-11-26T12:00:00.000Z');
    recordRunnerFailure(value.incidents, { version: 1, id: `overseer:service-down:${episode}`, kind: 'service-down', at: '2026-11-26T11:00:00.000Z', episode, detail: 'fetch failed', evidence: {} }, at);
    value.runnerReports.recordHalt({ version: 1, sequence: 1, kind: 'stopped', control: 'STOP.json', reason: 'STOP: journal damaged', since: '2026-11-26T11:59:00.000Z', pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:00:00.000Z' }, at);
    const ids = [`overseer-incident:${RUNNER_INCIDENT}`, 'overseer-stopped'];
    // A project whose saved outbox holds shadows of both, as an older release could have left it.
    const shadow = (id: string) => ({ id, title: id, detail: '', role: 'it', ticket: '', url: '', status: 'resolved', createdAt: at.toISOString(), updatedAt: at.toISOString() });
    value.get('brain').store.state.outbox = ids.map(shadow) as never;
    const savedBefore = JSON.stringify(value.get('brain').store.state);
    for (const fenced of [false, true]) {
        vi.spyOn(value, 'fenced').mockReturnValue(fenced);
        for (const project of ['brain', 'cms-field-vocabulary']) {
            const snapshot = value.snapshot(project) as unknown as { outbox: { id: string; status: string }[]; projects: { id: string; needsYou: number }[] };
            expect(snapshot.outbox.filter(item => ids.includes(item.id)).map(item => [item.id, item.status])).toEqual(ids.map(id => [id, 'open']));
            expect(snapshot.projects.map(summary => summary.needsYou)).toEqual([2, 2]);
            expect(value.summaries().map(summary => summary.needsYou)).toEqual([2, 2]);
        }
    }
    expect(JSON.stringify(value.get('brain').store.state)).toBe(savedBefore);
    // A reply to a notice is refused: it is in no project's own outbox.
    expect(() => value.get('cms-field-vocabulary').conversations.enqueue({ id: crypto.randomUUID(), body: 'done', actionId: 'overseer-stopped', ticket: '' })).toThrow('Outbox item does not match');
    expect(() => value.get('brain').conversations.enqueue({ id: crypto.randomUUID(), body: 'done', actionId: 'overseer-stopped', ticket: '' })).toThrow('already resolved');
    // Once the outage is restored and the runner reports itself running, neither shows, and no saved copy appears.
    recordRunnerFailure(value.incidents, { version: 1, id: `overseer:service-restored:${episode}`, kind: 'service-restored', at: '2026-11-26T12:05:00.000Z', episode, detail: '', evidence: {} }, at);
    value.runnerReports.recordHalt({ version: 1, sequence: 2, kind: 'running', control: null, reason: '', since: null, pass: '7b0c6a43-62f8-4a49-9f11-8d1b2f6ad0c4', reportedAt: '2026-11-26T12:06:00.000Z' }, at);
    const cleared = value.snapshot('brain') as unknown as { outbox: { id: string }[]; projects: { needsYou: number }[] };
    expect(cleared.outbox.filter(item => ids.includes(item.id))).toEqual([]);
    expect(cleared.projects.map(summary => summary.needsYou)).toEqual([0, 0]);
    db.close();
});
