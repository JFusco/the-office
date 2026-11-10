import type { KnowledgeState,KnowledgeSourceBinding,LessonExposure } from '../../../src/contracts/knowledge';
/** One dependency projection for accepted work, retained copies, promotion and audit events. */
export function exposureBindings(knowledge:KnowledgeState|undefined,exposure:LessonExposure):KnowledgeSourceBinding[] {
    const references=[...(exposure.evidence||[]).map(s=>s.reference),...(knowledge?.lookups?.find(r=>r.id===exposure.id)?.records||[]).flatMap(r=>r.selected.map(s=>s.reference))];
    const bindings=[...(exposure.sourceBindings||[]),...(knowledge?.lookups?.find(r=>r.id===exposure.id)?.records||[]).flatMap(r=>r.sourceBindings||[]),...references.flatMap(r=>[...(r.sourceBindings||[]),...(r.kind==='source'&&r.sourceId?[{sourceId:r.sourceId,unitId:r.unitId,version:r.version}]:[])])];
    return [...new Map(bindings.map(b=>[JSON.stringify(b),b])).values()];
}
export function requestSourceBindings(state:Pick<import('../../../src/shared').OfficeSnapshot,'knowledge'|'workLog'|'coordination'>,requestId:string):KnowledgeSourceBinding[] {
    const ids=new Set((state.workLog||[]).filter(w=>w.requestId===requestId).map(w=>w.id));
    const notice=state.coordination?.notices?.entries.find(n=>n.id===requestId&&n.kind==='knowledge-digest');
    const bindings=[...(state.knowledge?.exposures||[]).filter(e=>ids.has(e.id)||e.subject?.kind==='message'&&e.subject.id===requestId).flatMap(e=>exposureBindings(state.knowledge,e)),...(state.knowledge?.digests||[]).filter(d=>d.messageId===requestId||notice?.kind==='knowledge-digest'&&d.id===notice.digestId).flatMap(d=>d.sourceBindings)];
    return [...new Map(bindings.map(b=>[JSON.stringify(b),b])).values()];
}
