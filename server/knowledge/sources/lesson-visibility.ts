import type { Lesson, LessonEvidence } from '../../../src/contracts/knowledge';
import type { SourceRegistry } from './registry';
import { sourceVisible } from './visibility';
import { proofBindings, proofAuthorized } from './proof-scope';
export function sourceProofVisible(registry: SourceRegistry, project: string, proof: LessonEvidence): boolean {
    return proofAuthorized(registry, project, proof);
}
/** Approved Office text can be shared independently; withdrawal still excludes dependent guidance. */
export function lessonVisible(registry: SourceRegistry, project: string, lesson: Lesson): boolean {
    return lesson.evidence.every(proof => (proof.kind !== 'source' || !!proof.source) && proofBindings(proof).every(binding => !!registry.get(binding.sourceId) && registry.get(binding.sourceId)!.state !== 'withdrawn')
        && (lesson.scope === 'office' || sourceProofVisible(registry, project, proof)));
}
export function lessonForProject(registry: SourceRegistry, project: string, lesson: Lesson): Lesson {
    const foreign=lesson.scope==='office'&&lesson.originProjectId!==project;
    return { ...lesson, evidence: lesson.evidence.filter(proof => foreign ? proof.kind==='source'&&sourceProofVisible(registry,project,proof) : sourceProofVisible(registry,project,proof)),...(foreign?{sourceRetrospectiveId:'',sourceSubject:undefined,repositoryInstruction:undefined}:{}) };
}

export function lessonSourceBindings(registry: SourceRegistry, project: string, lesson: Lesson): import('../../../src/contracts/knowledge').KnowledgeSourceBinding[] {
    return lesson.evidence.flatMap(proofBindings).map(binding => lesson.scope === 'office' && !sourceVisible(registry, binding.sourceId, project) ? { sourceId: binding.sourceId, approvedTextOnly: true } : binding);
}

export function exposureSourceVisible(registry:SourceRegistry,project:string,binding:import('../../../src/contracts/knowledge').KnowledgeSourceBinding):boolean {
    return binding.approvedTextOnly?!!registry.get(binding.sourceId)&&registry.get(binding.sourceId)!.state!=='withdrawn':sourceVisible(registry,binding.sourceId,project,binding.unitId?'evidence':'metadata');
}
