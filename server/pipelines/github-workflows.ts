import type { PipelineOutcome, PipelineRun, PipelineStatus } from '../../src/contracts/pipelines';
import type { GitHubRun } from '../../src/shared';
import { RUNS_PER_PIPELINE } from './azure-pipelines';

type Api = (path: string) => Promise<any>;

function outcome(status: string, conclusion: string): PipelineOutcome {
    if (status !== 'completed') return 'running';
    return conclusion === 'success' ? 'passed' : ['failure', 'timed_out', 'startup_failure', 'action_required'].includes(conclusion) ? 'failed' : conclusion === 'cancelled' ? 'cancelled' : 'other';
}
const run = (r: { id: number; status: string; conclusion: string; event: string; branch: string; head: string; createdAt: string; updatedAt: string; url: string }): PipelineRun => ({
    id: r.id, status: r.status, result: r.conclusion, outcome: outcome(r.status, r.conclusion), reason: r.event, pullRequest: r.event.startsWith('pull_request'), branch: r.branch || '', commit: r.head,
    queuedAt: r.createdAt, finishedAt: r.status === 'completed' ? r.updatedAt : '', url: r.url,
});

/**
 * Every GitHub Actions workflow of the repository with its latest runs. Runs come from the recent
 * list already read (newest first). A workflow with none there keeps the runs last observed for it;
 * only one never seen before has its own latest runs read.
 */
export async function githubWorkflows(repository: string, api: Api, recent: readonly GitHubRun[], known: readonly PipelineStatus[] = []): Promise<PipelineStatus[]> {
    const listed = await api('actions/workflows?per_page=100');
    if (!Array.isArray(listed?.workflows)) throw new Error('GitHub returned no workflow list');
    const items: PipelineStatus[] = [];
    for (const w of listed.workflows) {
        let runs = recent.filter(r => r.workflowId === w.id).slice(0, RUNS_PER_PIPELINE).map(run);
        const before = known.find(p => p.id === String(w.id));
        if (!runs.length && before) runs = before.runs;
        else if (!runs.length) {
            const own = await api(`actions/workflows/${w.id}/runs?per_page=${RUNS_PER_PIPELINE}`);
            if (!Array.isArray(own?.workflow_runs)) throw new Error(`GitHub returned no runs for workflow ${w.id}`);
            runs = own.workflow_runs.map((r: any) => run({ id: r.id, status: r.status, conclusion: r.conclusion || '', event: r.event, branch: r.head_branch, head: r.head_sha, createdAt: r.created_at, updatedAt: r.updated_at, url: r.html_url }));
        }
        items.push({ id: String(w.id), name: String(w.name || w.path), enabled: w.state === 'active', url: String(w.html_url || `https://github.com/${repository}/actions`), runs });
    }
    return items.sort((a, b) => a.name.localeCompare(b.name));
}
