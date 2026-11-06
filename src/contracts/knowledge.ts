/** Harper's learning loop: project lessons distilled from finished delivery work. Advisory only. */
export type LessonKind = 'convention' | 'pitfall' | 'process' | 'tooling';
export type LessonStage = 'intake' | 'implement' | 'review' | 'validate' | 'repair' | 'any';
export const LESSON_KINDS: readonly LessonKind[] = ['convention', 'pitfall', 'process', 'tooling'];
export const LESSON_STAGES: readonly LessonStage[] = ['intake', 'implement', 'review', 'validate', 'repair', 'any'];
export interface LessonEvidence {
    kind: 'job' | 'pr' | 'step' | 'finding';
    ref: string;
    url: string;
    detail: string;
}
export interface Lesson {
    id: string;
    kind: LessonKind;
    statement: string;
    detail: string;
    stages: LessonStage[];
    paths: string[];
    status: 'active' | 'retired';
    evidence: LessonEvidence[];
    sourceRetrospectiveId: string;
    createdAt: string;
    updatedAt: string;
    retiredAt?: string;
    retiredBy?: 'human';
}
export type RetrospectiveTrigger = 'completed' | 'parked' | 'retired' | 'repair-budget';
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
    attemptId: string;
    summary: string;
    lessonIds: string[];
    at: string;
}
export interface KnowledgeState {
    enabled: boolean;
    /** Trigger ids already handled (or baselined); never trimmed with the display history. */
    consumed: string[];
    pending: PendingRetrospective[];
    lessons: Lesson[];
    retrospectives: RetrospectiveRecord[];
}
