import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { azureBinding } from '../../../server/office/project-bindings';
import type { AzureBinding } from '../../../server/office/project-bindings-config';
import { AzureMonitor } from '../../../server/cec/azure';
import * as processTools from '../../../server/workers/process';

const configured = vi.hoisted(() => ({ deployment: undefined as Record<string, string> | undefined }));
vi.mock('../../../server/office/project-bindings', async original => {
    const actual = await original<typeof import('../../../server/office/project-bindings')>();
    return { ...actual, azureBinding: (...args: Parameters<typeof actual.azureBinding>) => {
        const binding = actual.azureBinding(...args);
        return configured.deployment ? { ...binding, deployment: { ...binding.deployment, ...configured.deployment } } : binding;
    } };
});

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })); configured.deployment = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function poll(health: () => Response) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-azure-deployment-')); roots.push(root);
    const store = new Store(':memory:', projectById('cec'), root); stores.push(store);
    const deployment: AzureBinding['deployment'] = azureBinding(store.project).deployment;
    const command = vi.spyOn(processTools, 'command').mockImplementation(async (_program, args) => {
        if (args[0] === 'containerapp' && args.includes('revision')) return JSON.stringify({ containers: [{ name: 'sidecar', image: 'sidecar:1' }, { name: deployment.container, image: 'image:no-build' }] });
        if (args[0] === 'containerapp') return JSON.stringify({ revision: 'ready', latest: 'ready', fqdn: 'app.example', traffic: [{ weight: 100, revisionName: 'ready' }] });
        return '[]';
    });
    const fetched = vi.fn(async (_url: string) => health());
    vi.stubGlobal('fetch', fetched);
    await new AzureMonitor(store).poll();
    const shown = command.mock.calls.map(([, args]) => args).filter(args => args[0] === 'containerapp');
    return { deployment, shown, url: fetched.mock.calls[0]?.[0], azure: store.state.azure };
}
const cos = (body: unknown, status = 200) => () => new Response(JSON.stringify(body), { status });

test('the deployment is read from the project binding: app, container, environment and health path', async () => {
    const { deployment, shown, url, azure } = await poll(cos({ status: 'ok', persistence: { ok: true }, dbos: { ok: true } }));
    expect(shown).toHaveLength(2);
    for (const args of shown)
        expect(args.slice(args.indexOf('--subscription'), args.indexOf('--subscription') + 6)).toEqual(['--subscription', deployment.subscription, '--resource-group', deployment.resourceGroup, '--name', deployment.containerApp]);
    expect(url).toBe(`https://app.example${deployment.healthPath}`);
    expect(azure.error).toBe('');
    expect(azure.deployed).toMatchObject([{ environment: deployment.environment, image: 'image:no-build', revision: 'ready', healthy: true }]);
});

test('the cos contract still needs the service, persistence and DBOS to report ok', async () => {
    expect((await poll(cos({ status: 'ok', persistence: { ok: true }, dbos: { ok: false } }))).azure.deployed[0].healthy).toBe(false);
    expect((await poll(cos({ status: 'ok', persistence: { ok: true }, dbos: { ok: true } }, 503))).azure.deployed[0].healthy).toBe(false);
    // A 2xx that is not the COS health document is not a refreshed observation at all.
    const plain = await poll(() => new Response('OK', { status: 200 }));
    expect(plain.azure.error).toContain('Running staging version not refreshed');
    expect(plain.azure.deployed).toEqual([]);
});

test('the http-ok contract passes on a 2xx without reading JSON and uses its own deployment values', async () => {
    configured.deployment = { environment: 'uat', subscription: 'sub-1', resourceGroup: 'rg-1', containerApp: 'app-1', container: 'web', healthPath: '/healthz', healthy: 'http-ok' };
    const passed = await poll(() => new Response('OK', { status: 200 }));
    expect(passed.shown[0].slice(passed.shown[0].indexOf('--subscription'), passed.shown[0].indexOf('--subscription') + 6)).toEqual(['--subscription', 'sub-1', '--resource-group', 'rg-1', '--name', 'app-1']);
    expect(passed.url).toBe('https://app.example/healthz');
    expect(passed.azure.error).toBe('');
    expect(passed.azure.deployed).toMatchObject([{ environment: 'uat', image: 'image:no-build', healthy: true }]);
    expect((await poll(() => new Response('unavailable', { status: 503 }))).azure.deployed[0].healthy).toBe(false);
});
