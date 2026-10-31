import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {HOLDS} from './config';
import {artifact,rootArtifact,digest} from './readback-evidence';
import {continuationWorkerProof,assertContinuationWorker,continuationWorktree} from './continuation-evidence';
import {claudeExecution,completedExecution} from './worker-completion';
import {acceptedNativeGate} from './preparation-gates';
import {conflictFindingClassification} from './conflict-repair';
import {currentAssignment} from './assignment-context';
import {deliveryInputSha256} from './github-context';
import {verifyRepairCandidate} from './delivery-repairs';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import {SessionBridge} from './session-bridge';
import {requireSavedPrerequisites} from './saved-prerequisite-handoff';
import {workKey} from '../src/shared';
import type {Store} from './store';
import type {StageResult,TicketJob,WorkTime} from '../src/shared';
import type {GitHubDelivery} from './github-delivery';

type Ownership=()=>Promise<{complete:boolean;fresh:boolean;ownership?:{status:string}}>;
function originalPublication(store:Store,job:TicketJob,work:WorkTime,result:StageResult){
 if(work.stage!=='github-draft'||work.role!=='developer'||work.provider!=='claude'||work.status!=='completed'||!completedExecution(store,work)||result.outcome!=='passed'||!conflictFindingClassification(result)||
  result.commit!==job.head||result.worktree!==job.worktree||result.branch!==job.branch||!Number.isSafeInteger(result.prId)||result.prId<1||result.receipts.some(r=>!r.verified||r.uncertain)||!result.receipts.length||!result.evidence.some(e=>e.kind==='pr'&&e.commit===result.commit))throw Error('Exact completed conflicting draft publication required');
 const proof=continuationWorkerProof(store,job,work,false,job.worktree);
 if(!isDeepStrictEqual(proof.result,result))throw Error('Original publication result changed');
 const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
 if(rows.length!==1)throw Error('Original publication claim required');const claim=JSON.parse(rows[0].body),current=currentAssignment()?.claim;
 const active=claim.status==='running'&&!!current&&current.id===claim.id&&current.work.kind==='delivery'&&current.work.id===job.id&&current.stage==='draft';
 if(claim.id!==work.claimId||claim.lane!=='delivery'||claim.stage!=='draft'||claim.work?.kind!=='delivery'||claim.work.id!==job.id||claim.work.projectId!==store.project.id||
  !active&&(claim.status!=='completed'||!claim.endedAt||Date.parse(claim.endedAt)<Date.parse(work.endedAt!))||Date.parse(claim.claimedAt)>Date.parse(work.startedAt))throw Error('Original publication owning claim changed');
 const nativeRoot=resolve(homedir(),'.claude','projects'),native=claudeExecution(store,work,job.worktree,resolve(nativeRoot,job.worktree.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`));
 const gates=acceptedNativeGate(store,job,{directCompleted:true});
 return {work,proof,result,claim,nativeRoot,native,gates,completion:artifact(store,resolve(store.dataRoot,'sessions',work.id,'execution-completion.json'))};
}

/** Pure admission of the exact unpublished-in-Office but already-published provider result. */
export function publishedDraftConflictCandidate(store:Store,job:TicketJob,allowWorking=false){
 try{
  if(store.project.provider!=='github'||store.project.id==='brain'||job.stage!=='draft'||!(['blocked','interrupted'].includes(job.status)||allowWorking&&job.status==='working')||job.pr||job.prUrl||
   job.sourceAmendment||job.implementationContinuation||job.initialDraftConflict||job.mergeAttempt||job.mergeIntentId||job.dependsOnPR||HOLDS[job.key]||job.boardUpdates?.some(u=>u.status!=='verified')||
   store.state.coordination?.jobs?.filter(j=>j.key===job.key&&j.status!=='cancelled').length!==1||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status))||job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain)))return;
  const step=job.steps.at(-1),work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-draft').at(-1);
  if(!step||step.stage!=='draft'||!work)return;
  const selected=originalPublication(store,job,work,step.result),effects=store.db.prepare('SELECT id,body FROM effects WHERE work_key=? ORDER BY id').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{id:string;body:string}[];
  if(effects.some(row=>JSON.parse(row.body).status!=='verified'))return;
  return {...selected,effects,worktree:continuationWorktree(job.worktree),id:`initial-draft-conflict:${job.id}:${work.id}:${job.head}`};
 }catch{return;}
}
export function publishedDraftConflictUnresolved(store:Store,id:string){
 const [kind,jobId,,head]=id.split(':');return kind==='initial-draft-conflict'&&!!store.state.coordination?.jobs?.some(j=>j.id===jobId&&j.stage==='draft'&&j.head===head&&!j.pr&&['blocked','interrupted'].includes(j.status));
}

/** The original passed result stays passed; only this separately bound provider proof grants conflict routing. */
export function initialDraftConflictAnchor(store:Store,job:TicketJob,step:TicketJob['steps'][number]){
 const entries=step.result.evidence.filter(e=>e.kind==='provider'&&e.commit===step.result.commit&&e.path.startsWith(resolve(store.dataRoot,'ticket-work',job.id)+'/conflict-readback-')&&e.path.endsWith('-initial-draft.json'));
 if(entries.length!==1)return;
 const file=artifact(store,entries[0].path),saved=JSON.parse(readFileSync(file.path,'utf8'));
 const descriptor=job.initialDraftConflict;
 if(!descriptor||descriptor.proofPath!==file.path||descriptor.proofSha256!==file.sha256||!/^[a-f0-9]{64}$/.test(descriptor.proofSha256)||descriptor.originalWorkId!==saved.originalWorkId||descriptor.head!==step.result.commit||descriptor.head!==saved.head||descriptor.pr!==job.pr||descriptor.pr!==saved.pr)throw Error('Immutable initial publication proof descriptor changed');
 if(saved.publicationClass!=='initial-draft'||saved.kind!=='verified-conflict-only'||saved.jobId!==job.id||saved.projectId!==store.project.id||saved.repository!==store.project.repository||saved.ticket!==job.key||saved.pr!==job.pr||saved.head!==step.result.commit||saved.branch!==job.branch||saved.worktree!==job.worktree||saved.target!==store.project.target||!saved.originalWorkId)throw Error('Initial publication conflict proof identity changed');
 const work=store.state.workLog?.find(w=>w.id===saved.originalWorkId);if(!work)throw Error('Original publication worker missing');
 const raw={...step.result,evidence:step.result.evidence.filter(e=>e!==entries[0])},bound=originalPublication(store,{...job,head:saved.head},work,raw);
 if(digest(raw)!==saved.originalResultSha256||saved.originalClaimId!==work.claimId||saved.nativeSha256!==bound.native.file.sha256||saved.resultFileSha256!==bound.proof.files.find(f=>f.path.endsWith('/result.json'))?.sha256||
  digest(bound.gates.files)!==saved.sourceGateFilesSha256||digest(bound.gates.nativeArtifacts)!==saved.sourceNativeSha256||saved.provider.length!==2||!isDeepStrictEqual(saved.provider[0],saved.provider[1]))throw Error('Initial publication source/native/provider proof changed');
 return {...bound,file,saved};
}

function guard(store:Store,job:TicketJob,intentId?:string){
 const a=currentAssignment(),c=a?.claim,kind=intentId?'reconciliation':'delivery',id=intentId||job.id,stage=intentId?'reconcile-preparation':'draft';
 if(!c||a?.lane!=='delivery'||c.status!=='running'||c.lane!=='delivery'||c.stage!==stage||c.work.kind!==kind||c.work.id!==id||c.work.projectId!==store.project.id||
  !store.activeClaims().some(x=>isDeepStrictEqual(x,c))||store.state.paused||store.state.draining||HOLDS[job.key]||store.state.coordination?.enabled!==true||
  store.activeClaims().some(x=>x.id!==c.id&&x.work.kind==='delivery'&&x.work.id===job.id))throw Error('Initial draft admission ownership, hold or controls changed');
 return structuredClone(c);
}
async function providerFacts(delivery:GitHubDelivery,job:TicketJob,prId:number){
 const {store}=delivery,repository=store.project.repository,candidate={...job,pr:prId,prUrl:`https://github.com/${repository}/pull/${prId}`};
 const context=await readValidationProviderContext(delivery,job.key),pr=await delivery.verifyPR(candidate,true),target=await delivery.api(`commits/${encodeURIComponent(store.project.target)}`);
 if(pr.number!==prId||pr.html_url!==candidate.prUrl||pr.state!=='open'||pr.merged_at||pr.draft!==true||pr.mergeable!==false||pr.head.sha!==job.head||pr.head.ref!==job.branch||pr.head.repo?.full_name!==repository||pr.base.ref!==store.project.target||pr.base.repo?.full_name!==repository||pr.base.sha!==target.sha||!/^[a-f0-9]{40}$/.test(target.sha))throw Error('Exact current conflicting initial draft required');
 const links=JSON.parse(await delivery.execute('gh',['pr','view',String(prId),'--repo',repository,'--json','closingIssuesReferences'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
 if(!links.closingIssuesReferences?.some((i:any)=>i.url===context.issue.html_url))throw Error('Original publication native issue link changed');
 const [owner,name]=repository.split('/'),query='query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){pullRequest(number:$number){number url state isDraft headRefOid headRefName baseRefOid baseRefName mergeable mergeStateStatus headRepository{nameWithOwner} baseRepository{nameWithOwner}}}}';
 const graphRaw=JSON.parse(await delivery.execute('gh',['api','graphql','--input','-'],{cwd:store.project.repo,readOnly:true,timeout:60000,input:JSON.stringify({query,variables:{owner,name,number:prId}})})),graph=graphRaw.data?.repository?.pullRequest;
 if(graphRaw.errors?.length||graph?.number!==prId||graph.url!==candidate.prUrl||graph.state!=='OPEN'||graph.isDraft!==true||graph.headRefOid!==job.head||graph.headRefName!==job.branch||graph.baseRefOid!==target.sha||graph.baseRefName!==store.project.target||graph.headRepository?.nameWithOwner!==repository||graph.baseRepository?.nameWithOwner!==repository||graph.mergeable!=='CONFLICTING'||graph.mergeStateStatus!=='DIRTY')throw Error('Independent initial draft conflict readback required');
 const pages=JSON.parse(await delivery.execute('gh',['api',`repos/${repository}/pulls?state=open&head=${encodeURIComponent(owner+':'+job.branch)}&per_page=100`,'--paginate','--slurp'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
 if(!Array.isArray(pages)||!pages.length||pages.length>20||pages.some(p=>!Array.isArray(p)||p.length>100)||pages.flat().length!==1||pages.flat()[0].number!==prId||pages.flat()[0].head?.sha!==job.head)throw Error('One exact published branch PR required');
 const remote=(await delivery.execute('git',['ls-remote','--heads','origin','refs/heads/'+job.branch],{cwd:job.worktree,readOnly:true,timeout:30000})).trim();
 if(remote!==job.head+'\trefs/heads/'+job.branch)throw Error('Original publication remote head changed');
 const opts={cwd:job.worktree,readOnly:true,timeout:30000},fork=(await delivery.execute('git',['merge-base',target.sha,job.head],opts)).trim();
 if(!/^[a-f0-9]{40}$/.test(fork))throw Error('Actual initial publication scope fork required');
 const paths=(await delivery.execute('git',['diff','--name-only','--no-renames','-z',fork,job.head],opts)).split('\0').filter(Boolean);
 if(!paths.length||paths.length>256||new Set(paths).size!==paths.length||paths.some(p=>p.startsWith('/')||p.split('/').some(s=>!s||s==='.'||s==='..')))throw Error('Bounded initial publication changed paths required');
 return {contextVersion:validationProviderVersion(context),pr:{number:pr.number,url:pr.html_url,state:pr.state,draft:pr.draft,mergedAt:pr.merged_at,head:pr.head.sha,branch:pr.head.ref,base:pr.base.sha,target:pr.base.ref,updatedAt:pr.updated_at},graph,targetHead:target.sha,fork,paths};
}

/** Source observations keep their exact proposed bytes while unrelated accepted target entries survive integration. */
export function mergeInitialSourceLock(base:unknown,proposed:unknown,target:unknown){
 const parse=(value:unknown)=>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Structured source lock required');const v=value as Record<string,unknown>;
  if(!Array.isArray(v.sources)||!v.sources.length||v.sources.length>512)throw Error('Bounded source observations required');
  const map=new Map<string,unknown>();for(const source of v.sources){if(!source||typeof source.sourceId!=='string'||!source.sourceId.trim()||map.has(source.sourceId))throw Error('Unique source observation IDs required');map.set(source.sourceId,source);}return{value:v,map};};
 const b=parse(base),p=parse(proposed),t=parse(target);
 if(!isDeepStrictEqual([...b.map.keys()],[...p.map.keys()])||!isDeepStrictEqual([...b.map.keys()],[...t.map.keys()]))throw Error('Source identity expansion requires ordinary review');
 const result={...t.value,sources:[...t.map].map(([id,accepted])=>{const prior=b.map.get(id),proposal=p.map.get(id);if(isDeepStrictEqual(prior,proposal))return accepted;if(!isDeepStrictEqual(accepted,prior)&&!isDeepStrictEqual(accepted,proposal))throw Error('Target and proposal changed the same source observation');return proposal;})};
 for(const key of new Set([...Object.keys(b.value),...Object.keys(p.value)]))if(key!=='sources'&&!isDeepStrictEqual(b.value[key],p.value[key])){
  if(key!=='reviewedAt')throw Error('Source-lock structural changes require ordinary review');
  const dates=[p.value[key],t.value[key]];if(dates.some(v=>typeof v!=='string'||!Number.isFinite(Date.parse(v))))throw Error('Source-lock review times required');
  (result as Record<string,unknown>)[key]=dates.map(String).sort((a,b)=>Date.parse(b)-Date.parse(a))[0];
 }
 return result;
}
export async function verifyInitialDraftConflictDelta(delivery:GitHubDelivery,job:TicketJob,proof:any,head:string){
 if(proof.publicationClass!=='initial-draft')return;
 const retained=job.steps.find(s=>s.stage==='conflict-readback'&&s.result.commit===proof.head&&initialDraftConflictAnchor(delivery.store,job,s));
 if(!retained||!Array.isArray(proof.provider?.[0]?.paths)||!isDeepStrictEqual(proof.provider[0],proof.provider[1])||proof.base!==proof.provider[0].fork)throw Error('Bounded original publication delta required');
 const opts={cwd:job.worktree,readOnly:true,timeout:30000},paths=(await delivery.execute('git',['diff','--name-only','--no-renames','-z',proof.targetHead,head],opts)).split('\0').filter(Boolean);
 if(new Set(paths).size!==paths.length||paths.some(p=>!proof.provider[0].paths.includes(p)))throw Error('Conflict integration introduced an unrelated candidate path');
 const parents=(await delivery.execute('git',['rev-list','--parents','-n','1',head],opts)).trim().split(/\s+/);
 if(!isDeepStrictEqual(parents,[head,proof.head,proof.targetHead]))throw Error('Conflict integration is not the exact retained forward merge');
 if(proof.provider[0].paths.includes('sources.lock.json')){
  const read=async(commit:string)=>JSON.parse(await delivery.execute('git',['show',commit+':sources.lock.json'],opts));
  const expected=mergeInitialSourceLock(await read(proof.base),await read(proof.head),await read(proof.targetHead));
  if(!isDeepStrictEqual(await read(head),expected))throw Error('Conflict integration changed proposed or accepted target source observations');
 }
}

/** Scheduler-owned original readback: no worker, model, push, comment, board or PR replay. */
export async function reconcilePublishedDraftConflict(delivery:GitHubDelivery,job:TicketJob,originalWorkId:string,intentId?:string,ownership?:Ownership){
 const {store}=delivery,selected=publishedDraftConflictCandidate(store,job,!intentId);
 if(!selected||selected.work.id!==originalWorkId)throw Error('Exact original completed initial draft required');
 const intent=intentId?store.state.coordination?.requests?.find(r=>r.id===intentId):undefined;
 if(intentId&&(!intent||intent.action!=='reconcile-preparation'||intent.key!==job.key||intent.head!==originalWorkId||intent.lane!=='delivery'||intent.status!=='working'))throw Error('Exact initial draft readback intent required');
 const claim=guard(store,job,intentId),version=digest({job,project:store.project,intent}),input=deliveryInputSha256(store,job.key);
 const bridge=ownership?undefined:new SessionBridge(()=>[store],delivery.execute);
 const refreshed=ownership||(async()=>{await bridge!.refresh();return bridge!.forProject(store,job.key,job.id)as any;});
 const assertCurrent=()=>{
  const now=publishedDraftConflictCandidate(store,job,!intentId);assertContinuationWorker(store,selected.proof);
  if(!now||digest(now)!==digest(selected)||digest({job,project:store.project,intent})!==version||deliveryInputSha256(store,job.key)!==input||!isDeepStrictEqual(guard(store,job,intentId),claim))throw Error('Initial publication identity, inputs or effects changed');
 };
 const refresh=async()=>{const v=await refreshed();if(!v?.complete||!v.fresh||v.ownership?.status!=='clear')throw Error('Initial publication current ownership is unavailable or conflicting');assertCurrent();};
 await refresh();await verifyRepairCandidate(store.project,job,delivery.execute);
 if(job.savedPrerequisiteHandoff&&!await requireSavedPrerequisites(delivery,job))throw Error('Original saved prerequisites remain incomplete');
 const before=await providerFacts(delivery,job,selected.result.prId),after=await providerFacts(delivery,job,selected.result.prId);
 if(!isDeepStrictEqual(before,after))throw Error('Initial publication provider scope changed');
 await verifyRepairCandidate(store.project,job,delivery.execute);await refresh();
 const proof={kind:'verified-conflict-only',publicationClass:'initial-draft',projectId:store.project.id,repository:store.project.repository,jobId:job.id,ticket:job.key,head:job.head,branch:job.branch,worktree:job.worktree,pr:selected.result.prId,base:before.fork,targetHead:before.targetHead,target:store.project.target,
  originalWorkId,originalClaimId:selected.work.claimId,originalResultSha256:digest(selected.result),resultFileSha256:selected.proof.files.find(f=>f.path.endsWith('/result.json'))!.sha256,nativeSha256:selected.native.file.sha256,sourceGateFilesSha256:digest(selected.gates.files),sourceNativeSha256:digest(selected.gates.nativeArtifacts),provider:[before,after],inputSha256:input,observedAt:store.clock.now().toISOString()};
 const root=resolve(store.dataRoot,'ticket-work',job.id),path=resolve(root,`conflict-readback-${crypto.randomUUID()}-initial-draft.json`);mkdirSync(root,{recursive:true,mode:0o700});writeFileSync(path,JSON.stringify(proof,null,2),{mode:0o600,flag:'wx'});
 const file=artifact(store,path);
 store.transaction(()=>{assertCurrent();if(!isDeepStrictEqual(artifact(store,path),file))throw Error('Initial publication proof changed');
  if(job.initialDraftConflict)throw Error('Initial publication proof cannot replace an existing descriptor');
  job.initialDraftConflict=Object.freeze({originalWorkId,head:job.head,pr:selected.result.prId,proofPath:file.path,proofSha256:file.sha256});
  job.pr=selected.result.prId;job.prUrl=`https://github.com/${store.project.repository}/pull/${job.pr}`;
  job.steps.push({stage:'conflict-readback',workerId:originalWorkId,nativeResultSha256:digest(selected.result),result:{...structuredClone(selected.result),evidence:[...structuredClone(selected.result.evidence),{id:crypto.randomUUID(),kind:'provider',path,commit:job.head,environment:'Office exact initial publication readback',url:job.prUrl,summary:'Original completed publication and current initial draft conflicts verified; no source acceptance or effect replay.',observedAt:proof.observedAt}]}});
  job.repairReason='conflicts';job.stage='update-base';job.status='queued';job.detail='Existing draft publication reconciled without replay. Alex integrates current main on the same branch, preserves accepted target locks and all source acceptance holds, and runs repaired-head checks.';
  if(intent){intent.status='completed';intent.detail=job.detail;}
  store.emit('initial-draft-conflict-reconciled',job.detail,'developer',job.key);
 });
}
