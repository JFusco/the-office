import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {Effects} from './effects';
import {HOLDS} from './config';
import {artifact,rootArtifact,digest,sha,terminationObservation} from './readback-evidence';
import {continuationWorktree} from './continuation-evidence';
import {inspectPartialWorktree,localPathPresent} from './local-worktree-removal';
import {deliveryHumanInputs} from './github-context';
import {verifyRepairCandidate} from './delivery-repairs';
import {assertCoreCloseoutCoverage,closeoutClaim,type CloseoutOwnership} from './closeout-recovery';
import {closeoutProviderEvidence,closeoutScopeVersion,requireCloseout} from './closeout-recovery-evidence';
import {closeoutReceipt} from './github-delivery';
import {finishVerifiedCloseout} from './github-closeout';
import type {GitHubDelivery} from './github-delivery';
import {workKey} from '../src/shared';
import type {HarnessRequest,StageResult} from '../src/shared';
const names=['remote','worktree','branch']as const;
/** Three fixed cleanup primitives, each durably claimed and independently read back. No native closeout writer is rerun. */
export async function cleanupMergedCandidate(delivery:GitHubDelivery,request:HarnessRequest,ownership:()=>Promise<CloseoutOwnership>){
 const {store}=delivery,job=delivery.jobs.find(j=>j.key===request.key&&j.status!=='cancelled'),recovery=job?.closeoutRecovery;
 requireCloseout(job&&recovery&&recovery.status==='cleanup-pending'&&request.id===recovery.cleanupRequestId&&request.head===recovery.originalWorkId,'Exact reconciled original cleanup request required');
 const claim=closeoutClaim(store,request,'cleanup-merged-candidate'),requestVersion=digest(request),proofFile=artifact(store,recovery.proofPath);
 requireCloseout(proofFile.sha256===recovery.proofSha256,'Original closeout proof changed');
 const proof=JSON.parse(readFileSync(proofFile.path,'utf8')),original=proof.original;
 const legacy=recovery.kind===undefined&&proof.kind===undefined&&original.kind===undefined;
 const kind=legacy&&original.result?.outcome==='blocked'&&original.result.receipts?.filter((r:any)=>!r.verified||r.uncertain).length===1&&original.result.receipts.some((r:any)=>r.id==='merged-branch-cleanup'&&r.uncertain)?'cleanup-uncertain':!legacy&&recovery.kind===proof.kind&&proof.kind===original.kind?proof.kind:undefined;
 requireCloseout(kind==='cleanup-uncertain'||kind==='core-passed','Unknown or mismatched original recovery kind');
 if(kind==='core-passed'){requireCloseout(original.native?.root===proof.nativeRoot&&isDeepStrictEqual(original.native.file,proof.native),'Original native input and accepted proof differ');requireCloseout(original.result.outcome==='passed'&&original.cleanupFindingId===''&&original.result.receipts.every((r:any)=>r.verified&&!r.uncertain)&&original.result.findings.every((f:any)=>f.status==='verified'),'Original passed core checkpoint changed');assertCoreCloseoutCoverage(original,proof.assessment);}

 requireCloseout(proof.intentId===recovery.intentId&&proof.originalWorkId===recovery.originalWorkId&&proof.originalSessionId===recovery.originalSessionId&&proof.checkpointSha256===recovery.checkpointSha256&&proof.cleanupRequestId===request.id&&
  proof.assessment?.outcome==='passed'&&(kind==='core-passed'?proof.assessment.cleanupUnattempted===true:proof.assessment.originalDeletionNotCurrentlyApplied===true)&&proof.assessment.completeNativeExecution===true&&proof.assessment.noOtherUncertainEffects===true&&proof.assessment.coreCloseoutVerified===true&&proof.assessment.sourceGatesPreserved===true&&proof.assessment.noHumanHold===true&&
  proof.providerObservations?.length===2&&proof.providerObservations.every((p:any)=>p.branchHead===job.head)&&store.state.coordination?.requests?.some(r=>r.id===recovery.intentId&&r.action==='reconcile-closeout'&&r.head===recovery.originalWorkId&&r.status==='completed'),'Bound full original read-back and positive current ref required');
 const identity=()=>({id:job.id,key:job.key,head:job.head,pr:job.pr,prUrl:job.prUrl,branch:job.branch,worktree:job.worktree,mergeCommit:job.mergeCommit,mergeIntentId:job.mergeIntentId});
 const stable=()=>{
  requireCloseout(!store.state.paused&&!HOLDS[job.key]&&job.stage==='closeout'&&['blocked','interrupted'].includes(job.status)&&delivery.jobs.find(j=>j.id===job.id)===job&&delivery.jobs.filter(j=>j.key===job.key&&j.status!=='cancelled').length===1&&job.closeoutRecovery===recovery&&recovery.status==='cleanup-pending'&&
   isDeepStrictEqual(store.project,proof.project)&&digest(identity())===digest(proof.jobIdentity)&&isDeepStrictEqual(job.steps,proof.steps)&&isDeepStrictEqual(deliveryHumanInputs(store,job.key),proof.humanInputs)&&
   digest(request)===requestVersion&&isDeepStrictEqual(closeoutClaim(store,request,'cleanup-merged-candidate'),claim)&&artifact(store,recovery.proofPath).sha256===recovery.proofSha256&&
   isDeepStrictEqual(store.getEffect(original.merge.id),original.merge)&&Object.entries(recovery.operations).every(([name,op])=>names.includes(name as any)&&op.effectId===`closeout-cleanup:${job.id}:${recovery.originalWorkId}:${recovery.proofSha256}:${name}`&&(!op.processId||Number.isSafeInteger(op.processId)&&op.processId>0)),'Cleanup identity, source gates, human scope or claim changed');
  for(const file of [...original.files,...proof.readerFiles]){
   if(file.path.startsWith(store.dataRoot+'/'))requireCloseout(isDeepStrictEqual(artifact(store,file.path),file),'Protected original/independent evidence changed');
   else {
    const retained=proof.preservedSourceFiles?.filter((p:any)=>isDeepStrictEqual(p.original,file)&&p.head===job.head&&original.gates.trackedSources.includes(p.tracked));
    requireCloseout(retained?.length===1&&isDeepStrictEqual(artifact(store,retained[0].copy.path),retained[0].copy)&&retained[0].copy.sha256===file.sha256,'Exact tracked gate copy missing');
    if(localPathPresent(file.path))requireCloseout(isDeepStrictEqual(rootArtifact(job.worktree,file.path),file),'Tracked gate changed before cleanup');
    else {
     requireCloseout(['dispatching','uncertain','verified'].includes(store.getEffect(recovery.operations.worktree?.effectId||'')?.status||''),'Tracked evidence disappeared before owned worktree cleanup');
     if(localPathPresent(job.worktree))requireCloseout(isDeepStrictEqual(continuationWorktree(job.worktree),proof.worktree),'Partially removed tracked evidence lost original ownership');
    }
   }
  }
  const allEffects=store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{body:string}[];
  requireCloseout(allEffects.every(row=>{const e=JSON.parse(row.body);return e.status==='verified'||Object.values(recovery.operations).some(op=>op.effectId===e.id);})&&!store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)),'Another uncertain effect or active delivery worker blocks cleanup');
  requireCloseout(isDeepStrictEqual(store.state.workLog?.find(w=>w.id===original.work.id),original.work)&&isDeepStrictEqual(store.state.workLog?.find(w=>w.id===proof.reader.id),proof.reader),'Original or independent worker changed');
  terminationObservation(store,original.work);terminationObservation(store,proof.reader);
  if(kind==='core-passed')for(const n of [original.leadNative,...(original.sourceNatives||[]),...(original.chain?.nativeArtifacts||[])])requireCloseout(n&&isDeepStrictEqual(rootArtifact(n.root,n.file.path),n.file),'Original source/Lead native evidence changed');
  if(kind==='core-passed')requireCloseout(proof.readerNative?.root===resolve(homedir(),'.codex/sessions')&&isDeepStrictEqual(rootArtifact(proof.readerNative.root,proof.readerNative.file.path),proof.readerNative.file),'Complete independent native reader changed');
  requireCloseout(proof.nativeRoot===resolve(homedir(),'.codex/sessions')&&isDeepStrictEqual(rootArtifact(proof.nativeRoot,proof.native.path),proof.native),'Original complete native evidence changed');
 };
 requireCloseout(job.branch!==store.project.target&&!job.branch.startsWith('-')&&job.branch.length<256,'Cleanup may not target the project branch');
 const comment=closeoutReceipt(original.result,'issue-comment',`https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`,store.project.githubProject?.url||'')!;
 const provider=()=>closeoutProviderEvidence(delivery,job,comment.target),before=proof.providerObservations[1];
 const fresh=async()=>{stable();const live=await ownership(),p=await provider();stable();requireCloseout(live.complete&&live.fresh&&live.ownership?.status==='clear'&&closeoutScopeVersion(p)===closeoutScopeVersion(before),'Cleanup live scope, acceptance, Actions or ownership changed');return p;};
 const options={cwd:store.project.repo,timeout:60000},read={...options,readOnly:true};
 const localRef=async()=>{const text=(await delivery.execute('git',['for-each-ref','--format=%(refname)%09%(objectname)',`refs/heads/${job.branch}`],read)).trim();if(!text)return null;const parts=text.split('\t');requireCloseout(parts.length===2&&parts[0]===`refs/heads/${job.branch}`&&/^[a-f0-9]{40}$/.test(parts[1]),'Exact local cleanup ref required');return parts[1];};
 const worktrees=async()=>{const text=await delivery.execute('git',['worktree','list','--porcelain'],read);return text.trimEnd().split(/\n\n+/).filter(Boolean).map(block=>Object.fromEntries(block.split('\n').map(line=>{const i=line.indexOf(' ');return i<0?[line,true]:[line.slice(0,i),line.slice(i+1)];})));};
 const treeBefore=async()=>{requireCloseout(localPathPresent(job.worktree)&&isDeepStrictEqual(continuationWorktree(job.worktree),proof.worktree),'Original owned worktree changed');await verifyRepairCandidate(store.project,{head:job.head,branch:job.branch,worktree:job.worktree},delivery.execute);const rows=await worktrees();requireCloseout(rows.filter(w=>w.branch===`refs/heads/${job.branch}`).length===1&&rows.some(w=>w.worktree===job.worktree&&w.HEAD===job.head&&w.branch===`refs/heads/${job.branch}`&&!w.locked),'Owned unlocked worktree/branch required');};
 const afterState=async(name:typeof names[number])=>{
  if(name==='remote')return (await fresh()).branchHead===null;
  if(name==='worktree')return !localPathPresent(job.worktree)&&!(await worktrees()).some(w=>w.worktree===job.worktree);
  return await localRef()===null;
 };
 // A reservation consumes the only local continuation, even if the host crashes before onSpawn.
 // It never changes the uncertain effect back to prepared, or creates a second effect identity.
 const resumptionProof=(id:string)=>{
  const op=recovery.operations.worktree,r=op.localResumption;if(!r)return;
  requireCloseout(r.attempt===1&&r.proofPath&&r.proofSha256&&r.startedAt,'One durable partial-removal reservation required');
  const file=artifact(store,r.proofPath);requireCloseout(file.sha256===r.proofSha256,'Partial-removal proof changed');
  const saved=JSON.parse(readFileSync(file.path,'utf8')),raw=JSON.parse(saved.originalEffectBody);
  requireCloseout(saved.version===1&&saved.effectId===id&&saved.requestId===request.id&&saved.originalProofSha256===recovery.proofSha256&&saved.originalProcessId===op.processId&&saved.target===job.worktree&&saved.head===job.head&&saved.branch===job.branch&&
   raw.id===id&&raw.status==='uncertain'&&saved.originalEffectSha256===sha(saved.originalEffectBody)&&saved.qualification?.worktree===job.worktree&&saved.qualification.head===job.head&&saved.qualification.branch===job.branch&&isDeepStrictEqual(saved.qualification.owned,proof.worktree),'Partial-removal reservation binding changed');
  requireCloseout(r.processId,'Partial-removal reservation lacks a confirmed process identity; outcome remains unknown');
  terminationObservation(store,{id,sessionId:'harness-cleanup-local-continuation',processId:r.processId}as any);
  return saved;
 };
 const resumePartial=async(id:string)=>{
  const op=recovery.operations.worktree;
  if(op.localResumption){resumptionProof(id);throw new Error('Partial local removal continuation already consumed; uncertain effect is not resent');}
  const effect=store.getEffect(id)!;
  // Only a failed, terminated local remove with positively remaining partial content qualifies.
  requireCloseout(effect.status==='uncertain'&&effect.dispatchedAt&&effect.error&&op.processId,'Original uncertain local removal required');
  const terminated=terminationObservation(store,{id,sessionId:'harness-cleanup',processId:op.processId}as any);
  let p=await fresh();requireCloseout(p.branchHead===null&&store.getEffect(recovery.operations.remote.effectId)?.status==='verified'&&await localRef()===job.head,'Verified remote cleanup and unchanged local tip required');
  const qualification=await inspectPartialWorktree({repo:store.project.repo,worktree:job.worktree,head:job.head,branch:job.branch,original:proof.worktree},delivery.execute);
  stable();
  const row=store.db.prepare('SELECT body FROM effects WHERE id=?').get(id)as{body:string}|undefined;
  requireCloseout(row&&isDeepStrictEqual(JSON.parse(row.body),effect),'Original uncertain effect changed');
  const partial={version:1,effectId:id,requestId:request.id,originalProofSha256:recovery.proofSha256,originalProcessId:op.processId,target:job.worktree,head:job.head,branch:job.branch,originalEffectBody:row.body,originalEffectSha256:sha(row.body),termination:terminated,qualification,claim,at:store.clock.now().toISOString()};
  const path=resolve(dirname(recovery.proofPath),`${randomUUID()}-partial-local-removal.json`);
  writeFileSync(path,JSON.stringify(partial,null,2),{flag:'wx',mode:0o600});const file=artifact(store,path);
  // Check all mutable authorities and the complete local inventory again before consuming the one attempt.
  p=await fresh();requireCloseout(p.branchHead===null&&await localRef()===job.head&&isDeepStrictEqual(store.getEffect(id),effect)&&isDeepStrictEqual(await inspectPartialWorktree({repo:store.project.repo,worktree:job.worktree,head:job.head,branch:job.branch,original:proof.worktree},delivery.execute),qualification),'Partial removal changed before continuation');
  terminationObservation(store,{id,sessionId:'harness-cleanup',processId:op.processId}as any);stable();
  requireCloseout(!op.localResumption&&artifact(store,path).sha256===file.sha256,'Partial-removal attempt or proof changed');
  op.localResumption={proofPath:path,proofSha256:file.sha256,attempt:1,startedAt:store.clock.now().toISOString()};store.save();
  try{
   // --force permits ONLY the qualified missing tracked subset; the model cannot supply flags or a different target.
   await delivery.execute('git',['worktree','remove','--force','--',job.worktree],{...options,timeout:300000,onSpawn:(pid:number)=>{requireCloseout(Number.isSafeInteger(pid)&&pid>0&&!op.localResumption!.processId,'One owned local continuation process required');op.localResumption!.processId=pid;store.save();}});
  }catch(error){op.localResumption.error=String(error);throw error;}
  finally{op.localResumption.endedAt=store.clock.now().toISOString();store.save();}
  resumptionProof(id);await fresh();
 };
 for(const name of names){
  stable();const id=`closeout-cleanup:${job.id}:${recovery.originalWorkId}:${recovery.proofSha256}:${name}`,saved=recovery.operations[name];
  requireCloseout(!saved||saved.effectId===id,'Cleanup operation identity changed');
  if(!saved){recovery.operations[name]={effectId:id};store.save();}
  const effect=store.getEffect(id),effects=new Effects(store);
  if(effect)requireCloseout(effect.work.projectId===store.project.id&&effect.work.kind==='delivery'&&effect.work.id===job.id&&effect.attemptId===request.id&&effect.operation===`merged-candidate-cleanup-${name}`&&effect.target===(name==='worktree'?job.worktree:`refs/heads/${job.branch}`)&&effect.authorization===recovery.proofSha256&&isDeepStrictEqual(effect.payload,{name,head:job.head,mergeCommit:job.mergeCommit,worktree:job.worktree,branch:job.branch})&&isDeepStrictEqual(effect.expectedState,{originalDelete:kind==='core-passed'?'unattempted':'not-currently-applied',head:job.head}),'Cleanup effect identity changed');
  if(effect&&['dispatching','uncertain'].includes(effect.status)){
   const pid=recovery.operations[name].processId;requireCloseout(pid,'Attempted cleanup process identity missing');terminationObservation(store,{id,sessionId:'harness-cleanup',processId:pid}as any);
   if(name==='worktree'&&recovery.operations.worktree.localResumption)resumptionProof(id);
   if(name==='worktree'&&!await afterState(name))await resumePartial(id);
   requireCloseout(await effects.reconcile(id,async()=>({verified:await afterState(name),receipt:{operation:name,verifiedBy:'exact current provider/local postcondition',head:job.head,...(name==='worktree'&&recovery.operations.worktree.localResumption?{localResumption:structuredClone(recovery.operations.worktree.localResumption)}:{})}})),'New cleanup effect remains uncertain; it is not resent');
  }
  const existing=store.getEffect(id);if(existing?.status==='verified'){if(name==='worktree'&&recovery.operations.worktree.localResumption)resumptionProof(id);requireCloseout(await afterState(name),'Previously verified cleanup postcondition changed');continue;}
  const preflight=async()=>{
   const p=await fresh();
   if(name==='remote'){requireCloseout(p.branchHead===job.head&&await localRef()===job.head,'Original exact branch tip required before distinct delete');await treeBefore();}
   else {requireCloseout(p.branchHead===null&&store.getEffect(recovery.operations.remote.effectId)?.status==='verified','Verified remote cleanup required');if(name==='worktree'){requireCloseout(await localRef()===job.head,'Exact local tip required');await treeBefore();}else requireCloseout(!localPathPresent(job.worktree)&&!(await worktrees()).some(w=>w.branch===`refs/heads/${job.branch}`)&&await localRef()===job.head,'All branch worktrees must be gone before exact local ref deletion');}
   stable();
  };
  const dispatch=async()=>{
   const onSpawn=(pid:number)=>{recovery.operations[name].processId=pid;store.save();};
   if(name==='remote'){
    // GitHub updateRefs is atomic and beforeOid is a compare-and-swap; zero afterOid deletes only this ref.
    const query='mutation($input:UpdateRefsInput!){updateRefs(input:$input){clientMutationId}}';
    const output=JSON.parse(await delivery.execute('gh',['api','graphql','--input','-'],{...options,onSpawn,input:JSON.stringify({query,variables:{input:{repositoryId:before.repositoryId,clientMutationId:id,refUpdates:[{name:`refs/heads/${job.branch}`,beforeOid:job.head,afterOid:'0'.repeat(40),force:false}]}}})}));
    requireCloseout(!output.errors?.length&&output.data?.updateRefs?.clientMutationId===id,'Exact conditional deletion receipt missing');
   }else if(name==='worktree')await delivery.execute('git',['worktree','remove','--',job.worktree],{...options,onSpawn});
   else await delivery.execute('git',['update-ref','-d',`refs/heads/${job.branch}`,job.head],{...options,onSpawn});
   return{operation:name,head:job.head};
  };
  // Mutable preflight blockers do not consume an effect attempt. The fixed primitive still
  // has a synchronous final claim/scope fence and its own provider/local compare-and-swap.
  await preflight();
  await effects.execute({id,work:{projectId:store.project.id,kind:'delivery',id:job.id},attemptId:request.id,operation:`merged-candidate-cleanup-${name}`,target:name==='worktree'?job.worktree:`refs/heads/${job.branch}`,authorization:recovery.proofSha256,payload:{name,head:job.head,mergeCommit:job.mergeCommit,worktree:job.worktree,branch:job.branch},expectedState:{originalDelete:kind==='core-passed'?'unattempted':'not-currently-applied',head:job.head},preflight:async()=>stable(),dispatch,verify:()=>afterState(name)});
 }
 const current=await fresh();requireCloseout(current.branchHead===null&&!localPathPresent(job.worktree)&&await localRef()===null&&names.every(n=>store.getEffect(recovery.operations[n].effectId)?.status==='verified'),'Complete verified remote and local cleanup required');
 const at=store.clock.now().toISOString(),result:StageResult={...original.result,outcome:'passed',blocker:'',summary:kind==='core-passed'?'Original passed core checkpoint and failed transport retained; full independent effect read-back and first exact-tip cleanup verified.':'Independent original effect read-back and separate exact-tip cleanup verified. Original failed writer and blocked checkpoint retained.',findings:original.result.findings.map((f:any)=>f.id===original.cleanupFindingId?{...f,status:'verified',actual:'Original deletion timeout retained; distinct exact-tip remote and local cleanup effects independently verified.'}:f),
  receipts:[...original.result.receipts.filter((r:any)=>r.id!=='merged-branch-cleanup'),{id:'original-cleanup-readback',action:'original-cleanup-readback',target:recovery.originalWorkId,verified:true,uncertain:false,detail:kind==='core-passed'?`Original passed checkpoint and failed transport remain in history; first conditional cleanup and proof ${recovery.proofPath}`:`Original timeout remains in history; exact current ref and independent proof ${recovery.proofPath}`},...names.map(name=>({id:`cleanup-${name}`,action:`cleanup-${name}`,target:recovery.operations[name].effectId,verified:true,uncertain:false,detail:'Separate deterministic effect verified by current postcondition.'}))],evidence:[...original.result.evidence,{id:'original-closeout-readback',kind:'provider',path:recovery.proofPath,commit:job.mergeCommit!,summary:'Complete native original/independent read-back; original failures unchanged; all distinct cleanup effects verified.',environment:'Office deterministic cleanup',url:job.prUrl,observedAt:at}]};
 await finishVerifiedCloseout.call(delivery,job,result,()=>{
  stable();requireCloseout(names.every(n=>store.getEffect(recovery.operations[n].effectId)?.status==='verified'),'Cleanup effects changed before completion');
  job.steps.push({stage:'closeout-original-checkpoint',result:original.result},{stage:'closeout-readback',workerId:proof.reader.id,nativeResultSha256:digest(proof.assessment),result});
  recovery.status='complete';request.status='completed';request.detail=result.summary;
 },async()=>{await fresh();requireCloseout(!localPathPresent(job.worktree)&&await localRef()===null,'Final local cleanup postconditions changed');});
}

/** A new read-only request may wake the SAME cleanup intent. Attempted effects are only read back. */
export async function resumeCloseoutCleanup(delivery:GitHubDelivery,request:HarnessRequest,ownership:()=>Promise<CloseoutOwnership>){
 const {store}=delivery,job=delivery.jobs.find(j=>j.key===request.key&&j.status!=='cancelled'),r=job?.closeoutRecovery;
 requireCloseout(job&&r&&r.status==='cleanup-pending'&&request.head===r.originalWorkId,'Exact pending original closeout recovery required');
 const claim=closeoutClaim(store,request,'reconcile-closeout'),version=digest({job,project:store.project,human:deliveryHumanInputs(store,job.key)}),file=artifact(store,r.proofPath);
 requireCloseout(file.sha256===r.proofSha256,'Pending closeout proof changed');const proof=JSON.parse(readFileSync(file.path,'utf8'));
 const cleanup=store.state.coordination?.requests?.find(q=>q.id===r.cleanupRequestId);
 requireCloseout(cleanup&&cleanup.action==='cleanup-merged-candidate'&&cleanup.key===job.key&&cleanup.head===r.originalWorkId&&['queued','working','blocked','interrupted'].includes(cleanup.status),'Original cleanup intent missing');
 terminationObservation(store,proof.original.work);terminationObservation(store,proof.reader);
 const live=await ownership();
 store.transaction(()=>{
  requireCloseout(!store.state.paused&&!HOLDS[job.key]&&['blocked','interrupted'].includes(job.status)&&job.stage==='closeout'&&live.complete&&live.fresh&&live.ownership?.status==='clear'&&digest({job,project:store.project,human:deliveryHumanInputs(store,job.key)})===version&&isDeepStrictEqual(closeoutClaim(store,request,'reconcile-closeout'),claim)&&artifact(store,r.proofPath).sha256===r.proofSha256,'Pending closeout scope or ownership changed');
  if(['blocked','interrupted'].includes(cleanup.status)){
   requireCloseout(!store.activeClaims().some(c=>c.work.projectId===store.project.id&&c.work.kind==='reconciliation'&&c.work.id===cleanup.id),'Original cleanup claim is still active');
   cleanup.status='queued';cleanup.detail='Same cleanup identity requeued for exact effect read-back; no uncertain effect may be resent.';
  }
  request.status='completed';request.detail='Original cleanup intent retained; scheduler will read back attempted operations before any remaining cleanup.';
  store.emit('closeout-cleanup-resumed',`${job.key}: ${request.detail}`,'pm',job.key);
 });
}
