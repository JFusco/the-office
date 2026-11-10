import type { KnowledgeContext } from '../context';
import type { KnowledgeMap } from '../../../src/contracts/knowledge-views';
import { evidenceRecords } from '../sources/evidence-read';
import { lessonVisible } from '../sources/lesson-visibility';
import { sourceVisible } from '../sources/visibility';
import { knowledgeSnapshot } from '../knowledge-snapshot';
/** Edges come from retained subscriptions and citations; distance carries no authority. */
export function knowledgeMap(context: KnowledgeContext, project: string,global = false): KnowledgeMap {
    const nodes: KnowledgeMap['nodes'] = [{ id: global?'office:knowledge':`project:${project}`, title: global?'Office knowledge':project, kind: 'project',scope:global?'office':'project', detail: global?'Approved Office guidance and published technical knowledge':'Current project scope' }], edges: KnowledgeMap['edges'] = [];
    const sources = global?[]:context.registry.all().filter(s => sourceVisible(context.registry, s.id, project)).slice(0, 100);
    for (const source of sources) {
        nodes.push({ id: `stream:${source.id}`, title: source.title, kind: 'source',scope:'project', detail: `${source.destination} · ${source.state} · home ${source.homeProjectId}` });
        edges.push({ source: `project:${project}`, target: `stream:${source.id}`, kind: 'subscription' });
    }
    const records = global?[]:evidenceRecords(context, project,true), evidence = records.filter(r => sources.some(s => s.id === r.sourceId)).slice(0, 200);
    for (const r of evidence) { nodes.push({ id: r.id, title: r.unitId, kind: 'evidence',scope:'project', detail: `Version ${r.version} · ${r.readerVersion}`, reference: r.id,knowledgeReference:{id:r.id,kind:'source',sourceId:r.sourceId,unitId:r.unitId,version:r.version,contentSha256:r.contentSha256} }); edges.push({ source: `stream:${r.sourceId}`, target: r.id, kind: 'provenance' }); }
    const knowledge = knowledgeSnapshot(context.registry,project,context.stores.get(project)?.state.knowledge);
    const lessons = [...(global?[]:knowledge?.lessons || []), ...(knowledge?.officeLessons || [])].filter(l => l.status === 'active' && lessonVisible(context.registry, project, l)).slice(0, 100);
    for (const lesson of lessons) {
        const id = `lesson:${lesson.scope}:${lesson.id}`; nodes.push({ id, title: lesson.statement, kind: 'lesson',scope:lesson.scope, detail: `${lesson.detail}\n\nRevision ${lesson.revision||1} · ${lesson.scope} · ${lesson.tier || 'guidance'}${lesson.needsReview ? ' · review needed' : ''}` });
        for (const proof of lesson.evidence) if (evidence.some(e => e.id === proof.ref)) edges.push({ source: id, target: proof.ref, kind: 'citation' });
        if(global)edges.push({source:'office:knowledge',target:id,kind:'promotion'});
    }
    const assignments=global?[]:(knowledge?.exposures||[]).filter(e=>e.dispatchedAt).slice(-20),ids=new Set(nodes.map(n=>n.id));
    const connect=(assignment:string,target:string,kind:'supplied'|'retrieved'|'verified')=>{if(ids.has(target)&&!edges.some(e=>e.source===assignment&&e.target===target&&e.kind===kind))edges.push({source:assignment,target,kind});};
    for(const e of assignments){const id=`assignment:${e.id}`;nodes.push({id,title:`${e.stage} assignment`,kind:'assignment',scope:'project',reference:e.id,detail:'Recorded knowledge exposure. Supplied and retrieved knowledge do not establish application.'});
        for(const r of e.selected)connect(id,`lesson:${r.scope}:${r.id}`,'supplied');for(const r of e.evidence||[])connect(id,r.reference.id,'supplied');
        for(const r of knowledge?.lookups?.find(r=>r.id===e.id)?.records||[])if(r.outcome==='served')for(const s of r.selected)connect(id,s.reference.id,'retrieved');
        for(const r of knowledge?.outcomes?.filter(r=>r.assignmentId===e.id)||[]){for(const s of r.lessons)connect(id,`lesson:${s.scope}:${s.id}`,'verified');for(const s of r.evidence)connect(id,s.id,'verified');}
    }
    const result: KnowledgeMap = { nodes: nodes.sort((a,b) => a.id.localeCompare(b.id)), edges: edges.slice(0,1000), truncated: edges.length > 1000 || records.length > evidence.length || !global&&context.registry.all().filter(s => sourceVisible(context.registry,s.id,project)).length > sources.length || lessons.length === 100 || !global&&(knowledge?.exposures||[]).filter(e=>e.dispatchedAt).length>assignments.length };
    while (Buffer.byteLength(JSON.stringify(result)) > 512 * 1024 && result.nodes.length > 1) {
        const removed = result.nodes.pop()!; result.edges = result.edges.filter(e => e.source !== removed.id && e.target !== removed.id); result.truncated = true;
    }
    return result;
}
