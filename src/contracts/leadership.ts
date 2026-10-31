export type GoalStatus = 'idea' | 'planned' | 'active' | 'blocked' | 'done';
export interface GoalEvidenceRef {
    projectId: string;
    kind: 'ticket' | 'job' | 'issue' | 'pr' | 'maintenance' | 'blocker';
    id: string;
    version: string;
    head: string;
}
export interface GoalProgress {
    note: string;
    blockers: string[];
    linkedWork: GoalEvidenceRef[];
    evidence: GoalEvidenceRef[];
    lastReviewId: string;
    reviewedAt: string;
}
export interface DailyGoalUpdate {
    projectId: string;
    goalId: string;
    expectedUpdatedAt: string;
    progress: string;
    blockers: string[];
    evidence: GoalEvidenceRef[];
    linkedWork: GoalEvidenceRef[];
    rationale: string;
    status: GoalStatus | null;
}
export interface GoalEvidenceRequest {
    projectId: string;
    goals: { goalId: string; expectedUpdatedAt: string }[];
    inputFingerprint: string;
    questions: string[];
}
export interface DailyCTOResult {
    evidenceRequests?: GoalEvidenceRequest[];
    summary: string;
    updates: DailyGoalUpdate[];
    unmapped: string[];
}
export interface DailyCTOReport {
    id: string;
    revision: number;
    date: string;
    dueAt: string;
    collectedAt: string;
    status: 'queued' | 'recovery-queued' | 'working' | 'assessed' | 'completed' | 'conflicted' | 'blocked' | 'interrupted' | 'coalesced';
    facts: unknown;
    result: DailyCTOResult | null;
    attemptId: string;
    recoveryHistory?: { attemptId: string; detail: string; queuedAt: string }[];
    detail: string;
    applied: string[];
    conflicts: string[];
}
export type DailyCTOSummary = Pick<DailyCTOReport, 'id' | 'date' | 'dueAt' | 'collectedAt' | 'status' | 'detail'>;
