import type { KnowledgeContext } from '../context';
import type { KnowledgeNode,KnowledgeEdge } from '../../../src/contracts/knowledge-views';
import { IntakeLedger } from '../slack-intake/ledger';
import type { Proposal,SourceUnit } from '../slack-intake/contracts';
import { sourceVisible } from '../sources/visibility';
import { evidenceIdentity } from '../sources/evidence-record';
import { evidenceRead } from '../sources/evidence-read';
import { digest } from '../slack-intake/config';
import { captureIdentityMatches } from '../brain/capture-identity';

/** Bounded read-back only. Publication discovery never changes a capture or dispatches an effect. */
export async function publicationConnections(context:KnowledgeContext,project:string):Promise<{nodes:KnowledgeNode[];edges:KnowledgeEdge[];truncated:boolean}> {
    const result={nodes:[] as KnowledgeNode[],edges:[] as KnowledgeEdge[],truncated:false};
    if(!context.brain.captureReceipt)return result;
    const candidates:{sourceId:string;proposal:Proposal;ledger:IntakeLedger}[]=[];
    for(const source of context.registry.all()) {
        if(source.destination!=='technical-brain'||!sourceVisible(context.registry,source.id,project))continue;
        const home=context.stores.get(source.homeProjectId);if(!home)continue;
        const ledger=new IntakeLedger(home,source),rows=ledger.columns<{id:string;status:string}>('proposal',['id','status']).filter(r=>r.status==='captured');
        for(const row of rows.slice(-4)) {const proposal=ledger.get<Proposal>('proposal',row.id);if(proposal&&proposal.sourceId===source.id)candidates.push({sourceId:source.id,proposal,ledger});}
        result.truncated ||= rows.length>4;
    }
    result.truncated ||= candidates.length>4;
    const receipts=await Promise.allSettled(candidates.slice(-4).map(async entry=>({entry,receipt:await context.brain.captureReceipt!(entry.proposal.id)})));
    const mappings:{sourceId:string;evidence:string[];path:string;commit:string;hash:string}[]=[];
    for(const response of receipts)if(response.status==='fulfilled') {
        const {entry:{sourceId,proposal,ledger},receipt}=response.value;
        if(!captureIdentityMatches(receipt,proposal)||receipt.currentStatus==='quarantined'||receipt.disposition?.as!=='accepted'||!receipt.disposition.pr||!receipt.disposition.mergeCommit||receipt.lineage!=='mapped')continue;
        const evidence=proposal.units.flatMap(key=>{const unit=ledger.get<SourceUnit>('unit',key);return unit?[evidenceIdentity(sourceId,unit.id,unit.version)]:[];});
        for(const publication of receipt.publications||[])if(publication.commit===receipt.disposition.mergeCommit)mappings.push({sourceId,evidence,path:publication.path,commit:publication.commit,hash:publication.contentSha256});
    }
    result.truncated ||= mappings.length>4;
    const notes=await Promise.allSettled(mappings.slice(0,4).map(async mapping=>({mapping,body:await context.brain.read(mapping.commit,mapping.path)})));
    for(const response of notes)if(response.status==='fulfilled') {
        const {mapping,body}=response.value;
        if(body.contentSha256!==mapping.hash||digest(body.text)!==mapping.hash||!sourceVisible(context.registry,mapping.sourceId,project))continue;
        const evidence=mapping.evidence.filter(id=>!!evidenceRead(context,project,id,true));if(!evidence.length)continue;
        const id=`publication:${mapping.commit}:${mapping.path}`;
        if(!result.nodes.some(n=>n.id===id))result.nodes.push({id,title:mapping.path,kind:'technical',scope:'technical',detail:`Verified incorporation mapping at committed revision ${mapping.commit}. This is distinct from the latest note version.`,knowledgeReference:{id:`brain:${mapping.commit}:${mapping.path}`,kind:'brain',path:mapping.path,snapshot:mapping.commit,contentSha256:mapping.hash}});
        for(const from of evidence)if(!result.edges.some(e=>e.source===from&&e.target===id))result.edges.push({source:from,target:id,kind:'publication',relation:'incorporated into published note'});
    }
    return result;
}
