/** Retained per-attempt diagnosis; a new head never erases the failure that led to it. */
export interface CIRepair {
    id: string;
    head: string;
    base: string;
    branch: string;
    fingerprint: string;
    inputSha256: string;
    issueUpdatedAt: string;
    evidencePath: string;
    phase: 'diagnose' | 'apply' | 'publish' | 'done' | 'blocked';
    startedAt: string;
    diagnosisStarted?: boolean;
    plan?: CIRepairPlan;
    worktree?: string;
    hooksPath?: string;
    repairedHead?: string;
}
export interface CIRepairPlan {
    kind: 'source' | 'commit-messages' | 'pr-metadata' | 'retry' | 'blocked';
    summary: string;
    evidence: string[];
    messages: { sha: string; message: string }[];
    title: string;
    body: string;
    runId: number;
}
