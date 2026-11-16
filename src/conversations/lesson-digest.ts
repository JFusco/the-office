import type { OfficeSnapshot } from '../shared';

/** The weekly digest of Harper's proposals; its decisions are the individual ones it lists. */
export const LESSON_DIGEST = 'lesson-digest';
export const isLessonDecision = (actionId: string) => actionId === LESSON_DIGEST || /^(lesson-issue:|office-lesson:)/.test(actionId);

const PARTS = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The Eastern calendar date (YYYY-MM-DD) of the Monday that starts the moment's week; empty for an invalid date. */
export function easternWeek(moment: Date): string {
    if (Number.isNaN(moment.getTime())) return '';
    const part = Object.fromEntries(PARTS.formatToParts(moment).map(({ type, value }) => [type, value]));
    return new Date(Date.UTC(Number(part.year), Number(part.month) - 1, Number(part.day) - DAYS.indexOf(part.weekday))).toISOString().slice(0, 10);
}

export interface LessonDecision { id: string; statement: string; proposedAt: string }

/** Every proposal still waiting for Joe in the selected project, with the id its decision uses. */
export function pendingLessonDecisions(snapshot: OfficeSnapshot): LessonDecision[] {
    return [
        ...(snapshot.knowledge?.lessons || []).filter(lesson => lesson.status === 'active' && lesson.repositoryInstruction?.status === 'proposed').map(lesson => ({ id: `lesson-issue:${lesson.id}`, statement: lesson.statement, proposedAt: lesson.createdAt })),
        ...(snapshot.officeKnowledge?.proposals || snapshot.knowledge?.officeProposals || []).filter(proposal => proposal.status === 'proposed').map(proposal => ({ id: `office-lesson:${proposal.id}`, statement: proposal.statement, proposedAt: proposal.createdAt })),
    ];
}

/**
 * The proposals a digest shown at `at` contains: those made in an earlier Eastern week. This
 * week's wait for next Monday; a proposal with no readable date is due, never hidden.
 */
export function dueLessonDecisions(snapshot: OfficeSnapshot, at: Date): LessonDecision[] {
    const week = easternWeek(at);
    return pendingLessonDecisions(snapshot).filter(decision => easternWeek(new Date(decision.proposedAt)) < week);
}
