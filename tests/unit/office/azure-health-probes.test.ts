import { expect, test } from 'vitest';
import { azureProbes } from '../../../server/office/service-health';
import { PROJECT_BINDINGS } from '../../../server/office/projects';
import type { ProjectBindings } from '../../../server/office/project-bindings-config';

const cec = PROJECT_BINDINGS.get('cec')!;
const acme: ProjectBindings = { ...cec, jira: { ...cec.jira, projectKey: 'ACME' }, azure: { ...cec.azure, organization: 'https://dev.azure.com/acme', project: 'Acme' } };

test('each bound project gets its own read-only Azure DevOps check; cec keeps its id and wording', () => {
    const [legacy, second] = azureProbes(new Map([['cec', cec], ['acme', acme]]));
    expect(legacy).toMatchObject({ id: 'azure', name: 'Azure DevOps', program: 'az' });
    expect(legacy.args).toEqual(['devops', 'project', 'show', '--project', cec.azure.project, '--organization', cec.azure.organization, '--query', 'id', '--output', 'json']);
    expect(legacy.parse('"id"')).toEqual({ status: 'connected', detail: 'Read-only access check for the configured CEC Azure DevOps project.' });
    expect(second).toMatchObject({ id: 'azure:acme', name: 'Azure DevOps · ACME' });
    expect(second.args).toEqual(['devops', 'project', 'show', '--project', 'Acme', '--organization', 'https://dev.azure.com/acme', '--query', 'id', '--output', 'json']);
    expect(second.parse('{}').status).toBe('unknown');
    expect(azureProbes(new Map())).toEqual([]);
});
