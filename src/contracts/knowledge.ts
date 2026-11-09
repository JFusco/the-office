/** Harper's learning loop: lessons distilled from finished delivery work. Advisory only. */
export type LessonKind = 'convention' | 'pitfall' | 'process' | 'tooling';
/** `maintenance`: CMS maintenance stages (follow-up, vendor review, proposal and verification). */
export type LessonStage = 'intake' | 'implement' | 'review' | 'validate' | 'repair' | 'maintenance' | 'any';
export const LESSON_KINDS: readonly LessonKind[] = ['convention', 'pitfall', 'process', 'tooling'];
export const LESSON_STAGES: readonly LessonStage[] = ['intake', 'implement', 'review', 'validate', 'repair', 'maintenance', 'any'];
export interface LessonEvidence {
    /** `maintenance`: a CMS maintenance run; `artifact`: a file the run saved under its artifact root. */
    kind: 'job' | 'ticket' | 'maintenance' | 'pr' | 'step' | 'finding' | 'artifact' | 'rollup' | 'learning';
    ref: string;
    url: string;
    detail: string;
}
export interface LessonRecurrence {
    retrospectiveId: string;
    subjectId: string;
    detail: string;
    at: string;
    evidence?: LessonEvidence[];
    revision?: number;
    subject?: LearningSubject;
}
export interface RepositoryInstruction {
    status: 'proposed' | 'filed' | 'declined';
    issueUrl?: string;
    filedAt?: string;
}
export type LessonTier = 'hypothesis' | 'guidance' | 'procedure' | 'rule';
export interface Lesson {
    /** Absent only in legacy snapshots; normalized to guidance/revision 1. */
    tier?: LessonTier;
    revision?: number;
    needsReview?: boolean;
    sourceSubject?: LearningSubject;
    implementationRef?: string;
    id: string;
    scope: 'project' | 'office';
    kind: LessonKind;
    statement: string;
    detail: string;
    stages: LessonStage[];
    paths: string[];
    /** `ineffective`: recurred at least twice after it was learned; kept out of prompts until reactivated. */
    status: 'active' | 'retired' | 'ineffective';
    evidence: LessonEvidence[];
    sourceRetrospectiveId: string;
    recurrences: LessonRecurrence[];
    repositoryInstruction?: RepositoryInstruction;
    createdAt: string;
    updatedAt: string;
    retiredAt?: string;
    retiredBy?: 'human';
    reactivatedAt?: string;
}
/** `blocked`: a CMS maintenance run stopped on a blocker (the maintenance analogue of a Block park). */
export type RetrospectiveTrigger = 'completed' | 'parked' | 'retired' | 'repair-budget' | 'blocked' | 'learning';
export type RetrospectiveSubjectKind = 'job' | 'ticket' | 'maintenance' | 'feature' | 'investigation' | 'recovery' | 'orchestration' | 'message';
/** What happened at the moment of the trigger; kept because the job may change afterwards. */
export interface RetrospectiveEvent {
    stage: string;
    head: string;
    steps: number;
    reason: string;
}
export interface PendingRetrospective {
    source?: LearningSubject;
    opportunities?: LearningOpportunity[];
    eventIds?: string[];
    omittedEvents?: number;
    frozen?: boolean;
    packetDigest?: string;
    id: string;
    jobId: string;
    key: string;
    trigger: RetrospectiveTrigger;
    subject?: RetrospectiveSubjectKind;
    createdAt: string;
    event: RetrospectiveEvent;
    attempts: number;
    nextAt: string;
    lastError: string;
}
export interface RetrospectiveRecord {
    delivery?: { repairAttempts: number; reroutes: number; ciRepairs: number; timing: import('../shared').QueueTiming[] };
    source?: LearningSubject;
    eventIds?: string[];
    id: string;
    jobId: string;
    key: string;
    trigger: RetrospectiveTrigger;
    subject?: RetrospectiveSubjectKind;
    /** When the triggering event was recorded (park, completion, budget). */
    eventAt?: string;
    attemptId: string;
    summary: string;
    lessonIds: string[];
    at: string;
}
/** Deterministic, model-free counts for one week of a project's delivery. */
export interface DeliveryMetrics {
    from: string;
    to: string;
    completed: number;
    retired: number;
    parked: number;
    repairBudgets: number;
    repairAttempts: number;
    reroutes: number;
    ciRepairs: number;
    medianQueueMinutes: number | null;
    medianBlockHours: number | null;
    stillParked: number;
    retrospectives: number;
    lessonsAdded: number;
    lessonsRetired: number;
    recurrences: number;
}
export interface WeeklyRollup {
    learning?: LearningMetrics;
    researchId?: string;
    research?: WeeklyResearch;
    unavailable?: string;
    id: string;
    weekEnding: string;
    metrics: DeliveryMetrics;
    summary: string;
    ineffectiveLessonIds: string[];
    officeProposalIds: string[];
    at: string;
}
export interface KnowledgeRetry {
    learning?: LearningMetrics;
    metrics?: DeliveryMetrics;
    id: string;
    attempts: number;
    nextAt: string;
    lastError: string;
    /** Lessons this roll-up already marked not working, kept for its retries. */
    flaggedLessonIds?: string[];
}
export interface OfficeProposal {
    evidence?: LessonEvidence[];
    id: string;
    projectId: string;
    rollupId: string;
    kind: LessonKind;
    statement: string;
    detail: string;
    stages: LessonStage[];
    status: 'proposed' | 'accepted' | 'declined';
    createdAt: string;
    decidedAt?: string;
}
/** Office-wide knowledge kept in the control store; each project holds a read-only mirror. */
export interface OfficeKnowledge {
    research?: Record<string, WeeklyResearch>;
    proposals: OfficeProposal[];
    lessons: Lesson[];
}
export interface KnowledgeState {
    learningStartedAt?: string;
    exposures?: LessonExposure[];
    learningConsumed?: string[];
    learningAttempts?: Record<string, number>;
    followups?: BlockerFollowup[];
    improvements?: KnowledgeImprovement[];
    improvementGrant?: ImprovementGrant;
    research?: WeeklyResearch[];
    deliveryEvents?: RetrospectiveRecord[];
    expiredPackets?: string[];
    officeRecurrences?: (LessonRecurrence & LessonReference)[];
    procedureUses?: { id: string; operation: 'check-it'; source: LearningSubject; requestId: string; at: string; outcome: 'confirmed' | 'failed' | 'unknown' }[];

    enabled: boolean;
    /** Trigger ids already handled (or baselined); never trimmed with the display history. */
    consumed: string[];
    /** Trigger sources already baselined once, e.g. `tickets` for CEC runs. */
    baselines?: string[];
    pending: PendingRetrospective[];
    lessons: Lesson[];
    retrospectives: RetrospectiveRecord[];
    rollups?: WeeklyRollup[];
    rollupRetry?: KnowledgeRetry;
    /** Mirror of accepted office lessons, written by the Office; never edited here. */
    officeLessons?: Lesson[];
    /** Mirror of this project's open office proposals, for the outbox. */
    officeProposals?: OfficeProposal[];
}

/** Identity is typed; IDs may contain colons and are never parsed for ownership. */
export interface LearningSubject { kind: RetrospectiveSubjectKind; id: string }
export interface LearningOpportunity {
    id: string; subject: LearningSubject; key: string; stage: string; at: string;
    disposition: string; summary: string; digest: string; evidence: LessonEvidence[];
    origin: 'work' | 'harper'; phaseBoundary: boolean;
}
export interface LessonReference { scope: 'project' | 'office'; id: string; revision: number }
export interface LessonExposure {
    id: string; subject?: LearningSubject; stage: string; at: string; dispatchedAt?: string;
    digest: string; eligible: LessonReference[]; selected: LessonReference[];
    omitted: (LessonReference & { reason: 'count-limit' | 'character-limit' })[];
}
export interface LearningMetrics {
    /** Absent on reports written before activation coverage was recorded. */
    coverage?: { status: 'complete' | 'partial' | 'unavailable'; startedAt: string | null };
    assignments: number; eligibleAssignments: number; exposedAssignments: number;
    eligiblePairs: number; exposedPairs: number; omittedPairs: number;
    applicationUnknown: number; procedureConfirmed?: number; procedureFailed?: number; procedureUnknown?: number; superseded?: number; resolved: number; unresolved: number; unknown: number;
}
export interface BlockerFollowup {
    id: string; source: LearningSubject; fingerprint: string; key: string;
    lessonRefs?: LessonReference[];
    owner: 'Ellis' | 'Morgan'; nextAction: string; evidence: LessonEvidence[];
    recoveryId?: string; investigationId?: string; requestId?: string; nudgeId?: string;
    improvementId?: string; handoffId?: string; handoffIds?: string[];
    disposition: 'confirmed' | 'superseded' | 'unresolved' | 'needs-input' | 'unknown';
    createdAt: string; updatedAt: string; resolvedAt?: string;
    history: { at: string; disposition: BlockerFollowup['disposition']; fingerprint: string; detail?: string }[];
}
export interface ImprovementGrant {
    policy: 'harper-improvement-queue-v1'; source: string; registeredAt: string;
    projectId: string; enabled: boolean;
}
export interface KnowledgeImprovement {
    id: string; problemKey: string; destination: string; cause: string; change: string;
    regression: string; acceptance: string[]; incidents: string[]; evidence: LessonEvidence[];
    digest: string; origin: 'work' | 'harper'; grant?: string;
    status: 'proposed' | 'reserved' | 'publishing' | 'uncertain' | 'open' | 'closed' | 'needs-input';
    manifest?: import('./features').FeatureManifest;
    handoffId?: string;
    nextCheckAt?: string;
    /** Unsuccessful admission or reconciliation attempts; drives the retry backoff. */
    reconcileAttempts?: number;
    providerId?: string; url?: string; effectIds: string[]; detail: string; createdAt: string;
}
export interface ResearchTopic { id: string; question: string; technology: string; version: string }
export interface ResearchSource {
    topicId?: string; applicability?: 'unknown'; contradictions?: string;
    url: string; retrievedAt: string; version: string; primary: boolean;
    readEvidence: string; claim: string;
}
export interface WeeklyResearch {
    id: string; topics: ResearchTopic[]; host: string; attempts: number;
    status: 'pending' | 'running' | 'completed' | 'partial' | 'unavailable';
    inputDigest: string; attemptId?: string; nextAt: string; startedAt?: string; finishedAt?: string;
    sources: ResearchSource[]; findings: string[]; unavailable: string[];
}
