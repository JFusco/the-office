import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { controllerEffects, DEPLOY_PROJECT } from '../../../server/release/controller-effects';
import { PROJECTS } from '../../../server/office/projects';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));

test('the controller keeps its effects in its own store under deployments/, for a project the Office does not deliver', async () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-controller-effects-')); roots.push(root);
    expect(PROJECTS.some(project => project.id === DEPLOY_PROJECT.id)).toBe(false);
    const first = controllerEffects(root);
    const operation = {
        id: 'deploy-x:stop', work: { projectId: DEPLOY_PROJECT.id, kind: 'maintenance' as const, id: 'deploy-x' }, attemptId: 'deploy-x', operation: 'deploy-stop',
        target: 'service', authorization: 'test', payload: {}, expectedState: null, preflight: async () => {}, dispatch: async () => ({ n: 1 }), verify: async () => true,
    };
    expect(await first.effects.execute(operation)).toEqual({ n: 1 });
    first.close();
    expect(readdirSync(root)).toEqual(['deployments']);
    // A restarted controller finds the saved effect and does not dispatch it again.
    const second = controllerEffects(root);
    expect(await second.effects.execute({ ...operation, dispatch: async () => { throw new Error('dispatched twice'); } })).toEqual({ n: 1 });
    second.close();
});
