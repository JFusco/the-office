import type { Role, StageResult } from '../shared';
export type WorkKind = 'delivery' | 'intake' | 'checkpoint' | 'maintenance' | 'conversation' | 'notice' | 'mail' | 'continuation' | 'reconciliation' | 'daily-cto' | 'issue' | 'pr';
export interface WorkRef {
    projectId: string;
    kind: WorkKind;
    id: string;
}
export type CompletionCondition = 'issue-closed' | 'job-completed' | 'pr-merged';
export interface DependencyObservation {
    target: WorkRef;
    condition: CompletionCondition;
    exists: boolean;
    complete: boolean;
    version: string;
    observedAt: string;
    error: string;
}
export interface Prerequisite {
    target: WorkRef;
    condition: CompletionCondition;
    evidence: string;
    observedAt: string;
}
export type EligibilityState = 'running' | 'runnable' | 'waiting' | 'blocked' | 'terminal';
export interface WorkEligibility {
    state: EligibilityState;
    reason: string;
    owner: string;
    nextCheckAt: string | null;
}
export interface QueueTiming {
    stage?: string;
    enqueuedAt: string;
    readyAt: string;
    claimedAt: string;
    queueMs: number;
}
export interface WorkAssignment {
    id: string;
    work: WorkRef;
    stage: string;
    role: Role;
    attempt: number;
    expectedVersion: string;
    scope: {
        repository: string;
        worktree: string;
        artifacts: string;
    };
    profile: string;
    timing: QueueTiming;
    original: WorkRef | null;
    parent: WorkRef | null;
}
export interface AssignmentResult {
    assignment: WorkAssignment;
    result: StageResult;
    nativeSessionId: string;
    observedAt: string;
}
export type FailureCategory = 'transient-read' | 'authentication' | 'permission' | 'ownership' | 'uncertain-effect' | 'cancelled' | 'timeout' | 'invalid-output' | 'other';
export interface WorkFailure {
    category: FailureCategory;
    detail: string;
    dispatched: boolean;
}
export interface EffectIntent<T = unknown> {
    id: string;
    work: WorkRef;
    attemptId: string;
    operation: string;
    target: string;
    authorization: string;
    payload: T;
    expectedState: unknown;
    status: 'prepared' | 'dispatching' | 'verified' | 'uncertain' | 'rejected';
    createdAt: string;
    dispatchedAt: string;
    verifiedAt: string;
    receipt: unknown;
    error: string;
    elapsedMs: number | null;
}
export type ReconciliationAction = 'reconcile-activation' | 'reconcile-preparation' | 'reconcile-review' | 'reconcile-base-update' | 'reconcile-closeout' | 'reconcile-pr-link' | 'approve-merge' | 'retry-checkpoint' | 'reconcile-time' | 'reconcile-maintenance' | 'adopt-candidate';
export interface ReconciliationRequest {
    id: string;
    action: ReconciliationAction;
    requestedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
    head: string;
    detail: string;
}
export interface Continuation {
    id: string;
    original: WorkRef;
    checkpointId: string;
    repair: WorkRef;
    repairIssue: number;
    originalIssue: string;
    nativeRunId: string;
    nativeAuthorId?: string;
    nativeSlot: string;
    runId: string;
    status: 'waiting' | 'queued' | 'working' | 'completed' | 'blocked';
    nextCheckAt: string;
    detail: string;
}
export interface ProgressionItem {
    work: WorkRef;
    stage: string;
    rank: number;
    enqueuedAt: string;
    eligibility: WorkEligibility;
}
export interface SchedulerState {
    noticeClaims: number;
    lastClaimAt: string;
    lastProgressAt: string;
    undispatchedCycles: number;
}
export type ExecutionLane = 'delivery' | 'cto' | 'it' | 'operations';
export interface WorkClaim {
    lane?: ExecutionLane;
    id: string;
    work: WorkRef;
    owner: string;
    stage: string;
    status: 'running' | 'stopping' | 'completed' | 'interrupted';
    claimedAt: string;
    endedAt: string;
}
export const workKey = (work: WorkRef) => `${work.projectId}:${work.kind}:${work.id}`;
export interface HarnessRequest {
    closeoutSupervisionProof?: { path: string; sha256: string };
    timeClassification?: { workIds: string[]; expectedSha256: string; reason: 'recovery-work-is-administrative' };
    sourceAmendment?: import('../shared').SourceAmendmentAuthorization;
    discoveryResume?: { noteId: string; scopeDigest: string; jobDigest: string; workDigest: string };
    id: string;
    action: string;
    key: string;
    head: string;
    requestedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
    detail: string;
    lane: 'delivery' | 'it' | 'operations';
}
