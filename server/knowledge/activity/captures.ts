import type { KnowledgeContext } from '../context';
import type { KnowledgeCapture,KnowledgeCapturePage } from '../../../src/contracts/knowledge-captures';
import { IntakeLedger } from '../slack-intake/ledger';
import { sourceVisible } from '../sources/visibility';
import { BrainCaptureReceipt } from '../brain/capture-receipt';
import { captureIdentityMatches } from '../brain/capture-identity';
import { projectById } from '../../office/projects';
type CaptureMetadata={id:string;status:string;hash:string;domain:string;sourceId:string;receipt:string|null};
const key=(source:string,request:string)=>`${source}:${request}`;
const cursor=(value:string)=>Buffer.from(value).toString('base64url');
export function captureAfter(value:string):string {
    if(!value)return '';
    const decoded=Buffer.from(value,'base64url').toString();
    if(value.length>200||cursor(decoded)!==value||!/^([a-f0-9-]{36}):([a-f0-9-]{36})$/.test(decoded))throw Error('Invalid capture page');
    return decoded;
}
/** Four metadata read-backs per page; stable cursors reach all retained requests. No capture writes. */
export async function capturePage(context:KnowledgeContext,project:string,after='',selected=''):Promise<KnowledgeCapturePage> {
    const boundary=captureAfter(after),selection=captureAfter(selected),entries=[] as {sourceId:string;title:string;metadata:CaptureMetadata;key:string}[];
    for(const source of context.registry.all()){
        if(source.destination!=='technical-brain'||!sourceVisible(context.registry,source.id,project))continue;
        const home=context.stores.get(source.homeProjectId);if(!home)continue;
        for(const row of new IntakeLedger(home,source).columns<CaptureMetadata>('proposal',['id','status','hash','domain','sourceId','receipt'])){
            const identity=key(source.id,row.id);if(row.sourceId===source.id&&(selection?identity===selection:identity>boundary))entries.push({sourceId:source.id,title:source.title,metadata:row,key:identity});
        }
    }
    entries.sort((a,b)=>a.key.localeCompare(b.key));const page=entries.slice(0,selection?1:4),repository=projectById('brain').repository;
    const readbacks=await Promise.allSettled(page.map(async entry=>{
        const row=entry.metadata,base:KnowledgeCapture={requestId:row.id,detailCursor:cursor(entry.key),source:entry.title,intakeStatus:row.status,reviewStatus:'unavailable',lineage:'unavailable',noteCount:0,notes:[]};
        if(row.status!=='captured'||!context.brain.captureReceipt)return base;
        const receipt=BrainCaptureReceipt.parse(await context.brain.captureReceipt(row.id)),original=row.receipt?JSON.parse(row.receipt):undefined;
        if(!captureIdentityMatches(receipt,{...row,receipt:original}))return base;
        if(receipt.currentStatus==='quarantined')return {...base,reviewStatus:'quarantined' as const};
        const disposition=receipt.disposition;
        if(!disposition)return receipt.currentStatus==='pending'?{...base,reviewStatus:'pending' as const,lineage:'unknown' as const}:base;
        if(disposition.as!=='accepted')return {...base,reviewStatus:disposition.as,reviewedAt:disposition.at,lineage:'unknown' as const};
        if(!disposition.pr||!disposition.mergeCommit)return base;
        const mapped=receipt.lineage==='mapped'&&(receipt.publications||[]).every(note=>note.commit===disposition.mergeCommit);
        return {...base,reviewStatus:'accepted' as const,reviewedAt:disposition.at,acceptance:{pr:disposition.pr,url:`https://github.com/${repository}/pull/${disposition.pr}`,mergeCommit:disposition.mergeCommit},lineage:mapped?'mapped' as const:'unknown' as const,
            noteCount:mapped?(receipt.publications||[]).length:0,notes:selection&&mapped?(receipt.publications||[]).map(note=>({path:note.path,url:`https://github.com/${repository}/blob/${note.commit}/${note.path}`,reference:{id:`brain:${note.commit}:${note.path}`,kind:'brain' as const,path:note.path,snapshot:note.commit,contentSha256:note.contentSha256}})):[]};
    }));
    // Revoke retained titles, IDs and receipts together after every awaited read.
    const allowed=page.map((entry,index)=>({entry,index})).filter(({entry})=>sourceVisible(context.registry,entry.sourceId,project));
    const captures=allowed.map(({entry,index})=>{const response=readbacks[index];return response.status==='fulfilled'?response.value:{requestId:entry.metadata.id,detailCursor:cursor(entry.key),source:entry.title,intakeStatus:entry.metadata.status,reviewStatus:'unavailable' as const,lineage:'unavailable' as const,noteCount:0,notes:[]};});
    const last=allowed.at(-1)?.entry.key;
    const result:KnowledgeCapturePage={captures,next:!selection&&last&&entries.some(entry=>entry.key>last&&sourceVisible(context.registry,entry.sourceId,project))?cursor(last):null,
        limitations:['Four capture requests per page, sorted by stable source/request identity. Refresh from the first page for new requests.','Inbox capture is separate from Brain review. Accepted receipts link to the recorded merged PR; missing historical note mappings remain unknown.','Note links are recorded exact mappings. Inspect a note to verify its committed content. Receipt failures remain unavailable.']};
    if(Buffer.byteLength(JSON.stringify(result))>65536)throw Error('Capture page exceeds response bound');return result;
}
