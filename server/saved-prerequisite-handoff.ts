import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {ResultSchema} from './agents';
import {currentAssignment} from './assignment-context';
import {HOLDS} from './config';
import {continuationWorkerProof,assertContinuationWorker,continuationWorktree} from './continuation-evidence';
import {PrerequisitesSchema,validatePrerequisites} from './dependencies';
import {deliveryInputSha256} from './github-context';
import {GitOperations} from './git-operations';
import {artifact,digest,ownedPath,rootArtifact} from './readback-evidence';
import {claudeExecution,completedExecution} from './worker-completion';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import {refreshDeliveryOwnership} from './source-amendment';
import {recordJobApproach} from './approach';
import {workKey,type TicketJob,type StageResult} from '../src/shared';
import type {Store} from './store';
import {hasUncertainEffects,type GitHubDelivery} from './github-delivery';
type Ownership={complete:boolean;fresh:boolean;ownership?:{status:string}};
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
const stages=['implement','scope-repair'];
export function savedPrerequisiteJobEligible(store:Store,job:TicketJob){
 return store.project.provider==='github'&&store.project.id!=='brain'&&stages.includes(job.stage)&&!job.savedPrerequisiteHandoff&&!job.sourceAmendment&&!job.implementationContinuation&&!job.discoveryRecovery&&
  !job.pr&&!job.existingPR&&!job.mergeAttempt&&!job.mergeIntentId&&!job.dependsOnPR&&!job.prerequisites?.length;
}
/** This small admission predicate grants neither candidate adoption nor dependency completion. */
export function hasSavedPrerequisiteResult(store:Store,job:TicketJob,originalWorkId:string){
 if(!savedPrerequisiteJobEligible(store,job))return false;
 const work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.id===originalWorkId&&w.stage===`github-${job.stage}`).at(-1);
 return !!work&&work.provider==='claude'&&work.role==='developer'&&work.status==='completed'&&job.steps.some(s=>s.stage===job.stage&&s.result.outcome==='passed'&&!!s.result.prerequisites?.length);
}
function qualified(store:Store,result:StageResult,jobId:string){
 const dependencies=PrerequisitesSchema.parse(result.prerequisites);
 requireThat(dependencies?.length,'Explicit saved prerequisites required');
 requireThat(dependencies.every(d=>d.target.projectId===store.project.id&&d.target.kind==='pr'&&d.condition==='pr-merged'&&/^[1-9]\d*$/.test(d.target.id))&&
  new Set(dependencies.map(d=>workKey(d.target))).size===dependencies.length,'Only unique canonical same-project PR prerequisites qualify');
 const error=validatePrerequisites(dependencies,{projectId:store.project.id,kind:'delivery',id:jobId},new Map([[store.project.id,store]]));
 requireThat(!error,error||'Invalid saved prerequisite');return dependencies;
}
async function readDependencies(delivery:GitHubDelivery,dependencies:NonNullable<StageResult['prerequisites']>){
 return Promise.all(dependencies.map(async d=>{
  const p=await delivery.api(`pulls/${d.target.id}`),repository=delivery.store.project.repository;
  requireThat(p?.number===Number(d.target.id)&&p.html_url===`https://github.com/${repository}/pull/${d.target.id}`&&p.base?.repo?.full_name===repository&&
   p.base.ref===delivery.store.project.target&&/^[a-f0-9]{40}$/.test(p.head?.sha||'')&&['open','closed'].includes(p.state)&&typeof p.merged==='boolean'&&
   typeof p.updated_at==='string'&&!!p.updated_at&&(!p.merged||p.state==='closed'&&/^[a-f0-9]{40}$/.test(p.merge_commit_sha||'')),'Prerequisite provider identity or completion is unverified');
  return {target:d.target,condition:d.condition,exists:true,complete:p.merged,version:p.merge_commit_sha||p.updated_at,error:'',observedAt:delivery.store.clock.now().toISOString(),
   identity:{number:p.number,url:p.html_url,state:p.state,head:p.head.sha,base:p.base.ref,merged:p.merged,mergeCommit:p.merge_commit_sha||'',updatedAt:p.updated_at}};
 }));
}
const dependencyVersion=(rows:Awaited<ReturnType<typeof readDependencies>>)=>digest(rows.map(({observedAt,...r})=>r));
/** Verify the actual completed writer; passed prose and a commit are insufficient. */
export function savedPrerequisiteOriginal(store:Store,job:TicketJob,originalWorkId:string,nativeRoot=resolve(homedir(),'.claude/projects')){
 requireThat(savedPrerequisiteJobEligible(store,job),'Unpublished ordinary saved writer required; native/amendment flows retain their own gates');
 requireThat(!job.steps.some(s=>hasUncertainEffects(s.stage,s.result)),'Uncertain original effects require reconciliation');
 const originals=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage===`github-${job.stage}`)||[],work=originals.at(-1);
 requireThat(work?.id===originalWorkId&&work.role==='developer'&&work.provider==='claude'&&work.status==='completed'&&completedExecution(store,work),'One exact completed original writer required');
 const cwd=job.worktree||store.project.repo,proof=continuationWorkerProof(store,job,work,false,cwd),result=ResultSchema.parse(proof.result);
 requireThat(result.outcome==='passed'&&result.paidRuns===0&&result.prId===0&&/^[a-f0-9]{40}$/.test(result.commit)&&!!result.worktree&&!!result.branch&&(!job.worktree||result.worktree===job.worktree)&&(!job.branch||result.branch===job.branch)&&
  result.receipts.every(r=>r.verified&&!r.uncertain),'Saved result candidate or effects are unverified');
 const dependencies=qualified(store,result,job.id),step=job.steps.filter(s=>s.stage===job.stage&&isDeepStrictEqual(s.result,result));
 requireThat(step.length===1&&new Set(result.findings.map(f=>f.id)).size===result.findings.length&&
  (!job.candidateRecovery||job.candidateRecovery.findingIds.every(id=>result.findings.some(f=>f.id===id))),'Exact raw saved step and every original finding required');
 const originalClaim=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
 requireThat(originalClaim.length===1,'Original writer claim missing');const claim=JSON.parse(originalClaim[0].body);
 requireThat(claim.id===work.claimId&&claim.lane==='delivery'&&['running','completed'].includes(claim.status)&&claim.stage===work.stage.replace(/^github-/, '')&&
  isDeepStrictEqual(claim.work,proof.assignment.work),'Original writer claim identity differs');
 const completion=artifact(store,resolve(store.dataRoot,'sessions',work.id,'execution-completion.json'));
 const native=claudeExecution(store,work,cwd,resolve(nativeRoot,cwd.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`),nativeRoot);
 requireThat(JSON.parse(readFileSync(native.files[0].path,'utf8')).result?.terminal_reason==='completed','Original native terminal did not complete');
 const root=resolve(store.dataRoot,'ticket-work',job.id),files=result.evidence.map(e=>artifact(store,e.path));
 requireThat(result.evidence.some(e=>e.kind==='checks'&&e.commit===result.commit)&&files.every(f=>f.path.startsWith(root+'/')),'Owned exact-head check evidence required');
 return {work,proof,result,dependencies,claim,rawClaim:originalClaim[0].body,files:[...proof.files,...native.files,completion,...files],native:{root:nativeRoot,file:native.file},worktree:continuationWorktree(result.worktree)};
}
/** Persist only a verified candidate and wait condition; open findings remain independent-review gates. */
export async function handoffSavedPrerequisites(delivery:GitHubDelivery,job:TicketJob,originalWorkId:string,refresh:()=>Promise<Ownership>=refreshDeliveryOwnership,recoveryIntentId='',nativeRoot?:string){
 const {store}=delivery,context=currentAssignment(),claim=context?.claim;
 requireThat(context?.lane==='delivery'&&claim?.status==='running'&&claim.work.projectId===store.project.id,'Scheduler-owned saved prerequisite handoff required');
 const request=recoveryIntentId?store.state.coordination?.requests?.find(r=>r.id===recoveryIntentId):undefined;
 requireThat(recoveryIntentId?request?.status==='working'&&request.action==='reconcile-implementation'&&request.key===job.key&&request.head===originalWorkId&&claim.work.kind==='reconciliation'&&claim.work.id===request.id&&claim.stage==='reconcile-implementation':
  claim.work.kind==='delivery'&&claim.work.id===job.id&&claim.stage===job.stage,'Exact original-bound handoff claim required');
 requireThat(recoveryIntentId?['blocked','interrupted'].includes(job.status):job.status==='working','Saved writer stage is not eligible');
 const original=savedPrerequisiteOriginal(store,job,originalWorkId,nativeRoot),expected=digest(job),inputs=deliveryInputSha256(store,job.key),project=digest(store.project),readerClaim=JSON.stringify(claim),requestHash=request?digest(request):'';
 const effectRows=()=>store.db.prepare('SELECT body FROM effects WHERE work_key=? ORDER BY id').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{body:string}[];
 const effects=effectRows();requireThat(effects.every(({body})=>{const e=JSON.parse(body);return e.status==='verified'||e.status==='rejected'&&!e.dispatchedAt;}),'Original delivery effects remain uncertain');
 const stable=(ownership:Ownership)=>{
  requireThat(ownership.complete&&ownership.fresh&&ownership.ownership?.status==='clear'&&!store.state.paused&&!HOLDS[job.key]&&
   delivery.jobs.find(j=>j.id===job.id)===job&&digest(job)===expected&&digest(store.project)===project&&deliveryInputSha256(store,job.key)===inputs&&
   isDeepStrictEqual(currentAssignment()?.claim,claim)&&store.activeClaims().some(c=>JSON.stringify(c)===readerClaim)&&
   !store.activeClaims().some(c=>c.id!==claim.id&&c.work.kind==='delivery'&&c.work.id===job.id)&&
   !store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))&&
   !delivery.jobs.some(j=>j.id!==job.id&&j.status!=='cancelled'&&(j.key===job.key||j.worktree===original.result.worktree))&&
   isDeepStrictEqual(continuationWorktree(original.result.worktree),original.worktree)&&isDeepStrictEqual(effectRows(),effects)&&
   (!request||store.state.coordination?.requests?.filter(r=>r.id===request.id).length===1&&digest(request)===requestHash)&&
   store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(original.work.claimId!).map((r:any)=>r.body).join('')===original.rawClaim,'Saved prerequisite ownership, claim, inputs or effects changed');
  assertContinuationWorker(store,original.proof);requireThat(original.files.every(f=>isDeepStrictEqual(artifact(store,f.path),f))&&isDeepStrictEqual(rootArtifact(original.native.root,original.native.file.path),original.native.file),'Saved original execution evidence changed');
 };
 const local=async()=>{
  const candidate=await new GitOperations(store,delivery.execute).candidate(original.result.worktree,original.result.commit),options={cwd:original.result.worktree,readOnly:true,timeout:30000};
  const branch=(await delivery.execute('git',['branch','--show-current'],options)).trim(),origin=(await delivery.execute('git',['remote','get-url','origin'],options)).trim().replace(/\.git$/,'');
  requireThat(branch===original.result.branch&&[`https://github.com/${store.project.repository}`,`git@github.com:${store.project.repository}`].includes(origin),'Exact candidate branch/origin required');
  requireThat(!(await delivery.execute('git',['ls-remote','--heads','origin',`refs/heads/${original.result.branch}`],options)).trim(),'Saved prerequisite candidate is already published');
  const prs=await delivery.api(`pulls?state=all&head=${encodeURIComponent(store.project.repository.split('/')[0]+':'+original.result.branch)}&per_page=100`);
  requireThat(Array.isArray(prs)&&prs.length===0,'Saved prerequisite PR identity is not unpublished');
  if(job.head)await delivery.execute('git',['merge-base','--is-ancestor',job.head,original.result.commit],options);
  return candidate;
 };
 const beforeOwner=await refresh();stable(beforeOwner);const provider=await readValidationProviderContext(delivery,job.key),dependencies=await readDependencies(delivery,original.dependencies),candidate=await local();
 const afterOwner=await refresh(),afterProvider=await readValidationProviderContext(delivery,job.key),afterDependencies=await readDependencies(delivery,original.dependencies),afterCandidate=await local();
 requireThat(validationProviderVersion(provider)===validationProviderVersion(afterProvider)&&dependencyVersion(dependencies)===dependencyVersion(afterDependencies)&&isDeepStrictEqual(candidate,afterCandidate),'Candidate or provider inputs changed before saved handoff');stable(afterOwner);
 const root=resolve(store.dataRoot,'ticket-work',job.id);ownedPath(store,root);const path=resolve(root,`${randomUUID()}-saved-prerequisites.json`),at=store.clock.now().toISOString();
 const findingIds=[...new Set([...(job.candidateRecovery?.findingIds||[]),...original.result.findings.map(f=>f.id)])];
 writeFileSync(path,JSON.stringify({originalWorkId,fromHead:job.head,head:original.result.commit,stage:job.stage,prerequisites:original.dependencies,findingIds,assignment:original.proof.assignment,
  handoffClaim:structuredClone(claim),intentId:recoveryIntentId||null,originalWorker:original.proof.worker,originalClaim:original.claim,worktree:original.worktree,files:original.files,native:original.native,candidate,providerSha256:validationProviderVersion(provider),inputSha256:inputs,dependencies:afterDependencies,at},null,2),{mode:0o600});
 const proof=artifact(store,path);
 store.transaction(()=>{
  stable(afterOwner);requireThat(isDeepStrictEqual(artifact(store,path),proof),'Saved handoff proof changed');
  job.savedPrerequisiteHandoff={originalWorkId,fromHead:job.head,head:original.result.commit,stage:job.stage as 'implement'|'scope-repair',proofPath:path,proofSha256:proof.sha256,findingIds,at};
  job.head=original.result.commit;job.worktree=original.result.worktree;job.branch=original.result.branch;job.prerequisites=structuredClone(original.dependencies);
  const observations=store.state.coordination!.dependencyObservations??=[];
  for(const {identity,...observation}of afterDependencies){const old=observations.find(o=>workKey(o.target)===workKey(observation.target)&&o.condition===observation.condition);if(old)Object.assign(old,observation);else observations.push(observation);}
  recordJobApproach(job,{plan:job.approach?.plan||'brief',review:job.approach?.review==='full'?'full':'focused',validation:job.approach?.validation==='browser'?'browser':'independent-checks',checks:job.approach?.checks||['Required current-head checks'],reason:'A verified saved candidate with unresolved prerequisites requires independent review and QA; all original findings and source acceptance remain gated.'},'developer');
  job.stage='review';job.status='queued';job.detail='Saved candidate retained without writer replay. Independent review waits for verified PR prerequisites; original findings and source acceptance remain unresolved.';job.updatedAt=at;
  if(request){request.status='completed';request.detail=job.detail;}
  store.emit('saved-prerequisite-handoff',`${job.key}: ${job.detail}`,'pm',job.key);
 });
}
/** No inference from prerequisite prose to finding resolution is permitted. */
export function savedPrerequisiteFindingsResolved(job:TicketJob,stage:string,result:StageResult){
 return !job.savedPrerequisiteHandoff||!['review','validate'].includes(stage)||job.savedPrerequisiteHandoff.findingIds.every(id=>result.findings.some(f=>f.id===id&&(stage==='validate'?f.status==='verified':f.status!=='open')));
}
/** Fresh provider confirmation immediately before any independent acceptance stage. */
export async function requireSavedPrerequisites(delivery:GitHubDelivery,job:TicketJob){
 const saved=job.savedPrerequisiteHandoff;if(!saved)return true;
 const file=artifact(delivery.store,saved.proofPath),proof=JSON.parse(readFileSync(file.path,'utf8'));
 requireThat(file.sha256===saved.proofSha256&&proof.originalWorkId===saved.originalWorkId&&proof.head===saved.head&&isDeepStrictEqual(job.prerequisites,proof.prerequisites)&&isDeepStrictEqual(saved.findingIds,proof.findingIds),'Saved prerequisite proof or conditions changed');
 assertContinuationWorker(delivery.store,{worker:proof.originalWorker,files:proof.files,result:{},assignment:proof.assignment});
 requireThat(isDeepStrictEqual(rootArtifact(proof.native.root,proof.native.file.path),proof.native.file)&&isDeepStrictEqual(continuationWorktree(job.worktree),proof.worktree),'Saved original native or worktree ownership changed');
 const dependencies=qualified(delivery.store,{prerequisites:job.prerequisites}as StageResult,job.id),observed=await readDependencies(delivery,dependencies);
 const observations=delivery.store.state.coordination!.dependencyObservations??=[];
 for(const {identity,...observation}of observed){const old=observations.find(o=>workKey(o.target)===workKey(observation.target)&&o.condition===observation.condition);if(old)Object.assign(old,observation);else observations.push(observation);}
 return observed.every(o=>o.complete);
}
