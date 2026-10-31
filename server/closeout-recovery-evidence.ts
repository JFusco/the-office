import {offlineNativeEvidence,completedExecution} from './worker-completion';
import {retainedConflictChain} from './conflict-chain';
import {conflictOnlyAssessment} from './conflict-repair';
import {HOLDS} from './config';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {ResultSchema} from './agents';
import {artifact,digest,sha,terminationObservation} from './readback-evidence';
import {continuationArtifacts,continuationWorkerProof,continuationNativeReview} from './continuation-evidence';
import {preparationGateEvidence} from './preparation-gates';
import {workerProfile} from './worker-profiles';
import {containedFile} from './workflow';
import {closeoutReceipt} from './github-delivery';
import type {Store} from './store';
import type {TicketJob,StageResult} from '../src/shared';
import type {GitHubDelivery} from './github-delivery';
/** Historical native checkpoints omitted display fields; identities and acceptance data are never defaulted. */
export function closeoutCheckpoint(raw:any):StageResult{return ResultSchema.parse({...raw,prerequisites:raw.prerequisites??null,approach:raw.approach??null,blocker:raw.blocker??'',qaRunDir:raw.qaRunDir??'',previewUrl:raw.previewUrl??'',evidence:raw.evidence?.map((e:any)=>({...e,commit:e.commit??'',environment:e.environment??'',url:e.url??'',observedAt:e.observedAt??''}))});}
export function requireCloseout(value:unknown,detail:string):asserts value{if(!value)throw new Error(detail);}
export type CloseoutRecoveryKind='core-passed'|'cleanup-uncertain';
/** Input provenance only; paired calls and a passed model result do not accept their effects. */
export function coreCloseoutNative(store:Store,work:import('../src/shared').WorkTime,cwd:string,result:StageResult){
 const native=offlineNativeEvidence(store,work,cwd),records=readFileSync(native.file.path,'utf8').trim().split('\n').map(line=>JSON.parse(line)),last=records.at(-1);
 requireCloseout(last?.type==='event_msg'&&last.payload?.type==='task_complete'&&isDeepStrictEqual(closeoutCheckpoint(JSON.parse(last.payload.last_agent_message)),result),'Original terminal closeout response differs from checkpoint');
 const truncated=(value:string)=>/truncated output|output truncated|\[truncated\]/i.test(value),outputs=new Map<string,unknown>(),observed=new Set<string>(),terminals=new Map<string,{record:number;threadId:string;turnId:string;id:string;nativeProcessHandle:string;status:string;exitCode:number;source:string;cwd:string;commandSha256:string;outputSha256:string;outputBytes:number;outputTruncated:boolean;captureAtLimit:boolean;completedAt:string}>();
 for(const[index,row]of records.entries()){
  const p=row.payload;if(row.type==='response_item'&&['function_call_output','custom_tool_call_output'].includes(p?.type))outputs.set(p.call_id,p);
  if(row.type!=='event_msg'||p?.item?.type!=='CommandExecution')continue;
  const item=p.item;requireCloseout(typeof item.id==='string'&&item.id&&p.thread_id===work.sessionId,'Original native command identity differs');observed.add(item.id);
  if(p.type!=='item_completed')continue;
  requireCloseout(['completed','failed'].includes(item.status)&&Number.isInteger(item.exit_code)&&typeof item.process_id==='string'&&item.process_id&&typeof p.turn_id==='string'&&p.turn_id&&Array.isArray(item.command)&&item.command.length&&item.command.every((v:unknown)=>typeof v==='string')&&typeof item.cwd==='string'&&typeof item.source==='string'&&typeof item.aggregated_output==='string'&&Number.isFinite(Date.parse(row.timestamp)),'Complete original native command terminal metadata required');
  const bytes=Buffer.byteLength(item.aggregated_output),terminal={record:index+1,threadId:p.thread_id,turnId:p.turn_id,id:item.id,nativeProcessHandle:item.process_id,status:item.status,exitCode:item.exit_code,source:item.source,cwd:item.cwd,commandSha256:digest(item.command),outputSha256:sha(item.aggregated_output),outputBytes:bytes,outputTruncated:truncated(item.aggregated_output)||bytes>=65536,captureAtLimit:bytes>=65536,completedAt:row.timestamp};
  requireCloseout(!terminals.has(item.id),'Duplicate original native command terminal');terminals.set(item.id,terminal);
 }
 requireCloseout([...observed].every(id=>terminals.has(id)),'Unfinished original native command requires reconciliation');
 return {root:native.root,file:native.file,recordCount:native.recordCount,calls:native.calls.map(call=>({id:call.id,name:call.name,inputSha256:digest(call.input),outputSha256:digest(outputs.get(call.id)),outputTruncated:truncated(JSON.stringify(outputs.get(call.id)))})),terminalCommands:[...terminals.values()],terminalHandleMeaning:'Native handles identify recorded command lifecycles; they are not OS PID or Office process-group membership proof.',missingPrintedOutputRecovered:false,receipts:result.receipts.map(receipt=>({id:receipt.id,sha256:digest(receipt)}))};
}
function completedClaim(store:Store,work:import('../src/shared').WorkTime,job:TicketJob,stage:string){
 const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
 requireCloseout(rows.length===1,'One original closeout/source claim required');const claim=JSON.parse(rows[0].body);
 requireCloseout(claim.id===work.claimId&&claim.status==='completed'&&claim.endedAt&&claim.stage===stage&&claim.lane==='delivery'&&claim.work?.projectId===store.project.id&&claim.work.kind==='delivery'&&claim.work.id===job.id,'Original closeout/source claim differs');return {claim,bodySha256:sha(rows[0].body)};
}
/** Admit only the retained original, never relabel a failed writer or invent a successful checkpoint. */
export function closeoutRecoveryCandidate(store:Store,job:TicketJob){
 try{
  if(store.project.provider!=='github'||store.project.id==='brain'||job.closeoutRecovery||job.sourceAmendment||job.dependsOnPR||job.prerequisites?.length||job.stage!=='closeout'||!['blocked','interrupted'].includes(job.status)||!job.pr||!job.mergeCommit||!job.worktree||!job.branch||
   job.steps.some(s=>s.stage==='closeout')||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  const work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-closeout').at(-1);
  if(!work||work.ticket!==job.key||store.state.workLog?.filter(w=>w.id===work.id).length!==1||store.state.workLog?.some(w=>w.id!==work.id&&w.sessionId===work.sessionId)||work.role!=='pm'||work.provider!=='codex'||work.status!=='failed'||!work.sessionId||!work.endedAt||!work.claimId||work.lane!=='delivery')return;
  terminationObservation(store,work);
  const saved=continuationArtifacts(store,work.id,['provider.json','completed-output.json','assignment.json','assignment-identity.json','capabilities.json','error.json']);
  const [provider,raw,assignment,identity,caps,error]=saved.map(f=>f.value),dir=resolve(store.dataRoot,'sessions',work.id);
  if(provider.project!==store.project.id||provider.repository!==store.project.repository||provider.role!=='pm'||provider.provider!=='codex'||provider.readOnly!==false||
   assignment.id!==work.id||assignment.claimId!==work.claimId||assignment.role!=='pm'||assignment.stage!==work.stage||assignment.lane!=='delivery'||assignment.work?.projectId!==store.project.id||assignment.work?.kind!=='delivery'||assignment.work?.id!==job.id||assignment.scope?.repository!==store.project.repository||assignment.scope.worktree!==job.worktree||assignment.scope.artifacts!==dir||assignment.profile!==caps.name||!isDeepStrictEqual(caps,workerProfile(work.stage,false))||
   identity.attemptId!==work.id||identity.requestId!==job.id||identity.projectId!==store.project.id||identity.repository!==store.project.repository||identity.role!=='pm'||identity.threadId!==work.sessionId||error.session!==work.sessionId||error.provider!=='codex'||error.error!=='Error: Worker exited with surviving subprocesses; effects require reconciliation')return;
  const result=closeoutCheckpoint(raw);
  const kind:CloseoutRecoveryKind=result.outcome==='passed'?'core-passed':'cleanup-uncertain';
  if(kind==='core-passed'&&(store.state.paused||store.state.draining||HOLDS[job.key]||result.findings.some(f=>f.status!=='verified')||result.receipts.some(r=>!r.verified||r.uncertain)))return;
  const uncertain=result.receipts.filter(r=>!r.verified||r.uncertain),open=result.findings.filter(f=>f.status==='open');
  if(new Set(result.findings.map(f=>f.id)).size!==result.findings.length||result.findings.some(f=>!f.id)||result.commit!==job.mergeCommit||result.worktree!==job.worktree||result.branch!==job.branch||result.prId!==job.pr||result.paidRuns!==0||result.prerequisites?.length||
   !['issue-close','issue-comment','board-status'].every(action=>closeoutReceipt(result,action,`https://github.com/${store.project.repository}/issues/${Number(job.key.slice(3))}`,store.project.githubProject?.url||'')))return;
  if(kind==='cleanup-uncertain'&&(result.resolution&&(result.resolution.kind!=='uncertain-effect'||result.resolution.findingIds.length!==1||result.resolution.findingIds[0]!==open[0]?.id||!result.resolution.evidenceIds.length||!result.resolution.evidenceIds.every(id=>result.evidence.some(e=>e.id===id)))||result.findings.some(f=>f.status!=='open'&&f.status!=='verified')||result.outcome!=='blocked'||open.length!==1||uncertain.length!==1||
   uncertain[0].id!=='merged-branch-cleanup'||uncertain[0].action!==`git push origin --delete ${job.branch}`||uncertain[0].target!==`https://github.com/${store.project.repository}/tree/${job.branch}`))return;
  if(kind==='core-passed'&&(result.resolution||result.receipts.length!==3||new Set(result.receipts.map(r=>r.id)).size!==3||!['issue-close','issue-comment','board-status'].every(id=>result.receipts.some(r=>r.id===id))))return;
  const chain=kind==='core-passed'&&job.repairReason==='conflicts'?retainedConflictChain(store,job,conflictOnlyAssessment,false):undefined;
  if(kind==='core-passed'&&job.repairReason==='conflicts'&&(!chain||job.approach?.review!=='none'||job.approach.validation!=='developer-checks'||!job.decisions?.some(d=>d.stage==='update-base'&&d.role==='pm'&&d.approach.review==='none'&&d.approach.validation==='developer-checks')))return;
  for(const stage of ['review','validate']){const s=job.steps.filter(s=>s.stage===stage).at(-1);if(!s||s.result.outcome!=='passed'||s.result.commit!==(chain?.anchor||job.head)||s.result.findings.some(f=>f.status!=='verified')||s.result.receipts.some(r=>!r.verified||r.uncertain))return;}
  const root=resolve(store.dataRoot,'ticket-work',job.id),files=saved.map(f=>f.file);
  for(const e of result.evidence){if(!containedFile(e.path,root))return;files.push(artifact(store,e.path));}
  // Source/QA and preparation gates have their own historical reference contract. Later PR
  // monitoring is separately bound to its actual native result, never silently treated as source proof.
  const gates=chain?.gates||preparationGateEvidence(store,{...job,steps:job.steps.filter(s=>s.stage!=='lead-pr')},kind==='core-passed'?{directCompleted:true}:{});files.push(...gates.files,...(chain?.files||[]));
  const finalLead=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-lead-pr').at(-1),leadStep=job.steps.filter(s=>s.stage==='lead-pr').at(-1);
  if(!finalLead||!Number.isFinite(Date.parse(finalLead.endedAt||''))||!Number.isFinite(Date.parse(work.startedAt||''))||Date.parse(finalLead.endedAt!)>Date.parse(work.startedAt)||finalLead.role!=='lead'||finalLead.status!=='completed'||!leadStep)return;
  const leadProof=continuationWorkerProof(store,job,finalLead,true,job.worktree),leadResult=closeoutCheckpoint(leadProof.result);
  if(leadResult.outcome!=='passed'||leadResult.commit!==job.head||leadResult.prId!==job.pr||leadResult.findings.some(f=>f.status!=='verified')||leadResult.receipts.some(r=>!r.verified||r.uncertain))return;
  for(const key of ['outcome','summary','commit','findings','receipts','worktree','branch','prId','paidRuns','blocker','prerequisites']as const)if(!isDeepStrictEqual(leadResult[key],leadStep.result[key]))return;
  if(!leadResult.evidence.every(e=>leadStep.result.evidence.some(r=>isDeepStrictEqual(e,r))))return;
  files.push(...leadProof.files);
  const merge=store.getEffect(job.mergeIntentId||`merge:${job.id}:${job.head}`);
  if(!merge||merge.status!=='verified'||merge.operation!=='github-merge'||merge.work.projectId!==store.project.id||merge.work.kind!=='delivery'||merge.work.id!==job.id||(merge.payload as any)?.sha!==job.head||(merge.receipt as any)?.sha!==job.mergeCommit||(merge.receipt as any)?.merged!==true)return;
  const leadNative=kind==='core-passed'?continuationNativeReview(store,finalLead,leadResult):undefined,sourceNatives:ReturnType<typeof continuationNativeReview>[]=[];
  const originalClaim=kind==='core-passed'?completedClaim(store,work,job,'closeout'):undefined;
  const leadClaim=kind==='core-passed'?completedClaim(store,finalLead,job,'lead-pr'):undefined;
  if(kind==='core-passed'&&!completedExecution(store,finalLead))return;
  if(kind==='core-passed'&&!chain)for(const stage of ['review','validate']){
   const source=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage===`github-${stage}`).at(-1),step=job.steps.filter(s=>s.stage===stage).at(-1)!;
   if(!source||source.status!=='completed'||!completedExecution(store,source))return;
   const bound=continuationWorkerProof(store,job,source,stage==='review',job.worktree);completedClaim(store,source,job,stage);
   const nativeResult=closeoutCheckpoint(bound.result),{evidence:a,...first}=nativeResult,{evidence:b,...second}=step.result;
   if(!isDeepStrictEqual(first,second)||!a.every(e=>b.some(other=>isDeepStrictEqual(e,other))))return;sourceNatives.push(continuationNativeReview(store,source,nativeResult));files.push(...bound.files);
  }
  const native=kind==='core-passed'?coreCloseoutNative(store,work,job.worktree,result):undefined;
  const unique=new Map(files.map(f=>[f.path,f]));if(kind==='core-passed'&&files.some(f=>!isDeepStrictEqual(unique.get(f.path),f)))return;
  return{kind,work:structuredClone(work),result,files:kind==='core-passed'?[...unique.values()]:files,gates,chain,native,leadNative,sourceNatives,originalClaim,leadClaim,merge:structuredClone(merge),cleanupFindingId:kind==='core-passed'?'':open[0].id,checkpointSha256:saved[1].file.sha256};
 }catch{return;}
}

/** Pure priority qualification only; this is never execution, source acceptance or provider authority. */
export function verifiedCloseoutCleanupRequest(store:Store,request:import('../src/shared').HarnessRequest):boolean{
 try{
  if(request.action!=='cleanup-merged-candidate'||request.lane!=='delivery')return false;
  const jobs=store.state.coordination?.jobs?.filter(j=>j.key===request.key&&j.status!=='cancelled')||[];if(jobs.length!==1)return false;
  const job=jobs[0],r=job.closeoutRecovery;if(job.stage!=='closeout'||!['blocked','interrupted'].includes(job.status)||!job.mergeCommit||!r||r.status!=='cleanup-pending'||request.id!==r.cleanupRequestId||request.head!==r.originalWorkId)return false;
  const file=artifact(store,r.proofPath);if(file.sha256!==r.proofSha256)return false;const proof=JSON.parse(readFileSync(file.path,'utf8')),original=proof.original;
  const legacy=r.kind===undefined&&proof.kind===undefined&&original?.kind===undefined;
  const kind=legacy&&original?.result?.outcome==='blocked'&&original.result.receipts?.filter((x:any)=>!x.verified||x.uncertain).length===1&&original.result.receipts.some((x:any)=>x.id==='merged-branch-cleanup'&&x.uncertain)?'cleanup-uncertain':!legacy&&r.kind===proof.kind&&proof.kind===original?.kind?proof.kind:undefined;
  if(kind!=='core-passed'&&kind!=='cleanup-uncertain')return false;
  const identity={id:job.id,key:job.key,head:job.head,pr:job.pr,prUrl:job.prUrl,branch:job.branch,worktree:job.worktree,mergeCommit:job.mergeCommit,mergeIntentId:job.mergeIntentId};
  if(proof.intentId!==r.intentId||proof.originalWorkId!==r.originalWorkId||proof.originalSessionId!==r.originalSessionId||proof.checkpointSha256!==r.checkpointSha256||proof.cleanupRequestId!==request.id||proof.project?.id!==store.project.id||proof.project?.repository!==store.project.repository||digest(proof.jobIdentity)!==digest(identity)||original.work?.id!==r.originalWorkId||original.work.sessionId!==r.originalSessionId||original.work.status!=='failed'||original.work.role!=='pm'||original.work.provider!=='codex'||original.work.requestId!==job.id||original.work.ticket!==job.key||original.checkpointSha256!==r.checkpointSha256||original.result?.commit!==job.mergeCommit)return false;
  const a=proof.assessment;if(a?.outcome!=='passed'||a.completeNativeExecution!==true||a.noOtherUncertainEffects!==true||a.coreCloseoutVerified!==true||a.sourceGatesPreserved!==true||a.noHumanHold!==true||a.originalWorkId!==r.originalWorkId||a.nativeSessionId!==r.originalSessionId||a.checkpointSha256!==r.checkpointSha256||a.mergeCommit!==job.mergeCommit||a.head!==job.head)return false;
  if(kind==='core-passed'?(a.kind!=='core-passed'||a.cleanupUnattempted!==true||original.result.outcome!=='passed'||original.cleanupFindingId!==''||original.result.receipts.some((x:any)=>!x.verified||x.uncertain)||original.result.findings.some((f:any)=>f.status!=='verified')):a.originalDeletionNotCurrentlyApplied!==true)return false;
  return proof.providerObservations?.length===2&&proof.providerObservations.every((p:any)=>p.branchHead===job.head)&&original.merge?.status==='verified'&&original.merge.operation==='github-merge'&&original.merge.work?.projectId===store.project.id&&original.merge.work.id===job.id&&original.merge.payload?.sha===job.head&&original.merge.receipt?.sha===job.mergeCommit&&original.merge.receipt?.merged===true&&isDeepStrictEqual(store.getEffect(original.merge.id),original.merge)&&!!store.state.coordination?.requests?.some(q=>q.id===r.intentId&&q.action==='reconcile-closeout'&&q.key===job.key&&q.head===r.originalWorkId&&q.status==='completed');
 }catch{return false;}
}

/** Closed-issue evidence and exact branch identity; a missing ref is never inferred from a failed API call. */
export async function closeoutProviderEvidence(delivery:GitHubDelivery,job:TicketJob,commentUrl:string){
 const {store}=delivery,repository=store.project.repository,number=Number(job.key.slice(3)),issueUrl=`https://github.com/${repository}/issues/${number}`;
 const pr=await delivery.verifyPR(job,true),issue=await delivery.api(`issues/${number}`);
 requireCloseout(pr.number===job.pr&&pr.html_url===`https://github.com/${repository}/pull/${job.pr}`&&job.prUrl===pr.html_url&&pr.state==='closed'&&pr.merged_at&&pr.merge_commit_sha===job.mergeCommit&&pr.head.sha===job.head&&pr.head.ref===job.branch&&pr.head.repo?.full_name===repository&&pr.base.repo?.full_name===repository&&issue.number===number&&issue.html_url===issueUrl&&issue.state==='closed'&&issue.state_reason==='completed'&&issue.assignees?.some((a:any)=>a.login==='JFusco'),'Exact accepted merged PR and closed assigned issue required');
 const comments:any[]=[];for(let page=1;page<=20;page++){const rows=await delivery.api(`issues/${number}/comments?per_page=100&page=${page}`);requireCloseout(Array.isArray(rows)&&rows.length<=100,'Complete closed issue comments required');comments.push(...rows);requireCloseout(Buffer.byteLength(JSON.stringify(comments))<=1024*1024,'Closed issue comments exceed bound');if(rows.length<100)break;requireCloseout(page<20,'Closed issue comment coverage incomplete');}
 requireCloseout(new RegExp(`^https://github\\.com/${repository}/issues/${number}#issuecomment-[0-9]+$`).test(commentUrl)&&new Set(comments.map(c=>c.id)).size===comments.length&&comments.every(c=>Number.isSafeInteger(c.id)&&c.id>0&&typeof c.body==='string'&&typeof c.user?.login==='string'),'Canonical complete original comment inventory required');
 const matches=comments.filter(c=>c.html_url===commentUrl);requireCloseout(matches.length===1&&typeof matches[0].body==='string'&&matches[0].body.trim()&&matches[0].user?.login==='JFusco','Exact original closeout comment required');
 const board=await delivery.engine.github.board(),cards=board?.items.filter(c=>c.repository===repository&&c.number===number)||[];
 requireCloseout(board&&!board.error&&cards.length===1&&cards[0].status==='Done','Exact original Done card required');
 const options={cwd:store.project.repo,readOnly:true,timeout:60000};
 const dependents=JSON.parse(await delivery.execute('gh',['api',`repos/${repository}/pulls?state=open&base=${encodeURIComponent(job.branch)}&per_page=100`,'--paginate','--slurp'],options));
 requireCloseout(Array.isArray(dependents)&&dependents.length&&dependents.every(p=>Array.isArray(p)&&p.length===0),'Complete empty dependent PR inventory required');
 const [owner,name]=repository.split('/');
 const query='query($owner:String!,$name:String!,$ref:String!){repository(owner:$owner,name:$name){id nameWithOwner ref(qualifiedName:$ref){id name target{oid}}}}';
 const response=JSON.parse(await delivery.execute('gh',['api','graphql','--input','-'],{...options,input:JSON.stringify({query,variables:{owner,name,ref:`refs/heads/${job.branch}`}})})),repo=response.data?.repository;
 requireCloseout(!response.errors?.length&&repo?.nameWithOwner===repository&&typeof repo.id==='string'&&repo.id&&Object.hasOwn(repo,'ref')&&(repo.ref===null||repo.ref.name===job.branch&&/^[a-f0-9]{40}$/.test(repo.ref.target?.oid)),'Exact provider ref/repository read required');
 const runs=await delivery.api(`actions/runs?head_sha=${job.mergeCommit}&per_page=100`),actual=runs.workflow_runs?.filter((r:any)=>r.head_sha===job.mergeCommit&&r.event==='push'&&r.head_branch===store.project.target);
 requireCloseout(runs.total_count<=100&&actual?.length&&actual.every((r:any)=>r.status==='completed'&&['success','neutral','skipped'].includes(r.conclusion)),'Current merge push Actions required');
 return{pr:{number:pr.number,url:pr.html_url,head:pr.head.sha,branch:pr.head.ref,mergeCommit:pr.merge_commit_sha,mergedAt:pr.merged_at,target:pr.base.ref},issue:{number:issue.number,url:issue.html_url,state:issue.state,state_reason:issue.state_reason,title:issue.title,body:issue.body,labels:issue.labels,assignees:issue.assignees},comments:comments.map(c=>({id:c.id,html_url:c.html_url,body:c.body,user:c.user?.login,created_at:c.created_at,updated_at:c.updated_at})),card:cards[0],repositoryId:repo.id,branchHead:repo.ref?.target.oid||null,dependents:[],runs:actual.map((r:any)=>({id:r.id,head_sha:r.head_sha,event:r.event,head_branch:r.head_branch,status:r.status,conclusion:r.conclusion}))};
}
export const closeoutScopeVersion=(value:Awaited<ReturnType<typeof closeoutProviderEvidence>>)=>digest({...value,branchHead:undefined});

/** Hide only failed reconciliation rows whose exact original proof and cleanup are now verified. */
export function closeoutRequestResolved(store:Store,request:import('../src/shared').HarnessRequest){
 try{
  if(request.action!=='reconcile-closeout'||!['blocked','interrupted'].includes(request.status))return false;
  const job=store.state.coordination?.jobs?.find(j=>j.key===request.key&&j.status==='completed'),r=job?.closeoutRecovery;
  if(!job||!r||r.status!=='complete'||request.head&&request.head!==r.originalWorkId||artifact(store,r.proofPath).sha256!==r.proofSha256)return false;
  const proof=JSON.parse(readFileSync(r.proofPath,'utf8'));
  return proof.originalWorkId===r.originalWorkId&&proof.checkpointSha256===r.checkpointSha256&&['remote','worktree','branch'].every(name=>{const id=`closeout-cleanup:${job.id}:${r.originalWorkId}:${r.proofSha256}:${name}`;return r.operations[name]?.effectId===id&&store.getEffect(id)?.status==='verified';})&&
   !!store.state.coordination?.requests?.some(q=>q.id===r.cleanupRequestId&&q.action==='cleanup-merged-candidate'&&q.status==='completed')&&
   !!job.steps.some(s=>s.stage==='closeout-readback'&&s.result.outcome==='passed'&&s.result.receipts.some(receipt=>receipt.action==='original-cleanup-readback'&&receipt.target===r.originalWorkId&&receipt.verified&&!receipt.uncertain));
 }catch{return false;}
}
