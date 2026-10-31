import {isDeepStrictEqual} from 'node:util';
import {teamReviewedHead} from './team-review';
import {findingsBlock} from '../findings/advisory';
import {sameProviderInstant} from './provider-instant';
import {completedExecution} from '../../workers/worker-completion';
import {continuationWorkerProof,assertContinuationWorker} from '../recovery/implementation/continuation-evidence';
import {digest} from '../../store/readback-evidence';
import {deliveryInputSha256,deliveryHumanInputs} from '../../github/github-context';
import {requireSourceAmendmentAcceptance} from '../recovery/source-amendment/source-amendment';
import {HOLDS} from '../../office/config';
import type {GitHubDelivery} from '../pipeline/github-delivery';
import type {TicketJob} from '../../../src/shared';
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}
export class CurrentChecksWait extends Error {}
const id=(n:unknown)=>Number.isSafeInteger(n)&&Number(n)>0;
const time=(s:unknown)=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const pass=(c:any)=>c.status==='completed'&&['success','neutral','skipped'].includes(c.conclusion);
const pending=(c:any)=>['queued','in_progress','waiting','requested','pending'].includes(c.status)&&c.conclusion==null;
/** Raw checks and failures stay intact; only positively bound Actions executions can supersede one another. */
export async function selectCurrentChecks(delivery:GitHubDelivery,job:TicketJob,raw:any,providedPR?:any,statuses?:any){
 const {store}=delivery,head=job.head,repo=store.project.repository;
 if(statuses)validateStatuses(statuses,head);
 requireThat(Number.isInteger(raw?.total_count)&&raw.total_count>=0&&raw.total_count<=100&&Array.isArray(raw.check_runs)&&raw.total_count===raw.check_runs.length,'Complete bounded check-run coverage required');
 requireThat(raw.check_runs.every((c:any)=>id(c.id)&&c.head_sha===head)&&new Set(raw.check_runs.map((c:any)=>c.id)).size===raw.check_runs.length,'Unknown, foreign or duplicate check-run identity');
 const groups=new Map<string,any[]>();
 for(const c of raw.check_runs){if(c.app?.slug!=='github-actions'||!id(c.app.id)||typeof c.name!=='string'||!c.name)continue;const key=JSON.stringify([c.app.id,c.name]),group=groups.get(key)||[];group.push(c);groups.set(key,group);}
 const effective=[...raw.check_runs],superseded:any[]=[],workflows:any[]=[];
 for(const group of groups.values()){
  if(group.length<2)continue;
  const pr=providedPR||await delivery.verifyPR(job,true);
  requireThat(pr.number===job.pr&&pr.head?.sha===head&&typeof pr.head.ref==='string'&&pr.base?.repo?.full_name===repo&&pr.base.ref===store.project.target,'Current PR context is unavailable');
  const bound=[];
  for(const c of group){
   const match=typeof c.details_url==='string'&&c.details_url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/actions\/runs\/(\d+)\/job\/(\d+)$/);
   requireThat(match&&match[1]===repo&&Number(match[3])===c.id&&id(Number(match[2]))&&id(c.check_suite?.id)&&time(c.started_at)&&(!c.completed_at||time(c.completed_at)),'Canonical Actions job/run link required');
   const j=await delivery.api(`actions/jobs/${c.id}`);
   requireThat(j.id===c.id&&j.run_id===Number(match[2])&&id(j.run_attempt)&&j.head_sha===head&&j.name===c.name&&j.html_url===c.details_url&&
    j.check_run_url===`https://api.github.com/repos/${repo}/check-runs/${c.id}`&&j.status===c.status&&j.conclusion===c.conclusion&&j.started_at===c.started_at&&j.completed_at===c.completed_at,'Actions job does not match exact check-run');
   const r=await delivery.api(`actions/runs/${j.run_id}/attempts/${j.run_attempt}`);
   requireThat(r.id===j.run_id&&r.run_attempt===j.run_attempt&&r.check_suite_id===c.check_suite.id,'Actions run/attempt/suite identity differs');
   const identity=runIdentity(r,repo,head,pr);bound.push({check:c,job:j,run:r,identity});
  }
  const families=new Map<string,typeof bound>();for(const b of bound){const key=digest(b.identity),family=families.get(key)||[];family.push(b);families.set(key,family);}
  for(const family of families.values()){
   // Equal names from distinct workflows/events/PR contexts never cancel one another.
   if(family.length<2)continue;
   const sample=family[0],r=sample.run;
   const inventory=await delivery.api(`actions/workflows/${r.workflow_id}/runs?head_sha=${head}&event=${encodeURIComponent(r.event)}&branch=${encodeURIComponent(r.head_branch)}&per_page=100`);
   requireThat(Number.isInteger(inventory?.total_count)&&inventory.total_count>=0&&inventory.total_count<=100&&Array.isArray(inventory.workflow_runs)&&inventory.total_count===inventory.workflow_runs.length&&new Set(inventory.workflow_runs.map((x:any)=>x.id)).size===inventory.workflow_runs.length,'Complete bounded workflow-run inventory required');
   const relevant=inventory.workflow_runs.filter((x:any)=>isDeepStrictEqual(runIdentity(x,repo,head,pr),sample.identity));
   requireThat(relevant.length&&family.every(b=>relevant.some((x:any)=>x.id===b.run.id&&x.run_attempt>=b.run.run_attempt)),'Original workflow runs missing from current inventory');
   for(const b of family){const same=relevant.find((x:any)=>x.id===b.run.id&&x.run_attempt===b.run.run_attempt);if(same)requireThat(isDeepStrictEqual([same.status,same.conclusion,same.check_suite_id],[b.run.status,b.run.conclusion,b.run.check_suite_id])&&sameProviderInstant(same.created_at,b.run.created_at),'Historical workflow inventory changed during selection');}
   relevant.sort((a:any,b:any)=>b.run_number-a.run_number||b.run_attempt-a.run_attempt);
   const latest=relevant[0];requireThat(relevant.every((x:any)=>x.id===latest.id||x.run_number!==latest.run_number),'Ambiguous workflow run ordering');
   const current=family.filter(b=>b.run.id===latest.id&&b.run.run_attempt===latest.run_attempt);
   if(!current.length&&pending(latest)&&raw.check_runs.filter((c:any)=>!family.some(b=>b.check.id===c.id)).every((c:any)=>pass(c)||pending(c))&&(!statuses||['success','pending'].includes(statuses.state)&&statuses.statuses.every((s:any)=>['success','pending'].includes(s.state))))throw new CurrentChecksWait('Newer workflow execution is queued; waiting for its matching check/job coverage');
   requireThat(current.length===1,'Newer workflow execution has missing or ambiguous matching check/job coverage');
   const chosen=current[0];
   requireThat(chosen.run.status===latest.status&&chosen.run.conclusion===latest.conclusion&&sameProviderInstant(chosen.run.created_at,latest.created_at),'Workflow inventory changed during selection');
   for(const b of family){
    if(b===chosen)continue;
    const newer=b.run.id===latest.id?latest.run_attempt>b.run.run_attempt:latest.run_number>b.run.run_number;
    requireThat(newer&&Date.parse(latest.created_at)>=Date.parse(b.run.created_at)&&Date.parse(chosen.job.started_at)>=Date.parse(b.job.started_at),'Actions execution ordering is unproven');
    effective.splice(effective.findIndex(c=>c.id===b.check.id),1);
    superseded.push({oldCheckId:b.check.id,currentCheckId:chosen.check.id,context:sample.identity,oldRunId:b.run.id,oldAttempt:b.run.run_attempt,currentRunId:latest.id,currentAttempt:latest.run_attempt,oldJobSha256:digest(b.job),currentJobSha256:digest(chosen.job),oldRunSha256:digest(b.run),currentRunSha256:digest(latest)});
   }
   workflows.push({id:latest.id,status:latest.status,conclusion:latest.conclusion});
  }
 }
 return {raw,effective,superseded,workflows};
}
function runIdentity(r:any,repository:string,head:string,pr:any){
 requireThat(id(r?.id)&&id(r.workflow_id)&&id(r.run_number)&&id(r.run_attempt)&&id(r.check_suite_id)&&r.head_sha===head&&typeof r.path==='string'&&r.path.startsWith('.github/workflows/')&&
  r.repository?.full_name===repository&&id(r.repository.id)&&r.head_repository?.full_name===repository&&id(r.head_repository.id)&&r.head_branch===pr.head.ref&&typeof r.event==='string'&&!!r.event&&time(r.created_at)&&
  Array.isArray(r.pull_requests)&&r.pull_requests.length===1,'Incomplete workflow context; supersession denied');
 const p=r.pull_requests[0];requireThat(p.number===pr.number&&id(p.id)&&p.head?.sha===head&&p.head.ref===pr.head.ref&&p.head.repo?.id===r.head_repository.id&&
  p.base?.ref===pr.base.ref&&p.base.repo?.id===r.repository.id&&/^[a-f0-9]{40}$/.test(p.base.sha||''),'Workflow PR context mismatch');
 return {workflowId:r.workflow_id,path:r.path,event:r.event,branch:r.head_branch,head,repositoryId:r.repository.id,headRepositoryId:r.head_repository.id,prId:p.id,pr:p.number,base:p.base};
}
export function checksPassed(selection:Awaited<ReturnType<typeof selectCurrentChecks>>,statuses:any,head:string){
 validateStatuses(statuses,head);return !!(selection.effective.length||statuses.statuses.length)&&selection.effective.every(pass)&&selection.workflows.every(pass)&&statuses.statuses.every((s:any)=>s.state==='success')&&(statuses.state==='success'||statuses.state==='pending'&&statuses.total_count===0&&statuses.statuses.length===0);
}
export function checksPending(selection:Awaited<ReturnType<typeof selectCurrentChecks>>,statuses:any,head:string){
 validateStatuses(statuses,head);return selection.effective.every((c:any)=>pass(c)||pending(c))&&selection.workflows.every((c:any)=>pass(c)||pending(c))&&statuses.statuses.every((s:any)=>['success','pending'].includes(s.state))&&['success','pending'].includes(statuses.state)&&
  (selection.effective.some(pending)||selection.workflows.some(pending)||statuses.statuses.some((s:any)=>s.state==='pending'));
}
export function checksFailed(selection:Awaited<ReturnType<typeof selectCurrentChecks>>,statuses:any,head:string){
 validateStatuses(statuses,head);return [...selection.effective,...selection.workflows].some(c=>c.status==='completed'&&['failure','timed_out','action_required'].includes(c.conclusion))||statuses.statuses.some((s:any)=>['failure','error'].includes(s.state));
}
function validateStatuses(s:any,head:string){requireThat(s?.sha===head&&Number.isInteger(s.total_count)&&s.total_count>=0&&s.total_count<=100&&Array.isArray(s.statuses)&&s.statuses.length===s.total_count,'Complete current-head commit statuses required');}
export async function currentMergeChecks(delivery:GitHubDelivery,job:TicketJob,p:any){
 const checks=await delivery.api(`commits/${p.head.sha}/check-runs?per_page=100`),statuses=await delivery.api(`commits/${p.head.sha}/status`),selection=await selectCurrentChecks(delivery,job,checks,p,statuses);
 if(!checksPassed(selection,statuses,p.head.sha)){if(checksPending(selection,statuses,p.head.sha))throw new CurrentChecksWait('Current-head checks are still running');throw new Error('Current-head checks have not all passed');}return selection;
}
/** Observation queues only an unchanged, already accepted Lead assessment. Scheduler still owns all effects. */
export async function resumeReviewedMerge(delivery:GitHubDelivery,job:TicketJob,p:any){
 const {store}=delivery,project=digest(delivery.store.project),canonical=()=>delivery.jobs.filter(j=>j.id===job.id).length===1&&delivery.jobs.find(j=>j.id===job.id)===job&&!store.activeClaims().some(c=>c.work.projectId===store.project.id&&c.work.kind==='delivery'&&c.work.id===job.id)&&!store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)),context=job.reviewContext,review=job.steps.filter(s=>s.stage==='lead-pr').at(-1),work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-lead-pr').at(-1);
 const enabled=()=>store.state.coordination?.merges?.enabled||job.mergeAuthorization?.head===job.head;
 if(!context&&teamReviewedHead(store,job)){
  // Team-reviewed hands-off job: no Lead review to re-validate; requeue once current checks pass on the unchanged head.
  if(!canonical()||job.stage!=='merge'||!['blocked','interrupted','watching'].includes(job.status)||job.mergeAttempt||job.mergeApprovalRequired||store.state.paused||store.state.draining||HOLDS[job.key]||!enabled())return false;
  requireThat(p.state==='open'&&!p.draft&&p.mergeable===true&&p.head.sha===job.head,'Team-reviewed PR is not ready to merge');
  const intent=store.getEffect(job.mergeIntentId||`merge:${job.id}:${job.head}`);requireThat(!intent||['prepared','rejected'].includes(intent.status)&&!intent.dispatchedAt,'Prior merge intent needs read-back');
  const selection=await currentMergeChecks(delivery,job,p);
  job.status='queued';job.detail='Current checks passed on the team-reviewed head. The scheduler rechecks every merge gate before the write.';store.save();return selection;
 }
 if(!canonical()||job.stage!=='merge'||!['blocked','interrupted','watching'].includes(job.status)||!context||job.mergeAttempt||job.mergeApprovalRequired||store.state.paused||store.state.draining||HOLDS[job.key]||!enabled()||job.mergeAuthorization&&job.mergeAuthorization.head!==job.head)return false;
 requireThat(review?.result.outcome==='passed'&&!findingsBlock(store,review.result.findings,f=>f.status==='open')&&review.result.commit===job.head&&context.step===job.steps.indexOf(review)&&context.head===job.head&&context.head===p.head.sha&&context.target===store.project.target&&context.baseSha===p.base.sha&&context.prUpdatedAt===p.updated_at&&p.state==='open'&&!p.draft&&p.mergeable===true,'Saved merge review context changed');
 requireThat(job.reviewInputSha256===deliveryInputSha256(store,job.key)||!job.reviewInputSha256&&!deliveryHumanInputs(store,job.key).length,'Human merge review inputs changed');
 requireThat(work?.status==='completed'&&work.role==='lead'&&completedExecution(store,work),'One accepted actual Lead execution required');
 const original=continuationWorkerProof(store,job,work,true,job.worktree||store.project.repo),saved=original.result;
 const claimRows=()=>store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
 const rows=claimRows();requireThat(rows.length===1,'Accepted Lead owning claim missing');const originalClaim=JSON.parse(rows[0].body);
 requireThat(originalClaim.status==='completed'&&!!originalClaim.endedAt&&originalClaim.stage==='lead-pr'&&originalClaim.lane==='delivery'&&originalClaim.work.projectId===store.project.id&&originalClaim.work.kind==='delivery'&&originalClaim.work.id===job.id&&original.assignment.claimId===originalClaim.id,'Accepted Lead owning claim differs');
 const {evidence:savedEvidence,...savedValue}=saved,{evidence:acceptedEvidence,...acceptedValue}=review.result;requireThat(isDeepStrictEqual(savedValue,acceptedValue),'Saved Lead result differs from native execution');
 requireThat(savedEvidence.every((e:any)=>acceptedEvidence.some(r=>isDeepStrictEqual(e,r)))&&!job.steps.some(s=>s.result.receipts.some(r=>r.uncertain||!r.verified)),'Historical uncertain effects remain unresolved');
 const effect=()=>store.getEffect(job.mergeIntentId||`merge:${job.id}:${job.head}`),unattempted=()=>{const e=effect();return !e||['prepared','rejected'].includes(e.status)&&!e.dispatchedAt&&e.operation==='github-merge'&&e.target===job.prUrl&&e.work.projectId===store.project.id&&e.work.kind==='delivery'&&e.work.id===job.id&&(e.payload as any)?.sha===job.head;};requireThat(unattempted(),'Prior or foreign merge effect cannot be replayed');
 const expected=digest(job),input=deliveryInputSha256(store,job.key),issue=await delivery.api(`issues/${Number(job.key.slice(3))}`);requireThat(issue.number===Number(job.key.slice(3))&&issue.html_url===`https://github.com/${store.project.repository}/issues/${issue.number}`&&issue.state==='open'&&issue.assignees?.some((a:any)=>a.login==='JFusco')&&issue.updated_at===context.issueUpdatedAt,'Issue changed since accepted Lead review');
 await requireSourceAmendmentAcceptance(delivery,job);const selection=await currentMergeChecks(delivery,job,p);
 const fresh=await delivery.verifyPR(job,true),freshIssue=await delivery.api(`issues/${Number(job.key.slice(3))}`);
 requireThat(canonical()&&digest(store.project)===project&&digest(job)===expected&&deliveryInputSha256(store,job.key)===input&&isDeepStrictEqual([fresh.head.sha,fresh.base.sha,fresh.base.ref,fresh.updated_at,fresh.draft,fresh.mergeable],[p.head.sha,p.base.sha,p.base.ref,p.updated_at,p.draft,p.mergeable])&&freshIssue.updated_at===context.issueUpdatedAt&&
  !store.state.paused&&!store.state.draining&&!HOLDS[job.key]&&enabled()&&!job.mergeApprovalRequired&&unattempted(),'Merge observation changed before queueing');
 assertContinuationWorker(store,original);requireThat(completedExecution(store,work)&&isDeepStrictEqual(claimRows(),rows),'Accepted Lead completion or claim changed');
 store.transaction(()=>{requireThat(canonical()&&digest(store.project)===project&&digest(job)===expected,'Merge job changed');job.status='queued';job.detail='Current workflow executions passed; unchanged accepted Lead review retained. Scheduler will recheck every merge/source/permission gate before any write.';store.emit('merge-checks-reconciled',job.detail,'lead',job.key);});
 return selection;
}
