import type { OfficeSnapshot } from '../../src/shared';
import { dueLessonDecisions, LESSON_DIGEST } from '../../src/conversations/lesson-digest';

/**
 * Joe's human decisions (shown in the header "Needs you" tray). Proposals are advisory, so they
 * arrive as one weekly digest rather than one question each. Every proposal can be decided at any
 * time in Harper's Lessons panel; the digest clears itself once its proposals are decided.
 */
export function knowledgeOutbox(state: OfficeSnapshot, at = new Date()): { id: string; title: string; detail: string }[] {
    const due = dueLessonDecisions(state, at);
    if (!due.length) return [];
    return [{ id: LESSON_DIGEST, title: `Harper has ${due.length} ${due.length === 1 ? 'proposal' : 'proposals'} to review`, detail: `${due.map(decision => `- ${decision.statement}`).join('\n')}\nDecide each one below or in Harper's Lessons panel.` }];
}
