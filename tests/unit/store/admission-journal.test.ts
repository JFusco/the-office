import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Effects } from '../../../server/store/effects';
import { enqueueRequest } from '../../../server/scheduling/requests';
import { admissionCursor, admissionsSince } from '../../../server/store/admission-journal';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import { officeCapacity } from '../../../server/office/projects';
import type { OfficeSnapshot } from '../../../src/shared';
import { savedState, savedStateText } from './saved-state';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.db.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
function root() { const path = mkdtempSync(resolve(tmpdir(), 'office-admissions-')); roots.push(path); return path; }
function store(path = ':memory:', id = 'cms-field-vocabulary') { const dir = root(); const s = new Store(path === ':memory:' ? path : resolve(dir, path), projectById(id), dir); s.state.coordination ??= coordination(); stores.push(s); return s; }
const kinds = (s: Store, since = 0) => admissionsSince(s.db, since).map(row => [row.kind, row.ref]);

test('a scheduler claim journals exactly once, and a refused duplicate claim journals nothing', () => {
    const s = store(), work = { projectId: s.project.id, kind: 'issue' as const, id: 'GH-1' };
    const before = admissionCursor(s.db);
    const claim = s.claimWork(work, 'owner', 'implement')!;
    expect(s.claimWork(work, 'owner', 'implement')).toBeNull();
    expect(kinds(s, before)).toEqual([['claim', claim.id]]);
});

test('a new effect intent journals once; replaying the saved intent journals nothing more', async () => {
    const s = store(), effects = new Effects(s);
    const operation = { id: 'effect-1', work: { projectId: s.project.id, kind: 'issue' as const, id: 'GH-2' }, attemptId: 'a1', operation: 'github-comment', target: 'JFusco/x', authorization: 'test', payload: {}, expectedState: null, preflight: async () => {}, dispatch: async () => ({ ok: true }), verify: async () => true };
    const before = admissionCursor(s.db);
    await effects.execute(operation);
    await effects.execute(operation);
    expect(kinds(s, before)).toEqual([['effect', 'effect-1']]);
});

test('a harness request journals once in the same transaction; a deduplicated enqueue journals nothing', () => {
    const s = store(), before = admissionCursor(s.db);
    const request = enqueueRequest(s, 'refresh');
    expect(enqueueRequest(s, 'refresh').id).toBe(request.id);
    expect(kinds(s, before)).toEqual([['request', request.id]]);
});

test('a delivery request journals once; the deduplicated repeat journals nothing', () => {
    const s = store(':memory:', 'cec'), engine = new Engine(s, officeCapacity());
    s.state.tickets.push({ key: 'CEC-999', summary: 'Synthetic journal fixture', type: 'Bug', status: 'To Do', statusId: '10000', assignee: 'office-account', subtask: false, boardMember: true, url: '', updated: '', stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: '' } as any);
    const before = admissionCursor(s.db);
    const request = engine.requestDelivery('CEC-999', 'start-pilot');
    expect(engine.requestDelivery('CEC-999', 'start-pilot').id).toBe(request.id);
    expect(kinds(s, before)).toEqual([['delivery', request.id]]);
});

test('a failed enqueue save rolls back the request and its admission before a successful retry', () => {
    const s = store('office.sqlite'), before = admissionCursor(s.db);
    const persistedRequests = () => {
        return savedState(s).coordination?.requests ?? [];
    };
    const save = s.save.bind(s);
    vi.spyOn(s, 'save').mockImplementationOnce(() => {
        save();
        throw new Error('Injected state save failure');
    });

    expect(() => enqueueRequest(s, 'refresh')).toThrow('Injected state save failure');
    expect(s.state.coordination?.requests ?? []).toEqual([]);
    expect(persistedRequests()).toEqual([]);
    expect(admissionCursor(s.db)).toBe(before);

    const request = enqueueRequest(s, 'refresh');
    expect(s.state.coordination?.requests).toEqual([request]);
    expect(persistedRequests()).toEqual([request]);
    expect(kinds(s, before)).toEqual([['request', request.id]]);
});

test('the cursor is monotonic and survives reopening the store', () => {
    const dir = root(), path = resolve(dir, 'office.sqlite'), project = projectById('cms-field-vocabulary');
    const first = new Store(path, project, dir);
    first.state.coordination ??= coordination();
    enqueueRequest(first, 'refresh');
    const cursor = admissionCursor(first.db);
    expect(cursor).toBeGreaterThan(0);
    first.db.close();
    const reopened = new Store(path, project, dir); stores.push(reopened);
    expect(admissionCursor(reopened.db)).toBe(cursor);
    enqueueRequest(reopened, 'poll');
    expect(admissionCursor(reopened.db)).toBe(cursor + 1);
    expect(admissionsSince(reopened.db, cursor).map(row => row.kind)).toEqual(['request']);
});

test('journaling adds no state save: one enqueue and one claim save exactly as often as before the journal', () => {
    const s = store(), save = vi.spyOn(s, 'save');
    enqueueRequest(s, 'refresh');
    expect(save).toHaveBeenCalledTimes(1);
    save.mockClear();
    s.claimWork({ projectId: s.project.id, kind: 'issue', id: 'GH-9' }, 'owner', 'implement');
    expect(save).toHaveBeenCalledTimes(1);
    const body = savedStateText(s)!;
    expect(body).not.toContain('"admissions"');
});
