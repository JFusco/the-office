import type { Role, StageResult } from '../shared';
export type WorkKind = 'assessment' | 'feature' | 'delivery' | 'intake' | 'checkpoint' | 'maintenance' | 'conversation' | 'notice' | 'mail' | 'continuation' | 'reconciliation' | 'daily-cto' | 'issue' | 'pr' | 'retrospective' | 'knowledge-rollup';
export interface WorkRef {
    projectId: string;
    kind: WorkKind;
    id: string;
}
export interface DeliveryAdmission {
    kind: 'pickup' | 'manual' | 'linked-pr' | 'repair-followup';
    projectId: string;
    jobId: string;
    key: string;
    reference: string;
    at: string;
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
/**
 * Why blocked work is not running. Absent on other states. `needs-decision` is recorded only where the harness
 * knows a person must decide (parked work, a hold, missing authority); blocked work with no recorded cause is
 * `unclassified`, never assumed to be a decision.
 */
export type BlockedCause = 'needs-decision' | 'failed' | 'interrupted' | 'unconfirmed' | 'dependency' | 'paused' | 'unclassified';
/**
 * What blocked work is counted under. `awaiting-repair` is never a cause the scheduler projects: it
 * is read from a repair-wait marker where work is counted, and stands in only for a stop that is
 * unclassified, failed or interrupted (see server/incidents/repair/).
 */
export type CountedCause = BlockedCause | 'awaiting-repair';
/** Harness-classified reason a stage stopped. Labels the stop only; it grants no retry or authority. */
export type StopKind = 'provider-checks' | 'pr-not-ready' | 'source-closed' | 'uncertain-effect' | 'transient' | 'paused' | 'hold' | 'authority' | 'unclassified';
export interface StopReason {
    kind: StopKind;
    at: string;
}
/**
 * A harness repair in progress covers this stopped work: the Office's own answer, in the project's
 * store, to "is this exact stop waiting on a fix?". Written only by server/incidents/repair/. It
 * grants no retry, no resume and no authority, and never hides a stronger cause.
 */
export interface RepairWait {
    /** The incident and the `repair-started` event this wait belongs to. */
    incident: string;
    repair: string;
    /** A digest of `repair`, and what a saved marker is matched by: saved text is redacted, so the ID itself can come back changed. Absent on a marker saved before it was kept. */
    repairDigest?: string;
    issue: { repository: string; number: number; url: string };
    /** The incident subject, as `project/kind/id`, and the digest the repair recorded for it. */
    subject: string;
    digest: string;
    /** The stop this wait is for, as the project's own record stood; a later stop of the same record is not covered. */
    stands: { stage: string; episode: string; stop: StopReason | null; head: string };
    since: string;
    /** The last recorded progress of the repair: its start, a fix bound, or that fix found in the running release. */
    progressAt: string;
    /** Set once, 48 hours after the last progress; an expired wait is never brought back for the same repair. */
    expiredAt?: string;
}
export interface WorkEligibility {
    state: EligibilityState;
    reason: string;
    owner: string;
    nextCheckAt: string | null;
    cause?: BlockedCause;
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
export type FailureCategory = 'transient-read' | 'authentication' | 'permission' | 'ownership' | 'uncertain-effect' | 'cancelled' | 'timeout' | 'invalid-output' | 'provider-limit' | 'other';
export interface WorkFailure {
    /** Harness-classified shutdown warning; never inferred from model prose. */
    code?: 'surviving-subprocesses';
    category: FailureCategory;
    /** When the provider said to try again, for a `provider-limit` failure whose message stated it. */
    retryAt?: string;
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
    /** Set when an attempted write was read back as never having landed (`Effects.notLanded`); the intent is then `rejected`. */
    notLandedAt?: string;
    /** The GitHub writer pinned before the intent was created; absent on historical and non-GitHub intents. */
    writer?: import('./write-identity').EffectWriter;
    /** Actor-bearing read-back evidence an adapter returned with a successful verification. */
    qualification?: import('./write-identity').WriteQualification;
    /** An explicit route promotion saved on this verified qualifying Effect. */
    activation?: import('./write-identity').WriteActivation;
    /** Set when the dispatch claim refused the pinned writer; the intent is `rejected` and was never dispatched. */
    writerRefusedAt?: string;
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
export type ExecutionLane = 'delivery' | 'cto' | 'it' | 'operations' | 'knowledge';
export interface WorkClaim {
    stoppingGroups?: number[];
    stoppingObservationError?: string;
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
/**
 * Marks a request the Office queued to resume stopped work once a harness fix was found in the
 * running release: which incident, subject and fix it is for, the route it took and the release it
 * was admitted under. One per incident, subject and fix: while any request carries it, whatever
 * became of that request, the subject is not resumed for that fix again.
 */
export interface RepairResume {
    /**
     * SHA-256 of the incident, subject and fix event: what a later pass matches. The fields below
     * say the same in words, but a caller-chosen event ID can be changed by the credential
     * redaction every saved string goes through, and a digest cannot.
     */
    id: string;
    incident: string;
    /** The incident subject, as `project/kind/id`, and the digest the fix bound it by. */
    subject: string;
    digest: string;
    /** The `fix-bound` event and its commit. */
    fix: string;
    commit: string;
    action: string;
    /** SHA-256 of the route's payload in canonical form. */
    payload: string;
    /** The verified release that ran, and was known to hold the fix, when the resume was admitted. */
    release: { commit: string; operation: string };
    admittedAt: string;
    /**
     * How the job stood when the resume was admitted: how many steps it had, the stage it was at,
     * and the ID of the project event the admission emitted. What happened afterwards is told
     * from these: a step saved later, a stage left, a command recorded later. Absent on a binding
     * saved before outcomes were judged. A ticket has no steps of its own: its count is that of its
     * stage attempts (see server/incidents/repair/ticket-progress.ts). A ticket's resume admitted
     * before those were counted recorded 0 without the ticketAttemptsCounted marker. A checkpoint
     * has no steps of its own either: `run` is the original maintenance run it was linked to at the
     * admission, and `steps` counts that run's steps (see server/incidents/repair/checkpoint-progress.ts).
     * A checkpoint's resume saved without `run` cannot be judged. This is not
     * `DailyCheckpoint.repairResume`, an older field of the refresh continuation. An assignment
     * review has no steps and one stage: its baseline is 0 steps at `assignment-review` (see
     * server/incidents/repair/review-progress.ts).
     */
    stood?: { steps: number; stage: string; event: number; ticketAttemptsCounted?: true; run?: string };
}
export interface HarnessRequest {
    /** Last recorded stop; meaningful only while the request is blocked or interrupted. */
    stop?: StopReason;
    /** Set when the Office queued this request as a repair resume (see server/incidents/repair/dispatch-resume.ts). */
    repairResume?: RepairResume;
    historyRetirement?: import('./history-retirement').HistoryRetirementIntent;
    prMetadataRecovery?: import('./pr-metadata').PRMetadataRecoveryIntent;
    closeoutSupervisionProof?: { path: string; sha256: string };
    timeClassification?: { workIds: string[]; expectedSha256: string; reason: 'recovery-work-is-administrative' };
    timeScope?: { policy: 'model-work-v1'; expectedSha256: string };
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
