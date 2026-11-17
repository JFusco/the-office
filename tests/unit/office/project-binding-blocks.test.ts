import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { explicitBindings, parseBindingBlocks } from '../../../server/office/project-binding-blocks';
import { legacyCecBindings, projectBindings } from '../../../server/office/project-bindings-config';
import { configuredProjects, explicitBindingInputs } from '../../../server/office/projects';
import { localBindings } from '../../../server/office/local-config';
import { twgConnection, twgProfile } from '../../../server/cec/twg-connection';

const roots: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

const cec = { site: 'https://one.example.net', cloudId: 'cloud-1', board: 7, account: 'account-1', repo: '/tmp/cos', organization: 'https://dev.azure.com/one', project: 'One', repository: 'cos', repositoryId: 'repo-1', target: 'staging' };
const jira = { site: cec.site, cloudId: cec.cloudId, account: cec.account, projectKey: 'CEC', board: 7 };
const azure = { organization: cec.organization, project: cec.project, repositoryId: cec.repositoryId, deployment: { subscription: 'sub-1', resourceGroup: 'rg-1', containerApp: 'app-1', healthy: 'http-ok' } };
const project = { id: 'cec', provider: 'azure' };
/** Builds the entry as JSON would: a block given as undefined is absent, not present-and-undefined. */
const parse = (overrides: { jira?: unknown; azure?: unknown } = {}, legacy: typeof cec | null = cec, target: Record<string, unknown> = project) => {
    const entry: Record<string, unknown> = { ...target, jira: 'jira' in overrides ? overrides.jira : jira, azure: 'azure' in overrides ? overrides.azure : azure };
    for (const block of ['jira', 'azure']) if (entry[block] === undefined) delete entry[block];
    return parseBindingBlocks(entry as never, legacy ?? undefined);
};

test('equivalent explicit blocks resolve to the legacy workflow with the configured profile, credential and deployment', () => {
    const blocks = parse({ jira: { ...jira, twgProfile: 'cec', credentialAccount: 'office@example.test' } })!;
    const resolved = explicitBindings(cec, blocks), legacy = legacyCecBindings(cec);
    expect(resolved.jira).toEqual({ ...legacy.jira, twgProfile: 'cec', credentialAccount: 'office@example.test' });
    expect(resolved.azure).toEqual({ ...legacy.azure, deployment: { environment: 'staging', subscription: 'sub-1', resourceGroup: 'rg-1', containerApp: 'app-1', container: 'app-1', healthPath: '/api/health', healthy: 'http-ok' } });
    expect(Object.isFrozen(resolved.jira) && Object.isFrozen(resolved.azure.deployment)).toBe(true);
    const bare = explicitBindings(cec, parse()!).jira;
    expect('twgProfile' in bare || 'credentialAccount' in bare).toBe(false);
    expect(parseBindingBlocks({ id: 'cec', provider: 'azure' }, cec)).toBeUndefined();
});

test.each([
    [{ jira: undefined }, 'Project "cec": jira and azure must be supplied together'],
    [{ azure: undefined }, 'Project "cec": jira and azure must be supplied together'],
    [{ jira: null }, 'Project "cec": jira must be an object'],
    [{ jira: { ...jira, site: 'http://one.example.net' } }, 'Project "cec": jira.site must be an HTTPS site origin'],
    [{ jira: { ...jira, site: 'https://one.example.net/path' } }, 'Project "cec": jira.site must be an HTTPS site origin'],
    [{ jira: { ...jira, cloudId: '' } }, 'Project "cec": jira.cloudId must be a non-empty string'],
    [{ jira: { ...jira, account: undefined } }, 'Project "cec": jira.account is required'],
    [{ jira: { ...jira, projectKey: 'cec' } }, 'Project "cec": jira.projectKey must be an uppercase Jira project key'],
    [{ jira: { ...jira, projectKey: 'ACME' } }, 'Project "cec": jira.projectKey other than "CEC" requires the rules phase'],
    [{ jira: { ...jira, statuses: { intake: [] } } }, 'Project "cec": jira.statuses requires the rules phase'],
    [{ jira: { ...jira, board: undefined } }, 'Project "cec": jira.board must be a positive integer when jira.intakeListUrl is absent'],
    [{ jira: { ...jira, twgProfile: '' } }, 'Project "cec": jira.twgProfile must be a non-empty string'],
    [{ jira: { ...jira, extra: 1 } }, 'Project "cec": jira.extra is not supported'],
    [{ jira: { ...jira, site: 'https://two.example.net' } }, 'Project "cec": jira.site conflicts with legacy cec.site'],
    [{ jira: { ...jira, account: 'account-2' } }, 'Project "cec": jira.account conflicts with legacy cec.account'],
    [{ jira: { ...jira, board: 8 } }, 'Project "cec": jira.board conflicts with legacy cec.board'],
    [{ azure: { ...azure, organization: 'https://dev.azure.com/two' } }, 'Project "cec": azure.organization conflicts with legacy cec.organization'],
    [{ azure: { ...azure, repositoryId: 'repo-2' } }, 'Project "cec": azure.repositoryId conflicts with legacy cec.repositoryId'],
    [{ azure: { ...azure, deployment: undefined } }, 'Project "cec": azure.deployment is required'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, healthy: 'json' } } }, 'Project "cec": azure.deployment.healthy must be "cos" or "http-ok"'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, healthPath: 'https://evil.example/health' } } }, 'Project "cec": azure.deployment.healthPath must be an absolute URL path'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, healthPath: '//evil.example/health' } } }, 'Project "cec": azure.deployment.healthPath must be an absolute URL path'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, subscription: undefined } } }, 'Project "cec": azure.deployment.subscription is required'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, healthy: undefined } } }, 'Project "cec": azure.deployment.healthy is required'],
    [{ azure: { ...azure, deployment: { ...azure.deployment, minutes: 5 } } }, 'Project "cec": azure.deployment.minutes is not supported'],
])('%o fails naming the project and key', (overrides, message) => {
    expect(() => parse(overrides)).toThrow(new Error(message));
});

test('only the Azure project cec may carry explicit blocks, and only beside the legacy cec block', () => {
    expect(() => parse({}, cec, { id: 'acme', provider: 'azure' })).toThrow('Project "acme": a Jira/Azure project other than cec requires the rules phase');
    expect(() => parse({}, cec, { id: 'web', provider: 'github' })).toThrow('Project "web": jira is only supported for provider "azure"');
    expect(() => parse({}, null)).toThrow('Project "cec": jira and azure require the legacy cec block until the rules phase');
});

test('an explicit intake list must match the legacy list and select the configured project and assignee', () => {
    const list = `${cec.site}/jira/software/c/projects/CEC/list?jql=${encodeURIComponent(`project = CEC AND assignee = "${cec.account}" ORDER BY cf[10019] ASC`)}`;
    const withList = { ...cec, intakeListUrl: list };
    expect(parse({ jira: { ...jira, board: undefined, intakeListUrl: list } }, withList)!.jira.intakeListUrl).toBe(list);
    expect(() => parse({ jira: { ...jira, intakeListUrl: list } }, cec)).toThrow('Project "cec": jira.intakeListUrl conflicts with legacy cec.intakeListUrl');
    expect(() => parse({ jira: { ...jira, intakeListUrl: `${cec.site}/jira/software/c/projects/CEC/list?jql=x` } }, withList)).toThrow('jira.intakeListUrl must be the configured site\'s project list');
});

test('the registry uses explicit bindings for cec when given, and the legacy fold otherwise', () => {
    const projects = configuredProjects([{ id: 'cec', name: 'CEC', provider: 'azure', repo: cec.repo, repository: cec.repository, target: cec.target, bindingBlocks: parse() }])!;
    const explicit = explicitBindingInputs([{ id: 'cec', name: 'CEC', provider: 'azure', repo: cec.repo, repository: cec.repository, target: cec.target, bindingBlocks: parse() }], cec);
    expect(projects[0]).not.toHaveProperty('bindingBlocks');
    expect(projectBindings(projects, cec, explicit).get('cec')!.azure.deployment.containerApp).toBe('app-1');
    expect(projectBindings(projects, cec).get('cec')!.azure.deployment.containerApp).toBe('ca-cos-conductor-shell-stg');
});

test('the loader accepts equivalent explicit blocks and rejects a second Jira/Azure project', () => {
    const root = mkdtempSync(resolve(tmpdir(), 'office-binding-blocks-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    const entry = { id: 'cec', name: 'CEC', provider: 'azure', repo: cec.repo, repository: cec.repository, target: cec.target };
    const load = (projects: object[]) => { writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ cec, projects })); return localBindings(root); };
    expect(load([{ ...entry, jira, azure }]).projects![0].bindingBlocks?.azure.deployment.healthy).toBe('http-ok');
    expect(load([entry]).projects![0].bindingBlocks).toBeUndefined();
    // A raw bindingBlocks key in the file never reaches the registry unvalidated.
    const smuggled = load([{ ...entry, bindingBlocks: { jira: {}, azure: { deployment: { healthPath: 'https://evil.example' } } } }]).projects!;
    expect(smuggled[0].bindingBlocks).toBeUndefined();
    expect(explicitBindingInputs(smuggled, cec).size).toBe(0);
    expect(() => load([entry, { ...entry, id: 'acme', repository: 'acme' }])).toThrow('Project "acme": a Jira/Azure project other than cec requires the rules phase');
});

test('TWG calls carry the project site and, when configured, its login profile', () => {
    expect(twgConnection({ site: cec.site })).toEqual(['--site', cec.site]);
    expect(twgProfile({ site: cec.site })).toEqual([]);
    expect(twgConnection({ site: cec.site, twgProfile: 'cec' })).toEqual(['--site', cec.site, '--profile', 'cec']);
    expect(twgProfile({ site: cec.site, twgProfile: 'cec' })).toEqual(['--profile', 'cec']);
});
