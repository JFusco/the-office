import type { OfficeSnapshot } from '../../src/shared';

/** Decisions Harper needs from Joe. Each item clears itself once decided in the Lessons panel. */
export function knowledgeOutbox(state: OfficeSnapshot): { id: string; title: string; detail: string }[] {
    const knowledge = state.knowledge;
    if (!knowledge) return [];
    return [
        ...knowledge.lessons.filter(lesson => lesson.status === 'active' && lesson.needsReview).map(lesson => ({ id: `lesson-review:${lesson.id}`, title: 'Guidance needs review', detail: `${lesson.statement}\nTwo source-evidenced recurrences followed supplied guidance. Application is unknown; active guidance remains available.` })),
        ...knowledge.lessons.filter(lesson => lesson.status === 'ineffective').map(lesson => ({ id: `lesson-ineffective:${lesson.id}`, title: 'Legacy inactive guidance needs a decision', detail: `${lesson.statement}\nThis legacy entry remains outside prompts until you reactivate it. Recurrence alone does not prove guidance failed.` })),
        ...knowledge.lessons.filter(lesson => lesson.status !== 'retired' && lesson.repositoryInstruction?.status === 'proposed').map(lesson => ({ id: `lesson-issue:${lesson.id}`, title: 'Harper suggests a durable team improvement', detail: `${lesson.statement}\nFile it as a GitHub issue or decline it in Harper's Lessons panel.` })),
        ...(knowledge.officeProposals || []).filter(proposal => proposal.status === 'proposed').map(proposal => ({ id: `office-lesson:${proposal.id}`, title: 'Harper proposes an office-wide lesson', detail: `${proposal.statement}\nAccept it for every project or decline it in Harper's Lessons panel.` })),
    ];
}
