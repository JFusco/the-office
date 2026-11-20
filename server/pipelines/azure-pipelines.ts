import type { PipelineOutcome, PipelineStatus } from '../../src/contracts/pipelines';
import type { AzureBinding } from '../office/project-bindings-config';

export const RUNS_PER_PIPELINE = 3;
type Read = <T>(args: string[]) => Promise<T>;
type Azure = Pick<AzureBinding, 'organization' | 'project'>;

function outcome(status: string, result: string): PipelineOutcome {
    if (status !== 'completed') return 'running';
    return result === 'succeeded' ? 'passed' : result === 'failed' ? 'failed' : result === 'partiallySucceeded' ? 'partial' : result === 'canceled' ? 'cancelled' : 'other';
}

/** Every Azure pipeline of the project with its latest runs: one read of the definitions, one of their builds. */
export async function azurePipelines(azure: Azure, read: Read): Promise<PipelineStatus[]> {
    const definitions = await read<any[]>(['pipelines', 'list']);
    if (!Array.isArray(definitions)) throw new Error('Azure returned no pipeline list');
    if (!definitions.length) return [];
    const base = `${azure.organization}/${encodeURIComponent(azure.project)}/_build`;
    const builds = await read<{ value?: any[] }>(['devops', 'invoke', '--area', 'build', '--resource', 'builds', '--route-parameters', `project=${azure.project}`,
        '--query-parameters', `definitions=${definitions.map(d => d.id).join(',')}`, `maxBuildsPerDefinition=${RUNS_PER_PIPELINE}`, 'queryOrder=queueTimeDescending', '--api-version', '7.1', '--http-method', 'GET']);
    if (!Array.isArray(builds?.value)) throw new Error('Azure returned no build list');
    return definitions.map(d => ({
        id: String(d.id), name: String(d.name || `Pipeline ${d.id}`), enabled: !d.queueStatus || d.queueStatus === 'enabled', url: `${base}?definitionId=${d.id}`,
        runs: builds.value!.filter(b => b.definition?.id === d.id).sort((a, b) => String(b.queueTime || '').localeCompare(String(a.queueTime || ''))).slice(0, RUNS_PER_PIPELINE).map(b => ({
            id: Number(b.id), status: String(b.status || ''), result: String(b.result || ''), outcome: outcome(b.status, b.result), reason: String(b.reason || ''), pullRequest: b.reason === 'pullRequest',
            branch: String(b.sourceBranch || '').replace('refs/heads/', ''), commit: String(b.sourceVersion || ''), queuedAt: String(b.queueTime || ''), finishedAt: String(b.finishTime || ''), url: `${base}/results?buildId=${b.id}`,
        })),
    })).sort((a, b) => a.name.localeCompare(b.name));
}
