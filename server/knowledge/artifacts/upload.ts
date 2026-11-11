import { randomUUID } from 'node:crypto';
import { mkdirSync,writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { KnowledgeContext } from '../context';
import { digest } from '../digest';
import { privateFile } from '../sources/private-file';
import { SourceLedger } from '../sources/ledger';
import { checkedReceipt,scanText,type SecretScanner } from '../sources/admission';
import { sourceVisible } from '../sources/visibility';
import { evidenceIdentity,type EvidenceRecord } from '../sources/evidence-record';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import { extractDocument,type Extractor } from './extraction';
const MAX=10_000_000;
/** Stream only to a generated private home path; no client path is ever accepted. */
export async function uploadArtifact(context:KnowledgeContext,project:string,sourceId:string,request:Request,extract:Extractor=extractDocument,scan:SecretScanner=scanText) {
    const source=context.registry.get(sourceId),home=source&&context.stores.get(source.homeProjectId);
    if(!source||!home||source.kind!=='artifact'||source.state!=='active'||!sourceVisible(context.registry,sourceId,project))throw Error('Artifact source unavailable in this scope');
    const eligible=()=>{const current=context.registry.get(sourceId);return current?.state==='active'&&current.sourceDigest===source.sourceDigest&&sourceVisible(context.registry,sourceId,project);};
    const ledger=new SourceLedger(home,source), id=randomUUID(), path=privateFile(home,`sources/${sourceId}/artifacts/${id}/original`);
    const type=(request.headers.get('content-type')||'').split(';')[0].toLowerCase();
    const kind=type==='application/pdf'?'pdf':type==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?'docx':['text/plain','text/markdown'].includes(type)?'text':undefined;
    const save=(outcome:string,extra:Record<string,unknown>={})=>{const record={id,sourceId,outcome,at:home.clock.now().toISOString(),...extra};ledger.put('artifact',id,record);return record;};
    if(!kind)return save('unsupported');
    if(Number(request.headers.get('content-length'))>MAX)return save('oversized');
    const reader=request.body?.getReader();if(!reader)return save('malformed');
    const chunks:Uint8Array[]=[];let length=0;
    try {for(;;){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>MAX){await reader.cancel();return save('oversized');}chunks.push(value);}}finally{reader.releaseLock();}
    if(!eligible())return save('held');
    const bytes=Buffer.concat(chunks);mkdirSync(dirname(path),{recursive:true,mode:0o700});writeFileSync(path,bytes,{flag:'wx',mode:0o600});
    const original=readBoundedNoFollowSync(path,MAX);if('reason'in original)return save('unreadable');
    const result=await extract(path,kind),metadata={originalSha256:original.sha256,extractor:result.extractor,references:result.references,warnings:result.warnings};
    if(result.outcome!=='extracted')return save(result.outcome,metadata);
    if(!result.text?.trim())return save('no-text',metadata);
    if(result.text.length>500000||Buffer.byteLength(result.text)>1024*1024)return save('text-limit',metadata);
    try {
        const receipt=checkedReceipt(result.text,await scan(result.text));
        if(!eligible())return save('held',metadata);
        if(!receipt.clean)return save('scan-blocked',{...metadata,receipt});
        const contentSha256=digest(result.text),unitId=`artifact:${sourceId}`,version=digest(JSON.stringify([original.sha256,result.extractor,contentSha256])),evidenceId=evidenceIdentity(sourceId,unitId,version);
        const admittedAt=ledger.get<{at?:string}>('admission',`${unitId}:${version}`)?.at||home.clock.now().toISOString();
        const record:EvidenceRecord={id:evidenceId,sourceId,unitId,version,text:result.text,contentSha256,url:'',observedAt:home.clock.now().toISOString(),admittedAt,readerVersion:result.extractor!,extraction:{originalSha256:original.sha256,references:result.references||[],warnings:result.warnings||[]},limitations:result.warnings||[]};
        ledger.put('admission',`${unitId}:${version}`,{state:'admitted',receipt,at:admittedAt,readerVersion:result.extractor});if(!ledger.get('evidence',evidenceId))ledger.put('evidence',evidenceId,record);
        return save('admitted',{...metadata,evidenceId,version,receipt});
    }catch{return save('scan-unavailable',metadata);}
}
