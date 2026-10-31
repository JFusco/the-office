import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {currentAssignment} from './assignment-context';
import {ResultSchema} from './agents';
import {continuationWorkerProof,assertContinuationWorker,continuationNativeReview,continuationReviewArtifacts} from './continuation-evidence';
import {negativeTechnicalReview,implementationContinuationDecision} from './implementation-continuation';
import {artifact,ownedPath,digest} from './readback-evidence';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import {deliveryHumanInputs} from './github-context';
import type {Store} from './store';
import type {TicketJob} from '../src/shared';
import type {GitHubDelivery} from './github-delivery';

/** Qualification only; no model, dispatch, result rewriting or acceptance. */
export function savedNegativeContinuationReview(store:Store,job:TicketJob,originalWorkId:string){
 try{
  if(store.project.id!=='brain'||job.stage!=='review'||!['blocked','interrupted'].includes(job.status)||job.implementationContinuation?.phase!=='technical-review'||job.pr||job.existingPR||job.mergeAttempt||job.mergeIntentId)return;
  const works=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-review')||[],work=works.at(-1);
  if(!work||work.id!==originalWorkId||work.status!=='failed'||work.role!=='lead'||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))||job.steps.some(s=>s.workerId===work.id))return;
  const proof=continuationWorkerProof(store,job,work,true,job.worktree),result=ResultSchema.parse(proof.result);
  if(!negativeTechnicalReview(result,job)||result.commit!==job.head||result.worktree!==job.worktree||result.branch!==job.branch)return;
  const native=continuationNativeReview(store,work,result),diagnostics=continuationReviewArtifacts(store,job,result);
  const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as {body:string}[];
  if(rows.length!==1)return;const claim=JSON.parse(rows[0].body);
  if(claim.id!==work.claimId||claim.status!=='completed'||!claim.endedAt||claim.lane!=='delivery'||claim.stage!=='review'||claim.work?.projectId!==store.project.id||claim.work.kind!=='delivery'||claim.work.id!==job.id)return;
  return {proof,result,claim,native,diagnostics};
 }catch{return;}
}

/** Existing reconcile-review action consumes one original negative review, solely into the normal bounded repair transition. */
export async function reconcileContinuationReview(delivery:GitHubDelivery,key:string,originalWorkId:string){
 const {store}=delivery,jobs=delivery.jobs.filter(j=>j.key===key&&j.status!=='cancelled'),job=jobs[0],selected=jobs.length===1&&savedNegativeContinuationReview(store,job,originalWorkId);
 if(!selected)throw new Error('Exact saved negative continuation review required');
 const assignment=currentAssignment(),requests=store.state.coordination?.requests?.filter(r=>r.id===assignment?.claim.work.id)||[],intent=requests[0];
 if(requests.length!==1||intent.action!=='reconcile-review'||intent.key!==key||intent.head!==originalWorkId||intent.status!=='working'||intent.lane!=='delivery'||assignment?.lane!=='delivery')throw new Error('Exact scheduler-owned saved review intent required');
 const originalSnapshot=digest(selected),expectedIntent=digest(intent),start=Date.parse(selected.proof.worker.startedAt);
 if(!Number.isFinite(start))throw new Error('Original negative review start identity missing');
 const guard=await delivery.continuationGuard(job,intent),before=await readValidationProviderContext(delivery,key);
 const unchangedScope=(context:typeof before)=>{
  const dates=[context.issue.updated_at,...context.comments.flatMap(c=>[c.created_at,c.updated_at]),...deliveryHumanInputs(store,key).map(i=>i.createdAt)];
  if(dates.some(value=>!Number.isFinite(Date.parse(value as string))||Date.parse(value as string)>start))throw new Error('Issue, comments or human inputs changed since the negative review; fresh assessment required');
 };
 unchangedScope(before);
 const assertCurrent=()=>{
  guard.assertCurrent();assertContinuationWorker(store,selected.proof,job);
  const current=savedNegativeContinuationReview(store,job,originalWorkId);
  if(!current||digest(current)!==originalSnapshot||digest(intent)!==expectedIntent)throw new Error('Saved negative continuation review or intent changed');
 };
 assertCurrent();
 const decision=implementationContinuationDecision(job,selected.result,await guard.verify(selected.result));
 if(!decision||decision.action!=='repair')throw new Error('Saved negative review must require the existing bounded technical repair');
 const after=await readValidationProviderContext(delivery,key);unchangedScope(after);
 if(validationProviderVersion(before)!==validationProviderVersion(after))throw new Error('Current provider scope changed during negative review reconciliation');
 assertCurrent();
 const root=resolve(store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true,mode:0o700});ownedPath(store,root);
 const path=resolve(root,`${intent.id}-negative-review-readback.json`),at=store.clock.now().toISOString();
 writeFileSync(path,JSON.stringify({originalWorkId,original:selected.proof,originalClaim:selected.claim,native:selected.native,diagnostics:selected.diagnostics,intent:structuredClone(intent),providerBefore:before,providerAfter:after,decision,verifiedAt:at},null,2),{flag:'wx',mode:0o600});
 const file=artifact(store,path),result=structuredClone(selected.result);
 result.evidence.push({id:intent.id,kind:'review',path,commit:job.head,summary:'Original negative technical review reconciled without model replay; source acceptance remains pending',environment:'Office saved negative review readback',url:'',observedAt:at});
 store.transaction(()=>{
  assertCurrent();if(!isDeepStrictEqual(artifact(store,path),file))throw new Error('Negative review readback proof changed');
  job.steps.push({stage:'review',workerId:originalWorkId,nativeResultSha256:digest(selected.result),result});
  job.implementationContinuation=decision.next;job.stage='scope-repair';job.status='queued';
  job.candidateRecovery!.findingIds=[...new Set([...job.candidateRecovery!.findingIds,...decision.next.pendingFindingIds,...decision.next.repairFindingIds,...result.findings.map(f=>f.id)])];
  job.detail=decision.reason;job.updatedAt=at;intent.status='completed';intent.detail=decision.reason;
  store.emit('implementation-continuation',decision.reason,'developer',key);
 });
}
