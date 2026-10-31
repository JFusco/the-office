import { afterEach, expect, test, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById, withCECGoalEvidence } from '../../../server/office/projects';
import { collectAzureGoalDocuments, GOAL_EVIDENCE_LIMITS, azurePRDescription, goalEvidencePath } from '../../../server/leadership/goal-evidence';
import { projectPRFacts, goalEvidenceFingerprint } from '../../../server/leadership/goal-reporting';
import { collectCTOFacts } from '../../../server/leadership/cto-collector';
import { localBindings } from '../../../server/office/local-config';
import { AzureMonitor } from '../../../server/cec/azure';
import * as processTools from '../../../server/workers/process';
import { CEC } from '../../../server/office/config';
const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const head = 'a'.repeat(40), prior = 'b'.repeat(40), blob = 'c'.repeat(40), path = '/docs/acceptance.md';
function setup(paths: string[] = [path]) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-goal-evidence-')); roots.push(root);
    const store = new Store(':memory:', { ...projectById('cec'), repository: CEC.repository, goalEvidencePaths: paths }, root, { now: () => new Date('2026-10-30T21:30:00Z'), monotonic: () => 0 }); stores.push(store);
    store.state.azure.observedAt = store.clock.now().toISOString();
    store.state.azure.prs = [{ id: 40978, title: 'Link correction', ...azurePRDescription('29 focused checks; hosted link click remains.'), status: 'completed', draft: false, source: 'topic', target: 'staging', commit: prior, mergeCommit: head, url: 'https://azure.example/cec/pr/40978', policies: [] }];
    store.state.azure.deployed = [{ environment: 'staging', image: 'image:113524', revision: 'revision', url: 'https://staging.example', commit: head, buildId: 113524, healthy: true, observedAt: store.clock.now().toISOString() }];
    return store;
}
const binding = () => ({ projectId: 'cec', repository: CEC.repository, repositoryId: CEC.repositoryId, project: CEC.project });
function answer(args: string[]) { const commit = args.find(value => value.startsWith('versionDescriptor.version='))!.split('=')[1]; return { path, commitId: commit, objectId: blob, content: 'Hosted frame creation and selected-note persistence passed. Ordinary link click remains.' }; }
test('actual Azure poll retains PR bodies and exact-repository document observations before cached CTO projection', async () => {
    const store = setup();
    const command = vi.spyOn(processTools, 'command').mockImplementation(async (_program, args) => {
        if (args[0] === 'repos') return JSON.stringify([{ pullRequestId: 40904, title: 'Hosted acceptance', description: 'Selected note persisted; Bearer private-token', status: 'completed', sourceRefName: 'topic', targetRefName: 'staging', lastMergeSourceCommit: { commitId: prior }, lastMergeCommit: { commitId: head } }]);
        if (args[0] === 'pipelines') return '[]';
        if (args.includes('items')) return JSON.stringify(answer(args));
        if (args.includes('revision')) return JSON.stringify({ containers: [{ name: 'ca-cumulative-os-shell', image: 'image:no-build' }] });
        return JSON.stringify({ revision: 'ready', latest: 'ready', fqdn: 'staging.example', traffic: [{ weight: 100, revisionName: 'ready' }] });
    });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 'ok', persistence: { ok: true }, dbos: { ok: true } }), { status: 200 })));
    await new AzureMonitor(store).poll();
    expect(store.state.azure.prs[0].description).toContain('Selected note persisted');
    expect(store.state.azure.prs[0].description).not.toContain('private-token');
    expect(store.state.azure.goalDocuments![0]).toMatchObject({ projectId: 'cec', repository: CEC.repository, repositoryId: CEC.repositoryId, commit: head, path, blob });
    const args = command.mock.calls.find(([, args]) => args.includes('items'))![1];
    expect(args).toContain(`project=${CEC.project}`); expect(args).toContain(`repositoryId=${CEC.repositoryId}`); expect(args).toContain('GET'); expect(args).toContain('versionDescriptor.versionType=commit');
    command.mockClear(); const facts = collectCTOFacts([{ store, engine: { busy: false } as any, conversations: {} as any }], store.clock.now().toISOString());
    expect(facts.projects[0].pullRequests.prs[0]).toHaveProperty('description', expect.stringContaining('Selected note'));
    expect(command).not.toHaveBeenCalled();
});
test('configured commit/path observations cache immutably and distinguish deployed from PR-only source', async () => {
    const store = setup(), read = vi.fn(async (args: string[]) => answer(args));
    store.state.azure.prs[0].mergeCommit = prior;
    const initial = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString());
    expect(initial.documents).toMatchObject([{ commit: head, context: 'deployed' }, { commit: prior, context: 'pr' }]);
    store.state.azure.goalDocuments = initial.documents;
    await collectAzureGoalDocuments(store, binding(), read, '2026-10-31T00:00:00Z'); expect(read).toHaveBeenCalledTimes(2);
    const projection = projectPRFacts(store) as any;
    expect(projection.documents[0]).toMatchObject({ matchesDeployedCommit: true, authority: expect.stringContaining('not independent') });
    expect(projection.documents[1].matchesDeployedCommit).toBe(false);
    store.state.azure.observedAt = '2026-10-30T20:00:00Z'; expect((projectPRFacts(store) as any).documents[0].stale).toBe(true);
    expect(goalEvidenceFingerprint(store)).toMatch(/^[a-f0-9]{64}$/);
});
test.each(['../secret.md', '/docs/../secret.md', '/docs/%2e%2e.md', 'https://foreign.example/doc.md', '/docs/file.txt'])('refuses unconfigured/traversal path %s without reading', async value => {
    const store = setup([value]), read = vi.fn(); expect(goalEvidencePath(value)).toBe(false);
    const result = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString()); expect(read).not.toHaveBeenCalled(); expect(result.gaps[0]).toContain('invalid');
});
test('unset legacy paths explain the gap without fetching and foreign repository bindings reject', async () => {
    const store = setup([]), read = vi.fn(); const result = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString());
    expect(result.gaps[0]).toContain('No acceptance document paths'); expect(read).not.toHaveBeenCalled();
    await expect(collectAzureGoalDocuments(store, { ...binding(), repository: 'foreign' }, read, store.clock.now().toISOString())).rejects.toThrow('owning project');
    await expect(collectAzureGoalDocuments(store, { ...binding(), projectId: 'brain' }, read, store.clock.now().toISOString())).rejects.toThrow('owning project');
});
test.each(['path', 'commitId', 'objectId'])('mismatched provider %s stays an explicit evidence gap', async field => {
    const store = setup(), read = vi.fn(async (args: string[]) => ({ ...answer(args), [field]: 'foreign' }));
    const result = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString());
    expect(result.documents[0]).toMatchObject({ text: '', blob: '', error: expect.stringContaining('identity') });
});
test('UTF-8 payloads/counts are bounded, redacted and marked truncated; failures retry only after bounded backoff', async () => {
    const store = setup(); const body = azurePRDescription('😀'.repeat(9000)); expect(Buffer.byteLength(body.description!)).toBeLessThanOrEqual(GOAL_EVIDENCE_LIMITS.bodyBytes); expect(body.descriptionTruncated).toBe(true); expect(body.description).not.toContain('�');
    const read = vi.fn(async (args: string[]) => ({ ...answer(args), content: 'x'.repeat(40000) }));
    let result = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString()); expect(result.documents[0]).toMatchObject({ bytes: 40000, truncated: true }); expect(Buffer.byteLength(result.documents[0].text)).toBe(32768);
    expect(result.documents[0].sha256).toBe(createHash('sha256').update(result.documents[0].text).digest('hex'));
    read.mockRejectedValue(new Error('Missing document')); result = await collectAzureGoalDocuments(store, binding(), read, store.clock.now().toISOString()); store.state.azure.goalDocuments = result.documents; read.mockClear();
    await collectAzureGoalDocuments(store, binding(), read, '2026-10-30T21:30:10Z'); expect(read).not.toHaveBeenCalled();
    await collectAzureGoalDocuments(store, binding(), read, '2026-10-30T21:31:00Z'); expect(read).toHaveBeenCalledOnce();
});
test('normal private config validates optional bounded Markdown allowlists and legacy configuration remains compatible', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-goal-config-')); roots.push(root); vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const config = { projects: [{ id: 'cec', name: 'CEC', provider: 'azure', repo: '/fixture', repository: 'fixture', target: 'staging', goalEvidencePaths: [path] }] };
    writeFileSync(resolve(root, 'office-config.json'), JSON.stringify(config)); expect(localBindings(root).projects![0].goalEvidencePaths).toEqual([path]);
    for (const paths of [[path, path], ['../escape.md'], [path, '/a.md', '/b.md']]) { config.projects[0].goalEvidencePaths = paths; writeFileSync(resolve(root, 'office-config.json'), JSON.stringify(config)); expect(() => localBindings(root)).toThrow('bounded unique'); }
    delete (config.projects[0] as any).goalEvidencePaths; writeFileSync(resolve(root, 'office-config.json'), JSON.stringify(config)); expect(localBindings(root).projects).toHaveLength(1);
});


test('normal CEC project selection inherits only its validated canonical binding and preserves explicit overrides', () => {
    const binding = { repo: '/fixture/cec', repository: 'cec-repository', goalEvidencePaths: ['/docs/acceptance.md'] };
    const project = { ...projectById('cec'), repo: binding.repo, repository: binding.repository, goalEvidencePaths: undefined };
    const selected = withCECGoalEvidence(project, binding);
    expect(selected.goalEvidencePaths).toEqual(binding.goalEvidencePaths); expect(selected.goalEvidencePaths).not.toBe(binding.goalEvidencePaths);
    expect(project.goalEvidencePaths).toBeUndefined();
    for (const paths of [[], ['/docs/explicit.md']]) {
        const explicit = { ...project, goalEvidencePaths: paths };
        expect(withCECGoalEvidence(explicit, binding)).toBe(explicit); expect(explicit.goalEvidencePaths).toEqual(paths);
    }
    for (const delta of [{ id: 'brain' }, { provider: 'github' as const }, { repository: 'different-repository' }, { repo: '/fixture/foreign' }]) {
        const foreign = { ...project, ...delta }; expect(withCECGoalEvidence(foreign, binding)).toBe(foreign); expect(foreign.goalEvidencePaths).toBeUndefined();
    }
    expect(withCECGoalEvidence(project, { repo: binding.repo, repository: binding.repository })).toBe(project);
});
