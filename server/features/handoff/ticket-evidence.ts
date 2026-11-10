import { attachmentKind } from './attachment-kind';
import { randomUUID } from 'node:crypto';
import { statSync, renameSync, rmSync, existsSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../store/store';
import { command } from '../../workers/process';
import { CEC } from '../../office/config';
import { readBoundedNoFollowSync } from '../../store/owned-artifact';
import { extractDocument, type Extractor } from '../../knowledge/artifacts/extraction';
import { jiraEvidence } from './jira-evidence';
import { githubEvidence } from './github-evidence';
import { EVIDENCE_LIMITS, failedCoverage, type EvidenceReadContext, type ProviderEvidence } from './evidence-contract';
import { evidenceDirectory, storeEvidence } from './evidence-artifacts';
import { assetDownloader } from './asset-download';

export async function captureTicketEvidence(store:Store,key:string,execute:typeof command=command,download=assetDownloader(),extract:Extractor=extractDocument,outerSignal?:AbortSignal) {
 const controller=new AbortController(),started=performance.now();const timer=setTimeout(()=>controller.abort(),EVIDENCE_LIMITS.captureMs);
 const signal=outerSignal?AbortSignal.any([outerSignal,controller.signal]):controller.signal;
 const directory=evidenceDirectory(store,key);
 const bounded:typeof command=async(program,args,options={})=>{
  let bytes=0;return execute(program,args,{...options,signal,timeout:Math.min(options.timeout??EVIDENCE_LIMITS.commandMs,EVIDENCE_LIMITS.captureMs-(performance.now()-started)),onOutput:(stream,chunk)=>{bytes+=Buffer.byteLength(chunk);if(bytes>EVIDENCE_LIMITS.structuredBytes)controller.abort();options.onOutput?.(stream,chunk);}});
 };
 const context:EvidenceReadContext={execute:bounded,signal,directory,download};
 try {
  const evidence=await (store.project.provider==='github'?githubEvidence(store.project,key,context):jiraEvidence(store.project,key,context));
  let aggregate=0,extractedBytes=0;
  for(const [index,attachment] of evidence.attachments.entries()){
   if(index>=EVIDENCE_LIMITS.attachments||signal.aborted||aggregate>=EVIDENCE_LIMITS.aggregateBytes){attachment.coverage={state:'truncated',detail:'Capture attachment or time budget exhausted'};continue;}
   const maxBytes=Math.min(EVIDENCE_LIMITS.attachmentBytes,EVIDENCE_LIMITS.aggregateBytes-aggregate);
   if((attachment.size??0)>maxBytes){attachment.coverage={state:'truncated',detail:'Attachment exceeds byte budget'};continue;}
   const temp=resolve(directory,'capture-'+randomUUID());
   let monitor:ReturnType<typeof setInterval>|undefined;
   try {
    if(store.project.provider==='azure'){
     monitor=setInterval(()=>{try{if(statSync(temp).size>maxBytes)controller.abort();}catch{}},25);
     await bounded('twg',['jira','workitem','attachment','download','--attachment-id',attachment.id,'--output-path',temp,'--site',CEC.site,'-o','json','--output-summary','none'],{readOnly:true,signal,timeout:EVIDENCE_LIMITS.commandMs});
    }else if(attachment.url)await download(attachment.url,temp,signal,maxBytes);else throw new Error('Attachment has no supported reader');
    const read=readBoundedNoFollowSync(temp,maxBytes);if(!('sha256' in read)){attachment.coverage={state:read.reason==='too-large'?'truncated':'unreadable',detail:read.reason};continue;}
    chmodSync(temp,0o600);aggregate+=statSync(temp).size;attachment.sha256=read.sha256;
    const path=resolve(directory,read.sha256+'.asset');if(existsSync(path)){const prior=readBoundedNoFollowSync(path,maxBytes);if(!('sha256'in prior)||prior.sha256!==read.sha256)throw new Error('Attachment identity collision');}else renameSync(temp,path);
    attachment.artifact=path;attachment.coverage={state:'complete'};
    const kind=attachmentKind(path,attachment.mime,attachment.name);
    if(kind==='image'){attachment.interpretation='unread-image';continue;}
    if(kind==='unsupported'){attachment.interpretation='unsupported';continue;}
    if(signal.aborted||performance.now()-started>EVIDENCE_LIMITS.captureMs-30_000||extractedBytes>=EVIDENCE_LIMITS.extractedBytes){attachment.coverage={state:'truncated',detail:'Extraction budget exhausted'};continue;}
    const result=await extract(path,kind);
    if(result.outcome==='extracted'&&result.text){const bytes=Buffer.byteLength(result.text);if(extractedBytes+bytes>EVIDENCE_LIMITS.extractedBytes){attachment.coverage={state:'truncated',detail:'Aggregate extracted text limit'};continue;}attachment.extracted=result.text;attachment.interpretation='text';extractedBytes+=bytes;}
    else {attachment.interpretation=result.outcome==='no-text'?'unread-image':'unsupported';attachment.coverage={state:'unreadable',detail:result.outcome};}
   }catch(error){attachment.coverage=failedCoverage(error);}finally{if(monitor)clearInterval(monitor);rmSync(temp,{force:true});}
  }
  boundRetainedEvidence(evidence);
  return {evidence,reference:storeEvidence(store,evidence)};
 }finally{clearTimeout(timer);}
}
/** Keep complete structured fields, dropping oversized tail items with explicit coverage. */
function boundRetainedEvidence(evidence:ProviderEvidence) {
 const bytes=()=>Buffer.byteLength(JSON.stringify({capturedAt:'0000-00-00T00:00:00.000Z',evidence}));
 for(const section of ['attachments','remoteLinks','links','children','comments'] as const)while(bytes()>EVIDENCE_LIMITS.structuredBytes&&evidence[section].length){evidence[section].pop();evidence.coverage[section]={state:'truncated',detail:'Retained evidence byte limit'};}
 if(bytes()>EVIDENCE_LIMITS.structuredBytes){evidence.description=null;evidence.coverage.issue={state:'truncated',detail:'Description exceeds retained byte limit'};}
 if(bytes()>EVIDENCE_LIMITS.structuredBytes){evidence.summary=evidence.summary.slice(0,10000);evidence.labels=[];}
}
