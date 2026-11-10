import type { KnowledgeOutcome } from '../../../src/contracts/knowledge-outcomes';
import type { Lesson } from '../../../src/contracts/knowledge';
import type { SourceRegistry } from '../sources/registry';
import { exposureSourceVisible } from '../sources/lesson-visibility';
import { sourceVisible } from '../sources/visibility';
import { publicReference } from '../lookup/public-reference';
export function outcomeVisible(registry:SourceRegistry,project:string,row:Pick<KnowledgeOutcome,'sourceBindings'|'lessons'|'evidence'>,lessons:Lesson[]):boolean {
    return row.sourceBindings.every(b=>exposureSourceVisible(registry,project,b))&&row.lessons.every(r=>lessons.some(l=>l.id===r.id&&l.scope===r.scope))&&row.evidence.every(r=>r.kind==='source'?!!r.sourceId&&sourceVisible(registry,r.sourceId,project,'evidence'):r.kind==='lesson'?!!r.lesson&&lessons.some(l=>l.id===r.lesson!.id&&l.scope===r.lesson!.scope):true);
}
export function publicOutcome(row:KnowledgeOutcome):KnowledgeOutcome {
    return {...row,sourceBindings:[],evidence:row.evidence.map(publicReference)};
}
