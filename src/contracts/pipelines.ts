/** How one run ended, in the same words for every provider. `other` covers skipped and neutral runs. */
export type PipelineOutcome = 'passed' | 'failed' | 'partial' | 'cancelled' | 'running' | 'other';

export interface PipelineRun {
    id: number;
    /** The provider's own status and result words, for display. */
    status: string;
    result: string;
    outcome: PipelineOutcome;
    /** Why it ran: a push, a pull request, a schedule, a person. */
    reason: string;
    /** Ran for a pull request: it judges that change, not the pipeline. */
    pullRequest: boolean;
    branch: string;
    commit: string;
    queuedAt: string;
    finishedAt: string;
    url: string;
}

/** One Azure pipeline or GitHub Actions workflow with its latest runs, newest first. */
export interface PipelineStatus {
    id: string;
    name: string;
    enabled: boolean;
    url: string;
    runs: PipelineRun[];
    /** What the newest deciding run said, kept while the latest runs decide nothing. */
    health?: 'passing' | 'failing';
}

export interface PipelineWatch {
    /** When `items` was last read in full. A failed read keeps the earlier time and items. */
    observedAt: string;
    error: string;
    items: PipelineStatus[];
}
