import { afterEach, expect, test, vi } from 'vitest';
import { readValidationProviderContext } from '../../../../../server/delivery/recovery/validation/validation-provider-context';
import { cleanupFakes, fakeGitHub, REPOSITORY } from '../../support/fake-github';

afterEach(cleanupFakes);

const fields = [
    { resource: 'issue', field: 'title', invalid: null }, { resource: 'issue', field: 'body', invalid: 0 },
    { resource: 'issue', field: 'labels', invalid: {} }, { resource: 'issue', field: 'updated_at', invalid: '' },
    { resource: 'comment', field: 'user', invalid: {} }, { resource: 'comment', field: 'author_association', invalid: null },
    { resource: 'comment', field: 'created_at', invalid: '' }, { resource: 'comment', field: 'updated_at', invalid: null },
];

test.each(fields.flatMap(field => ['missing', 'malformed'].map(problem => ({ ...field, problem }))))(
    'rejects a $problem $resource.$field during provider read-back', async ({ resource, field, invalid, problem }) => {
        const { delivery, state } = fakeGitHub();
        const issue = { ...state.issue, body: 'Scope', labels: [] };
        const comment = { id: 1, issue_url: `https://api.github.com/repos/${REPOSITORY}/issues/5`,
            html_url: issue.html_url + '#issuecomment-1', body: 'Review', user: { login: 'JFusco' },
            author_association: 'OWNER', created_at: issue.updated_at, updated_at: issue.updated_at };
        vi.spyOn(delivery, 'api').mockImplementation(async path => path === 'issues/5' ? issue : [comment]);
        const read = () => readValidationProviderContext(delivery, 'GH-5');
        await read();
        const record: Record<string, unknown> = resource === 'issue' ? issue : comment;
        if (problem === 'missing') delete record[field];
        else record[field] = invalid;
        await expect(read()).rejects.toThrow(resource === 'issue'
            ? 'Current issue scope is unavailable' : 'Current issue comment identity or pagination is unverified');
    },
);
