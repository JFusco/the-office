import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {ResultSchema} from '../../../workers/agents';
import {currentAssignment} from '../../../workers/assignment-context';
import {HOLDS} from '../../../office/config';
import {continuationWorkerProof,assertContinuationWorker,continuationWorktree} from '../implementation/continuation-evidence';
import {completedExecution,claudeExecution} from '../../../workers/worker-completion';
import {artifact,digest,ownedPath,rootArtifact} from '../../../store/readback-evidence';
import {deliveryInputSha256} from '../../../github/github-context';
import {readValidationProviderContext,validationProviderVersion} from '../validation/validation-provider-context';
import {amendmentInstruction,SourceAmendmentCommand} from '../source-amendment/source-amendment';
import {approvedText} from '../source-amendment/approved-text';
import {RELEASE_AMENDMENT_PATHS,RELEASE_SOURCE_IDS,sourceHash,sourceJson} from '../source-amendment/source-amendment-scope';
import {outsideAmendmentFindingIds} from '../source-amendment/source-amendment-held';
import {verifyRepairCandidate} from '../../repairs/delivery-repairs';
import {recordJobApproach} from '../../pipeline/approach';
import {containedFile} from '../../../cec/workflow';
import {workKey} from '../../../../src/shared';
import type {TicketJob,StageResult} from '../../../../src/shared';
import type {Store} from '../../../store/store';
import type {GitHubDelivery} from '../../pipeline/github-delivery';
type Ownership={complete:boolean;fresh:boolean;ownership?:{status:string}};
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
const originalClaim=(store:Store,id:string)=>(store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(id)as{body:string}[]).map(row=>({body:row.body}));
const effects=(store:Store,job:TicketJob)=>store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{body:string}[];
const certain=(rows:{body:string}[])=>rows.every(row=>{const e=JSON.parse(row.body);return ['prepared','rejected'].includes(e.status)&&!e.dispatchedAt;});
const directionPaths=['scripts/source-scan.mjs','tests/source-scan.test.mjs','wiki/topics/official-source-freshness.md']as const;
const directionContract=()=>({approvedTextSha256:sourceHash(approvedText.toString()),sourceContractSha256:digest({paths:RELEASE_AMENDMENT_PATHS,sourceIds:RELEASE_SOURCE_IDS,directionPaths})});
/** Current technical direction derives only from the existing frozen human authorization and regular Git blobs. */
async function scopeRepairDirection(delivery:GitHubDelivery,job:TicketJob,providerBase:string){
 const amendment=job.sourceAmendment;if(!amendment)return;
 amendmentInstruction(delivery.store,job);const authorization=SourceAmendmentCommand.parse(amendment.authorization);
 const read=async(commit:string,path:string,required=false)=>{
  const options={cwd:job.worktree,readOnly:true,timeout:30000},entry=(await delivery.execute('git',['ls-tree',commit,'--',path],options)).trim();
  if(!entry&&!required)return '';
  const match=entry.match(/^(100644|100755) blob ([a-f0-9]{40})\t([^\n]+)$/);
  requireThat(match&&match[3]===path,'Scope-repair direction requires an exact regular Git blob');
  const value=await delivery.execute('git',['show',`${commit}:${path}`],options);
  requireThat(Buffer.byteLength(value)<=16000000&&!value.includes('\0'),'Scope-repair direction blob exceeds its text bound');return value;
 };
 const frozen:Record<string,Record<string,string>>={originalBase:{},proposal:{}};
 for(const [revision,commit]of [['originalBase',authorization.originalBase],['proposal',authorization.originalHead]])
  for(const path of RELEASE_AMENDMENT_PATHS)frozen[revision][path]=await read(commit,path,directionPaths.includes(path as typeof directionPaths[number]));
 const proposalFilesSha256=sourceHash(sourceJson(frozen));requireThat(proposalFilesSha256===amendment.proposalFilesSha256,'Scope-repair frozen approved files changed');
 const files=[];for(const path of directionPaths){
  const original=frozen.originalBase[path],proposal=frozen.proposal[path],base=await read(providerBase,path,true),expectedText=approvedText(original,proposal,base,path);
  files.push({path,inputSha256:{originalBase:sourceHash(original),proposal:sourceHash(proposal),base:sourceHash(base)},expectedSha256:sourceHash(expectedText),expectedText});
 }
 requireThat(Buffer.byteLength(JSON.stringify(files))<=1024*1024,'Scope-repair technical direction exceeds its bound');
 return {version:1,authorizationId:amendment.id,authorizationSha256:digest(authorization),proposalFilesSha256,originalBase:authorization.originalBase,proposalHead:authorization.originalHead,providerBase,contract:directionContract(),files};
}

/** Only the latest completed-transport negative on the same unpublished candidate; no outcome is rewritten. */
export function scopeRepairResumeCandidate(store:Store,job:TicketJob){
 try{
  if(store.project.provider!=='github'||store.project.id==='brain'||job.stage!=='scope-repair'||!['blocked','interrupted'].includes(job.status)||
   !job.candidateRecovery||!job.head||!job.branch||!job.worktree||job.pr||job.prUrl||job.existingPR||job.mergeAttempt||job.mergeIntentId||job.mergeApprovalRequired||
   job.implementationContinuation||job.implementationRecovery||job.discoveryRecovery||job.savedPrerequisiteHandoff||job.prerequisites?.length||job.dependsOnPR||job.repairCycle?.phase==='diagnosis'||
   store.state.coordination?.jobs?.filter(j=>j.id===job.id||j.key===job.key&&j.status!=='cancelled').length!==1||
   store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  if(job.sourceAmendment){if(!job.sourceAmendment.adoptedAt||!job.scopeRepairReadback)return;amendmentInstruction(store,job);}
  const work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-scope-repair').at(-1);
  if(!work||work.status!=='blocked'||work.role!=='developer'||!completedExecution(store,work)||job.scopeRepairResumes?.some(r=>r.originalWorkId===work.id))return;
  const original=continuationWorkerProof(store,job,work,false,job.worktree),result=ResultSchema.parse(original.result);
  if(result.outcome!=='blocked'||result.commit!==job.head||!/^[a-f0-9]{40}$/.test(result.commit)||result.worktree!==job.worktree||result.branch!==job.branch||result.prId!==0||result.paidRuns!==0||result.prerequisites?.length||result.receipts.length||
   !result.findings.length||new Set(result.findings.map(f=>f.id)).size!==result.findings.length||result.findings.some(f=>!f.id.trim())||!result.findings.some(f=>f.status==='open')||
   job.boardUpdates?.some(u=>u.status!=='verified')||job.candidateRecovery.findingIds.some(id=>!result.findings.some(f=>f.id===id))||!isDeepStrictEqual(job.steps.filter(s=>s.stage==='scope-repair').at(-1)?.result,result)||
   job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain))||!certain(effects(store,job)))return;
  const claims=originalClaim(store,work.claimId!);if(claims.length!==1)return;const claim=JSON.parse(claims[0].body);
  if(claim.id!==work.claimId||claim.status!=='completed'||!claim.endedAt||claim.lane!=='delivery'||claim.stage!=='scope-repair'||claim.work?.projectId!==store.project.id||claim.work?.kind!=='delivery'||claim.work?.id!==job.id)return;
  const native=claudeExecution(store,work,job.worktree,resolve(homedir(),'.claude/projects',job.worktree.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`),undefined,{scopeRepairOriginal:original});
  const root=resolve(store.dataRoot,'ticket-work',job.id),files=[...original.files,...native.files];
  for(const e of result.evidence){if(!containedFile(e.path,root))return;files.push(artifact(store,e.path));}
  const completion=artifact(store,resolve(store.dataRoot,'sessions',work.id,'execution-completion.json'));files.push(completion);
  return {work,original,result,claims,native,files,checkpointSha256:artifact(store,resolve(store.dataRoot,'sessions',work.id,'result.json')).sha256};
 }catch{return;}
}

/** Existing exact-original durable action; the scheduler alone can claim and later dispatch the writer. */
export async function resumeBlockedScopeRepair(delivery:GitHubDelivery,key:string,originalWorkId:string,ownership:()=>Promise<Ownership>,intentId:string){
 const {store,engine}=delivery,job=delivery.jobs.find(j=>j.key===key&&j.status!=='cancelled'),selected=job&&scopeRepairResumeCandidate(store,job);
 requireThat(job&&selected&&selected.work.id===originalWorkId,'Exact stopped same-candidate scope-repair original required');
 const intent=store.state.coordination?.requests?.find(r=>r.id===intentId),claim=currentAssignment()?.claim;
 requireThat(intent?.action==='reconcile-scope-repair'&&intent.key===key&&intent.head===originalWorkId&&intent.status==='working'&&intent.lane==='delivery'&&
  claim?.stage==='reconcile-scope-repair'&&claim.lane==='delivery'&&claim.status==='running'&&claim.work.projectId===store.project.id&&claim.work.kind==='reconciliation'&&claim.work.id===intentId,'Exact scheduler-owned scope-repair resume required');
 const expected=digest({job,project:store.project,selected}),claimIdentity=structuredClone(claim),intentIdentity=digest(intent),input=deliveryInputSha256(store,key),tree=continuationWorktree(job.worktree),effectRows=effects(store,job);
 const assertCurrent=(live:Ownership)=>{
  const current=scopeRepairResumeCandidate(store,job);
  requireThat(!store.state.paused&&!HOLDS[key]&&delivery.jobs.find(j=>j.id===job.id)===job&&current&&digest({job,project:store.project,selected:current})===expected&&
   deliveryInputSha256(store,key)===input&&isDeepStrictEqual(effects(store,job),effectRows)&&certain(effectRows)&&
   isDeepStrictEqual(currentAssignment()?.claim,claimIdentity)&&store.activeClaims().some(c=>isDeepStrictEqual(c,claimIdentity))&&
   !store.activeClaims().some(c=>c.id!==claimIdentity.id&&c.work.projectId===store.project.id&&c.work.id===job.id)&&
   store.state.coordination?.requests?.filter(r=>r.id===intentId).length===1&&digest(intent)===intentIdentity&&
   isDeepStrictEqual(continuationWorktree(job.worktree),tree)&&live.complete&&live.fresh&&live.ownership?.status==='clear','Scope repair resume identity, inputs, claim, effects or ownership changed');
  assertContinuationWorker(store,selected.original);requireThat(completedExecution(store,selected.work)&&isDeepStrictEqual(originalClaim(store,selected.work.claimId!),selected.claims),'Original scope-repair completion/claim changed');
 };
 const local=async()=>{
  await verifyRepairCandidate(store.project,{head:job.head,branch:job.branch,worktree:job.worktree},delivery.execute);
  await delivery.execute('git',['merge-base','--is-ancestor',job.candidateRecovery!.head,job.head],{cwd:job.worktree,readOnly:true,timeout:30000});
  requireThat(!(await delivery.execute('git',['ls-remote','--heads','origin',`refs/heads/${job.branch}`],{cwd:job.worktree,readOnly:true,timeout:30000})).trim(),'Scope-repair candidate is already published');
  const pages=JSON.parse(await delivery.execute('gh',['api',`repos/${store.project.repository}/pulls?state=all&head=${encodeURIComponent(store.project.repository.split('/')[0]+':'+job.branch)}&per_page=100`,'--paginate','--slurp'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
  requireThat(Array.isArray(pages)&&pages.length>0&&pages.every(p=>Array.isArray(p)&&p.length===0),'Unpublished scope-repair PR coverage required');
  const base=await delivery.api(`commits/${store.project.target}`);requireThat(/^[a-f0-9]{40}$/.test(base.sha),'Current scope-repair provider base required');
  if(job.sourceAmendment){
   const cacheOptions={cwd:job.worktree,readOnly:true,timeout:30000};
   const cachedBase=async()=>{
    const observed=(await delivery.execute('git',['cat-file','--batch-check=%(objectname) %(objecttype)'],{...cacheOptions,input:`${base.sha}\n`})).trim();
    requireThat(observed===`${base.sha} commit`||observed===`${base.sha} missing`,'Provider base cache has an unknown object identity or type');
    return observed===`${base.sha} commit`;
   };
   if(!await cachedBase()){
    // Cache only the exact provider commit under the admitted claim; no refs or FETCH_HEAD move.
    assertCurrent(await ownership());
    await verifyRepairCandidate(store.project,{head:job.head,branch:job.branch,worktree:job.worktree},delivery.execute);
    const origin=(await delivery.execute('git',['remote','get-url','origin'],cacheOptions)).trim();
    requireThat([`https://github.com/${store.project.repository}`,`https://github.com/${store.project.repository}.git`,`git@github.com:${store.project.repository}`,`git@github.com:${store.project.repository}.git`,`ssh://git@github.com/${store.project.repository}`,`ssh://git@github.com/${store.project.repository}.git`].some(url=>url.toLowerCase()===origin.toLowerCase()),'Exact project origin required for provider base cache fetch');
    requireThat((await delivery.api(`commits/${store.project.target}`)).sha===base.sha,'Provider base changed before cache fetch');
    assertCurrent(await ownership());
    await delivery.execute('git',['fetch','--no-tags','--no-write-fetch-head','--refmap=','--no-recurse-submodules','--no-auto-maintenance','origin',base.sha],{cwd:job.worktree,readOnly:false,timeout:60000});
    assertCurrent(await ownership());
    await verifyRepairCandidate(store.project,{head:job.head,branch:job.branch,worktree:job.worktree},delivery.execute);
    requireThat((await delivery.execute('git',['remote','get-url','origin'],cacheOptions)).trim()===origin,'Origin changed during provider base cache fetch');
    requireThat((await delivery.api(`commits/${store.project.target}`)).sha===base.sha,'Provider base changed during cache fetch');
    requireThat(await cachedBase(),'Fetched provider base commit is still absent');
   }
  }
  const held=[...await outsideAmendmentFindingIds(delivery,job)].sort();
  return {head:job.head,branch:job.branch,worktree:job.worktree,providerBase:base.sha,heldFindingIds:held,technicalDirection:await scopeRepairDirection(delivery,job,base.sha)};
 };
 const beforeOwnership=await ownership();assertCurrent(beforeOwnership);const beforeLocal=await local(),before=await readValidationProviderContext(delivery,key),prior=new Set((store.state.workLog||[]).map(w=>w.id));
 const calls=selected.native.calls.flatMap(c=>(c.inputRepresentations||[{namespace:'display' as const,value:c.input,sha256:digest(c.input)}]).map(r=>({id:JSON.stringify([c.id,r.namespace]),toolId:c.id,name:c.name,namespace:r.namespace,inputSha256:r.sha256}))),ids=calls.map(c=>c.id)as[string,...string[]];
 const schema=z.object({outcome:z.enum(['passed','blocked']),originalWorkId:z.literal(originalWorkId),nativeSessionId:z.literal(selected.work.sessionId!),checkpointSha256:z.literal(selected.checkpointSha256),head:z.literal(job.head),nativeSha256:z.literal(selected.native.file.sha256),nativeRecordCount:z.literal(selected.native.recordCount),
  completeNativeExecution:z.boolean(),noExternalEffects:z.boolean(),repairWithinExistingScope:z.boolean(),noHumanHold:z.boolean(),summary:z.string().trim().min(1),...(beforeLocal.technicalDirection?{technicalDirectionSha256:z.literal(digest(beforeLocal.technicalDirection))}:{}),
  callEffects:z.array(z.object({id:z.enum(ids),inputSha256:z.string().regex(/^[a-f0-9]{64}$/),classification:z.enum(['read-only','owned-local','external','unknown']),summary:z.string().trim().min(1)}).strict()).min(calls.length).max(calls.length)}).strict();
 assertCurrent(await ownership());
 const assessment=await engine.agents.run('lead',`READ ONLY same-candidate scope-repair resume. Independently inspect COMPLETE original native ${selected.native.file.path}, every call/output including errors/background handles, and exact original ${originalWorkId}/${selected.work.sessionId}. Native SHA ${selected.native.file.sha256}, record count ${selected.native.recordCount}, paired calls ${JSON.stringify(calls)}. Classify EVERY distinct display AND wire representation separately, not just the displayed input. API-history references are nonexecution context only after the harness positively binds them to issued execution and genuine outputs; inspect all retained forms and reference provenance. Return EXACTLY these representation IDs/input hashes once; extra commentary belongs only in summary. Positively classify every operation. External/unknown effects, an unowned process, incomplete execution, permission/service/human hold, changed candidate or ambiguous repair scope BLOCK. Owned local experiments are not external effects, but current clean exact candidate must be preserved; do not infer no effects from prose or an empty receipt list. Original task remains BLOCKED and all findings remain required: ${JSON.stringify(selected.result.findings)}. Current canonical issue/comments/board ${JSON.stringify(before)}, ownership ${JSON.stringify(beforeOwnership)}, candidate ${JSON.stringify(beforeLocal)}. ${beforeLocal.technicalDirection?`Current code-owned technical direction SHA256 ${digest(beforeLocal.technicalDirection)}. It proves the frozen scanner/test/topic approvedText composition against this provider base and supplies exact expected text/hash for the authorized LOCAL repair. Historical technical conflicts or a past model request for a maintainer decision are retained diagnostics; determine actual CURRENT explicit human holds from the canonical human inputs. Pending source acceptance remains required before acceptance/merge and does not revoke the existing bounded local repair authorization. This composition does not prove the actual candidate, journal, generation or fresh proof is repaired. Return technicalDirectionSha256 exactly as supplied and BLOCK any true overlap, outside scope, failed composition, actual current hold or uncertainty.`:''} Confirm only that the same existing authorized local repair may continue. Source acceptance, old audit/authorization, findings, counters and all independent review/QA gates remain unchanged. No research, refetch, checks, generation, edits, provider operations, delivery dispatch or nested workers. Original owned evidence ${JSON.stringify(selected.files)}. Bound reference provenance ${JSON.stringify(selected.native.calls.map(c=>({id:c.id,referenceProvenance:c.referenceProvenance}))) }. ${amendmentInstruction(store,job)}`,schema,
  {cwd:job.worktree,readOnly:true,effortKind:'administrative',ticket:key,stage:'scope-repair-resume-readback',requestId:job.id});
 schema.parse(assessment);
 requireThat(assessment.outcome==='passed'&&assessment.completeNativeExecution&&assessment.noExternalEffects&&assessment.repairWithinExistingScope&&assessment.noHumanHold&&
  new Set(assessment.callEffects.map(c=>c.id)).size===calls.length&&calls.every(c=>assessment.callEffects.some(r=>r.id===c.id&&r.inputSha256===c.inputSha256&&['read-only','owned-local'].includes(r.classification))),'Scope-repair resume full native/effects/authorization audit is incomplete');
 const readers=(store.state.workLog||[]).filter(w=>!prior.has(w.id)&&w.stage==='scope-repair-resume-readback');requireThat(readers.length===1&&readers[0].role==='lead'&&readers[0].sessionId!==selected.work.sessionId&&completedExecution(store,readers[0]),'One completed independent scope-repair resume reader required');
 const reader=continuationWorkerProof(store,job,readers[0],true,job.worktree,'reconciliation');requireThat(reader.assignment.work.id===intentId&&reader.assignment.claimId===claimIdentity.id&&isDeepStrictEqual(reader.result,assessment),'Owned scope-repair resume assessment differs');
 const after=await readValidationProviderContext(delivery,key),afterLocal=await local(),afterOwnership=await ownership();assertCurrent(afterOwnership);assertContinuationWorker(store,reader);
 requireThat(validationProviderVersion(before)===validationProviderVersion(after)&&isDeepStrictEqual(beforeLocal,afterLocal),'Scope-repair current provider/candidate scope changed');
 const finalLocal=await local(),finalProvider=await readValidationProviderContext(delivery,key);assertCurrent(await ownership());requireThat(isDeepStrictEqual(beforeLocal,finalLocal)&&validationProviderVersion(before)===validationProviderVersion(finalProvider),'Scope-repair current candidate/provider changed before queue');
 const findingIds=[...new Set([...job.candidateRecovery!.findingIds,...job.steps.flatMap(s=>s.result.findings.map(f=>f.id)),...selected.result.findings.map(f=>f.id)])];
 const root=resolve(store.dataRoot,'ticket-work',job.id),path=resolve(root,`${randomUUID()}-scope-repair-resume.json`),at=store.clock.now().toISOString();ownedPath(store,root);
 const proof={version:1,projectId:store.project.id,repository:store.project.repository,jobId:job.id,key,head:job.head,intentId,originalWorkId,originalSessionId:selected.work.sessionId,checkpointSha256:selected.checkpointSha256,
  findingIds,findings:structuredClone(selected.result.findings),afterStep:job.steps.length,priorStepsSha256:digest(job.steps),inputSha256:input,technicalDirection:beforeLocal.technicalDirection,original:selected.original,originalClaimRows:selected.claims,originalNative:selected.native.file,nativeArtifactCwd:selected.native.artifactCwd||null,nativeInputBindings:selected.native.calls,evidenceFiles:selected.files,reader,assessment,provider:[before,after,finalProvider],candidate:[beforeLocal,afterLocal,finalLocal],ownership:[beforeOwnership,afterOwnership],at};
 writeFileSync(path,JSON.stringify(proof,null,2),{flag:'wx',mode:0o600});const proofSha256=artifact(store,path).sha256;
 store.transaction(()=>{
  assertCurrent(afterOwnership);assertContinuationWorker(store,reader);requireThat(isDeepStrictEqual(rootArtifact(resolve(homedir(),'.claude/projects'),selected.native.file.path),selected.native.file),'Original native transcript changed before resume');
  (job.scopeRepairResumes??=[]).push({intentId,originalWorkId,head:job.head,proofPath:path,proofSha256,checkpointSha256:selected.checkpointSha256,findingIds,afterStep:job.steps.length,at});
  job.candidateRecovery!.findingIds=findingIds;
  recordJobApproach(job,{plan:job.approach?.plan||'none',review:'full',validation:job.approach?.validation==='browser'?'browser':'independent-checks',checks:job.approach?.checks||['Required exact-candidate repository checks'],reason:'Verified exact-original scope-repair continuation; all retained findings require full independent review and QA.'},'lead');
  job.status='queued';job.detail='Exact blocked same-candidate repair independently reconciled. Scheduler will continue the existing local repair; all findings, source holds and independent review/QA remain required.';job.updatedAt=at;
  intent.status='completed';intent.detail=job.detail;store.emit('scope-repair-resumed',`${key}: ${job.detail}`,'developer',key);
 });
}

/** New findings carry explicit original-worker provenance through every subsequent independent gate. */
export function scopeRepairResumeInstruction(store:Store,job:TicketJob){
 if(!job.scopeRepairResumes?.length)return '';
 const required=new Set<string>(),directions:string[]=[];
 for(const record of job.scopeRepairResumes){
  requireThat(containedFile(record.proofPath,resolve(store.dataRoot,'ticket-work',job.id)),'Owned scope-repair resume proof required');
  const file=artifact(store,record.proofPath),proof=JSON.parse(readFileSync(file.path,'utf8'));
  requireThat(file.sha256===record.proofSha256&&proof.version===1&&proof.projectId===store.project.id&&proof.repository===store.project.repository&&proof.jobId===job.id&&proof.key===job.key&&proof.head===record.head&&proof.intentId===record.intentId&&proof.originalWorkId===record.originalWorkId&&proof.checkpointSha256===record.checkpointSha256&&
   isDeepStrictEqual(proof.findingIds,record.findingIds)&&proof.afterStep===record.afterStep&&Number.isInteger(record.afterStep)&&record.afterStep>0&&digest(job.steps.slice(0,record.afterStep))===proof.priorStepsSha256&&deliveryInputSha256(store,job.key)===proof.inputSha256&&
   store.state.coordination?.requests?.filter(r=>r.id===record.intentId&&r.action==='reconcile-scope-repair'&&r.key===job.key&&r.head===record.originalWorkId&&r.status==='completed').length===1,'Scope-repair resume provenance/input changed');
  assertContinuationWorker(store,proof.original);assertContinuationWorker(store,proof.reader);
  const native=claudeExecution(store,proof.original.worker,proof.original.assignment.scope.worktree,proof.originalNative.path,undefined,{scopeRepairOriginal:proof.original});
  requireThat(isDeepStrictEqual(native.artifactCwd||null,proof.nativeArtifactCwd)&&isDeepStrictEqual(native.calls,proof.nativeInputBindings),'Scope-repair native input/CWD ownership changed');
  requireThat(completedExecution(store,proof.original.worker)&&completedExecution(store,proof.reader.worker)&&isDeepStrictEqual(originalClaim(store,proof.original.worker.claimId),proof.originalClaimRows)&&
   isDeepStrictEqual(rootArtifact(resolve(homedir(),'.claude/projects'),proof.originalNative.path),proof.originalNative)&&proof.evidenceFiles.every((f:any)=>isDeepStrictEqual(artifact(store,f.path),f)),'Scope-repair original evidence changed');
  if(proof.technicalDirection){
   amendmentInstruction(store,job);const direction=proof.technicalDirection,authorization=SourceAmendmentCommand.parse(job.sourceAmendment?.authorization);
   requireThat(direction.version===1&&direction.authorizationId===job.sourceAmendment?.id&&direction.authorizationSha256===digest(authorization)&&direction.proposalFilesSha256===job.sourceAmendment?.proposalFilesSha256&&direction.originalBase===authorization.originalBase&&direction.proposalHead===authorization.originalHead&&
    isDeepStrictEqual(direction.contract,directionContract())&&isDeepStrictEqual(direction.files.map((f:any)=>f.path),directionPaths)&&direction.files.every((f:any)=>typeof f.expectedText==='string'&&sourceHash(f.expectedText)===f.expectedSha256)&&proof.assessment.technicalDirectionSha256===digest(direction)&&proof.candidate.length===3&&proof.candidate.every((c:any)=>c.providerBase===direction.providerBase&&isDeepStrictEqual(c.technicalDirection,direction)),'Scope-repair technical direction provenance changed');
   directions.push(`CURRENT APPROVED LOCAL REPAIR DIRECTION: read immutable proof ${record.proofPath}, technicalDirection SHA256 ${digest(direction)}, provider base ${direction.providerBase}. Its technicalDirection.files contain exact expectedText and expectedSha256 for ONLY ${directionPaths.join(', ')}. Verify the provider base is still exact before using these bytes; a changed base requires refreshed harness direction. Apply the approved delta while preserving current base additions. This is repair direction, never evidence that the saved candidate is already repaired. Correct the capture-derived journal, regenerate and retain fresh current-head/base amendment proof; source acceptance and full independent Sam/Riley gates remain required.`);
  }
  record.findingIds.forEach(id=>required.add(id));
 }
 requireThat([...required].every(id=>job.candidateRecovery?.findingIds.includes(id)),'Scope-repair mandatory findings changed');
 return `RESUMED SCOPE-REPAIR FINDINGS: ${JSON.stringify([...required])}. Preserve every ID with explicit current-head evidence. Repair and review must resolve each ID; QA must independently verify each ID. Only an independently harness-proved outside finding may remain OPEN. No approach/reroute may skip full review or independent QA. Original-worker provenance: ${JSON.stringify(job.scopeRepairResumes.map(r=>({originalWorkId:r.originalWorkId,checkpointSha256:r.checkpointSha256,proofSha256:r.proofSha256})))}. ${directions.join(' ')}`;
}
export function assertScopeRepairResumeFindings(store:Store,job:TicketJob,stage:string,result:StageResult,held:Set<string>){
 if(!job.scopeRepairResumes?.length||!['scope-repair','review','validate'].includes(stage))return;
 scopeRepairResumeInstruction(store,job);
 const required=[...new Set(job.scopeRepairResumes.flatMap(r=>r.findingIds))];
 requireThat(required.every(id=>result.findings.filter(f=>f.id===id&&(held.has(id)?f.status==='open':stage==='validate'?f.status==='verified':f.status!=='open')).length===1),'Resumed scope-repair findings require explicit independent dispositions');
}
export function scopeRepairResumeNextStage(job:TicketJob){
 if(!job.scopeRepairResumes?.length||!['scope-repair','review','validate'].includes(job.stage))return;
 const afterStep=job.scopeRepairResumes.at(-1)!.afterStep;
 for(const stage of ['review','validate']as const){const latest=job.steps.slice(afterStep).filter(s=>s.stage===stage).at(-1);if(latest?.result.outcome!=='passed'||latest.result.commit!==job.head||!latest.workerId)return stage;}
 return 'draft' as const;
}
