import { expect, test } from 'vitest';
import { restPR } from '../../../server/github/pr-rest-shape';
import { FROZEN_GOLDEN, frozenRerun } from './support/frozen-prs';
import { pr20, pr21, pr22, pr30, type RestPR } from './support/pull-fixtures';

const project = (prs: RestPR[]) => prs.map(p => restPR(p.detail, p.reviews, p.checks, p.statuses));

test('the REST projection reproduces the frozen pre-change rows exactly, in order', () => {
    expect(project([pr22.rest, pr21.rest, pr20.rest])).toStrictEqual(FROZEN_GOLDEN);
    for (const refresh of [1, 2, 3] as const) expect(project([pr30(refresh).rest])).toStrictEqual(frozenRerun(refresh));
});

test('statuses keep the newest per context in REST order after the check runs; a null user fails', () => {
    const rows = restPR({ ...pr22.rest.detail, body: null }, [], [{ check_runs: [{ name: 'test', status: 'completed', conclusion: null, html_url: 'u', head_sha: 'h' }] }],
        [{ context: 'test', state: 'pending', target_url: 'n' }, { context: 'lint', state: 'error', target_url: null }, { context: 'test', state: 'success', target_url: 'o' }]);
    expect(rows).toMatchObject({ linkedIssues: [], description: '', checks: [{ name: 'test', status: 'completed', conclusion: '' }, { name: 'test', status: 'pending', conclusion: 'pending', url: 'n' }, { name: 'lint', status: 'completed', conclusion: 'error', url: '' }] });
    expect(() => restPR({ ...pr22.rest.detail, user: null }, [], [], [])).toThrow(TypeError);
});
