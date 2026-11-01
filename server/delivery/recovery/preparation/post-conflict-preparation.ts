import {harnessDelivers} from '../../harness/scope';
import {retainedConflictChain,verifyConflictChainGit} from '../../repairs/conflict-chain';
import {initialDraftConflictAnchor,verifyInitialDraftConflictDelta} from './published-draft-conflict';
import {resolve,relative,isAbsolute,sep} from 'node:path';
import {homedir} from 'node:os';
import {readFileSync,lstatSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {artifact,rootArtifact,digest} from '../../../store/readback-evidence';
import {continuationWorkerProof,assertContinuationWorker,continuationWorktree} from '../implementation/continuation-evidence';
import {completedExecution,claudeExecution} from '../../../workers/worker-completion';
import {preparationCheckpoint} from './preparation-checkpoint';
import {preparationGateEvidence} from './preparation-gates';
import {assertHistoricalArtifactPath} from '../../../store/historical-artifact-path';
import {conflictOnlyAssessment,conflictApprovalGuidance} from '../../repairs/conflict-repair';
import {readPreparationProviderContext,preparationProviderVersion} from './preparation-provider-context';
import {readValidationProviderContext,validationProviderVersion} from '../validation/validation-provider-context';
import {verifyRepairCandidate} from '../../repairs/delivery-repairs';
import {deliveryInputSha256} from '../../../github/github-context';
import {currentAssignment} from '../../../workers/assignment-context';
import {HOLDS} from '../../../office/config';
import {workKey} from '../../../../src/shared';
import type {StageResult,TicketJob} from '../../../../src/shared';
import type {Store} from '../../../store/store';
import type {GitHubDelivery} from '../../pipeline/github-delivery';

/** A published conflict repair retains its real pre-integration source gates; it does not invent new ones. */
export function postConflictPreparationEvidence(store:Store,job:TicketJob){
 const conflict=job.steps.filter(s=>s.stage==='conflict-readback').at(-1),repair=job.steps.filter(s=>s.stage==='update-base').at(-1),publication=job.steps.filter(s=>s.stage==='draft').at(-1);
 const initial=conflict&&initialDraftConflictAnchor(store,job,conflict);
 if(store.project.provider!=='github'||job.repairReason!=='conflicts'||!job.pr||!job.prUrl||!job.worktree||!job.branch||
  job.sourceAmendment||job.mergeAttempt||job.mergeIntentId||job.dependsOnPR||job.prerequisites?.length&&!initial||
  job.implementationContinuation&&job.implementationContinuation.phase!=='acceptance')return;
 if(!conflict||!repair||!publication||!conflictOnlyAssessment(conflict.result)&&!initial||repair.result.outcome!=='passed'||repair.result.commit!==job.head||
  publication.result.outcome!=='passed'||publication.result.commit!==job.head||publication.result.prId!==job.pr||
  [repair,publication].some(s=>s.result.worktree!==job.worktree||s.result.branch!==job.branch||s.result.receipts.some(r=>!r.verified||r.uncertain)||s.result.findings.some(f=>f.status==='open'))||
  !repair.result.evidence.some(e=>e.kind==='checks'&&e.commit===job.head)||!publication.result.evidence.some(e=>e.kind==='pr'&&e.commit===job.head)||
  !job.decisions?.some(d=>d.stage==='update-base'&&d.role==='pm'&&d.approach.review==='none'&&d.approach.validation==='developer-checks')||
  job.approach?.review!=='none'||job.approach.validation!=='developer-checks')return;
 const sourceAnchor=job.steps.filter(s=>s.stage==='review').at(-1)?.result.commit;
 const chain=sourceAnchor!==conflict.result.commit?retainedConflictChain(store,job,conflictOnlyAssessment,false):undefined;
 const anchor=chain?.anchor||conflict.result.commit;
 for(const stage of ['review','validate']){
  const accepted=job.steps.filter(s=>s.stage===stage).at(-1)?.result;
  if(!accepted||accepted.outcome!=='passed'||accepted.commit!==anchor||accepted.findings.some(f=>f.status==='open')||accepted.receipts.some(r=>!r.verified||r.uncertain))return;
 }
 const entries=conflict.result.evidence.filter(e=>e.kind==='provider'&&e.commit===conflict.result.commit&&e.path.startsWith(resolve(store.dataRoot,'ticket-work',job.id)+'/conflict-readback-'));
 if(entries.length!==1)return;
 const file=artifact(store,entries[0].path),proof=JSON.parse(readFileSync(file.path,'utf8'));
 if(proof.kind!=='verified-conflict-only'||proof.projectId!==store.project.id||proof.repository!==store.project.repository||proof.jobId!==job.id||proof.ticket!==job.key||
  proof.head!==conflict.result.commit||proof.branch!==job.branch||proof.worktree!==job.worktree||proof.pr!==job.pr||proof.target!==store.project.target||
  !/^[a-f0-9]{40}$/.test(proof.targetHead)||!/^[a-f0-9]{40}$/.test(proof.base))return;
 const gateEnd=job.steps.map(s=>s.stage).lastIndexOf('validate');
 const gates=chain?.gates||preparationGateEvidence(store,{...job,head:anchor,steps:[...job.steps.slice(0,gateEnd+1),repair,publication]},{directCompleted:!!initial}),files=[file,...gates.files,...(chain?.files||[])];
 return {anchor,repair,publication,proof,gates,files,chain,...(initial?{initial}:{}),guidance:conflictApprovalGuidance(job)};
}

export function assertPostConflictOwnership(store:Store,job:TicketJob,intentId?:string){
 const assignment=currentAssignment(),claim=assignment?.claim;
 const kind=intentId?'reconciliation':'delivery',id=intentId||job.id,stage=intentId?'reconcile-preparation':job.stage;
 if(!claim||assignment?.lane!=='delivery'||claim.lane!=='delivery'||claim.status!=='running'||claim.work.projectId!==store.project.id||claim.work.kind!==kind||claim.work.id!==id||claim.stage!==stage||
  !store.activeClaims().some(c=>isDeepStrictEqual(c,claim))||store.state.paused||HOLDS[job.key]||
  store.activeClaims().some(c=>c.work.id===job.id&&c.id!==claim.id)||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))||
  job.boardUpdates?.some(u=>u.status!=='verified'))throw Error('Post-conflict preparation ownership, pause, hold or admitted claim changed');
 const effects=store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as {body:string}[];
 if(effects.some(row=>JSON.parse(row.body).status!=='verified')||job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain)))throw Error('Post-conflict effects require reconciliation');
 return structuredClone(claim);
}

/** Read-only verification only. Hosted checks and exact-claim approval continuity still belong to ordinary Lead readiness. */
export async function readPostConflictPreparationFacts(delivery:GitHubDelivery,job:TicketJob,draft=false){
 const evidence=postConflictPreparationEvidence(delivery.store,job);
 if(!evidence)throw Error('Verified conflict-only publication with retained source gates required');
 await verifyRepairCandidate(delivery.store.project,job,delivery.execute);
 if(evidence.chain)await verifyConflictChainGit(delivery,job,evidence.chain);
 for(const path of evidence.gates.trackedSources)if((await delivery.execute('git',['--literal-pathspecs','ls-files','--error-unmatch','--',path],{cwd:job.worktree,readOnly:true,timeout:30000})).trim()!==path)throw Error('Retained conflict evidence is not a tracked candidate file');
 const remote=(await delivery.execute('git',['ls-remote','--heads','origin','refs/heads/'+job.branch],{cwd:job.worktree,readOnly:true,timeout:30000})).trim();
 if(remote!==job.head+'\trefs/heads/'+job.branch)throw Error('Published conflict branch changed');
 await delivery.execute('git',['merge-base','--is-ancestor',evidence.anchor,job.head],{cwd:job.worktree,readOnly:true});
 await delivery.execute('git',['merge-base','--is-ancestor',evidence.proof.targetHead,job.head],{cwd:job.worktree,readOnly:true});
 await verifyInitialDraftConflictDelta(delivery,job,evidence.proof,job.head);
 if(draft){
  const pr=await delivery.verifyPR(job,true);
  if(pr.number!==job.pr||pr.html_url!==job.prUrl||pr.state!=='open'||pr.merged_at||pr.draft!==true||pr.head.sha!==job.head||pr.head.ref!==job.branch||pr.head.repo?.full_name!==delivery.store.project.repository||pr.base.repo?.full_name!==delivery.store.project.repository||pr.base.ref!==delivery.store.project.target)throw Error('Initial conflict draft publication identity changed');
  const provider=await readValidationProviderContext(delivery,job.key);
  return {evidence,provider,providerVersion:digest({scope:validationProviderVersion(provider),pr}),inputSha256:deliveryInputSha256(delivery.store,job.key)};
 }
 const provider=await readPreparationProviderContext(delivery,job);
 return {evidence,provider,providerVersion:preparationProviderVersion(provider),inputSha256:deliveryInputSha256(delivery.store,job.key)};
}

const within=(root:string,path:string)=>{const r=relative(resolve(root),path);return path===resolve(path)&&!!r&&r!=='..'&&!r.startsWith('..'+sep)&&!isAbsolute(r);};
/** Rehash only the two positively qualified roots; tracked source is never a private-store artifact. */
function assertPostConflictFiles(store:Store,job:TicketJob,evidence:NonNullable<ReturnType<typeof postConflictPreparationEvidence>>){
 for(const ref of evidence.gates.references as any[])if(ref.kind==='historical-installation-alias-context')assertHistoricalArtifactPath(store,job.id,ref.provenance);
 if(evidence.initial){const step=job.steps.filter(s=>s.stage==='conflict-readback').at(-1)!,current=initialDraftConflictAnchor(store,job,step);if(!current||!isDeepStrictEqual(current,evidence.initial))throw Error('Initial source/publication proof changed before handoff');}
 if('nativeArtifacts'in evidence.gates)for(const native of evidence.gates.nativeArtifacts||[])if(!isDeepStrictEqual(rootArtifact(native.root,native.file.path),native.file))throw Error('Direct source native evidence changed before handoff');
 const tracked=new Set(evidence.gates.trackedSources.map(path=>resolve(job.worktree,path)));
 for(const file of evidence.files){
  let actual:ReturnType<typeof artifact>;
  if(within(store.dataRoot,file.path))actual=artifact(store,file.path);
  else{
   if(!within(job.worktree,file.path)||!tracked.has(file.path))throw Error('Unqualified post-conflict artifact root');
   const stat=lstatSync(job.worktree);
   if(stat.isSymbolicLink()||!stat.isDirectory()||!evidence.gates.references.some((ref:any)=>ref.kind==='candidate-directory-context'&&ref.path===job.worktree&&ref.identity?.dev===stat.dev&&ref.identity?.ino===stat.ino))throw Error('Post-conflict candidate directory identity changed');
   actual=rootArtifact(job.worktree,file.path);
  }
  if(!isDeepStrictEqual(actual,file))throw Error('Post-conflict evidence changed before handoff');
 }
}

/** Retained initial-publication history still requires its descriptor after a restart. */
export async function verifyInitialDraftConflictPreparation(delivery:GitHubDelivery,job:TicketJob,draft:boolean){
 if(job.repairReason!=='conflicts'||!job.initialDraftConflict&&!job.steps.some(s=>s.stage==='conflict-readback'&&s.result.outcome==='passed'))return;
 const facts=await readPostConflictPreparationFacts(delivery,job,draft);
 assertPostConflictFiles(delivery.store,job,facts.evidence);
}

/** This is one successfully completed, already-published conflict draft, never an arbitrary worker recovery. */
export function completedConflictDraftCandidate(store:Store,job:TicketJob){
 try{
  if(store.project.provider!=='github'||store.project.id==='brain'||job.stage!=='draft'||!['blocked','interrupted'].includes(job.status)||job.repairReason!=='conflicts'||HOLDS[job.key]||
   store.state.coordination?.jobs?.filter(j=>j.key===job.key&&j.status!=='cancelled').length!==1||job.boardUpdates?.some(u=>u.status!=='verified')||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))||job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain)))return;
  const step=job.steps.at(-1),work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-draft').at(-1);
  if(!step||step.stage!=='draft'||step.result.outcome!=='passed'||!step.result.receipts.length||!work||work.status!=='completed'||work.role!=='developer'||work.provider!=='claude'||!completedExecution(store,work))return;
  const proof=continuationWorkerProof(store,job,work,false,job.worktree),result=preparationCheckpoint(proof.result);
  if(!isDeepStrictEqual(result,step.result)||result.commit!==job.head||result.prId!==job.pr||result.worktree!==job.worktree||result.branch!==job.branch||result.findings.some(f=>f.status==='open'))return;
  const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];if(rows.length!==1)return;const claim=JSON.parse(rows[0].body);
  if(claim.id!==work.claimId||claim.status!=='completed'||claim.lane!=='delivery'||claim.stage!=='draft'||claim.work?.projectId!==store.project.id||claim.work.kind!=='delivery'||claim.work.id!==job.id||!claim.endedAt||
   !Number.isFinite(Date.parse(claim.claimedAt))||!Number.isFinite(Date.parse(claim.endedAt))||Date.parse(claim.claimedAt)>Date.parse(work.startedAt)||Date.parse(claim.endedAt)<Date.parse(work.endedAt!))return;
  const nativeRoot=resolve(homedir(),'.claude','projects'),native=claudeExecution(store,work,job.worktree,resolve(nativeRoot,job.worktree.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`));
  const evidence=postConflictPreparationEvidence(store,job);if(!evidence)return;assertPostConflictFiles(store,job,evidence);
  const effects=store.db.prepare('SELECT id,body FROM effects WHERE work_key=? ORDER BY id').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{id:string;body:string}[];
  if(effects.some(row=>JSON.parse(row.body).status!=='verified'))return;
  return {id:`post-conflict-draft:${job.id}:${work.id}:${job.head}`,work:proof.worker,proof,result,claim,effects,nativeRoot,native,evidence,completion:artifact(store,resolve(store.dataRoot,'sessions',work.id,'execution-completion.json')),worktree:continuationWorktree(job.worktree)};
 }catch{return;}
}
export function completedConflictDraftUnresolved(store:Store,id:string){
 const [kind,jobId,,head]=id.split(':');return kind==='post-conflict-draft'&&!!store.state.coordination?.jobs?.some(job=>job.id===jobId&&job.stage==='draft'&&job.head===head&&['blocked','interrupted'].includes(job.status));
}

/** Scheduler-owned readback of the completed publication; zero model or mutation replay. */
export async function reconcileCompletedConflictDraft(delivery:GitHubDelivery,key:string,originalWorkId:string,ownership:()=>Promise<{complete:boolean;fresh:boolean;ownership?:{status:string}}>,intentId:string){
 const {store}=delivery,job=delivery.jobs.find(j=>j.key===key&&j.status!=='cancelled'),selected=job&&completedConflictDraftCandidate(store,job);
 if(!job||!selected||selected.work.id!==originalWorkId)throw Error('Exact completed post-conflict draft required');
 const intent=store.state.coordination?.requests?.find(r=>r.id===intentId),expected=digest({job,project:store.project}),intentIdentity=digest(intent);
 if(intent?.action!=='reconcile-preparation'||intent.key!==key||intent.head!==originalWorkId||intent.lane!=='delivery'||intent.status!=='working')throw Error('Exact completed draft reconciliation intent required');
 const claim=assertPostConflictOwnership(store,job,intentId);
 const assertOriginal=()=>{
  assertContinuationWorker(store,selected.proof);
  const claims=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(selected.work.claimId!)as{body:string}[];
  if(!isDeepStrictEqual(store.db.prepare('SELECT id,body FROM effects WHERE work_key=? ORDER BY id').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id})),selected.effects)||expected!==digest({job,project:store.project})||intentIdentity!==digest(intent)||store.state.coordination?.requests?.filter(r=>r.id===intentId).length!==1||
   claims.length!==1||!isDeepStrictEqual(JSON.parse(claims[0].body),selected.claim)||!completedExecution(store,selected.work)||
   !isDeepStrictEqual(artifact(store,selected.completion.path),selected.completion)||!isDeepStrictEqual(rootArtifact(selected.nativeRoot,selected.native.file.path),selected.native.file)||
   selected.native.files.some(file=>!isDeepStrictEqual(artifact(store,file.path),file))||!isDeepStrictEqual(continuationWorktree(job.worktree),selected.worktree)||!isDeepStrictEqual(assertPostConflictOwnership(store,job,intentId),claim))throw Error('Completed draft original identity or evidence changed');
  assertPostConflictFiles(store,job,selected.evidence);
 };
 const requireOwnership=(value:{complete:boolean;fresh:boolean;ownership?:{status:string}})=>{if(!value.complete||!value.fresh||value.ownership?.status!=='clear')throw Error('Completed draft ownership is unavailable or conflicting');assertOriginal();};
 requireOwnership(await ownership());
 const pr=await delivery.verifyPR(job,true);if(typeof pr.draft!=='boolean'||pr.number!==job.pr||pr.html_url!==job.prUrl||job.prUrl!==`https://github.com/${store.project.repository}/pull/${job.pr}`||pr.state!=='open'||pr.merged_at||pr.head.sha!==job.head||pr.head.ref!==job.branch||pr.head.repo?.full_name!==store.project.repository||pr.base.repo?.full_name!==store.project.repository||pr.base.ref!==store.project.target)throw Error('Completed draft current PR identity changed');
 const draft=pr.draft,facts=await readPostConflictPreparationFacts(delivery,job,draft),after=await readPostConflictPreparationFacts(delivery,job,draft);requireOwnership(await ownership());
 if(facts.providerVersion!==after.providerVersion||facts.inputSha256!==after.inputSha256||facts.inputSha256!==deliveryInputSha256(store,job.key)||digest(facts.evidence)!==digest(after.evidence)||digest(selected.evidence)!==digest(after.evidence))throw Error('Completed draft current provider or evidence changed');
 store.transaction(()=>{assertOriginal();assertPostConflictFiles(store,job,after.evidence);if(facts.inputSha256!==deliveryInputSha256(store,job.key))throw Error('Completed draft human inputs changed');
  job.stage=draft?'prepare-pr':'lead-pr';job.status='queued';delete job.reviewContext;delete job.reviewInputSha256;
  job.detail=draft?'Original completed conflict draft and current draft PR reconciled without replaying publication. Normal preparation must verify metadata and authorize readiness; original source approval and every mutation receipt remain retained.':'Original completed conflict draft and current ready PR reconciled without replaying publication. Sam checks current-head readiness; original source approval and every mutation receipt remain retained.';
  intent.status='completed';intent.detail=job.detail;store.emit('post-conflict-draft-reconciled',job.detail,'lead',job.key);
 });
}

/** An already-ready same PR has no remaining metadata write merely because its conflict repair was published. */
export async function routeReadyPostConflictPublication(delivery:GitHubDelivery,job:TicketJob,published:StageResult){
 if(job.stage!=='draft'||published.outcome!=='passed'||published.commit!==job.head||published.prId!==job.pr)return false;
 if(job.repairReason!=='conflicts')return false;
 // A hands-off conflict refresh has no conflict-readback chain; Sam's current-head review follows preparation.
 if(harnessDelivers(delivery.store,job))return false;
 const pr=await delivery.verifyPR(job,true);
 if(pr.draft){await verifyInitialDraftConflictPreparation(delivery,job,true);return false;}
 if(pr.state!=='open'||pr.merged_at||pr.head.sha!==job.head||pr.head.ref!==job.branch||pr.base.ref!==delivery.store.project.target)throw Error('Ready conflict publication identity changed');
 const evidence=postConflictPreparationEvidence(delivery.store,job);if(!evidence)throw Error('Ready conflict publication requires retained exact source gates');
 const claim=assertPostConflictOwnership(delivery.store,job),before=digest(job),inputs=deliveryInputSha256(delivery.store,job.key);
 const facts=await readPostConflictPreparationFacts(delivery,job),after=await readPostConflictPreparationFacts(delivery,job);
 if(before!==digest(job)||inputs!==deliveryInputSha256(delivery.store,job.key)||facts.providerVersion!==after.providerVersion||digest(facts.evidence)!==digest(after.evidence)||
  !isDeepStrictEqual(assertPostConflictOwnership(delivery.store,job),claim))throw Error('Post-conflict metadata/provider/input identity changed');
 delivery.store.transaction(()=>{
  if(before!==digest(job)||inputs!==deliveryInputSha256(delivery.store,job.key)||!isDeepStrictEqual(assertPostConflictOwnership(delivery.store,job),claim))throw Error('Post-conflict evidence changed before handoff');
  assertPostConflictFiles(delivery.store,job,facts.evidence);
  job.stage='lead-pr';job.status='queued';delete job.reviewContext;delete job.reviewInputSha256;
  job.detail='Same conflict-repaired PR is already ready and its metadata is verified. Sam checks current-head hosted readiness and unchanged approved claims; no metadata writer or repeated source review/QA was dispatched.';
  delivery.store.emit('post-conflict-pr-ready',job.detail,'lead',job.key);
 });
 return true;
}
