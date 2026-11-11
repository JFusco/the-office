import type { KnowledgeState, LearningMetrics } from '../../src/contracts/knowledge';
/** Coverage and supply are observable. Semantic application remains unknown. */
export function learningMetrics(knowledge: KnowledgeState, from: string, to: string): LearningMetrics {
    const startedAt = knowledge.learningStartedAt || null;
    const coverage: NonNullable<LearningMetrics['coverage']> = { startedAt, status: !startedAt || startedAt >= to ? 'unavailable' : startedAt > from ? 'partial' : 'complete' };
    const exposures = (knowledge.exposures || []).filter(item => item.dispatchedAt && item.dispatchedAt >= from && item.dispatchedAt < to);
    const followups = (knowledge.followups || []).filter(item => item.createdAt < to).map(item => ({ ...item, disposition: item.history.filter(entry => entry.at < to).at(-1)?.disposition || 'unknown' }));
    const exposedPairs = exposures.reduce((sum, item) => sum + item.selected.length, 0);
    return { coverage, retrievedLookups:(knowledge.lookups||[]).flatMap(s=>s.records).filter(r=>r.outcome==='served'&&r.at>=from&&r.at<to).length,verifiedKnowledgeOutcomes:(knowledge.outcomes||[]).filter(r=>r.at>=from&&r.at<to).length, assignments: exposures.length, eligibleAssignments: exposures.filter(item => item.eligible.length).length,
        exposedAssignments: exposures.filter(item => item.selected.length).length,
        eligiblePairs: exposures.reduce((sum, item) => sum + item.eligible.length, 0), exposedPairs,
        omittedPairs: exposures.reduce((sum, item) => sum + item.omitted.length, 0),
        superseded: followups.filter(item => item.disposition === 'superseded').length,
        resolved: followups.filter(item => item.disposition === 'confirmed').length,
        unresolved: followups.filter(item => ['unresolved', 'needs-input'].includes(item.disposition)).length,
        unknown: followups.filter(item => item.disposition === 'unknown').length };
}
