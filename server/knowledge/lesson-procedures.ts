import type { Lesson } from '../../src/shared';
/** Reviewed registrations link installed code; model output cannot extend this table. */
const INSTALLED = {
    'server/knowledge/blocker-followups.ts#check-it': 'procedure',
    'server/knowledge/improvement-intake-gate.ts#improvementIntakeGate': 'rule',
} as const;
export function installedLesson(lesson: Lesson): boolean {
    return !['procedure', 'rule'].includes(lesson.tier) || !!lesson.implementationRef &&
        Object.hasOwn(INSTALLED, lesson.implementationRef) && INSTALLED[lesson.implementationRef as keyof typeof INSTALLED] === lesson.tier;
}
