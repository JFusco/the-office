import { expect, test } from 'vitest';
import { azurePipelines } from '../../../server/pipelines/azure-pipelines';

const azure = { organization: 'https://dev.azure.com/org', project: 'Proj' };
const build = (id: number, definition: number, result: string, queueTime: string, status = 'completed') => ({ id, definition: { id: definition }, status, result, reason: 'manual', sourceBranch: 'refs/heads/production', sourceVersion: `c${id}`, queueTime, finishTime: status === 'completed' ? queueTime : null });

test('every pipeline is listed with its own latest runs, however old they are', async () => {
    const calls: string[][] = [];
    const items = await azurePipelines(azure, async <T>(args: string[]) => {
        calls.push(args);
        if (args[0] === 'pipelines') return [{ id: 460, name: 'prod-deploy', queueStatus: 'enabled' }, { id: 451, name: 'cos-release', queueStatus: 'disabled' }, { id: 441, name: 'aca-deploy', queueStatus: 'enabled' }] as T;
        return { value: [build(9, 441, 'partiallySucceeded', '2026-11-19T10:00:00Z'), build(8, 441, 'succeeded', '2026-11-19T09:00:00Z'), build(2, 460, 'succeeded', '2026-10-01T00:00:00Z'), build(10, 441, '', '2026-11-19T11:00:00Z', 'inProgress')] } as T;
    });
    expect(calls).toHaveLength(2);
    expect(calls[1]).toEqual(expect.arrayContaining(['definitions=460,451,441', 'maxBuildsPerDefinition=3', 'project=Proj']));
    expect(items.map(p => p.name)).toEqual(['aca-deploy', 'cos-release', 'prod-deploy']);
    expect(items[0].runs.map(r => [r.id, r.outcome])).toEqual([[10, 'running'], [9, 'partial'], [8, 'passed']]);
    expect(items[1]).toMatchObject({ enabled: false, runs: [] });
    expect(items[2].runs[0]).toMatchObject({ id: 2, outcome: 'passed', pullRequest: false, branch: 'production', commit: 'c2', url: 'https://dev.azure.com/org/Proj/_build/results?buildId=2' });
    expect(items[2].url).toBe('https://dev.azure.com/org/Proj/_build?definitionId=460');
});

test('no pipelines means no build read, and a malformed answer is an error', async () => {
    let reads = 0;
    expect(await azurePipelines(azure, async <T>() => { reads++; return [] as T; })).toEqual([]);
    expect(reads).toBe(1);
    await expect(azurePipelines(azure, async <T>(args: string[]) => (args[0] === 'pipelines' ? [{ id: 1, name: 'a' }] : {}) as T)).rejects.toThrow('no build list');
    await expect(azurePipelines(azure, async <T>() => ({}) as T)).rejects.toThrow('no pipeline list');
});
