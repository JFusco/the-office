import { expect, test } from 'vitest';
import { githubWorkflows } from '../../../server/pipelines/github-workflows';
import type { GitHubRun } from '../../../src/shared';

const recent = (id: number, workflowId: number, conclusion: string, status = 'completed'): GitHubRun => ({ id, workflowId, name: 'x', status, conclusion, head: `h${id}`, branch: 'main', event: 'push', attempt: 1, url: `https://github.example/runs/${id}`, createdAt: '2026-11-19T10:00:00Z', updatedAt: '2026-11-19T10:05:00Z', startedAt: '' });

test('workflows use the runs already read and read their own only when none is recent', async () => {
    const paths: string[] = [];
    const items = await githubWorkflows('o/r', async path => {
        paths.push(path);
        if (path.startsWith('actions/workflows?')) return { workflows: [{ id: 1, name: 'quality', state: 'active', html_url: 'https://github.example/w/1' }, { id: 2, name: 'weekly scan', state: 'disabled_manually', html_url: 'https://github.example/w/2' }] };
        return { workflow_runs: [{ id: 50, status: 'completed', conclusion: 'timed_out', event: 'schedule', head_branch: 'main', head_sha: 'old', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:10:00Z', html_url: 'https://github.example/runs/50' }] };
    }, [recent(9, 1, '', 'in_progress'), recent(8, 1, 'failure'), recent(7, 1, 'success'), recent(6, 1, 'success'), recent(5, 3, 'success')]);
    expect(paths).toEqual(['actions/workflows?per_page=100', 'actions/workflows/2/runs?per_page=3']);
    expect(items.map(p => [p.name, p.enabled, p.runs.map(r => r.outcome)])).toEqual([['quality', true, ['running', 'failed', 'passed']], ['weekly scan', false, ['failed']]]);
    expect(items[0].runs[0].finishedAt).toBe('');
    expect(items[1].runs[0]).toMatchObject({ id: 50, reason: 'schedule', commit: 'old', finishedAt: '2026-11-01T00:10:00Z' });
});

test('a malformed workflow list is an error', async () => {
    await expect(githubWorkflows('o/r', async () => ({}), [])).rejects.toThrow('no workflow list');
    await expect(githubWorkflows('o/r', async path => path.includes('?per_page=100') ? { workflows: [{ id: 1, name: 'a', state: 'active' }] } : {}, [])).rejects.toThrow('no runs for workflow 1');
});

test('a workflow seen before keeps its last runs instead of being read again; a pull request run is marked', async () => {
    const paths: string[] = [];
    const known = [{ id: '2', name: 'weekly scan', enabled: true, url: '', runs: [{ id: 50, status: 'completed', result: 'success', outcome: 'passed' as const, reason: 'schedule', pullRequest: false, branch: 'main', commit: 'c', queuedAt: '', finishedAt: '', url: 'u' }] }];
    const items = await githubWorkflows('o/r', async path => { paths.push(path); return { workflows: [{ id: 1, name: 'quality', state: 'active' }, { id: 2, name: 'weekly scan', state: 'active' }] }; }, [{ ...recent(9, 1, 'failure'), event: 'pull_request' }], known);
    expect(paths).toEqual(['actions/workflows?per_page=100']);
    expect(items[1].runs).toEqual(known[0].runs);
    expect(items[0]).toMatchObject({ url: 'https://github.com/o/r/actions', runs: [{ pullRequest: true }] });
});
