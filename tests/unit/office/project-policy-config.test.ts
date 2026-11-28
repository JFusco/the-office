import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { localBindings } from '../../../server/office/local-config';
import { parseProjectPolicy } from '../../../server/office/project-policy-config';
import { configuredProjects, contextPacket, persistedProject, policyInputs } from '../../../server/office/projects';
import { projectPolicy } from '../../../server/office/project-policy';
import { handsOff } from '../../../server/delivery/harness/scope';
import { digest } from '../../../server/store/readback-evidence';

const roots: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

const web = { id: 'web', provider: 'github' }, cec = { id: 'cec', provider: 'azure' };

test('a valid policy block is returned as written, and every key is optional', () => {
    expect(parseProjectPolicy(web, {})).toEqual({});
    expect(parseProjectPolicy(web, { merge: 'human', handsOff: true, checkpoint: { hour: 8, weekends: false } })).toEqual({ merge: 'human', handsOff: true, checkpoint: { hour: 8, weekends: false } });
    expect(parseProjectPolicy(cec, { merge: 'human', handsOff: false, checkpoint: {} })).toEqual({ merge: 'human', handsOff: false, checkpoint: {} });
    expect(parseProjectPolicy(web, { releaseMarkerCheck: false })).toEqual({ releaseMarkerCheck: false });
});

test.each([
    [web, null, 'Project "web": policy must be an object'],
    [web, [], 'Project "web": policy must be an object'],
    [web, { merge: 'auto' }, 'Project "web": policy.merge must be "human" or "harness"'],
    [web, { merge: null }, 'Project "web": policy.merge must be "human" or "harness"'],
    [web, { handsOff: 'yes' }, 'Project "web": policy.handsOff must be a boolean'],
    [web, { releaseMarkerCheck: 'yes' }, 'Project "web": policy.releaseMarkerCheck must be a boolean'],
    [web, { releaseMarkerCheck: null }, 'Project "web": policy.releaseMarkerCheck must be a boolean'],
    [web, { checkpoint: 9 }, 'Project "web": policy.checkpoint must be an object'],
    [web, { checkpoint: { hour: 24 } }, 'Project "web": policy.checkpoint.hour must be an integer from 0 to 23'],
    [web, { checkpoint: { hour: -1 } }, 'Project "web": policy.checkpoint.hour must be an integer from 0 to 23'],
    [web, { checkpoint: { hour: 9.5 } }, 'Project "web": policy.checkpoint.hour must be an integer from 0 to 23'],
    [web, { checkpoint: { hour: '9' } }, 'Project "web": policy.checkpoint.hour must be an integer from 0 to 23'],
    [web, { checkpoint: { weekends: 1 } }, 'Project "web": policy.checkpoint.weekends must be a boolean'],
    [web, { mergeMode: 'human' }, 'Project "web": policy.mergeMode is not supported'],
    [web, { checkpoint: { minute: 30 } }, 'Project "web": policy.checkpoint.minute is not supported'],
    [cec, { merge: 'harness' }, 'Project "cec": policy.merge must be "human" for provider "azure"'],
    [cec, { handsOff: true }, 'Project "cec": policy.handsOff must be false for provider "azure"'],
])('%o with %o fails naming the project and key', (project, raw, message) => {
    expect(() => parseProjectPolicy(project, raw)).toThrow(new Error(message));
});

function loader() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-project-policy-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const entry = { id: 'cec', name: 'CEC', provider: 'azure', repo: '/tmp/repo', repository: 'cos', target: 'staging', board: { name: 'CEC', url: 'https://example.invalid/board' }, goalEvidencePaths: [] as string[] };
    const load = (project: Record<string, unknown>) => { writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ projects: [project] })); return localBindings(root).projects![0]; };
    return { entry, load };
}

test('the loader validates policy and stops on blocks this build cannot honor', () => {
    const { entry, load } = loader();
    expect(load(entry)).toEqual(entry);
    expect(load({ ...entry, policy: { checkpoint: { hour: 10 } } }).policy).toEqual({ checkpoint: { hour: 10 } });
    expect(() => load({ ...entry, policy: { merge: 'harness' } })).toThrow('Project "cec": policy.merge must be "human" for provider "azure"');
    expect(() => load({ ...entry, policy: null })).toThrow('Project "cec": policy must be an object');
    for (const value of [{}, null]) expect(() => load({ ...entry, prompt: value })).toThrow('Project "cec": prompt requires the rules phase');
    expect(() => load({ ...entry, policy: {}, jira: {}, azure: {}, prompt: {} })).toThrow('Project "cec": prompt requires the rules phase');
    for (const block of ['jira', 'azure']) expect(() => load({ ...entry, [block]: {} })).toThrow('Project "cec": jira and azure must be supplied together');
});

test('a policy block never reaches the saved project, its worker context or a continuation digest', () => {
    const { entry, load } = loader();
    const before = persistedProject(load(entry)), after = persistedProject(load({ policy: { checkpoint: { hour: 10 }, merge: 'human' }, ...entry }));
    expect(Object.keys(after)).toEqual(Object.keys(entry));
    expect(JSON.stringify(after)).toBe(JSON.stringify(before));
    expect(contextPacket(after)).toBe(contextPacket(before));
    expect(digest({ project: after, key: 'CEC-1' })).toBe(digest({ project: before, key: 'CEC-1' }));
    expect(persistedProject({ ...entry, policy: {}, jira: {}, azure: {}, prompt: {} } as never)).toEqual(entry);
});

test('configured projects reach stores without their policy, and the policy reaches the registry', () => {
    const { entry, load } = loader();
    const web = { id: 'web', name: 'Web', provider: 'github' as const, repo: '/tmp/web', repository: 'example/web', target: 'main' };
    const inputs = [load({ ...entry, policy: { checkpoint: { hour: 10 } } }), { ...web, policy: { handsOff: true, merge: 'human' as const } }, { ...web, id: 'plain' }];
    expect(configuredProjects(undefined)).toBeUndefined();
    expect(configuredProjects(inputs)).toEqual([entry, web, { ...web, id: 'plain' }]);
    const registry = policyInputs(inputs);
    expect([...registry.keys()]).toEqual(['cec', 'web']);
    expect(projectPolicy(entry as never, registry).checkpoint).toEqual({ hour: 10, weekends: false });
    expect(projectPolicy(web, registry)).toMatchObject({ handsOff: true, merge: 'human' });
    expect(projectPolicy({ ...web, id: 'plain' }, registry)).toMatchObject({ handsOff: false, merge: 'harness' });
    expect(handsOff({ project: web } as never)).toBe(false);
});

test('the cec project and the legacy cec block must name the same repository and target', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-legacy-cec-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const cec = { site: 'https://one.example.net', cloudId: 'c', board: 1, account: 'a', repo: '/tmp/cos', organization: 'https://dev.azure.com/o', project: 'p', repository: 'cos', repositoryId: 'i', target: 'staging' };
    const project = { id: 'cec', name: 'CEC', provider: 'azure', repo: '/tmp/cos', repository: 'cos', target: 'staging' };
    const load = (entry: object) => { writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ cec, projects: [entry] })); return localBindings(root); };
    expect(load(project).projects).toHaveLength(1);
    for (const [field, value] of [['repo', '/tmp/other'], ['repository', 'other'], ['target', 'main']])
        expect(() => load({ ...project, [field]: value })).toThrow(`Project "cec": ${field} conflicts with legacy cec.${field}`);
    // Another project is not compared with the legacy block.
    expect(load({ ...project, id: 'web', provider: 'github', repository: 'example/web', target: 'main' }).projects).toHaveLength(1);
});
