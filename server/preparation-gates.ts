import {preparationReceiptBindings} from './preparation-receipts';
import {lstatSync,readFileSync,readdirSync} from 'node:fs';
import {resolve,relative,sep,isAbsolute} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {artifact,rootArtifact,digest,ownedPath,terminationObservation} from './readback-evidence';
import {continuationWorkerProof,continuationNativeReview} from './continuation-evidence';
import {completedExecution} from './worker-completion';
import {historicalArtifactPath} from './historical-artifact-path';
import type {Store} from './store';
import type {TicketJob,StageResult} from '../src/shared';
const within=(root:string,path:string)=>{const suffix=relative(resolve(root),path);return path===resolve(path)&&!!suffix&&suffix!=='..'&&!suffix.startsWith('..'+sep)&&!isAbsolute(suffix);};
/** Candidate qualification does not accept aliases; full native and provider proof is still required. */
export function readyOnlyReceiptHistory(store:Store,job:TicketJob,result:StageResult){return preparationReceiptBindings(store,job,result)!==undefined;}

/** Positive accepted QA readback binds the actual prior native approval, not its mutable historical inputs. */
export function acceptedNativeGate(store:Store,job:TicketJob,options:{directCompleted?:boolean}={}){
 const files:ReturnType<typeof artifact>[]=[],read=(path:string)=>{const file=artifact(store,path);files.push(file);return JSON.parse(readFileSync(path,'utf8'));};
 const review=job.steps.filter(s=>s.stage==='review').at(-1)!,qa=job.steps.filter(s=>s.stage==='validate').at(-1)!;
 const lead=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-review').at(-1);
 if(!lead||lead.role!=='lead'||lead.status!=='completed'||!lead.sessionId||!lead.endedAt)throw new Error('Actual completed source review required');
 if(!/^[a-zA-Z0-9-]+$/.test(lead.id))throw new Error('Invalid source worker identity');
 const dir=(id:string,name:string)=>resolve(store.dataRoot,'sessions',id,name);
 const lp=read(dir(lead.id,'provider.json')),lr=read(dir(lead.id,'result.json'));
 if(lp.project!==store.project.id||lp.repository!==store.project.repository||lp.role!=='lead'||lp.provider!==lead.provider||lp.readOnly!==true||lr.session!==lead.sessionId||lr.result?.outcome!=='passed'||lr.result.commit!==job.head)throw new Error('Owned source review identity disagrees');
 for(const key of ['outcome','summary','commit','findings','receipts','worktree','branch','prId','paidRuns','blocker','prerequisites']as const)
  if(!isDeepStrictEqual(lr.result[key],review.result[key]))throw new Error('Accepted source review differs from actual native result');
 if(!Array.isArray(lr.result.evidence)||!lr.result.evidence.every((e:unknown)=>review.result.evidence.some(r=>isDeepStrictEqual(e,r))))throw new Error('Native review evidence is not retained');
 terminationObservation(store,lead);
 if(options.directCompleted){
  const nativeArtifacts:{root:string;file:ReturnType<typeof artifact>}[]=[];
  const original=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-validate').at(-1);
  if(!original||original.role!=='qa'||original.provider!=='codex'||original.status!=='completed'||!original.endedAt||original.sessionId===lead.sessionId||Date.parse(lead.endedAt)>Date.parse(original.startedAt))throw Error('Direct completed independent source QA required');
  for(const [work,step,readOnly]of [[lead,review,true],[original,qa,false]]as const){
   if(!completedExecution(store,work))throw Error('Direct source gate execution receipt required');
   const bound=continuationWorkerProof(store,job,work,readOnly,job.worktree),saved=bound.result as StageResult;
   if(saved.outcome!=='passed'||saved.commit!==job.head||saved.worktree!==job.worktree||saved.branch!==job.branch||saved.paidRuns!==0||saved.findings.some(f=>work===lead?f.status==='open':f.status!=='verified')||saved.receipts.some(r=>!r.verified||r.uncertain))throw Error('Direct source gate result is unresolved');
   for(const key of ['outcome','summary','commit','findings','receipts','worktree','branch','prId','paidRuns','blocker','prerequisites']as const)if(!isDeepStrictEqual(saved[key],step.result[key]))throw Error('Direct source gate differs from its actual result');
   if(!saved.evidence.length||!saved.evidence.every(e=>step.result.evidence.some(r=>isDeepStrictEqual(e,r))))throw Error('Direct source gate evidence missing');
   const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
   if(rows.length!==1)throw Error('Direct source claim required');const claim=JSON.parse(rows[0].body);
   if(claim.id!==work.claimId||claim.status!=='completed'||claim.stage!==(work===lead?'review':'validate')||claim.lane!=='delivery'||claim.work?.kind!=='delivery'||claim.work.id!==job.id||claim.work.projectId!==store.project.id||[claim.claimedAt,claim.endedAt,work.startedAt,work.endedAt].some(t=>!Number.isFinite(Date.parse(t||'')))||Date.parse(claim.claimedAt)>Date.parse(work.startedAt)||Date.parse(claim.endedAt)<Date.parse(work.endedAt!))throw Error('Direct source claim identity changed');
   const native=continuationNativeReview(store,work,saved);files.push(...bound.files,artifact(store,dir(work.id,'execution-completion.json')));
   // Native files live under their separately qualified provider root, never under the private artifact root.
   nativeArtifacts.push(native);
  }
  return {files,nativeArtifacts,reviewNativeEvidence:lr.result.evidence,reviewWorker:lead.id,qaWorker:original.id,proofPath:dir(original.id,'execution-completion.json'),directCompleted:true};
 }
 const proofEntries=qa.result.evidence.filter(e=>e.path.endsWith('-validation-readback.json')&&e.commit===job.head);
 if(proofEntries.length!==1||!within(resolve(store.dataRoot,'ticket-work',job.id),proofEntries[0].path))throw new Error('One owned accepted QA proof required');
 const proof=read(proofEntries[0].path),a=proof.assessment,reader=store.state.workLog?.find(w=>w.id===proof.readerId),original=store.state.workLog?.find(w=>w.id===proof.originalWorkId);
 if(!reader||!original||reader.id!==qa.workerId||reader.requestId!==job.id||reader.ticket!==job.key||reader.role!=='qa'||reader.provider!=='codex'||reader.stage!=='validation-readback'||reader.status!=='completed'||!reader.sessionId||!reader.endedAt||reader.sessionId===lead.sessionId||
  original.requestId!==job.id||original.ticket!==job.key||original.role!=='qa'||original.stage!=='github-validate'||original.status!=='failed'||!original.sessionId||!original.endedAt||original.sessionId===reader.sessionId||Date.parse(lead.endedAt)>Date.parse(original.startedAt)||
  proof.originalSessionId!==original.sessionId||proof.readerSessionId!==reader.sessionId||!a||a.outcome!=='passed'||a.commit!==job.head||a.originalWorkId!==original.id||a.nativeSessionId!==original.sessionId||a.completeNativeExecution!==true||a.checksVerified!==true||a.effectsVerified!==true||a.noHumanHold!==true||
  !Number.isSafeInteger(a.nativeRecordCount)||a.nativeRecordCount<1||qa.nativeResultSha256!==digest(a)||!qa.result.receipts.some(r=>r.action==='validation-readback'&&r.target===original.id&&r.verified&&!r.uncertain)||
  !store.state.coordination?.requests?.some(r=>r.id===proof.intentId&&r.action==='reconcile-validation'&&r.key===job.key&&r.head===original.id&&r.status==='completed'))throw new Error('Accepted QA native proof is not positively bound');
 if(!/^[a-zA-Z0-9-]+$/.test(reader.id)||!/^[a-zA-Z0-9-]+$/.test(original.id))throw new Error('Invalid QA worker identity');
 const preparation=store.state.workLog?.filter(w=>w.requestId===job.id&&(w.stage==='github-prepare-pr'||job.stage==='draft'&&w.stage==='github-draft'&&w.status==='completed')).at(-1);
 const chronology=[lead.endedAt,original.startedAt,reader.endedAt,preparation?.startedAt].map(v=>Date.parse(v||''));
 if(chronology.some(v=>!Number.isFinite(v))||chronology[0]>chronology[1]||chronology[2]>chronology[3])throw new Error('Source gates must precede the original metadata operation');
 terminationObservation(store,reader);terminationObservation(store,original);
 if(!Array.isArray(proof.terminationObservations)||proof.terminationObservations.length!==2||proof.terminationObservations.some((o:any)=>o.workerId!==original.id||o.nativeSessionId!==original.sessionId||o.processGroupId!==original.processId||o.result!=='ESRCH'))throw new Error('Accepted QA termination proof disagrees');
 const rp=read(dir(reader.id,'provider.json')),rr=read(dir(reader.id,'result.json'));
 if(rp.project!==store.project.id||rp.repository!==store.project.repository||rp.role!=='qa'||rp.provider!==reader.provider||rp.readOnly!==true||rr.session!==reader.sessionId||!isDeepStrictEqual(rr.result,a))throw new Error('Actual Riley result disagrees with accepted QA');
 const allowed=new Set([lead.id,reader.id,original.id]);
 if(!Array.isArray(proof.evidenceDigests)||!proof.evidenceDigests.length)throw new Error('Accepted QA artifact identities missing');
 const covered=new Set<string>();
 for(const saved of proof.evidenceDigests){
  const session=relative(resolve(store.dataRoot,'sessions'),saved.path).split(sep)[0];
  if(!within(resolve(store.dataRoot,'ticket-work',job.id),saved.path)&&(!within(resolve(store.dataRoot,'sessions'),saved.path)||!allowed.has(session)))throw new Error('Foreign accepted QA artifact');
  const actual=artifact(store,saved.path);if(!isDeepStrictEqual(actual,saved))throw new Error('Accepted QA artifact bytes or parent identity changed');files.push(actual);covered.add(saved.path);
 }
 for(const [id,names]of [[lead.id,['provider.json','result.json']],[original.id,['provider.json','assignment.json','assignment-identity.json','capabilities.json','error.json','completed-output.json']],[reader.id,['provider.json','result.json','assignment-identity.json','capabilities.json']]]as [string,string[]][])
  for(const name of names)if(!covered.has(dir(id,name)))throw new Error('Accepted QA omitted a required native artifact');
 const checkpoint=read(dir(original.id,'completed-output.json'));
 if(checkpoint.outcome!=='passed'||checkpoint.commit!==job.head||checkpoint.worktree!==job.worktree||checkpoint.branch!==job.branch||a.checkpointSha256!==artifact(store,dir(original.id,'completed-output.json')).sha256||!Array.isArray(a.verifiedFindingIds)||!Array.isArray(checkpoint.findings)||!isDeepStrictEqual(checkpoint.findings,qa.result.findings)||checkpoint.findings.some((f:any)=>f.status!=='verified'||!a.verifiedFindingIds.includes(f.id)))throw new Error('Original QA checkpoint identity disagrees');
 return {files,reviewNativeEvidence:lr.result.evidence,reviewWorker:lead.id,qaWorker:reader.id,proofPath:proofEntries[0].path};
}

/** Typed historical references: protected files, tracked source, directory identity, URL, or native-bound routing context. */
export function preparationGateEvidence(store:Store,job:TicketJob,options:{directCompleted?:boolean}={}):{files:ReturnType<typeof artifact>[];references:unknown[];trackedSources:string[];gateSummary:unknown;qaProofPath?:string;nativeArtifacts?:{root:string;file:ReturnType<typeof artifact>}[]}{
 const root=resolve(store.dataRoot,'ticket-work',job.id),history=job.steps.flatMap(s=>s.result.evidence);
 if(history.every(e=>within(root,e.path)&&lstatSync(e.path).isFile()))return {files:history.map(e=>artifact(store,e.path)),references:[],trackedSources:[]as string[],gateSummary:job.steps,qaProofPath:undefined};
 const gate=acceptedNativeGate(store,job,options),files=[...gate.files],references:unknown[]=[],trackedSources:string[]=[];
 const directory=(path:string)=>{
  const identities:unknown[]=[],pending=[{path,depth:0}];let count=0,total=0;
  while(pending.length){const current=pending.pop()!;if(current.depth>16)throw new Error('Historical directory depth exceeds bound');
   const ownership=ownedPath(store,current.path),stat=lstatSync(current.path);if(!stat.isDirectory())throw new Error('Historical directory is not owned');identities.push({path:current.path,ownership});
   for(const name of readdirSync(current.path).sort().reverse()){
    if(++count>512)throw new Error('Historical directory inventory exceeds bound');const child=resolve(current.path,name),info=lstatSync(child);
    if(info.isSymbolicLink())throw new Error('Historical directory contains symbolic links');
    if(info.isDirectory())pending.push({path:child,depth:current.depth+1});
    else {const file=artifact(store,child);total+=info.size;if(total>32*1024*1024)throw new Error('Historical directory bytes exceed bound');files.push(file);}
   }
  }
  return identities;
 };
 for(const e of history){
  if(e.path===root||within(root,e.path)&&lstatSync(e.path).isDirectory()){
   references.push({id:e.id,kind:'owned-artifact-directory',path:e.path,identities:directory(e.path),reason:'Complete bounded private file inventory retained; no truncation'});continue;
  }
  if(e.path===job.worktree||within(job.worktree,e.path)){
   const stat=lstatSync(job.worktree);if(stat.isSymbolicLink()||!stat.isDirectory())throw new Error('Historical candidate directory identity is not owned');
   references.push({id:e.id,kind:'candidate-directory-context',path:job.worktree,identity:{dev:stat.dev,ino:stat.ino},reason:'Candidate directory is context; exact head, tracked references and clean state are fenced'});if(e.path===job.worktree)continue;
  }
  if(within(root,e.path)){files.push(artifact(store,e.path));continue;}
  const historical=historicalArtifactPath(store,job.id,e.path);
  if(historical){
   files.push(artifact(store,historical.canonicalPath));
   references.push({id:e.id,kind:'historical-installation-alias-context',path:e.path,provenance:historical,reason:'Original locator retained as context; canonical owned file bytes and installation alias identity are fenced'});continue;
  }
  if(within(resolve(store.dataRoot,'sessions'),e.path)){
   const id=relative(resolve(store.dataRoot,'sessions'),e.path).split(sep)[0];
   if(!store.state.workLog?.some(w=>w.id===id&&w.requestId===job.id))throw new Error('Historical session belongs to another job');files.push(artifact(store,e.path));continue;
  }
  if(within(job.worktree,e.path)){files.push(rootArtifact(job.worktree,e.path));trackedSources.push(relative(job.worktree,e.path));continue;}
  if(!e.path&&e.url){references.push({id:e.id,kind:'historical-url',url:e.url,reason:'Historical URL is context; no new provider evidence inferred'});continue;}
  if(!e.path&&!e.url&&gate.reviewNativeEvidence.some((row:unknown)=>isDeepStrictEqual(row,e))){
   references.push({id:e.id,kind:'native-review-diagnostic-context',reason:'Empty locator retained byte-for-byte in actual accepted native source review; context only, never source acceptance or provider proof'});continue;
  }
  if(e.id==='memory-routing'&&e.kind==='review'&&e.environment==='historical routing, independently revalidated'&&gate.reviewNativeEvidence.some((row:unknown)=>isDeepStrictEqual(row,e))){
   references.push({id:e.id,kind:'historical-routing-context',path:e.path,reason:'Retained in actual native review; do not dereference or use as source acceptance'});continue;
  }
  throw new Error('Unknown required historical evidence boundary');
 }
 const unique=new Map<string,ReturnType<typeof artifact>>();for(const file of files){const prior=unique.get(file.path);if(prior&&!isDeepStrictEqual(prior,file))throw new Error('Historical artifact changed between reads');unique.set(file.path,file);}
 return {files:[...unique.values()],...('nativeArtifacts'in gate?{nativeArtifacts:gate.nativeArtifacts}:{}),references,qaProofPath:gate.proofPath,trackedSources:[...new Set(trackedSources)],gateSummary:{head:job.head,sourceReviewWorker:gate.reviewWorker,qaReader:gate.qaWorker,qaProof:gate.proofPath,
  stages:job.steps.map(s=>({stage:s.stage,outcome:s.result.outcome,commit:s.result.commit,summary:s.result.summary,findings:s.result.findings,receipts:s.result.receipts})),references}};
}
