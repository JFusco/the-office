import type { KnowledgeState, Lesson } from '../../src/shared';

type Stored = Record<string, unknown>;
const LEARNING = ['applicationUnknown', 'procedureConfirmed', 'procedureFailed', 'procedureUnknown'];

/** Removes one stored lesson's recurrence grading. Source-validity reviews keep their flag. Idempotent. */
export function dropLessonGradingFields(lesson: Lesson): void {
    const stored = lesson as unknown as Stored;
    delete stored.recurrences;
    // The legacy inactive status was set by recurrence counting; such a lesson was already out of prompts.
    if (stored.status === 'ineffective') stored.status = 'retired';
    // Only recurrence counting raised a review flag without a source reason.
    if (lesson.needsReview && !lesson.sourceReviewReason) delete lesson.needsReview;
}

function dropReportFields(report: { metrics?: object; learning?: object }): void {
    delete (report.metrics as Stored | undefined)?.recurrences;
    for (const key of LEARNING) delete (report.learning as Stored | undefined)?.[key];
}

/** One-time cleanup of stored state from the removed recurrence and procedure-use grading. Idempotent. */
export function dropLessonGrading(knowledge: KnowledgeState): void {
    const state = knowledge as unknown as Stored;
    delete state.officeRecurrences; delete state.procedureUses;
    for (const lesson of [...knowledge.lessons, ...(knowledge.officeLessons || [])]) dropLessonGradingFields(lesson);
    // A pending roll-up reuses its frozen metrics, so they are cleaned as well as the saved reports.
    if (knowledge.rollupRetry) { delete (knowledge.rollupRetry as unknown as Stored).flaggedLessonIds; dropReportFields(knowledge.rollupRetry); }
    for (const rollup of knowledge.rollups || []) { delete (rollup as unknown as Stored).ineffectiveLessonIds; dropReportFields(rollup); }
}
