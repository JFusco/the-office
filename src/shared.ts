import type { Continuation, Prerequisite, QueueTiming, ReconciliationRequest, SchedulerState, ProgressionItem, WorkFailure } from './contracts/work';
import type { ConfirmedSegment, ObservationGap, TimeLedgerState } from './contracts/timing';
import type { GoalProgress, DailyCTOSummary } from './contracts/leadership';
import type { ProjectReadiness } from './contracts/health';
export type * from './contracts/health';
export type * from './contracts/work';
export { workKey } from './contracts/work';
export type * from './contracts/timing';
export type * from './contracts/leadership';
export const STAGES = ['mailbox', 'understand', 'enhance', 'plan', 'plan-review', 'implement', 'code-review', 'draft-pr', 'preview', 'qa', 'repair', 'repair-review', 'retest', 'publish', 'ci', 'ci-diagnose', 'ready-for-staging', 'staging-qa', 'complete'] as const;
export type Stage = typeof STAGES[number];
export type Role = 'pm' | 'developer' | 'lead' | 'qa' | 'cto' | 'it';
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
    board?: {
        name: string;
        url: string;
    };
    githubProject?: {
        owner: string;
        number: number;
        url: string;
    };
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
    sourceAmendment?: SourceAmendment;
    discoveryRecovery?: { requestId: string; originalWorkId: string; originalSessionId: string; baseline: string; noteId: string; findingIds: string[]; at: string };
    implementationRecovery?: { workId: string; kind: 'candidate' | 'preflight'; at: string };
    prerequisites?: Prerequisite[];
    reconciliation?: ReconciliationRequest;
    timing?: QueueTiming[];
    candidateBase?: string;
    candidateRecovery?: {
        head: string;
        findingIds: string[];
        summary: string;
    };
    ciFollowupKey?: string;
    ciRecoveryAttemptAt?: string;
    repairReason?: 'conflicts' | 'ci' | 'source';
    repairCycle?: DeliveryRepairCycle;
    mergeApprovalRequired?: boolean;
    mergeAuthorization?: {
        head: string;
        at: string;
    };
    boardUpdates?: BoardUpdate[];
    /** A model returned a genuine human decision; the card sits in Block until Joe moves it back to Ready. */
    parked?: { stage: string; reason: string; at: string; published: boolean };
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
    dependsOnPR?: number;
    updatedAt?: string;
    automaticStatus?: string;
    mergeCommit?: string;
    lastPRFingerprint?: string;
    reviewInputSha256?: string;
    steps: {
        workerId?: string;
        nativeResultSha256?: string;
        issueSha256?: string;
        stage: string;
        result: StageResult;
    }[];
}
export interface SourceAmendmentAuthorization {
    projectId: string;
    repository: string;
    jobId: string;
    issue: 91;
    originalHead: string;
    originalBase: string;
    sourceIds: string[];
    approvedBy: 'human';
    questionItemId: string;
    proposalSha256: string;
}
export interface SourceAmendment {
    id: string;
    authorization: SourceAmendmentAuthorization;
    authorizedAt: string;
    proposalFilesSha256: string;
    adoptedAt?: string;
    receipts: {
        id: string;
        authorizationId: string;
        head: string;
        base: string;
        issueSha256: string;
        scopeSha256: string;
        proofSha256: string;
        review: { workerId: string; sessionId: string };
        qa: { workerId: string; sessionId: string };
        at: string;
    }[];
}
export interface NoticePolicy {
    enabled: boolean;
    recipients: 'assignee' | 'reporter' | 'both';
    workspace: string;
    mappings: string;
    enabledAt: string;
}
export interface MergeNotice {
    id: string;
    event: string;
    key: string;
    prUrl: string;
    mergeCommit: string;
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
}
export interface Coordination {
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
    status: 'running' | 'stopping' | 'completed' | 'failed' | 'blocked' | 'interrupted';
    startedAt: string;
    lastHeartbeatAt: string;
    endedAt: string;
    elapsedMs: number;
    queuedMs: number;
    inputTokens: number | null;
    outputTokens: number | null;
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
    id: string;
    key: string;
    action: 'start-pilot' | 'resume-ticket';
    requestedAt: string;
    status: 'queued' | 'working' | 'completed' | 'blocked' | 'interrupted';
    error: string;
    intakeStatus?: string;
}
export interface OfficeSnapshot {
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
    ciHistory?: AzureBuild[];
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
export const ROLE_NAMES: Record<Role, string> = { pm: 'Morgan', developer: 'Alex', lead: 'Sam', qa: 'Riley', cto: 'Avery', it: 'Ellis' };
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
