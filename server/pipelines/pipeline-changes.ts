import type { PipelineRun, PipelineStatus } from '../../src/contracts/pipelines';

export interface PipelineChange { pipeline: PipelineStatus; to: 'failing' | 'passing'; run: PipelineRun }

/**
 * The newest run that settles whether the pipeline works. Cancelled, skipped and running runs do
 * not, and neither does a pull request's run: that one judges the change it ran for.
 */
export function decidingRun(pipeline: PipelineStatus): PipelineRun | undefined {
    return pipeline.runs.find(run => !run.pullRequest && (run.outcome === 'passed' || run.outcome === 'failed' || run.outcome === 'partial'));
}

const health = (run: PipelineRun) => run.outcome === 'passed' ? 'passing' as const : 'failing' as const;

/** Each pipeline with its health: its deciding run's, or the one last known when no run decides. */
export function withHealth(previous: readonly PipelineStatus[], next: readonly PipelineStatus[]): PipelineStatus[] {
    return next.map(pipeline => {
        const run = decidingRun(pipeline), known = run ? health(run) : previous.find(p => p.id === pipeline.id)?.health;
        return known ? { ...pipeline, health: known } : pipeline;
    });
}

/**
 * Pipelines that moved between passing and failing since the last observation. A pipeline seen for
 * the first time, and one that fails again while already failing, is not a change.
 */
export function pipelineChanges(previous: readonly PipelineStatus[], next: readonly PipelineStatus[]): PipelineChange[] {
    const changes: PipelineChange[] = [];
    for (const pipeline of next) {
        const was = previous.find(p => p.id === pipeline.id)?.health, run = decidingRun(pipeline);
        if (was && run && was !== health(run)) changes.push({ pipeline, to: health(run), run });
    }
    return changes;
}
