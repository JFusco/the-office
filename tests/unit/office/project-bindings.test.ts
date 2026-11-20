import { expect, test } from 'vitest';
import { legacyCecBindings, projectBindings } from '../../../server/office/project-bindings-config';
import { azureBinding, jiraBinding } from '../../../server/office/project-bindings';
import { PROJECT_BINDINGS, projectById } from '../../../server/office/projects';

const cec = { site: 'https://one.example.net', cloudId: 'cloud-1', board: 7, account: 'account-1', repo: '/tmp/cos', organization: 'https://dev.azure.com/one', project: 'One', repository: 'cos', repositoryId: 'repo-1', target: 'staging' };

test('the legacy fold carries the cec connection and the workflow values that were in the code', () => {
    const { prompt, ...bindings } = legacyCecBindings(cec);
    expect(prompt).toMatchObject({ htmlFallback: true, preflightStatuses: ['In Progress', 'Code Review', 'Ready for QA', 'QA', 'In Review'] });
    expect(JSON.stringify(prompt.repository)).toBe(JSON.stringify(cec));
    expect(prompt.repository).not.toBe(cec);
    expect(bindings).toEqual({
        jira: {
            site: 'https://one.example.net', cloudId: 'cloud-1', account: 'account-1', projectKey: 'CEC', board: 7,
            statuses: {
                intake: [{ name: 'To Do', id: '10000' }, { name: 'Open', id: '1' }],
                stages: { understand: 'In Progress', 'code-review': 'Code Review', 'repair-review': 'Code Review', preview: 'Ready for QA', qa: 'QA', retest: 'QA' },
                readyForStaging: 'Ready for Staging', blocked: 'Blocked',
            },
        },
        azure: {
            organization: 'https://dev.azure.com/one', project: 'One', repositoryId: 'repo-1',
            deployment: { environment: 'staging', subscription: 'adcd54e8-229d-4a59-89ec-1713267e3ec9', resourceGroup: 'Cumulative-OS', containerApp: 'ca-cos-conductor-shell-stg', container: 'ca-cos-conductor-shell-stg', healthPath: '/api/health', healthy: 'cos' },
            production: { branch: 'production', pipeline: 'prod-deploy' },
        },
    });
    const list = 'https://one.example.net/jira/software/c/projects/CEC/list?jql=x';
    expect(legacyCecBindings({ ...cec, intakeListUrl: list }).jira.intakeListUrl).toBe(list);
    expect('intakeListUrl' in legacyCecBindings(cec).jira).toBe(false);
});

test('resolved bindings cannot be mutated', () => {
    const { jira, azure } = legacyCecBindings(cec);
    expect(() => { (jira as { site: string }).site = 'https://other.example.net'; }).toThrow();
    expect(() => { (jira.statuses.stages as { qa: string }).qa = 'Done'; }).toThrow();
    expect(() => { (jira.statuses.intake as unknown[]).push({}); }).toThrow();
    expect(() => { (azure.deployment as { containerApp: string }).containerApp = 'other'; }).toThrow();
});

test('only the Azure project cec receives the legacy binding; no other project inherits it', () => {
    const registry = projectBindings([{ id: 'cec', provider: 'azure' }, { id: 'acme', provider: 'azure' }, { id: 'brain', provider: 'github' }, { id: 'cec-mirror', provider: 'azure' }], cec);
    expect([...registry.keys()]).toEqual(['cec']);
    expect(projectBindings([{ id: 'cec', provider: 'github' }], cec).size).toBe(0);
    expect(jiraBinding({ id: 'cec' }, registry).account).toBe('account-1');
    expect(azureBinding({ id: 'cec' }, registry).project).toBe('One');
    for (const id of ['acme', 'brain', 'cec-mirror']) {
        expect(() => jiraBinding({ id }, registry)).toThrow(`Project "${id}" has no Jira/Azure binding`);
        expect(() => azureBinding({ id }, registry)).toThrow(`Project "${id}" has no Jira/Azure binding`);
    }
});

test('the start-up registry binds the configured cec project', () => {
    expect([...PROJECT_BINDINGS.keys()]).toEqual(['cec']);
    expect(jiraBinding(projectById('cec')).projectKey).toBe('CEC');
    expect(() => jiraBinding(projectById('brain'))).toThrow('has no Jira/Azure binding');
});
