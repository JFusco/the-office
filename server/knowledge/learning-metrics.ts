import type { KnowledgeState, LearningMetrics, Lesson } from '../../src/contracts/knowledge';
/** Coverage and supply are observable. Semantic application remains unknown. */
export function learningMetrics(knowledge: KnowledgeState, from: string, to: string): LearningMetrics {
    const startedAt = knowledge.learningStartedAt || null;
    const coverage: NonNullable<LearningMetrics['coverage']> = { startedAt, status: !startedAt || startedAt >= to ? 'unavailable' : startedAt > from ? 'partial' : 'complete' };
    const exposures = (knowledge.exposures || []).filter(item => item.dispatchedAt && item.dispatchedAt >= from && item.dispatchedAt < to);
    const uses = (knowledge.procedureUses || []).filter(item => item.at >= from && item.at < to);
    const followups = (knowledge.followups || []).filter(item => item.createdAt < to).map(item => ({ ...item, disposition: item.history.filter(entry => entry.at < to).at(-1)?.disposition || 'unknown' }));
    const exposedPairs = exposures.reduce((sum, item) => sum + item.selected.length, 0);
    return { coverage, retrievedLookups:(knowledge.lookups||[]).flatMap(s=>s.records).filter(r=>r.outcome==='served'&&r.at>=from&&r.at<to).length,verifiedKnowledgeOutcomes:(knowledge.outcomes||[]).filter(r=>r.at>=from&&r.at<to).length, assignments: exposures.length, eligibleAssignments: exposures.filter(item => item.eligible.length).length,
        exposedAssignments: exposures.filter(item => item.selected.length).length,
        eligiblePairs: exposures.reduce((sum, item) => sum + item.eligible.length, 0), exposedPairs,
        omittedPairs: exposures.reduce((sum, item) => sum + item.omitted.length, 0), applicationUnknown: exposedPairs,
        procedureConfirmed: uses.filter(item => item.outcome === 'confirmed').length,
        procedureFailed: uses.filter(item => item.outcome === 'failed').length,
        procedureUnknown: uses.filter(item => item.outcome === 'unknown').length,
        superseded: followups.filter(item => item.disposition === 'superseded').length,
        resolved: followups.filter(item => item.disposition === 'confirmed').length,
        unresolved: followups.filter(item => ['unresolved', 'needs-input'].includes(item.disposition)).length,
        unknown: followups.filter(item => item.disposition === 'unknown').length };
}
export function lessonsNeedingReview(knowledge: KnowledgeState): Lesson[] {
    return knowledge.lessons.filter(lesson => lesson.status === 'active' && new Set(lesson.recurrences.filter(recurrence =>
        recurrence.evidence?.length && recurrence.revision === (lesson.revision || 1) && recurrence.subjectId !== lesson.sourceSubject?.id && recurrence.at >= (lesson.reactivatedAt || lesson.createdAt) &&
        (knowledge.exposures || []).some(exposure => exposure.subject?.id === recurrence.subjectId && (!recurrence.subject || exposure.subject.kind === recurrence.subject.kind) && exposure.dispatchedAt && exposure.dispatchedAt < recurrence.at &&
            exposure.selected.some(ref => ref.id === lesson.id && ref.scope === lesson.scope && ref.revision === (lesson.revision || 1))))
        .map(recurrence => `${recurrence.subject?.kind || 'job'}:${recurrence.subjectId}`)).size >= 2);
}
