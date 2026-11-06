import { expect, test } from 'vitest';
import { officeConfigRoute, officeConfigSummary, type OfficeConfigInputs } from '../../../../server/office/http/office-config';

const inputs: OfficeConfigInputs = {
    projects: [
        { id: 'cec', name: 'CEC', provider: 'azure', repo: '/Users/private/cec', repository: 'cec-repo', target: 'staging', goalEvidencePaths: ['docs/goals.md'], board: { name: 'CEC Jira board', url: 'https://example.atlassian.net/board' } },
        { id: 'gh', name: 'Fixture', provider: 'github', repo: '/Users/private/gh', repository: 'owner/fixture', target: 'main', githubProject: { owner: 'owner', number: 1, url: 'https://github.com/users/owner/projects/1' } },
        { id: 'bare', name: 'Bare', provider: 'github', repo: '/tmp/bare', repository: 'owner/bare', target: 'main' },
    ],
    cec: { site: 'https://example.atlassian.net', cloudId: 'secret-cloud', board: 7, account: 'secret-account', repo: '/Users/private/cec', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', repositoryId: 'secret-repo-id', target: 'staging', goalEvidencePaths: ['docs/goals.md'] },
    holds: { 'CEC-1': 'Fixture hold reason.' },
};

test('projects only allowlisted fields, deriving GitHub boards and nulling missing ones', () => {
    const summary = officeConfigSummary(inputs);
    expect(summary).toEqual({
        projects: [
            { id: 'cec', name: 'CEC', provider: 'azure', repository: 'cec-repo', target: 'staging', boardName: 'CEC Jira board', boardUrl: 'https://example.atlassian.net/board' },
            { id: 'gh', name: 'Fixture', provider: 'github', repository: 'owner/fixture', target: 'main', boardName: 'Fixture GitHub board', boardUrl: 'https://github.com/users/owner/projects/1' },
            { id: 'bare', name: 'Bare', provider: 'github', repository: 'owner/bare', target: 'main', boardName: null, boardUrl: null },
        ],
        cec: { site: 'https://example.atlassian.net', organization: 'https://dev.azure.com/example', project: 'example', repository: 'cec-repo', target: 'staging' },
        holds: [{ key: 'CEC-1', reason: 'Fixture hold reason.' }],
    });
    const text = JSON.stringify(summary);
    for (const secret of ['secret-cloud', 'secret-account', 'secret-repo-id', '/Users/private', 'goals.md']) expect(text).not.toContain(secret);
});
test('serves the projection on GET, rejects other methods and ignores other paths', async () => {
    const call = (method: string, path = '/api/office-config') => officeConfigRoute(new Request('http://local' + path, { method }), new URL('http://local' + path), { config: { ...inputs, holds: {} } });
    const response = (await call('GET'))!;
    expect(response.status).toBe(200);
    expect((await response.json()).holds).toEqual([]);
    expect((await call('POST'))!.status).toBe(405);
    expect(await call('GET', '/api/office')).toBeUndefined();
});
