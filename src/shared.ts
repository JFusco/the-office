import type { Continuation, Prerequisite, QueueTiming, ReconciliationRequest, SchedulerState, ProgressionItem, WorkFailure } from './contracts/work';
import type { ConfirmedSegment, ObservationGap, TimeLedgerState } from './contracts/timing';
import type { GoalProgress, DailyCTOSummary } from './contracts/leadership';
import type { ProjectReadiness } from './contracts/health';
export type * from './contracts/health';
export type * from './contracts/work';
export { workKey } from './contracts/work';
export type * from './contracts/timing';
export type * from './contracts/leadership';
export type * from './contracts/knowledge';
import { PERSONAS } from './contracts/people';
export type * from './contracts/people';
export { PERSONAS, OWNER, DEPARTMENTS, EMPLOYEE_IDS } from './contracts/people';
export const STAGES = ['mailbox', 'understand', 'enhance', 'plan', 'plan-review', 'implement', 'code-review', 'draft-pr', 'preview', 'qa', 'repair', 'repair-review', 'retest', 'publish', 'ci', 'ci-diagnose', 'ready-for-staging', 'staging-qa', 'complete'] as const;
export type Stage = typeof STAGES[number];
export type Role = 'pm' | 'developer' | 'lead' | 'qa' | 'cto' | 'it' | 'analyst' | 'knowledge';
export interface WorkApproach {
    plan: 'none' | 'brief' | 'reviewed';
    review: 'none' | 'focused' | 'full';
    validation: 'developer-checks' | 'independent-checks' | 'browser';
    checks: string[];
    reason: string;
}
export interface ApproachDecision {
    role: Role;
    stage: string;
    at: string;
    approach: WorkApproach;
}
export interface OfficeProject {
    id: string;
    name: string;
    provider: 'azure' | 'github';
    repo: string;
    repository: string;
    target: string;
    goalEvidencePaths?: string[];
    /** Optional harness validation commands (argv, no shell); default is the repository's `verify:ci`. */
    checks?: { name: string; command: string[]; timeoutMs?: number }[];
    board?: {
        name: string;
        url: string;
    };
    githubProject?: {
        owner: string;
        number: number;
        url: string;
    };
    /** Automation sources whose open PRs the Office adopts without a person moving each card. */
    autoAdopt?: ('pin-courier' | 'wiki-sync')[];
}
export interface AssignedIssue {
    key: string;
    summary: string;
    url: string;
    assignee: string;
    status: string;
    statusId: string;
    updated: string;
    type: string;
    subtask: boolean;
    pickupStatus?: string;
}
export interface ReadRetry {
    failure?: WorkFailure;
    attempts: number;
    nextAt: string;
    history: {
        at: string;
        detail: string;
    }[];
    exhausted: boolean;
}
export interface AssignmentReview {
    featureBinding?: import('./contracts/features').FeatureBinding;
    assessmentHold?: {kind: 'planning'; featureId: string; reason: string} | {kind: 'assessing'; episodeId: string; deadline: string | null; reason: string};
    legacyDependencyReviewPending?: boolean;
    parentReviewId?: string;
    prerequisites?: Prerequisite[];
    prerequisiteError?: string;
    resumedFor?: string;
    failure?: WorkFailure;
    timing?: QueueTiming[];
    itRecoveryAttempts?: number;
    retry?: ReadRetry;
    id: string;
    key: string;
    summary: string;
    url: string;
    queuedAt: string;
    startedAt: string;
    endedAt: string;
    status: 'queued' | 'working' | 'ready' | 'owned' | 'blocked' | 'cancelled' | 'interrupted' | 'held';
    detail: string;
    owner: string;
    workRequested?: 'automatic' | 'manual';
    prNumber?: number;
    bridgeRetryVersion?: number;
}
export interface DailyCheckpoint {
    /** Times this checkpoint's maintenance was tried again after a run that never started. */
    startRetries?: number;
    continuationId?: string;
    reconciliation?: ReconciliationRequest;
    id: string;
    date: string;
    dueAt: string;
    requestedAt: string;
    startedAt: string;
    endedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
    runId: string;
    detail: string;
    retryAt?: string;
    repairResume?: {
        issue: number;
        nextCheckAt: string;
        needsFollowup: boolean;
    };
}
export interface PickupPolicy {
    enabled: boolean;
    status: string;
}
export interface BoardUpdate {
    stage: string;
    head: string;
    project: string;
    item: string;
    field: string;
    option: string;
    target: string;
    at: string;
    status: 'pending' | 'verified' | 'uncertain';
    detail: string;
}
/** A code-owned review/repair/activation continuation; no pending source finding is accepted by this record. */
export interface ImplementationContinuation {
    sourceConfig?: {
        attempts: number; maxAttempts: 2; originalWorkId: string; proofPath: string; proofSha256: string;
        sourceId: string; baseline: Record<string, unknown>; retryAt: string;
        findingIds: string[]; proposal?: { entry: Record<string, unknown>; coverage: string; evidence: string[] };
        proposalSha256?: string; reviewedSha256?: string; attemptOpen?: boolean;
        history?: {path: string; sha256: string}[];
        proposalProof?: {path: string; sha256: string}; reviewProof?: {path: string; sha256: string};
        reservation?: {claimId: string; phase: 'repair' | 'technical-review'; head: string; stage: string; at: string; priorAttempts: number; proposalSha256: string; providerVersion: string};
        readRetry?: ReadRetry;
        readRetryProof?: {path: string; sha256: string};
    };
    originalWorkId: string;
    originalHead: string;
    noteIds: string[];
    scopeSha256: string;
    proofPath: string;
    proofSha256?: string;
    phase: 'technical-review' | 'repair' | 'activation' | 'acceptance';
    pendingFindingIds: string[];
    repairFindingIds: string[];
    round: number;
    maxRounds: 3;
}
export interface TicketJob {
    /** Last recorded stop; meaningful only while the job is blocked, interrupted or watching. */
    stop?: import('./contracts/work').StopReason;
    qaProtocol?: 'office-v1';
    admission?: import('./contracts/work').DeliveryAdmission;
    improvementId?: string;
    featureBinding?: import('./contracts/features').FeatureBinding;
    featureFloor?: { review: 'focused' | 'full'; validation?: WorkApproach['validation']; checks?: string[] };
    ciRepairs?: import('./contracts/ci-repair').CIRepair[];
    prMetadataRepair?: import('./contracts/pr-metadata').PRMetadataRepair;
    stoppedBaseUpdate?: import('./contracts/stopped-base-update').StoppedBaseUpdate;
    adoptedRepairCheckout?: import('./contracts/ci-repair').RepairCheckout;
    initialDraftConflict?: Readonly<{ originalWorkId: string; head: string; pr: number; proofPath: string; proofSha256: string }>;
    scopeRepairResumes?: { intentId: string; originalWorkId: string; head: string; proofPath: string; proofSha256: string; checkpointSha256: string; findingIds: string[]; afterStep: number; at: string }[];
    savedPrerequisiteHandoff?: { originalWorkId: string; fromHead: string; head: string; stage: 'implement' | 'scope-repair'; proofPath: string; proofSha256: string; findingIds: string[]; at: string };
    scopeRepairReadback?: { intentId: string; originalWorkId: string; fromHead: string; head: string; proofPath: string; proofSha256: string; outsideSourceIds: string[]; at: string };
    closeoutRecovery?: {
        kind?: 'core-passed' | 'cleanup-uncertain';
        originalWorkId: string; originalSessionId: string; intentId: string;
        proofPath: string; proofSha256: string; checkpointSha256: string; cleanupRequestId: string;
        status: 'cleanup-pending' | 'complete';
        operations: Record<string, { effectId: string; processId?: number; localResumption?: { proofPath: string; proofSha256: string; attempt: 1; processId?: number; startedAt: string; endedAt?: string; error?: string } }>;
        at: string;
    };
    implementationContinuation?: ImplementationContinuation;
    discoveryRecoveryHistory?: NonNullable<TicketJob['discoveryRecovery']>[];
    discoveryRecovery?: { requestId: string; originalWorkId: string; originalSessionId: string; baseline: string; noteId: string; findingIds: string[]; at: string };
    implementationRecovery?: { workId: string; kind: 'candidate' | 'preflight'; at: string };
    prerequisites?: Prerequisite[];
    reconciliation?: ReconciliationRequest;
    timing?: QueueTiming[];
    candidateBase?: string;
    /** Writer stage runs the harness abandoned and restarted from the accepted head; their work is kept under `ref`. */
    writerRestarts?: import('./contracts/writer-restart').WriterRestart[];
    /** The stopped writer run the harness would not restart, and why; other recovery owns it. */
    writerRestartDeclined?: { workId: string; reason: string; at: string };
    /** Why the last pre-restart read of the branch or PR failed; cleared when the read succeeds. */
    writerRestartReadError?: string;
    candidateRecovery?: {
        head: string;
        findingIds: string[];
        summary: string;
    };
    ciFollowupKey?: string;
    ciRecoveryAttemptAt?: string;
    ciRecoveryNoWriteProof?: { attemptAt: string; originalWorkerId: string; readerWorkerId: string; evidencePath: string; sha256: string };
    mergeScannerRetry?: { runId: number; attempt: number; head: string; evidencePath: string };
    repairReason?: 'conflicts' | 'ci' | 'source';
    repairCycle?: DeliveryRepairCycle;
    mergeApprovalRequired?: boolean;
    mergeAuthorization?: {
        head: string;
        at: string;
    };
    boardUpdates?: BoardUpdate[];
    /** A model returned a genuine human decision; the card sits in Block until Joe moves it back to Ready. */
    parked?: { stage: string; reason: string; at: string; published: boolean; release?: ReleaseWait; releaseCheckedAt?: string; releaseBaselineAt?: string; releaseFound?: string };
    /** Times the harness returned this job to the pickup lane after its npm release wait was met. */
    releaseUnparks?: number;
    /** The step whose sign-in wait the harness already returned to pickup once (`server/delivery/parking/sign-in-unpark.ts`). */
    signInUnparkedStep?: number;
    approach?: WorkApproach;
    decisions?: ApproachDecision[];
    skippedStages?: Record<string, string>;
    reviewContext?: {
        head: string;
        issueUpdatedAt: string;
        prUpdatedAt: string;
        baseSha: string;
        target: string;
        step: number;
    };
    retry?: ReadRetry;
    id: string;
    key: string;
    requestedAt: string;
    status: 'queued' | 'working' | 'blocked' | 'interrupted' | 'watching' | 'completed' | 'cancelled';
    stage: 'ci-recovery' | 'implement' | 'scope-repair' | 'update-base' | 'review' | 'validate' | 'draft' | 'lead-pr' | 'prepare-pr' | 'merge' | 'closeout';
    mergeIntentId?: string;
    mergeAttempt?: {
        head: string;
        at: string;
    };
    detail: string;
    head: string;
    worktree: string;
    branch: string;
    pr: number;
    prUrl: string;
    existingPR?: boolean;
    /** Removal of the Office-created worktree and branches after closeout or Backlog retirement. */
    candidateCleanup?: { status: 'pending' | 'done' | 'skipped'; detail: string; at: string };
    dependsOnPR?: number;
    updatedAt?: string;
    automaticStatus?: string;
    mergeCommit?: string;
    /** The head for which a maintenance-verified draft was last sent back to the prepare stage to be marked ready; once per head. */
    draftPromotionHead?: string;
    /** Set once when a stop on the harness's own parked pull request card was queued again (`server/delivery/recovery/parked-card-refusal.ts`). */
    parkedCardRequeuedAt?: string;
    /** The last time a stop after an accepted conflict assessment was queued again, once per running revision (`server/delivery/recovery/undispatched-assessment.ts`). */
    assessmentRedispatch?: { revision: string; step: number; at: string; dispatchedAt?: string };
    /** Set when the QA gate refused a passing QA result: the step that holds it and the human inputs QA ran on. */
    qaGateRefusal?: { step: number; inputSha256: string; at: string };
    /** The last time a QA result the gate refused and now accepts was queued again, once per running revision (`server/delivery/recovery/refused-qa-result.ts`). */
    qaReaccept?: { revision: string; step: number; at: string; usedAt?: string; declined?: string };
    lastPRFingerprint?: string;
    reviewInputSha256?: string;
    steps: {
        workerId?: string;
        nativeResultSha256?: string;
        stage: string;
        result: StageResult;
    }[];
}
export interface NoticePolicy {
    enabled: boolean;
    recipients: 'assignee' | 'reporter' | 'both';
    workspace: string;
    mappings: string;
    enabledAt: string;
    goals?: {
        enabled: boolean;
        enabledAt: string;
        version: string;
        targetId: string;
        targetName: string;
        workspaceId: string;
    };
    /** One channel post per merge, mentioning these Slack user IDs. */
    channel?: {
        enabled: boolean;
        channelId: string;
        channelName: string;
        workspaceId: string;
        mentionIds: string[];
        enabledAt: string;
        version: string;
    };
}
interface NoticeEntry {
    id: string;
    event: string;
    key: string;
    identity: string;
    email: string;
    text: string;
    createdAt: string;
    status: 'queued' | 'working' | 'sent' | 'blocked' | 'uncertain' | 'cancelled';
    detail: string;
    resolved?: {
        targetId: string;
        targetName: string;
        workspaceId: string;
    };
}
export type MergeNotice = NoticeEntry & ({ kind?: 'merge'; prUrl: string; mergeCommit: string; channel?: true; channelVersion?: string } | {
    kind: 'goal'; goalId: string; goalTitle: string; completedAt: string; policyVersion: string;
    prUrl?: never; mergeCommit?: never; channel?: never; channelVersion?: never;
} | {
    /** One DM per completed maintenance run, to the recipient Joe verified for goal-completion DMs. */
    kind: 'maintenance'; runId: string; policyVersion: string;
    prUrl?: never; mergeCommit?: never; channel?: never; channelVersion?: never;
});
export interface TimeEntry {
    revision?: number;
    worklogId?: string;
    id: string;
    key: string;
    date: string;
    seconds: number;
    sourceIds: string[];
    status: 'pending' | 'posting' | 'posted' | 'uncertain' | 'excluded';
    detail: string;
    url: string;
    /** Times a GitHub day that failed before any write was returned to pending, and when it last was (`server/time/unsent-time.ts`). */
    unsentReleases?: number;
    unsentCheckedAt?: string;
}
/** An automated PR the harness bridged (or refused to bridge) into existing-PR delivery. */
export interface DependabotAdoption { bot?: 'pin-courier' | 'wiki-sync'; id: string; pr: number; url: string; title: string; issue: number; status: 'adopting' | 'adopted' | 'refused' | 'blocked' | 'withdrawn'; detail: string; at: string; relinkError?: string }
/** A Dependabot alert the harness turned into an issue because no pull request came for it. */
export interface DependabotAlertIssue { id: string; alert: number; package: string; issue: number; status: 'tracking' | 'tracked' | 'resolved' | 'blocked'; detail: string; at: string }
export interface Coordination {
    adoptions?: DependabotAdoption[];
    alertIssues?: DependabotAlertIssue[];
    requests?: import('./contracts/work').HarnessRequest[];
    dependencyObservations?: import('./contracts/work').DependencyObservation[];
    continuations?: Continuation[];
    merges?: {
        enabled: boolean;
        authorizedAt: string;
    };
    notices?: {
        policy: NoticePolicy;
        entries: MergeNotice[];
    };
    time?: TimeLedgerState;
    pickup?: PickupPolicy;
    jobs?: TicketJob[];
    enabled: boolean;
    activatedAt: string;
    lastTickAt: string;
    nextDueAt: string;
    checkpoints: DailyCheckpoint[];
    listener: {
        lastCheckedAt: string;
        nextCheckAt: string;
        error: string;
        assigned: AssignedIssue[];
        reviews: AssignmentReview[];
    };
}
export interface GitHubBoard {
    title: string;
    url: string;
    description: string;
    readme: string;
    observedAt: string;
    error: string;
    lanes: string[];
    items: {
        id: string;
        number: number;
        title: string;
        url: string;
        repository: string;
        state: string;
        status: string;
    }[];
}
export interface GitHubIssue {
    number: number;
    key: string;
    title: string;
    state: string;
    url: string;
    updatedAt: string;
}
export interface GitHubPR {
    description?: string;
    descriptionTruncated?: boolean;
    linkedIssues?: number[];
    number: number;
    title: string;
    state: string;
    draft: boolean;
    author: string;
    head: string;
    base: string;
    url: string;
    mergedAt: string;
    mergeable: boolean | null;
    reviews: {
        author: string;
        state: string;
        commit: string;
    }[];
    checks: {
        name: string;
        status: string;
        conclusion: string;
        url: string;
        sha: string;
    }[];
}
export interface GitHubRun {
    id: number;
    /** The workflow this run belongs to; absent on runs observed before workflows were tracked. */
    workflowId?: number;
    name: string;
    status: string;
    conclusion: string;
    head: string;
    branch: string;
    event: string;
    attempt: number;
    url: string;
    createdAt: string;
    updatedAt: string;
    startedAt: string;
}
export interface GitHubState {
    status: Activity;
    observedAt: string;
    error: string;
    issues: GitHubIssue[];
    prs: GitHubPR[];
    runs: GitHubRun[];
    board?: GitHubBoard;
}
export interface MaintenanceResult {
    outcome: 'passed' | 'blocked' | 'reroute';
    summary: string;
    ledger: string;
    receipts: Receipt[];
    candidates: {
        issue: number;
        worktree: string;
        branch: string;
        head: string;
        summary: string;
        approach?: WorkApproach | null;
    }[];
    blocker: string;
    approach?: WorkApproach | null;
    checks?: {
        path: string;
        commit: string;
        summary: string;
        kind?: 'checks' | 'browser' | 'screenshot';
        url?: string;
    }[];
}
export interface MaintenanceRun {
    /** Brain's nightly gate as read just before the worker was dispatched; proves a blocked run never started. */
    gateBefore?: { slotDate: string; attempts: number; active: string; completed: string; head: string; changes: string };
    retirement?: import('./contracts/history-retirement').HistoryRetirement;
    /** Earlier blocked/interrupted runs this scheduled run proceeded past (their history is retained). */
    supersedes?: string[];
    originalIssue?: string;
    nativeRunId?: string;
    checkpointId?: string;
    candidateIndex?: number;
    candidateStage?: string;
    reconciliation?: ReconciliationRequest;
    timing?: QueueTiming[];
    blockerFollowup?: {
        status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
        detail: string;
        issue?: number;
    };
    readbackRetry?: ReadRetry;
    id: string;
    requestedAt: string;
    startedAt: string;
    endedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted' | 'reconciled';
    weekly: boolean;
    stage: string;
    error: string;
    steps: {
        role: Role;
        stage: string;
        result: MaintenanceResult;
        at: string;
    }[];
    decisions?: ApproachDecision[];
    /** Candidates left to the delivery pipeline because their issue is held or has an unsettled delivery job. */
    skippedCandidates?: { index: number; checkpoint: 'triage' | 'proposal'; issue: number; reason: string; at: string }[];
}
export interface ProjectGoal {
    projectId?: string;
    mapping?: 'mapped' | 'unmapped';
    progress?: GoalProgress;
    id: string;
    project: string;
    title: string;
    detail: string;
    priority: 1 | 2 | 3 | 4;
    status: 'idea' | 'planned' | 'active' | 'blocked' | 'done';
    updatedAt: string;
    requestId: string;
}
export type Activity = 'idle' | 'working' | 'waiting' | 'blocked' | 'disconnected';
export interface Evidence {
    id: string;
    kind: 'screenshot' | 'browser' | 'checks' | 'review' | 'provider' | 'deployment' | 'jira' | 'pr';
    summary: string;
    path: string;
    commit: string;
    environment: string;
    url: string;
    observedAt: string;
}
export interface Finding {
    id: string;
    summary: string;
    expected: string;
    actual: string;
    status: 'open' | 'fixed' | 'verified';
    attempts: number;
}
export interface DeliveryResolution {
    kind: 'source-repair' | 'conflict-repair' | 'provider-wait' | 'permission' | 'scope' | 'human-hold' | 'uncertain-effect';
    findingIds: string[];
    evidenceIds: string[];
    /** A provider-wait on a published npm release; absent on results saved before it existed. */
    release?: ReleaseWait | null;
}
export interface ReleaseWait {
    registry: 'npm';
    package: string;
    /** Lowest stable x.y.z that satisfies the wait. */
    minimum: string;
}
export interface DeliveryRepairCycle {
    owner: 'developer';
    findingAttempts: Record<string, number>;
    attempts: number;
    pendingFindingIds: string[];
    sourceStage: string;
    sourceHead: string;
    phase: 'repair' | 'review' | 'verify' | 'diagnosis';
    diagnosisRequestId?: string;
    approachRevision?: number;
    diagnosisAttempted?: boolean;
    exhaustedApproach?: string;
    publishedHead?: string;
}
export interface StageResult {
    qa?: import('./contracts/qa').OfficeQAReport | null;
    resolution?: DeliveryResolution | null;
    prerequisites?: Prerequisite[] | null;
    outcome: 'passed' | 'failed' | 'blocked' | 'reroute';
    summary: string;
    commit: string;
    evidence: Evidence[];
    findings: Finding[];
    receipts: Receipt[];
    previewUrl: string;
    worktree: string;
    branch: string;
    prId: number;
    qaRunDir: string;
    paidRuns: number | null;
    blocker: string;
    approach?: WorkApproach | null;
}
export interface Receipt {
    id: string;
    action: string;
    target: string;
    verified: boolean;
    uncertain: boolean;
    detail: string;
}
export interface Ticket {
    /** The ticket after staging acceptance: promotion pull request and production deploy. */
    production?: import('./contracts/production').ProductionFollow;
    /** Last recorded stop; meaningful only while the ticket is blocked. */
    stop?: import('./contracts/work').StopReason;
    officeQAHandoffs?: import('./contracts/office-qa-handoff').OfficeQAHandoff[];
    /** Recent QA reports for the inspector; complete immutable history stays in native attempts/artifacts. */
    qaHistory?: { stage: Stage; result: StageResult }[];
    /** The stage attempt whose saved result was applied to this ticket after it was found missing; never applied twice. */
    recoveredAttemptId?: string;
    /** The count of consecutive QA setup stops Joe has already been shown; a resume at this count runs one more attempt. */
    qaSetupStopsConfirmed?: number;
    /** The stage, candidate and exact stop that count was shown for; a count without it, or for another stop, was not shown for this one. */
    qaSetupStopsConfirmedFor?: string;
    /** The QA run directory of the sign-in wait the Office already resumed once by itself (`server/cec/qa/resume-after-sign-in.ts`). */
    signInResumedFor?: string;
    qaProtocol?: Partial<Record<Stage, 'office-v1'>>;
    qaPlanRetries?: import('./contracts/qa-plan-retry').QAPlanRetry[];
    qaPlanContinuations?: import('./contracts/qa-plan-continuation').QAPlanContinuation[];
    implementationContinuation?: import('./contracts/cec-implementation-continuation').ImplementationContinuation;
    implementationContinuationHold?: { workerId: string; note: string; at: string };
    savedPlanRecoveryFailure?: { at: string; detail: string };
    savedPlanRecovery?: { workerId: string; resultPath: string; resultSha256: string; analysisPath: string; analysisSha256: string; at: string };
    improvementId?: string;
    featureBinding?: import('./contracts/features').FeatureBinding;
    featureFloor?: { review: 'focused' | 'full'; validation?: WorkApproach['validation']; checks?: string[] };
    externalPlan?: { featureId: string; approvalId: string; digest: string };
    repairCycle?: DeliveryRepairCycle;
    routeChanges?: number;
    prerequisites?: Prerequisite[];
    timing?: QueueTiming[];
    key: string;
    summary: string;
    type: string;
    status: string;
    statusId: string;
    assignee: string;
    subtask: boolean;
    boardMember: boolean;
    url: string;
    updated: string;
    stage: Stage;
    activity: Activity;
    blocker: string;
    runId: string;
    attempt: number;
    commit: string;
    branch: string;
    worktree: string;
    previewUrl: string;
    prId: number;
    results: Partial<Record<Stage, StageResult>>;
    findings: Finding[];
    evidence: Evidence[];
    pilot: boolean;
    observedAt: string;
    progressUpdates?: {
        stage: Stage;
        target: string;
        at: string;
        result: StageResult;
    }[];
    repairAttempts?: Record<string, number>;
    approach?: WorkApproach;
    decisions?: ApproachDecision[];
    skippedStages?: Partial<Record<Stage, string>>;
    approachReturnStage?: Stage;
    /** Set when the harness parked the ticket in Jira Blocked for a human decision; moving it back to fromStatus resumes it. */
    parked?: { stage: Stage; reason: string; at: string; fromStatus: string; marker: string; published: boolean; resumeRequestedAt?: string; commentAttempt?: number };
    /** The last parked decision Joe resolved by moving the ticket back; stage workers treat its comment as answered. */
    resolvedDecision?: { marker: string; reason: string; status: string; at: string };
    /** Set when a draft pull request was opened on a head that moved forward from the accepted candidate; `confirmed` is the commit the confirming repair settled on. */
    headMove?: { from: string; to: string; prId: number; at: string; confirmed?: string };
    /** A change being verified at its own scope: the verified commit it was made on, and the ticket's approach to return to. */
    changeScope?: { base: string; approach: WorkApproach;
        /** Required checks QA did not pass on the base: the harness keeps them in every scope stated for this change. */ owed?: string[];
        /** Required checks QA passed on the base, with the commit they passed on; one is not repeated unless the scope names it. */ carried?: { checks: string[]; commit: string } };
}
export interface OfficeEvent {
    id: number;
    at: string;
    kind: string;
    message: string;
    role?: Role;
    ticket?: string;
}
export interface Agent {
    id: Role;
    name: string;
    title: string;
    activity: Activity;
    task: string;
    ticket: string;
    sessionId: string;
    lastSeen: string;
    lastOutcome?: {
        ticket: string;
        summary: string;
        status: string;
        at: string;
    };
    provider?: 'claude' | 'codex';
    model?: string;
    effort?: string;
    observedModel?: string;
}
export interface WorkTime {
    requestedModel?: string | null;
    requestedEffort?: string | null;
    observedModel?: string | null;
    observedEffort?: string | null;
    timerStatus?: 'live' | 'last-confirmed';
    claimId?: string;
    lane?: import('./contracts/work').ExecutionLane;
    processId?: number;
    segments?: ConfirmedSegment[];
    gaps?: ObservationGap[];
    measurement?: {
        rawElapsedMs: number;
        wallAt: string;
    };
    effortKind?: 'substantive' | 'administrative';
    effortCorrection?: { requestId: string; originalDigest: string; originalKind: 'substantive'; auditPath: string; at: string };
    failure?: WorkFailure;
    originalId?: string;
    enqueuedAt?: string;
    readyAt?: string;
    id: string;
    role: Role;
    task: string;
    ticket: string;
    stage: string;
    requestId: string;
    sessionId: string;
    provider: string;
    model: string;
    effort: string;
    /** Provider execution completion is distinct from the task's semantic outcome. */
    executionStatus?: 'completed';
    /** The stage accepted the result this timed-out run saved before it was stopped; its failure is no longer an open question. */
    completionAccepted?: true;
    status: 'running' | 'stopping' | 'completed' | 'failed' | 'blocked' | 'interrupted';
    startedAt: string;
    lastHeartbeatAt: string;
    endedAt: string;
    elapsedMs: number;
    queuedMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
    /** Normalized usage and estimated cost; legacy token fields above keep provider-native meaning. */
    accounting?: import('./contracts/telemetry').RunAccounting;
    durationUncertain: boolean;
    reportedAt: string;
}
export interface AzureBuild {
    timerStatus?: 'live' | 'last-confirmed';
    id: number;
    name: string;
    status: string;
    result: string;
    commit: string;
    branch: string;
    url: string;
    queuedAt?: string;
    startedAt?: string;
    finishedAt?: string;
    observedAt?: string;
    queueMs?: number | null;
    durationMs?: number | null;
    linkedTickets?: string[];
    relatedPrIds?: number[];
    timingError?: string;
    stages: {
        name: string;
        state: string;
        result: string;
        issues: string[];
        id?: string;
        parentId?: string;
        type?: string;
        attempt?: number;
        startedAt?: string;
        finishedAt?: string;
        durationMs?: number | null;
    }[];
}
export interface AzureGoalDocument {
    repository: string;
    projectId: string;
    repositoryId: string;
    commit: string;
    path: string;
    blob: string;
    sha256: string;
    observedAt: string;
    context: 'deployed' | 'pr';
    text: string;
    bytes: number;
    truncated: boolean;
    error: string;
}
export interface AzurePR {
    description?: string;
    descriptionTruncated?: boolean;
    id: number;
    title: string;
    draft: boolean;
    status: string;
    source: string;
    target: string;
    commit: string;
    mergeCommit: string;
    url: string;
    closedAt?: string;
    policies: {
        name: string;
        status: string;
        buildId: number;
    }[];
}
export interface HumanAction {
    id: string;
    title: string;
    detail: string;
    role: Role;
    ticket: string;
    url: string;
    status: 'open' | 'resolved';
    createdAt: string;
    updatedAt: string;
}
export interface TeamMessage {
    timing?: QueueTiming[];
    inputRecovery?: { originalMessageId: string; workerId: string; originalSha256: string; artifacts: { path: string; sha256: string }[] };
    slackReplacement?: import('./contracts/slack-supersession').SlackReplacementRequest;
    goalEvidenceReturn?: { requestId: string; answerId: string };
    goalEvidenceRequest?: { reviewId: string; projectId: string; goalIds: string[]; goals: { goalId: string; expectedUpdatedAt: string }[]; fingerprint: string };
    goalReport?: { projectId: string; goalIds: string[]; summary: string };
    resolvedBy?: {
        messageId: string;
        project: string;
        verifiedAt: string;
    };
    contextProject?: string;
    id: string;
    requestId: string;
    from: 'human' | Role;
    to: Role;
    ticket: string;
    actionId: string;
    body: string;
    status: 'queued' | 'working' | 'answered' | 'failed' | 'interrupted';
    createdAt: string;
    sessionId: string;
    recheck: boolean;
    error: string;
    recipients: Role[];
    receipts: Receipt[];
    question?: string;
}
export interface SlackDelivery {
    supersededBy?: import('./contracts/slack-supersession').SlackSupersession;
    supersessionHistory?: import('./contracts/slack-supersession').SlackSupersession[];
    supersession?: import('./contracts/slack-supersession').SlackSupersessionView;
    id: string;
    requestId: string;
    targetType: 'person' | 'channel';
    targetId: string;
    targetName: string;
    workspaceId: string;
    text: string;
    status: 'sending' | 'verifying' | 'confirmed' | 'uncertain';
    channelId: string;
    messageTs: string;
    permalink: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    error: string;
}
export function slackMessageUrl(url: string, channelId: string, messageTs: string): boolean {
    try {
        const u = new URL(url);
        return u.protocol === 'https:' && !u.username && !u.password && !u.port && !u.search && !u.hash && u.hostname.endsWith('.slack.com') && /^[CDG][A-Z0-9]+$/.test(channelId) && /^\d+\.\d{6}$/.test(messageTs) && u.pathname === `/archives/${channelId}/p${messageTs.replace('.', '')}`;
    }
    catch {
        return false;
    }
}
export interface DeliveryRequest {
    qaReadContinuation?: import('./contracts/qa-ownership-read').QAOwnershipReadContinuation;
    qaReadContinuationRepair?: import('./contracts/qa-ownership-read').QAOwnershipReadContinuation;
    officeQAHandoff?: import('./contracts/office-qa-handoff').OfficeQAHandoffRequest;
    qaPlanRetry?: import('./contracts/qa-plan-retry').QAPlanRetryRequest;
    implementationContinuation?: import('./contracts/cec-implementation-continuation').ImplementationContinuationRequest;
    featureBinding?: import('./contracts/features').FeatureBinding;
    id: string;
    key: string;
    action: 'start-pilot' | 'resume-ticket' | 'continue-saved-implementation';
    requestedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
    error: string;
    intakeStatus?: string;
}
/** Office-wide display and interaction preferences, stored by the local service. */
export interface OfficePreferences {
    quality: 'high' | 'low';
    reducedMotion: boolean;
    keyboardShortcuts: boolean;
    deliveryToasts: boolean;
    coffeeBreaks: boolean;
    revision: number;
}
export type OfficePreferencesPatch = Partial<Omit<OfficePreferences, 'revision'>>;
export const OFFICE_PREFERENCE_DEFAULTS: OfficePreferences = { quality: 'high', reducedMotion: false, keyboardShortcuts: true, deliveryToasts: true, coffeeBreaks: true, revision: 0 };
/** Preference responses carry the service identity so a client can scope revision ordering. */
export type OfficePreferencesResponse = OfficePreferences & { serviceInstanceId: string };
/** Read-only public projection of the effective office configuration. */
/** One project's resolved policy and, for a bound Jira/Azure project, its non-secret connection facts. */
export interface OfficeConfigProjectSettings {
    policy: { merge: 'human' | 'harness'; handsOff: boolean; checkpoint: { hour: number; weekends: boolean } };
    jira: { site: string; projectKey: string; intakeStatuses: string[]; defaultPickup: string };
    azure: { organization: string; project: string };
}
export interface OfficeConfigSummary {
    projects: ({ id: string; name: string; provider: 'azure' | 'github'; repository: string; target: string; boardName: string | null; boardUrl: string | null } & Partial<OfficeConfigProjectSettings>)[];
    cec: { site: string; organization: string; project: string; repository: string; target: string };
    holds: { key: string; reason: string }[];
}
export interface OfficeSnapshot {
    preferences?: OfficePreferences;
    features?: import('./contracts/features').Feature[];
    featureQuestions?: import('./contracts/features').FeatureQuestionProjection[];
    featurePlanning?: import('./contracts/features').FeaturePlanningActivation;
    liveAnchor?: import('./contracts/timing').LiveAnchor;
    timerStatus?: 'live' | 'last-confirmed';
    serviceInstanceId?: string;
    snapshotSequence?: number;
    draining?: boolean;
    scheduler?: SchedulerState;
    schedulerLanes?: Partial<Record<Exclude<import('./contracts/work').ExecutionLane, 'delivery'>, SchedulerState>>;
    progression?: ProgressionItem[];
    dailyCTO?: DailyCTOSummary[];
    sessionVisibility?: {
        complete: boolean;
        fresh: boolean;
        observedAt: string;
        expiresAt: string;
        sources: {
            name: string;
            ok: boolean;
            detail: string;
        }[];
        sessions: {
            id: string;
            title: string;
            status: string;
            source: string;
            ticket?: string;
        }[];
    };
    it?: ITState;
    knowledge?: import('./contracts/knowledge').KnowledgeState;
    officeKnowledge?: import('./contracts/knowledge').OfficeKnowledge;
    deliveryQueue?: DeliveryRequest[];
    project?: OfficeProject;
    projects?: {
        id: string;
        name: string;
        provider: 'azure' | 'github';
        paused: boolean;
        working: number;
        queued: number;
        needsYou: number;
    }[];
    github?: GitHubState;
    maintenance?: {
        runs: MaintenanceRun[];
        lastDaily: string;
        lastWeekly: string;
        ledger: string;
    };
    coordination?: Coordination;
    teamQueue?: {
        project: string;
        projectName: string;
        job: TicketJob;
    }[];
    pmQueue?: {
        project: string;
        projectName: string;
        review: AssignmentReview;
    }[];
    revision: number;
    serverTime: string;
    startedAt: string;
    paused: boolean;
    pilotKey: string;
    nightlyEnabled?: boolean;
    nightlyActivationReason?: string;
    nightlyDispatching?: boolean;
    pendingMail?: {
        id?: string;
        scheduled: boolean;
        requestedAt: string;
    };
    mode: 'live' | 'demo';
    intake: {
        status: Activity;
        lastChecked: string;
        error: string;
        schedule: string;
    };
    agents: Agent[];
    tickets: Ticket[];
    events: OfficeEvent[];
    outbox: HumanAction[];
    messages: TeamMessage[];
    slackDeliveries?: SlackDelivery[];
    ctoGoals?: ProjectGoal[];
    ctoMessages?: TeamMessage[];
    goals?: ProjectGoal[];
    leadershipReports?: {
        id: string;
        requestId: string;
        summary: string;
        ticket: string;
        createdAt: string;
    }[];
    workLog?: WorkTime[];
    /** When per-run usage capture began; earlier runs stay uncaptured. Set once, never reset. */
    telemetryCaptureStartedAt?: string;
    ciHistory?: AzureBuild[];
    /** Every pipeline or workflow of the project with its latest runs. */
    pipelines?: import('./contracts/pipelines').PipelineWatch;
    projectNotes: {
        id: string;
        ticket: string;
        summary: string;
        detail: string;
        requestId: string;
        createdAt: string;
    }[];
    azure: {
        status: Activity;
        observedAt: string;
        error: string;
        builds: AzureBuild[];
        prs: AzurePR[];
        goalDocuments?: AzureGoalDocument[];
        goalEvidenceGaps?: string[];
        deployed: {
            environment: string;
            image: string;
            revision: string;
            url: string;
            buildId?: number;
            commit?: string;
            healthy?: boolean;
            observedAt?: string;
        }[];
    };
    lastHandoff: {
        at: string;
        from: Role;
        to: Role;
        ticket: string;
    } | null;
}
export const ROLE_NAMES = Object.fromEntries(Object.values(PERSONAS).map(persona => [persona.id, persona.name])) as Record<Role, string>;
export const STAGE_LABELS: Record<Stage, string> = {
    mailbox: 'In the mailbox', understand: 'Reading the ticket', enhance: 'Detailing requirements', plan: 'Writing a plan',
    'plan-review': 'Reviewing the plan', implement: 'Building the fix', 'code-review': 'Reviewing the code', 'draft-pr': 'Opening a draft PR',
    preview: 'Starting the candidate', qa: 'Verifying the change', repair: 'Addressing QA findings', 'repair-review': 'Reviewing the fixes',
    retest: 'Retesting the fix', publish: 'Publishing the PR', ci: 'Waiting for Azure CI', 'ci-diagnose': 'Diagnosing Azure failure', 'ready-for-staging': 'Ready for staging',
    'staging-qa': 'Verifying the deployed change', complete: 'Verified on staging'
};
export const STAGE_ROLE: Record<Stage, Role> = {
    mailbox: 'pm', understand: 'pm', enhance: 'pm', plan: 'developer', 'plan-review': 'lead', implement: 'developer', 'code-review': 'lead',
    'draft-pr': 'developer', preview: 'developer', qa: 'qa', repair: 'developer', 'repair-review': 'lead', retest: 'qa', publish: 'developer',
    ci: 'pm', 'ci-diagnose': 'developer', 'ready-for-staging': 'pm', 'staging-qa': 'qa', complete: 'pm'
};
export function officeUrl(path: string, project = 'cec') { return project === 'cec' ? path : `${path}${path.includes('?') ? '&' : '?'}project=${encodeURIComponent(project)}`; }
export interface ServiceHealth {
    id: string;
    name: string;
    status: 'connected' | 'warning' | 'disconnected' | 'unknown';
    detail: string;
    checkedAt: string;
    kind?: 'login' | 'activity' | 'listener' | 'provider';
    statusLabel?: string;
    checkedLabel?: string;
    lastSuccessAt?: string;
    expiresAt?: string;
    sourceUrl?: string;
    identity?: string;
    nextStep?: string;
    lastFailure?: {
        at: string;
        detail: string;
    };
}
export interface ITFollowUp {
    id: string;
    owner: 'IT' | 'Morgan' | 'You';
    detail: string;
    nextAt?: string;
    /** An informational watch on the Office's own surroundings: listed, never counted. */
    routine?: boolean;
}
export interface ITReport {
    id: string;
    at: string;
    status: 'monitoring' | 'retrying' | 'needs-attention';
    summary: string;
    actions: string[];
    followUps: ITFollowUp[];
    notified: Role[];
    fingerprint: string;
}
export interface ITState {
    investigations?: import('./contracts/it-investigations').ITInvestigation[];
    projectId?: string;
    followUps?: ITFollowUp[];
    checkedAt: string;
    nextCheckAt: string;
    status: ITReport['status'];
    reports: ITReport[];
    recoveries: Record<string, {
        requestId?: string;
        attempts: number;
        nextAt: string;
        status: 'retrying' | 'needs-human' | 'resolved';
        detail: string;
    }>;
    services: ServiceHealth[];
}
export interface HealthReport {
    checkedAt: string;
    context: string;
    services: ServiceHealth[];
    it?: ITState;
    loadedHash?: string;
    readiness?: ProjectReadiness[];
    dailyCTO?: DailyCTOSummary | null;
}
