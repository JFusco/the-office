import type { KnowledgeSourceBinding, LessonEvidence } from '../../../src/contracts/knowledge';
import type { SourceRegistry } from './registry';
import { sourceVisible } from './visibility';

/** All inputs that could have contributed text remain dependencies, including uncited exposure. */
export function proofBindings(proof: LessonEvidence): KnowledgeSourceBinding[] {
    return [...(proof.sourceBindings || []), ...(proof.source ? [proof.source] : [])];
}
export function proofAuthorized(registry: SourceRegistry, project: string, proof: LessonEvidence): boolean {
    return (proof.kind !== 'source' || !!proof.source) && proofBindings(proof).every(binding => binding.approvedTextOnly ? !!registry.get(binding.sourceId) && registry.get(binding.sourceId)!.state !== 'withdrawn' : sourceVisible(registry, binding.sourceId, project));
}
export function catalogBindings(catalog: Record<string, LessonEvidence>): KnowledgeSourceBinding[] {
    return [...new Map(Object.values(catalog).flatMap(proofBindings).map(binding => [JSON.stringify(binding), binding])).values()];
}
