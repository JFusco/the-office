import type { KnowledgeContext } from '../context';
import type { KnowledgeMap } from '../../../src/contracts/knowledge-views';
import { knowledgeSnapshot } from '../knowledge-snapshot';
/** Edges come from recorded assignments and promotions; distance carries no authority. */
export function knowledgeMap(context: KnowledgeContext, project: string,global = false): KnowledgeMap {
    const nodes: KnowledgeMap['nodes'] = [{ id: global?'office:knowledge':`project:${project}`, title: global?'Office knowledge':project, kind: 'project',scope:global?'office':'project', detail: global?'Approved Office guidance and published technical knowledge':'Current project scope' }], edges: KnowledgeMap['edges'] = [];
    const knowledge = knowledgeSnapshot(project,context.stores.get(project)?.state.knowledge);
    const lessons = [...(global?[]:knowledge?.lessons || []), ...(knowledge?.officeLessons || [])].filter(l => l.status === 'active').slice(0, 100);
    for (const lesson of lessons) {
        const id = `lesson:${lesson.scope}:${lesson.id}`; nodes.push({ id, title: lesson.statement, kind: 'lesson',scope:lesson.scope, detail: `${lesson.detail}\n\nRevision ${lesson.revision} · ${lesson.scope} · ${lesson.tier}` });
        if(global)edges.push({source:'office:knowledge',target:id,kind:'promotion'});
    }
    const assignments=global?[]:(knowledge?.exposures||[]).filter(e=>e.dispatchedAt).slice(-20),ids=new Set(nodes.map(n=>n.id));
    const connect=(assignment:string,target:string,kind:'supplied'|'retrieved'|'verified')=>{if(ids.has(target)&&!edges.some(e=>e.source===assignment&&e.target===target&&e.kind===kind))edges.push({source:assignment,target,kind});};
    for(const e of assignments){const id=`assignment:${e.id}`;nodes.push({id,title:`${e.stage} assignment`,kind:'assignment',scope:'project',reference:e.id,detail:'Recorded knowledge exposure. Supplied and retrieved knowledge do not establish application.'});
        for(const r of e.selected)connect(id,`lesson:${r.scope}:${r.id}`,'supplied');for(const r of e.evidence||[])connect(id,r.reference.id,'supplied');
        for(const r of knowledge?.lookups?.find(r=>r.id===e.id)?.records||[])if(r.outcome==='served')for(const s of r.selected)connect(id,s.reference.id,'retrieved');
        for(const r of knowledge?.outcomes?.filter(r=>r.assignmentId===e.id)||[]){for(const s of r.lessons)connect(id,`lesson:${s.scope}:${s.id}`,'verified');for(const s of r.evidence)connect(id,s.id,'verified');}
    }
    const result: KnowledgeMap = { nodes: nodes.sort((a,b) => a.id.localeCompare(b.id)), edges: edges.slice(0,1000), truncated: edges.length > 1000 || lessons.length === 100 || !global&&(knowledge?.exposures||[]).filter(e=>e.dispatchedAt).length>assignments.length };
    while (Buffer.byteLength(JSON.stringify(result)) > 512 * 1024 && result.nodes.length > 1) {
        const removed = result.nodes.pop()!; result.edges = result.edges.filter(e => e.source !== removed.id && e.target !== removed.id); result.truncated = true;
    }
    return result;
}
