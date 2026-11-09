import type { KnowledgeImprovement, LessonEvidence, LearningSubject } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';
import { learningDigest } from './learning-events';
import { improvementIncident } from './improvement-incident';
export const IMPROVEMENT_POLICY = 'harper-improvement-queue-v1' as const;
export interface ImprovementProposal { destination?: 'project' | 'office'; cause: string; change: string; regression: string; acceptance: string[]; evidenceIds: string[] }
export function improvementDigest(item: Pick<KnowledgeImprovement, 'problemKey' | 'destination' | 'cause' | 'change' | 'regression' | 'acceptance' | 'incidents' | 'evidence'>): string {
    return learningDigest([item.problemKey, item.destination, item.cause, item.change, item.regression, item.acceptance, item.incidents, item.evidence]);
}
export function proposeImprovements(store: Store, source: LearningSubject, proposals: ImprovementProposal[], catalog: Record<string, LessonEvidence>): void {
    const knowledge = store.state.knowledge;
    if (!knowledge) return;
    const items = knowledge.improvements ??= [];
    const original = improvementIncident(store, source);
    if (!original) return;
    const incident = `${original.kind}:${original.id}`;
    const sourceKey = source.kind === 'job' ? store.state.coordination?.jobs?.find(job => job.id === source.id)?.key : source.kind === 'ticket' ? store.state.tickets.find(ticket => ticket.runId === source.id)?.key : undefined;
    if (store.state.coordination?.jobs?.some(job => job.id === source.id && job.improvementId) || store.state.tickets.some(ticket => ticket.runId === source.id && ticket.improvementId)) return;
    if (sourceKey && items.some(item => item.providerId === sourceKey)) return;
    for (const proposal of proposals) {
        const evidence = proposal.evidenceIds.filter(id => Object.hasOwn(catalog, id)).map(id => catalog[id]);
        if (!evidence.length || !proposal.cause.trim() || !proposal.change.trim() || !proposal.regression.trim() || !proposal.acceptance.length) continue;
        const destination = proposal.destination === 'office' && !store.project.repository.endsWith('/the-office') ? 'office-harness' : store.project.id;
        const problemKey = learningDigest([store.project.id, proposal.cause.trim().toLowerCase().replace(/\s+/g, ' ')]);
        let item = items.find(item => item.problemKey === problemKey && item.status !== 'closed');
        if (item && item.status !== 'proposed') continue; // published specification is immutable
        if (!item) {
            item = { id: crypto.randomUUID(), problemKey, destination, cause: proposal.cause, change: proposal.change, regression: proposal.regression, acceptance: proposal.acceptance, incidents: [], evidence: [], digest: '', origin: 'work', status: 'proposed', effectIds: [], detail: 'Waiting for two independent incidents and admission checks.', createdAt: store.clock.now().toISOString() };
            items.push(item);
        }
        if (!item.incidents.includes(incident)) { item.incidents.push(incident); item.evidence.push(...structuredClone(evidence)); }
        if (destination !== store.project.id) { item.status = 'needs-input'; item.detail = 'Office harness cause needs its configured owning destination. Morgan must route it; no issue is filed in the source project.'; }
        item.digest = improvementDigest(item);
    }
}
