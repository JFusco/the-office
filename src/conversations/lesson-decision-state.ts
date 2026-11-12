import { officeUrl, type OfficeSnapshot } from '../shared';

export type LessonDecisionAction = 'file-lesson-issue' | 'decline-lesson-issue' | 'accept-office-lesson' | 'decline-office-lesson';

/** Resolve an outbox decision in the selected project, including its durable filing request. */
export function lessonDecisionState(snapshot: OfficeSnapshot, actionId: string) {
    if (actionId.startsWith('lesson-issue:')) {
        const id = actionId.slice('lesson-issue:'.length);
        const lesson = snapshot.knowledge?.lessons.find(item => item.id === id);
        const request = snapshot.coordination?.requests?.filter(item => item.action === 'file-lesson-issue' && item.head === id).at(-1);
        return { kind: 'repository' as const, id, lesson, request,
            proposed: lesson?.status === 'active' && lesson.repositoryInstruction?.status === 'proposed',
            status: lesson?.repositoryInstruction?.status,
            approve: 'file-lesson-issue' as const, decline: 'decline-lesson-issue' as const };
    }
    if (actionId.startsWith('office-lesson:')) {
        const id = actionId.slice('office-lesson:'.length);
        const proposal = (snapshot.officeKnowledge?.proposals || snapshot.knowledge?.officeProposals || []).find(item => item.id === id);
        return { kind: 'office' as const, id, proposal, proposed: proposal?.status === 'proposed', status: proposal?.status,
            approve: 'accept-office-lesson' as const, decline: 'decline-office-lesson' as const };
    }
    return null;
}

/** Unlike the shared screen refresh, this read must reject on failure before unlocking a decision. */
export async function readLessonDecision(fetchImpl: typeof fetch, projectId: string, actionId: string) {
    const response = await fetchImpl(officeUrl('/api/office', projectId));
    if (!response.ok) throw new Error(`Office returned ${response.status}`);
    const snapshot = await response.json() as OfficeSnapshot;
    if (!projectId || snapshot.project?.id !== projectId) throw new Error('Decision status belongs to another project');
    const decision = lessonDecisionState(snapshot, actionId);
    if (!decision || !(decision.kind === 'repository' ? decision.lesson : decision.proposal)) throw new Error('Decision status is unavailable');
    return decision;
}
