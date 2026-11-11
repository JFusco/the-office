import type { KnowledgeLookupSummary } from '../../../src/contracts/knowledge-lookups';
import type { Lesson } from '../../../src/contracts/knowledge';
import type { SourceRegistry } from '../sources/registry';
import { exposureSourceVisible } from '../sources/lesson-visibility';
import { sourceVisible } from '../sources/visibility';
import { publicReference } from './public-reference';
export function lookupSummaryVisible(registry:SourceRegistry,project:string,summary:KnowledgeLookupSummary,lessons:Lesson[]):boolean {
    return summary.records.every(record=>(record.sourceBindings||[]).every(b=>exposureSourceVisible(registry,project,b))&&record.selected.every(({reference:r})=>r.kind==='source'?!!r.sourceId&&sourceVisible(registry,r.sourceId,project):r.kind==='lesson'?!!r.lesson&&lessons.some(l=>l.id===r.lesson!.id&&l.scope===r.lesson!.scope):true));
}
export function publicLookupSummary(summary:KnowledgeLookupSummary):KnowledgeLookupSummary {
    return {...summary,records:summary.records.map(({sourceBindings,...r})=>{void sourceBindings;return {...r,selected:r.selected.map(s=>({...s,reference:publicReference(s.reference)}))};})};
}
