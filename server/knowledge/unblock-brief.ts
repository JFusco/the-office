import type { KnowledgeState, LearningSubject } from '../../src/shared';

export interface UnblockBrief { known: string; decision: string; next: string; at: string; retrospectiveId: string }
const KEPT = 50;
const key = (subject: Pick<LearningSubject, 'kind' | 'id'>) => `${subject.kind}:${subject.id}`;

/** Harper's brief for one blocked subject, written by the retrospective that the park or block already triggers. */
export function saveUnblockBrief(knowledge: KnowledgeState, subject: Pick<LearningSubject, 'kind' | 'id'>, brief: UnblockBrief): void {
    const briefs = { ...(knowledge.unblockBriefs || {}), [key(subject)]: brief };
    knowledge.unblockBriefs = Object.fromEntries(Object.entries(briefs).sort(([, a], [, b]) => a.at.localeCompare(b.at)).slice(-KEPT));
}
/** A resolved blocker no longer needs its brief. */
export function clearUnblockBrief(knowledge: KnowledgeState, subject: Pick<LearningSubject, 'kind' | 'id'>): void {
    if (knowledge.unblockBriefs?.[key(subject)]) delete knowledge.unblockBriefs[key(subject)];
}
/** The block a resumed assignment reads first. Empty when Harper wrote no brief for this subject. */
export function unblockBrief(knowledge: KnowledgeState | undefined, subject: Pick<LearningSubject, 'kind' | 'id'> | undefined): string {
    const brief = subject && knowledge?.unblockBriefs?.[key(subject)];
    return brief ? `UNBLOCK BRIEF (from Harper after this work blocked on ${brief.at.slice(0, 10)}; advisory, verify against current evidence):\nKnown: ${brief.known}\nDecision: ${brief.decision}\nNext: ${brief.next}` : '';
}
