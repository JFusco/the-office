import type { KnowledgeState } from '../../src/shared';

/** One-time cleanup of stored state from the removed recurrence and procedure-use grading. Idempotent. */
export function dropLessonGrading(knowledge: KnowledgeState): void {
    const state = knowledge as unknown as Record<string, unknown>;
    delete state.officeRecurrences; delete state.procedureUses;
    if (knowledge.rollupRetry) delete (knowledge.rollupRetry as unknown as Record<string, unknown>).flaggedLessonIds;
    for (const lesson of knowledge.lessons as unknown as Record<string, unknown>[]) {
        delete lesson.recurrences;
        // The legacy inactive status was set by recurrence counting; such a lesson was already out of prompts.
        if (lesson.status === 'ineffective') lesson.status = 'retired';
    }
    for (const rollup of (knowledge.rollups || []) as unknown as { ineffectiveLessonIds?: unknown; metrics?: Record<string, unknown>; learning?: Record<string, unknown> }[]) {
        delete rollup.ineffectiveLessonIds; delete rollup.metrics?.recurrences;
        for (const key of ['applicationUnknown', 'procedureConfirmed', 'procedureFailed', 'procedureUnknown']) delete rollup.learning?.[key];
    }
}
