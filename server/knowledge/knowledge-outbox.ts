import type { OfficeSnapshot } from '../../src/shared';

/** Decisions Harper needs from Joe. Each item clears itself once decided in the Lessons panel. */
export function knowledgeOutbox(state: OfficeSnapshot): { id: string; title: string; detail: string }[] {
    const knowledge = state.knowledge;
    if (!knowledge) return [];
    return [
        ...knowledge.lessons.filter(lesson => lesson.status === 'ineffective').map(lesson => ({ id: `lesson-ineffective:${lesson.id}`, title: 'Harper flagged a lesson that keeps recurring', detail: `${lesson.statement}\nIt recurred ${lesson.recurrences.length} times after it was learned, so it is out of the prompts. Retire it or reactivate it in Harper's Lessons panel.` })),
        ...knowledge.lessons.filter(lesson => lesson.status !== 'retired' && lesson.repositoryInstruction?.status === 'proposed').map(lesson => ({ id: `lesson-issue:${lesson.id}`, title: 'Harper suggests an AGENTS.md change', detail: `${lesson.statement}\nFile it as a GitHub issue or decline it in Harper's Lessons panel.` })),
        ...(knowledge.officeProposals || []).filter(proposal => proposal.status === 'proposed').map(proposal => ({ id: `office-lesson:${proposal.id}`, title: 'Harper proposes an office-wide lesson', detail: `${proposal.statement}\nAccept it for every project or decline it in Harper's Lessons panel.` })),
    ];
}
