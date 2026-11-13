import type { OfficeSnapshot } from '../../src/shared';

/** Decisions Harper needs from Joe. Each item clears itself once decided, here in the Outbox or in the Lessons panel. */
export function knowledgeOutbox(state: OfficeSnapshot): { id: string; title: string; detail: string }[] {
    const knowledge = state.knowledge;
    if (!knowledge) return [];
    return [
        ...knowledge.lessons.filter(lesson => lesson.status !== 'retired' && lesson.repositoryInstruction?.status === 'proposed').map(lesson => ({ id: `lesson-issue:${lesson.id}`, title: 'Harper suggests a durable team improvement', detail: `${lesson.statement}\nFile it as a GitHub issue or decline it.` })),
        ...(knowledge.officeProposals || []).filter(proposal => proposal.status === 'proposed').map(proposal => ({ id: `office-lesson:${proposal.id}`, title: 'Harper proposes an office-wide lesson', detail: `${proposal.statement}\nAccept it for every project or decline it.` })),
    ];
}
