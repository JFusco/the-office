/** Harper's learning loop: lessons distilled from finished delivery work. Advisory only. */
export type LessonKind = 'convention' | 'pitfall' | 'process' | 'tooling';
export type LessonStage = 'intake' | 'implement' | 'review' | 'validate' | 'repair' | 'any';
export const LESSON_KINDS: readonly LessonKind[] = ['convention', 'pitfall', 'process', 'tooling'];
export const LESSON_STAGES: readonly LessonStage[] = ['intake', 'implement', 'review', 'validate', 'repair', 'any'];
export interface LessonEvidence {
    kind: 'job' | 'ticket' | 'pr' | 'step' | 'finding' | 'rollup';
    ref: string;
    url: string;
    detail: string;
}
export interface LessonRecurrence {
    retrospectiveId: string;
    subjectId: string;
    detail: string;
    at: string;
}
export interface RepositoryInstruction {
    status: 'proposed' | 'filed' | 'declined';
    issueUrl?: string;
    filedAt?: string;
}
export interface Lesson {
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
export type RetrospectiveTrigger = 'completed' | 'parked' | 'retired' | 'repair-budget';
export type RetrospectiveSubjectKind = 'job' | 'ticket';
/** What happened at the moment of the trigger; kept because the job may change afterwards. */
export interface RetrospectiveEvent {
    stage: string;
    head: string;
    steps: number;
    reason: string;
}
export interface PendingRetrospective {
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
    id: string;
    weekEnding: string;
    metrics: DeliveryMetrics;
    summary: string;
    ineffectiveLessonIds: string[];
    officeProposalIds: string[];
    at: string;
}
export interface KnowledgeRetry {
    id: string;
    attempts: number;
    nextAt: string;
    lastError: string;
    /** Lessons this roll-up already marked not working, kept for its retries. */
    flaggedLessonIds?: string[];
}
export interface OfficeProposal {
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
    proposals: OfficeProposal[];
    lessons: Lesson[];
}
export interface KnowledgeState {
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
