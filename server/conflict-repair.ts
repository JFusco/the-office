import {retainedConflictChain,verifyConflictChainGit} from './conflict-chain';
import {isDeepStrictEqual} from 'node:util';
import {resolve} from 'node:path';
import {HOLDS} from './config';
import {verifyRepairCandidate} from './delivery-repairs';
import {hasUncertainEffects} from './github-delivery';
import {artifact,digest} from './readback-evidence';
import {readFileSync} from 'node:fs';
import {deliveryInputSha256} from './github-context';
import {currentAssignment} from './assignment-context';
import {containedFile} from './workflow';
import type {GitHubDelivery} from './github-delivery';
import type {StageResult,TicketJob} from '../src/shared';

/** Two reserved historical IDs only; future workers use the explicit conflict-only classification. */
const legacyConflictIds=new Set(['merge-conflicts','main-integration-conflict']);
export function conflictOnlyAssessment(result:StageResult){
 return ['blocked','failed'].includes(result.outcome)&&conflictFindingClassification(result);
}
/** Classification alone is never authority to adopt a publication or bypass a source gate. */
export function conflictFindingClassification(result:StageResult){
 const ids=result.findings.filter(f=>f.status==='open').map(f=>f.id),classification=result.resolution;
 if(result.paidRuns!==0||!ids.length||new Set(ids).size!==ids.length||result.prerequisites?.length||hasUncertainEffects('lead-pr',result))return false;
 if(classification?.kind==='conflict-repair')return classification.findingIds.length===ids.length&&new Set(classification.findingIds).size===ids.length&&ids.every(id=>classification.findingIds.includes(id))&&classification.evidenceIds.length>0&&new Set(classification.evidenceIds).size===classification.evidenceIds.length&&classification.evidenceIds.every(id=>{const matches=result.evidence.filter(e=>e.id===id);return !!id.trim()&&matches.length===1&&matches[0].commit===result.commit&&(!!matches[0].path.trim()||remoteLocator(matches[0].url));});
 return (!classification||classification.kind==='source-repair')&&ids.every(id=>legacyConflictIds.has(id));
}

function remoteLocator(value:string){try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&!!url.hostname;}catch{return false;}}
/** URL-only model locators are advisory; bind their unchanged structured assessment to Office's own saved review. */
export function conflictAssessmentArtifact(store:import('./store').Store,job:TicketJob,result:StageResult){
 const remoteOnly=result.resolution?.kind==='conflict-repair'&&result.resolution.evidenceIds.some(id=>result.evidence.some(e=>e.id===id&&!e.path.trim()));
 if(!remoteOnly)return;
 const entries=result.evidence.filter(e=>e.kind==='review'&&e.commit===job.head&&e.environment==='Office Lead review'&&e.path.startsWith(resolve(store.dataRoot,'ticket-work',job.id)+'/lead-review-'));
 if(entries.length!==1)throw Error('One Office-owned current-head conflict assessment required');
 const file=artifact(store,entries[0].path),saved=JSON.parse(readFileSync(file.path,'utf8'));
 if(saved.head!==job.head||saved.pr!==job.prUrl||!isDeepStrictEqual(saved.review,{...result,evidence:result.evidence.filter(e=>e!==entries[0])}))throw Error('Saved Office conflict assessment differs from the original result');
 return file;
}

/** Provider conflict facts corroborate a classification, never grant source acceptance or a merge. */
export async function readConflictRepairProof(delivery:GitHubDelivery,job:TicketJob,result:StageResult){
 const {store}=delivery,expected=digest({job,project:store.project}),inputSha256=deliveryInputSha256(store,job.key);
 const assertCurrent=()=>{
  if(store.state.paused||store.state.draining||HOLDS[job.key]||delivery.jobs.find(j=>j.id===job.id)!==job||digest({job,project:store.project})!==expected||deliveryInputSha256(store,job.key)!==inputSha256||job.mergeAttempt||job.mergeIntentId&&['dispatching','uncertain','verified'].includes(store.getEffect(job.mergeIntentId)?.status||'')||job.boardUpdates?.some(u=>u.status!=='verified')||store.activeClaims().some(claim=>claim.work.kind==='delivery'&&claim.work.id===job.id&&claim.id!==currentAssignment()?.claim.id)||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))||job.implementationContinuation&&job.implementationContinuation.phase!=='acceptance')throw new Error('Conflict candidate ownership, hold or authorization changed');
 };
 if(!conflictOnlyAssessment(result)||result.commit!==job.head||result.prId!==job.pr||result.worktree!==job.worktree||result.branch!==job.branch||resolve(job.worktree)===resolve(store.project.repo))throw new Error('Conflict-only exact owned assessment required');
 const chain=retainedConflictChain(store,job,conflictOnlyAssessment);
 if(!chain)for(const stage of ['review','validate']){
  const accepted=job.steps.filter(s=>s.stage===stage).at(-1)?.result;
  if(!accepted||accepted.outcome!=='passed'||accepted.commit!==job.head||accepted.findings.some(f=>f.status==='open')||hasUncertainEffects(stage,accepted)||!accepted.evidence.some(e=>e.commit===job.head&&e.kind===(stage==='review'?'review':'checks')&&containedFile(e.path,resolve(store.dataRoot,'ticket-work',job.id))))throw new Error('Existing exact-head source review and QA required for conflict-only repair');
 }
 const assessment=conflictAssessmentArtifact(store,job,result);
 if(chain)await verifyConflictChainGit(delivery,job,chain);
 assertCurrent();await verifyRepairCandidate(store.project,{head:job.head,branch:job.branch,worktree:job.worktree},delivery.execute);
 const p=await delivery.verifyPR(job,true),repository=store.project.repository;
 const issue=await delivery.api(`issues/${Number(job.key.slice(3))}`),target=await delivery.api(`commits/${encodeURIComponent(store.project.target)}`);
 if(issue.number!==Number(job.key.slice(3))||issue.html_url!==`https://github.com/${repository}/issues/${issue.number}`||issue.state!=='open'||!/^[a-f0-9]{40}$/.test(target.sha||'')||job.reviewContext&&(job.reviewContext.head!==job.head||job.reviewContext.issueUpdatedAt!==issue.updated_at||job.reviewContext.prUpdatedAt!==p.updated_at)||job.reviewInputSha256&&job.reviewInputSha256!==deliveryInputSha256(store,job.key))throw new Error('Conflict assessment scope or current target changed');
 if(p.number!==job.pr||p.html_url!==job.prUrl||p.html_url!==`https://github.com/${repository}/pull/${job.pr}`||p.state!=='open'||p.merged_at||p.draft!==false||p.mergeable!==false||p.head.sha!==job.head||p.head.ref!==job.branch||p.head.repo?.full_name!==repository||p.base.ref!==store.project.target||p.base.repo?.full_name!==repository||!/^[a-f0-9]{40}$/.test(p.base.sha||''))throw new Error('Current canonical PR conflict identity required');
 const query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){number url state isDraft headRefOid headRefName baseRefOid baseRefName mergeable mergeStateStatus headRepository{nameWithOwner} baseRepository{nameWithOwner}}}}';
 const [owner,name]=repository.split('/'),raw=JSON.parse(await delivery.execute('gh',['api','graphql','--input','-'],{cwd:store.project.repo,readOnly:true,timeout:60000,input:JSON.stringify({query,variables:{owner,name,number:job.pr}})}));
 const graph=raw.data?.repository?.pullRequest;
 if(raw.errors?.length||graph?.number!==job.pr||graph.url!==job.prUrl||graph.state!=='OPEN'||graph.isDraft!==false||graph.headRefOid!==job.head||graph.headRefName!==job.branch||graph.baseRefOid!==p.base.sha||graph.baseRefName!==store.project.target||graph.headRepository?.nameWithOwner!==repository||graph.baseRepository?.nameWithOwner!==repository||graph.mergeable!=='CONFLICTING'||graph.mergeStateStatus!=='DIRTY')throw new Error('Exact GitHub conflict and base readback required');
 const after=await delivery.verifyPR(job,true),targetAfter=await delivery.api(`commits/${encodeURIComponent(store.project.target)}`),issueAfter=await delivery.api(`issues/${issue.number}`);
 const identity=(pr:any)=>({number:pr.number,url:pr.html_url,state:pr.state,draft:pr.draft,mergedAt:pr.merged_at,mergeable:pr.mergeable,head:{sha:pr.head.sha,ref:pr.head.ref,repository:pr.head.repo?.full_name},base:{sha:pr.base.sha,ref:pr.base.ref,repository:pr.base.repo?.full_name},updatedAt:pr.updated_at});
 if(!isDeepStrictEqual(identity(p),identity(after))||target.sha!==targetAfter.sha||!isDeepStrictEqual(issue,issueAfter))throw new Error('Conflict provider candidate changed during readback');
 assertCurrent();if(assessment&&!isDeepStrictEqual(artifact(store,assessment.path),assessment))throw Error('Saved conflict assessment changed');
 return {assessment,...(chain?{sourceAnchor:chain.anchor,priorConflictChain:chain.links.map(link=>({from:link.from,head:link.head,target:link.target,base:link.base})),priorConflictArtifacts:chain.files}:{}),kind:'verified-conflict-only',projectId:store.project.id,repository,jobId:job.id,ticket:job.key,head:job.head,branch:job.branch,worktree:job.worktree,pr:job.pr,base:p.base.sha,targetHead:target.sha,target:p.base.ref,classification:result.resolution||null,findingIds:result.findings.filter(f=>f.status==='open').map(f=>f.id),provider:[identity(p),graph,identity(after)],observedAt:store.clock.now().toISOString()};
}

/** Conflict integration changes the commit anchor, not the scope of an existing authenticated claim approval. */
export function conflictApprovalGuidance(job:TicketJob){
 const anchor=job.steps.filter(step=>step.stage==='conflict-readback').at(-1)?.result;
 if(job.repairReason!=='conflicts'||!anchor||!conflictOnlyAssessment(anchor))return '';
 return `CONFLICT-ONLY APPROVAL CONTINUITY: Ordinary target-branch conflict integration is authorized. Preserve the pre-integration approval anchor ${anchor.commit} and its authenticated approval note. If that note accepts exact claims/citations, carry that same acceptance forward only after confirming the ticket's approved claim and source-lock delta is unchanged relative to the updated target. A new conflict-integration commit hash alone is not a reason to ask for the same source acceptance again or repeat source review/QA. This is not new source acceptance: never infer an absent approval, expand claims, accept additional locks/baselines or use conflict authorization for an unrelated finding. Expanded or changed ticket scope returns to its ordinary acceptance path. Retain required repaired-head developer/hosted checks, current-head readiness, release/permission gates and same-PR merge identity.`;
}
