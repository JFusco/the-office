import type { KnowledgeContext } from '../context';
import type { KnowledgeMap } from '../../../src/contracts/knowledge-views';
import type { BrainGraph } from '../brain/reader';
import { knowledgeMap } from './projection';
import { knowledgeSnapshot } from '../knowledge-snapshot';
import { publicationConnections } from './publications';

function bounded(result:KnowledgeMap):KnowledgeMap {
    if(result.edges.length>1000){result.edges=result.edges.slice(0,1000);result.truncated=true;}
    result.nodes.sort((a,b)=>a.id.localeCompare(b.id));
    while((result.nodes.length>500||Buffer.byteLength(JSON.stringify(result))>512*1024)&&result.nodes.length>1){const node=result.nodes.pop()!;result.edges=result.edges.filter(e=>e.source!==node.id&&e.target!==node.id);result.truncated=true;}
    return result;
}

/** One finite committed page; every Office projection is rebuilt after the awaited external read. */
export async function committedKnowledgeMap(context: KnowledgeContext, project: string, global = false): Promise<KnowledgeMap> {
    let page: BrainGraph | undefined;
    try { if(context.brain.graph)page=await context.brain.graph(await context.brain.snapshot()); } catch { /* Honest unavailable state retains scoped Office results. */ }
    const publications=global?{nodes:[],edges:[],truncated:false}:await publicationConnections(context,project);
    const result = knowledgeMap(context, project, global);
    const officeIds=new Set(result.nodes.map(n=>n.id));
    const publicationEdges=publications.edges.filter(e=>officeIds.has(e.source));
    result.nodes.push(...publications.nodes.filter(n=>publicationEdges.some(e=>e.target===n.id)));result.edges.push(...publicationEdges);result.truncated ||= publications.truncated;
    result.technicalStatus = page ? 'available' : 'unavailable';
    result.limitations = ['Visual proximity has no routing authority. Older technical revisions are not linked to a newer displayed note.','Incorporation read-back is limited to four retained capture requests and four mapped notes per view. Unknown lineage remains unknown.'];
    if (!page) return bounded(result);
    result.snapshot = page.snapshot; result.truncated ||= page.truncated;
    const ids = new Map<string, string>();
    for (const node of page.nodes) {
        const id = `technical:${node.id}`; ids.set(node.id, id);
        result.nodes.push({ id, title: node.title, kind: 'technical', scope: 'technical', detail: `${node.summary || ''}\nPublished technical revision ${page.snapshot}`,
            ...(node.kind === 'curated-note' && node.path && node.sha256 ? { knowledgeReference: { id: `brain:${page.snapshot}:${node.path}`, kind: 'brain', path: node.path, snapshot: page.snapshot, contentSha256: node.sha256 } } : {}),
        });
    }
    for(const edge of page.edges)if(ids.has(edge.source)&&ids.has(edge.target))result.edges.push({source:ids.get(edge.source)!,target:ids.get(edge.target)!,kind:'publication',relation:edge.relation});
    if(!global) {
        const knowledge=knowledgeSnapshot(context.registry,project,context.stores.get(project)?.state.knowledge);
        const connect=(assignment:string,reference:import('../../../src/contracts/knowledge-retrieval').KnowledgeReference,kind:'supplied'|'retrieved'|'verified')=>{
            const node=result.nodes.find(n=>n.kind==='technical'&&n.knowledgeReference?.id===reference.id&&n.knowledgeReference.contentSha256===reference.contentSha256);
            if(node&&result.nodes.some(n=>n.id===assignment)&&!result.edges.some(e=>e.source===assignment&&e.target===node.id&&e.kind===kind))result.edges.push({source:assignment,target:node.id,kind});
        };
        for(const exposure of knowledge?.exposures||[])if(exposure.dispatchedAt){
            const assignment=`assignment:${exposure.id}`;
            for(const selected of exposure.evidence||[])connect(assignment,selected.reference,'supplied');
            for(const record of knowledge?.lookups?.find(r=>r.id===exposure.id)?.records||[])if(record.outcome==='served')for(const selected of record.selected)connect(assignment,selected.reference,'retrieved');
            for(const outcome of knowledge?.outcomes?.filter(r=>r.assignmentId===exposure.id)||[])for(const reference of outcome.evidence)connect(assignment,reference,'verified');
        }
    }
    return bounded(result);
}
