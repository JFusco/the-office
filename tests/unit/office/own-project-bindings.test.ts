import { afterEach, expect, test, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { parseBindingBlocks } from '../../../server/office/project-binding-blocks';
import { legacyCecBindings, projectBindings } from '../../../server/office/project-bindings-config';
import { configuredProjects, explicitBindingInputs } from '../../../server/office/projects';
import { localBindings, type ProjectInput } from '../../../server/office/local-config';
import { assertUniqueProjectKeys } from '../../../server/office/jira-project-keys';
import { ACME_AUTHORITY, acmeEntry, cecEntry, legacyCec } from './second-project-fixture';

const roots: string[] = [];
afterEach(() => { vi.unstubAllEnvs(); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });

/** Loads an isolated office-config.json through the real loader. */
function load(projects: object[], cec: object | undefined = legacyCec) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-own-bindings-')); roots.push(root);
    vi.stubEnv('VITEST', ''); vi.stubEnv('NODE_ENV', 'production');
    writeFileSync(resolve(root, 'office-config.json'), JSON.stringify({ ...(cec ? { cec } : {}), projects }));
    return localBindings(root);
}
const clone = () => structuredClone(acmeEntry) as any;
/** acmeEntry with one nested key removed, e.g. `without('jira.statuses.intake')`. */
function without(path: string) {
    const entry = clone(), keys = path.split('.'), last = keys.pop()!;
    delete keys.reduce((value, key) => value[key], entry)[last];
    return entry;
}
const registry = (config: ReturnType<typeof load>) => projectBindings(configuredProjects(config.projects)!, legacyCec, explicitBindingInputs(config.projects, legacyCec));

test('a second Jira/Azure project loads and resolves to its own binding, with defaults and no secrets in its prompt', () => {
    const config = load([cecEntry, acmeEntry]), bindings = registry(config), acme = bindings.get('acme')!;
    expect(configuredProjects(config.projects)![1]).toEqual({ id: 'acme', name: 'Acme', provider: 'azure', repo: '/tmp/acme-web', repository: 'acme-web', target: 'develop' });
    expect(acme.jira).toEqual({
        site: 'https://acme.example.net', cloudId: 'acme-cloud', account: 'acme-account', credentialAccount: 'office@acme.example', twgProfile: 'acme', projectKey: 'ACME', board: 12,
        statuses: {
            intake: [{ name: 'Selected', id: '10100' }, { name: 'Ready', id: '10101' }],
            stages: { understand: 'Doing', 'code-review': 'Code Review', 'repair-review': 'Code Review', preview: 'Ready for QA', qa: 'Testing', retest: 'Testing' },
            readyForStaging: 'Ready for Staging', blocked: 'On Hold',
        },
    });
    expect(acme.azure.deployment).toEqual({ environment: 'staging', subscription: 'acme-sub', resourceGroup: 'acme-rg', containerApp: 'acme-web-dev', container: 'acme-web-dev', healthPath: '/api/health', healthy: 'http-ok' });
    expect(acme.prompt).toEqual({
        authority: ACME_AUTHORITY, preview: '', htmlFallback: false, preflightStatuses: ['Doing', 'Code Review', 'Ready for QA', 'Testing'],
        repository: { site: 'https://acme.example.net', cloudId: 'acme-cloud', account: 'acme-account', organization: 'https://dev.azure.com/acme', project: 'Acme', repository: 'acme-web', repositoryId: 'acme-repo-id', target: 'develop' },
    });
    for (const secret of ['office@acme.example', '"acme"', 'acme-sub', 'acme-rg', '/tmp/acme-web', 'cec', 'Cec']) expect(JSON.stringify(acme.prompt)).not.toContain(secret);
    expect(Object.isFrozen(acme.prompt.repository) && Object.isFrozen(acme.jira.statuses.stages)).toBe(true);
    // cec, with no explicit blocks, keeps the legacy fold exactly.
    expect(bindings.get('cec')).toEqual(legacyCecBindings(legacyCec));
});

test('optional keys override the defaults', () => {
    const entry = clone();
    Object.assign(entry.jira, { htmlFallback: true, board: undefined, intakeListUrl: `${entry.jira.site}/jira/software/c/projects/ACME/list?jql=${encodeURIComponent('project = ACME AND assignee = "acme-account" ORDER BY cf[10019] ASC')}` });
    Object.assign(entry.jira.statuses, { readyForStaging: 'Awaiting Release', stages: { understand: 'Doing', 'code-review': 'Peer Review', 'repair-review': 'Peer Review', preview: 'Ready to Test', qa: 'Testing', retest: 'Retesting' } });
    entry.prompt.preview = 'Start the Acme app on an isolated port.';
    Object.assign(entry.azure.deployment, { environment: 'dev', container: 'web', healthPath: '/healthz' });
    const acme = registry(load([JSON.parse(JSON.stringify(entry))])).get('acme')!;
    expect(acme.jira.intakeListUrl).toBe(entry.jira.intakeListUrl);
    expect(acme.jira.board).toBe(0);
    expect(acme.jira.statuses.readyForStaging).toBe('Awaiting Release');
    expect(acme.prompt).toMatchObject({ htmlFallback: true, preview: 'Start the Acme app on an isolated port.', preflightStatuses: ['Doing', 'Peer Review', 'Ready to Test', 'Testing', 'Retesting'] });
    expect(acme.azure.deployment).toMatchObject({ environment: 'dev', container: 'web', healthPath: '/healthz' });
});

test.each([
    ['jira', 'Project "acme": jira is required for a Jira/Azure project'],
    ['prompt', 'Project "acme": prompt is required for a Jira/Azure project'],
    ['jira.site', 'Project "acme": jira.site is required'],
    ['jira.cloudId', 'Project "acme": jira.cloudId is required'],
    ['jira.account', 'Project "acme": jira.account is required'],
    ['jira.projectKey', 'Project "acme": jira.projectKey is required'],
    ['jira.twgProfile', 'Project "acme": jira.twgProfile is required'],
    ['jira.credentialAccount', 'Project "acme": jira.credentialAccount is required'],
    ['jira.statuses', 'Project "acme": jira.statuses is required'],
    ['jira.statuses.intake', 'Project "acme": jira.statuses.intake is required'],
    ['jira.board', 'Project "acme": jira.board must be a positive integer when jira.intakeListUrl is absent'],
    ['azure.organization', 'Project "acme": azure.organization is required'],
    ['azure.project', 'Project "acme": azure.project is required'],
    ['azure.repositoryId', 'Project "acme": azure.repositoryId is required'],
    ['azure.deployment', 'Project "acme": azure.deployment is required'],
    ['azure.deployment.subscription', 'Project "acme": azure.deployment.subscription is required'],
    ['azure.deployment.resourceGroup', 'Project "acme": azure.deployment.resourceGroup is required'],
    ['azure.deployment.containerApp', 'Project "acme": azure.deployment.containerApp is required'],
    ['azure.deployment.healthy', 'Project "acme": azure.deployment.healthy is required'],
    ['prompt.authority', 'Project "acme": prompt.authority is required'],
])('missing %s stops start-up', (path, message) => {
    expect(() => load([cecEntry, without(path)])).toThrow(new Error(message));
});

test('missing blocks are named together', () => {
    const { jira: _jira, azure: _azure, prompt: _prompt, ...bare } = clone();
    expect(() => load([bare])).toThrow(new Error('Project "acme": jira, azure and prompt are required for a Jira/Azure project'));
    const { azure: _a, prompt: _p, ...jiraOnly } = clone();
    expect(() => load([jiraOnly])).toThrow(new Error('Project "acme": azure and prompt are required for a Jira/Azure project'));
});

const variant = (edit: (entry: any) => void) => { const entry = clone(); edit(entry); return entry; };
test.each([
    [variant(e => { e.jira.statuses.intake = []; }), 'Project "acme": jira.statuses.intake must be a non-empty array'],
    [variant(e => { e.jira.statuses.intake[0].name = ''; }), 'Project "acme": jira.statuses.intake.0.name must be a non-empty string'],
    [variant(e => { e.jira.statuses.intake[0].id = '0'; }), 'Project "acme": jira.statuses.intake.0.id must be a positive decimal string'],
    [variant(e => { e.jira.statuses.intake[0].id = 10100; }), 'Project "acme": jira.statuses.intake.0.id must be a positive decimal string'],
    [variant(e => { e.jira.statuses.intake[0].color = 'blue'; }), 'Project "acme": jira.statuses.intake.0.color is not supported'],
    [variant(e => { e.jira.statuses.intake[1].name = 'Selected'; }), 'Project "acme": jira.statuses.intake names must be unique'],
    [variant(e => { e.jira.statuses.intake[1].id = '10100'; }), 'Project "acme": jira.statuses.intake ids must be unique'],
    [variant(e => { e.jira.statuses.stages.deploy = 'Deploying'; }), 'Project "acme": jira.statuses.stages.deploy is not supported'],
    [variant(e => { e.jira.statuses.stages.qa = ''; }), 'Project "acme": jira.statuses.stages.qa must be a non-empty string'],
    [variant(e => { e.jira.statuses.extra = 1; }), 'Project "acme": jira.statuses.extra is not supported'],
    [variant(e => { e.jira.statuses.blocked = 'Selected'; }), 'Project "acme": jira.statuses.blocked must differ from every intake and stage status'],
    [variant(e => { e.jira.statuses.blocked = 'Code Review'; }), 'Project "acme": jira.statuses.blocked must differ from every intake and stage status'],
    [variant(e => { e.jira.statuses.blocked = undefined; e.jira.statuses.stages.qa = 'Blocked'; }), 'Project "acme": jira.statuses.blocked must differ from every intake and stage status'],
    [variant(e => { e.jira.projectKey = 'GH'; }), 'Project "acme": jira.projectKey "GH" is reserved for GitHub issues'],
    [variant(e => { e.jira.projectKey = 'acme'; }), 'Project "acme": jira.projectKey must be an uppercase Jira project key'],
    [variant(e => { e.jira.htmlFallback = 'yes'; }), 'Project "acme": jira.htmlFallback must be true or false'],
    [variant(e => { e.jira.intakeListUrl = 'https://acme.example.net/jira/software/c/projects/CEC/list?jql=x'; }), 'Project "acme": jira.intakeListUrl must be the configured site\'s project list for the configured assignee'],
    [variant(e => { e.azure.deployment.minutes = 5; }), 'Project "acme": azure.deployment.minutes is not supported'],
    [variant(e => { e.prompt.extra = 'x'; }), 'Project "acme": prompt.extra is not supported'],
    [variant(e => { e.prompt.preview = 5; }), 'Project "acme": prompt.preview must be a string'],
    [variant(e => { e.prompt = 'text'; }), 'Project "acme": prompt must be an object'],
])('an invalid second project stops start-up: %#', (entry, message) => {
    expect(() => load([cecEntry, JSON.parse(JSON.stringify(entry))])).toThrow(new Error(message));
});

test('project keys are unique across configured Jira projects, and GitHub projects carry no blocks', () => {
    expect(() => load([cecEntry, variant(e => { e.jira.projectKey = 'CEC'; })])).toThrow(new Error('Project "acme": jira.projectKey is already used by project "cec"'));
    expect(() => load([variant(e => { e.jira.projectKey = 'CEC'; }), cecEntry])).toThrow(new Error('Project "acme": jira.projectKey is already used by project "cec"'));
    expect(() => load([acmeEntry, { ...acmeEntry, id: 'acme2', repository: 'acme-two' }])).toThrow(new Error('Project "acme2": jira.projectKey is already used by project "acme"'));
    const github = { id: 'web', name: 'Web', provider: 'github', repo: '/tmp/web', repository: 'owner/web', target: 'main' };
    for (const block of ['jira', 'azure', 'prompt'] as const)
        expect(() => load([{ ...github, [block]: (acmeEntry as any)[block] }])).toThrow(new Error(`Project "web": ${block} is only supported for provider "azure"`));
    // The key check reads only validated blocks.
    expect(() => assertUniqueProjectKeys([{ id: 'cec', provider: 'azure' }, { id: 'web', provider: 'github' }])).not.toThrow();
});

test('the example configuration loads through the real loader, with its Jira/Azure example bound on its own', () => {
    const example = JSON.parse(readFileSync(resolve(__dirname, '../../../office-config.example.json'), 'utf8'));
    const config = load(example.projects, example.cec);
    const bound = explicitBindingInputs(config.projects, example.cec);
    expect([...bound.keys()]).toEqual(['acme']);
    expect(bound.get('acme')!.jira.projectKey).toBe('ACME');
    expect(bound.get('acme')!.prompt.repository).not.toHaveProperty('repo');
});

test('the second project needs no legacy cec block, and never reads one', () => {
    const config = load([acmeEntry], undefined), acme = explicitBindingInputs(config.projects, legacyCec).get('acme')!;
    expect(acme.jira.site).toBe('https://acme.example.net');
    expect(parseBindingBlocks(acmeEntry, undefined)).toEqual(parseBindingBlocks(acmeEntry, legacyCec));
    // A raw bindingBlocks key is replaced by the validated blocks.
    const smuggled = load([{ ...acmeEntry, bindingBlocks: { jira: { site: 'https://evil.example' } } }]).projects as ProjectInput[];
    expect(smuggled[0].bindingBlocks!.jira.site).toBe('https://acme.example.net');
});
