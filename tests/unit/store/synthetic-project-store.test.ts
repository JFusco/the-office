import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { Effects } from '../../../server/store/effects';
import { DATA } from '../../../server/office/config';
import { PROJECTS } from '../../../server/office/projects';
import type { OfficeProject } from '../../../src/shared';

/**
 * Qualification for a process outside the service (a release controller or repair runner): it needs real
 * Effects persistence for a project the Office does not deliver, without touching any configured project's data.
 */
const roots: string[] = [];
const stores: Store[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.db.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

function tree(root: string): string[] {
    if (!existsSync(root)) return [];
    return readdirSync(root, { recursive: true, encoding: 'utf8' }).map(path => `${path}${statSync(join(root, path)).isDirectory() ? '/' : ''}`).sort();
}
const project: OfficeProject = { id: 'the-office', name: 'The Office', provider: 'github', repo: '/nonexistent/the-office', repository: 'JFusco/the-office', target: 'main' };

test('a Store for a project outside PROJECTS writes its database and data only under the roots it was given', async () => {
    expect(PROJECTS.some(configured => configured.id === project.id)).toBe(false);
    const runner = mkdtempSync(resolve(tmpdir(), 'office-synthetic-store-')); roots.push(runner);
    const before = tree(DATA);
    const store = new Store(resolve(runner, 'office.sqlite'), project, resolve(runner, 'data')); stores.push(store);
    let dispatched = 0;
    const operation = {
        id: 'synthetic:issue:1', work: { projectId: project.id, kind: 'issue' as const, id: 'synthetic-1' }, attemptId: 'a1',
        operation: 'github-issue-create', target: 'JFusco/the-office', authorization: 'qualification', payload: { title: 'x' }, expectedState: null,
        preflight: async () => {}, dispatch: async () => { dispatched++; return { number: 1 }; }, verify: async () => true,
    };
    expect(await new Effects(store).execute(operation)).toEqual({ number: 1 });
    expect(store.getEffect(operation.id)?.status).toBe('verified');
    // The saved intent makes a second execute return its receipt without dispatching again.
    expect(await new Effects(store).execute(operation)).toEqual({ number: 1 });
    expect(dispatched).toBe(1);
    expect(store.state.project?.id).toBe('the-office');
    expect(tree(DATA)).toEqual(before);
    expect(tree(runner).filter(path => !path.startsWith('office.sqlite'))).toEqual(['data/']);
});

test('a Store creates the database folder it was given and never the global DATA, even when DATA is absent', async () => {
    const runner = mkdtempSync(resolve(tmpdir(), 'office-synthetic-store-')); roots.push(runner);
    // DATA is this test file's own temporary root (tests/setup/data-root.ts); it is restored afterwards.
    rmSync(DATA, { recursive: true, force: true });
    try {
        const store = new Store(resolve(runner, 'db/office.sqlite'), project, resolve(runner, 'data')); stores.push(store);
        let dispatched = 0;
        const operation = {
            id: 'synthetic:issue:3', work: { projectId: project.id, kind: 'issue' as const, id: 'synthetic-3' }, attemptId: 'a1',
            operation: 'github-issue-create', target: 'JFusco/the-office', authorization: 'qualification', payload: {}, expectedState: null,
            preflight: async () => {}, dispatch: async () => { dispatched++; return { number: 3 }; }, verify: async () => true,
        };
        expect(await new Effects(store).execute(operation)).toEqual({ number: 3 });
        expect(await new Effects(store).execute(operation)).toEqual({ number: 3 });
        expect(dispatched).toBe(1);
        expect(existsSync(DATA)).toBe(false);
        expect(tree(runner).filter(path => !path.startsWith('db/office.sqlite'))).toEqual(['data/', 'db/']);
    } finally {
        mkdirSync(DATA, { recursive: true, mode: 0o700 });
    }
});

test('the saved intent survives reopening the synthetic Store', async () => {
    const runner = mkdtempSync(resolve(tmpdir(), 'office-synthetic-store-')); roots.push(runner);
    const path = resolve(runner, 'office.sqlite'), dataRoot = resolve(runner, 'data');
    const first = new Store(path, project, dataRoot);
    await new Effects(first).execute({
        id: 'synthetic:issue:2', work: { projectId: project.id, kind: 'issue', id: 'synthetic-2' }, attemptId: 'a1', operation: 'github-issue-create',
        target: 'JFusco/the-office', authorization: 'qualification', payload: {}, expectedState: null,
        preflight: async () => {}, dispatch: async () => ({ number: 2 }), verify: async () => true,
    });
    first.db.close();
    const reopened = new Store(path, project, dataRoot); stores.push(reopened);
    expect(reopened.getEffect('synthetic:issue:2')).toMatchObject({ status: 'verified', receipt: { number: 2 } });
});
