import {ResultSchema} from '../../workers/agents';
import {HOLDS} from '../../office/config';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,relative,sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {artifact,rootArtifact,digest,terminationObservation} from '../../store/readback-evidence';
import {preparationGateEvidence,acceptedNativeGate} from '../recovery/preparation/preparation-gates';
import {preparationCheckpoint,preparationNativeCheckpoint,preparationNativeAssessment} from '../recovery/preparation/preparation-checkpoint';
import {continuationWorkerProof,continuationNativeReview} from '../recovery/implementation/continuation-evidence';
import {initialDraftConflictAnchor,verifyInitialDraftConflictDelta} from '../recovery/preparation/published-draft-conflict';
import type {Store} from '../../store/store';
import type {TicketJob,StageResult} from '../../../src/shared';
import type {GitHubDelivery} from '../pipeline/github-delivery';
const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{40}$/.test(v);
const within=(root:string,path:string)=>{const s=relative(resolve(root),path);return path===resolve(path)&&!!s&&s!=='..'&&!s.startsWith('..'+sep)&&!s.startsWith('/');};
type Step=TicketJob['steps'][number];
/** Prior target integrations are authority only through their original harness-admitted native audit. */
function preparedHop(store:Store,job:TicketJob,step:Step,anchor:string,head:string,files:ReturnType<typeof artifact>[],conflictFile:ReturnType<typeof artifact>,repair:Step,publication:Step){
 const entries=step.result.evidence.filter(e=>e.commit===head&&e.path.endsWith('-preparation-readback.json')&&within(resolve(store.dataRoot,'ticket-work',job.id),e.path));
 if(entries.length!==1||!step.workerId||!step.nativeResultSha256)throw Error('One actual conflict preparation readback required');
 const file=artifact(store,entries[0].path),proof=JSON.parse(readFileSync(file.path,'utf8'));files.push(file);
 const reader=store.state.workLog?.find(w=>w.id===proof.readerId),original=store.state.workLog?.find(w=>w.id===proof.originalWorkId),a=proof.assessment;
 if(!proof.postConflict||!reader||!original||reader.id!==step.workerId||reader.stage!=='preparation-readback'||reader.status!=='completed'||reader.role!=='lead'||original.stage!=='github-prepare-pr'||original.status!=='failed'||original.role!=='lead'||original.requestId!==job.id||original.ticket!==job.key||
  proof.readerSessionId!==reader.sessionId||proof.originalSessionId!==original.sessionId||!a||a.outcome!=='passed'||a.commit!==head||a.prId!==job.pr||a.approvalAnchor!==anchor||a.originalWorkId!==original.id||a.nativeSessionId!==original.sessionId||a.preparationClass!=='post-conflict-zero-write'||a.completeNativeExecution!==true||a.noExternalEffects!==true||a.privateWritesOnly!==true||a.unchangedApprovedDelta!==true||a.sourceGatesPreserved!==true||a.historicalEffectsVerified!==true||a.effectsVerified!==true||a.noHumanHold!==true||step.nativeResultSha256!==digest(a)||!step.result.receipts.some(r=>r.action==='preparation-readback'&&r.target===original.id&&r.verified&&!r.uncertain))throw Error('Prior native conflict audit or approval anchor changed');
 const bound=continuationWorkerProof(store,job,reader,true,job.worktree,'reconciliation');files.push(...bound.files);
 if(!isDeepStrictEqual(bound.result,a)||bound.assignment.work.id!==proof.intentId||!store.state.coordination?.requests?.some(r=>r.id===proof.intentId&&r.action==='reconcile-preparation'&&r.key===job.key&&r.head===original.id&&r.status==='completed'&&r.lane==='delivery'))throw Error('Prior preparation reader/request binding changed');
 const claim=(id:string)=>{const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(id)as{body:string}[];if(rows.length!==1)throw Error('Original conflict claim required');return JSON.parse(rows[0].body);};
 const rc=claim(reader.claimId!),oc=claim(original.claimId!);
 if(rc.status!=='completed'||rc.stage!=='reconcile-preparation'||rc.work?.id!==proof.intentId||rc.work.kind!=='reconciliation'||rc.work.projectId!==store.project.id||rc.lane!=='delivery'||!rc.endedAt||!isDeepStrictEqual(oc,proof.originalClaim)||oc.status!=='completed'||oc.stage!=='prepare-pr'||oc.work?.id!==job.id||oc.work.kind!=='delivery'||oc.work.projectId!==store.project.id||oc.lane!=='delivery'||!oc.endedAt)throw Error('Prior conflict claim identity changed');
 terminationObservation(store,original);terminationObservation(store,reader);
 const originalRoot=resolve(store.dataRoot,'sessions',original.id),read=(name:string)=>{const f=artifact(store,resolve(originalRoot,name));files.push(f);return JSON.parse(readFileSync(f.path,'utf8'));};
 const checkpoint=preparationCheckpoint(read('completed-output.json')),provider=read('provider.json'),assignment=read('assignment.json'),identity=read('assignment-identity.json'),caps=read('capabilities.json'),error=read('error.json');
 if(checkpoint.outcome!=='passed'||checkpoint.commit!==head||checkpoint.prId!==job.pr||checkpoint.branch!==job.branch||checkpoint.worktree!==job.worktree||provider.project!==store.project.id||provider.repository!==store.project.repository||provider.provider!==original.provider||provider.role!=='lead'||provider.readOnly!==false||assignment.id!==original.id||assignment.claimId!==original.claimId||assignment.stage!==original.stage||assignment.role!=='lead'||assignment.lane!=='delivery'||assignment.work?.id!==job.id||assignment.work.kind!=='delivery'||assignment.work.projectId!==store.project.id||assignment.scope?.repository!==store.project.repository||assignment.scope?.worktree!==job.worktree||assignment.scope?.artifacts!==originalRoot||assignment.profile!==caps.name||caps.name!=='github-native'||caps.readOnly!==false||identity.attemptId!==original.id||identity.requestId!==job.id||identity.threadId!==original.sessionId||identity.projectId!==store.project.id||identity.repository!==store.project.repository||identity.role!=='lead'||error.session!==original.sessionId||error.provider!==original.provider||error.error!=='Error: Worker exited with surviving subprocesses; effects require reconciliation'||a.checkpointSha256!==artifact(store,resolve(originalRoot,'completed-output.json')).sha256)throw Error('Prior preparation original native identity changed');
 const native=preparationNativeCheckpoint(original,checkpoint),readerNative=preparationNativeAssessment(reader,job.worktree,a);
 if(!isDeepStrictEqual(native,proof.nativeCheckpoint)||!isDeepStrictEqual(readerNative,proof.readerNative)||native.file.sha256!==a.nativeSessionSha256||native.file.path!==a.nativeSessionPath||native.recordCount!==a.nativeRecordCount||!Array.isArray(proof.terminationObservations)||proof.terminationObservations.length!==2||proof.terminationObservations.some((o:any)=>o.workerId!==original.id||o.nativeSessionId!==original.sessionId||o.processGroupId!==original.processId||o.result!=='ESRCH'))throw Error('Prior complete native execution or termination changed');
 // Duplicate retained references are permitted only when their complete owned identity is identical.
 const seen=new Map<string,unknown>();if(!Array.isArray(proof.evidenceDigests)||!proof.evidenceDigests.length||proof.evidenceDigests.length>2048)throw Error('Bounded prior conflict artifacts required');
 for(const saved of proof.evidenceDigests){
  if(seen.has(saved.path)&&!isDeepStrictEqual(seen.get(saved.path),saved))throw Error('Ambiguous prior conflict artifact');seen.set(saved.path,saved);
  const actual=within(store.dataRoot,saved.path)?artifact(store,saved.path):within(job.worktree,saved.path)?rootArtifact(job.worktree,saved.path):undefined;
  if(!actual||!isDeepStrictEqual(actual,saved))throw Error('Prior conflict evidence bytes or ownership changed');files.push(actual);
 }
 for(const f of [...bound.files.filter(f=>!f.path.endsWith('/assignment.json')),...files.filter(f=>within(originalRoot,f.path))])if(!seen.has(f.path))throw Error('Prior native audit omitted required original artifact: '+f.path);
 if(!isDeepStrictEqual(seen.get(conflictFile.path),conflictFile))throw Error('Prior native audit omitted the exact conflict provider proof');
 if(!Array.isArray(proof.conflictObservations)||proof.conflictObservations.length!==2||proof.conflictObservations.some((o:any)=>o.evidence?.anchor!==anchor||!isDeepStrictEqual(o.evidence?.repair,repair)||!isDeepStrictEqual(o.evidence?.publication,publication)||!isDeepStrictEqual(o.evidence?.proof,JSON.parse(readFileSync(conflictFile.path,'utf8')))))throw Error('Prior audited integration graph changed');
 return {file,native,readerNative};
}

/** Bounded backwards walk: every prior published head must lead to the original real source gates. */
export function retainedConflictChain(store:Store,job:TicketJob,qualifies:(result:StageResult)=>boolean,requireLatestPreparation=true){
 const steps=job.steps,review=steps.filter(s=>s.stage==='review').at(-1),qa=steps.filter(s=>s.stage==='validate').at(-1),anchor=review?.result.commit;
 if(!review||!qa||!hash(anchor)||qa.result.commit!==anchor||!hash(job.head)||anchor===job.head)return;
 if([review,qa].some(s=>s.result.outcome!=='passed'||s.result.findings.some(f=>f.status==='open')||s.result.receipts.some(r=>!r.verified||r.uncertain)))throw Error('Original source gates are not accepted');
 const initial=steps.filter(s=>s.stage==='conflict-readback'&&s.result.commit===anchor&&s.result.outcome==='passed').map(s=>initialDraftConflictAnchor(store,job,s)).filter(Boolean);
 if(initial.length>1)throw Error('Ambiguous initial publication source anchor');
 const direct=initial.length===1,nativeSource=acceptedNativeGate(store,{...job,head:anchor},{directCompleted:direct});
 const gateEnd=steps.lastIndexOf(qa),gates=preparationGateEvidence(store,{...job,head:anchor,steps:steps.slice(0,gateEnd+1)},{directCompleted:direct}),files=[...nativeSource.files,...gates.files],nativeArtifacts:{root:string;file:ReturnType<typeof artifact>}[]=[...('nativeArtifacts'in nativeSource?nativeSource.nativeArtifacts||[]:[])],links:{from:string;head:string;target:string;base:string;conflict:Step;repair:Step;publication:Step;preparation?:Step;proof:any}[]=[],seen=new Set<string>();
 let cursor=job.head,end=steps.length;
 for(const original of initial)if(original)nativeArtifacts.push({root:original.nativeRoot,file:original.native.file});
 while(cursor!==anchor){
  if(links.length>=3||seen.has(cursor))throw Error('Conflict continuity cycle or hop limit');seen.add(cursor);
  const repairs=steps.map((s,i)=>({s,i})).filter(({s,i})=>i<end&&i>gateEnd&&s.stage==='update-base'&&s.result.commit===cursor);if(repairs.length!==1)throw Error('One original integration step required');const {s:repair,i:ri}=repairs[0];
  const ci=steps.slice(0,ri).map(s=>s.stage).lastIndexOf('conflict-readback'),conflict=steps[ci];if(ci<=gateEnd||!conflict||!qualifies(conflict.result)&&!initialDraftConflictAnchor(store,job,conflict)||!hash(conflict.result.commit)||conflict.result.commit===cursor)throw Error('Original typed conflict link missing');
  const pubs=steps.map((s,i)=>({s,i})).filter(({s,i})=>i>ri&&i<end&&s.stage==='draft'&&s.result.commit===cursor);if(pubs.length!==1)throw Error('One original conflict publication required');const {s:publication,i:pi}=pubs[0];
  if([repair,publication].some(s=>s.result.outcome!=='passed'||s.result.worktree!==job.worktree||s.result.branch!==job.branch||s.result.prId!==job.pr||s.result.receipts.some(r=>!r.verified||r.uncertain)||s.result.findings.some(f=>f.status==='open'))||!repair.result.evidence.some(e=>e.kind==='checks'&&e.commit===cursor)||!publication.result.evidence.some(e=>e.kind==='pr'&&e.commit===cursor))throw Error('Conflict repair/publication incomplete or uncertain');
  if(steps.slice(ci+1,end).some(s=>['implement','scope-repair','review','validate'].includes(s.stage)))throw Error('Mixed source stages cannot inherit conflict approval');
  const entries=conflict.result.evidence.filter(e=>e.kind==='provider'&&e.commit===conflict.result.commit&&within(resolve(store.dataRoot,'ticket-work',job.id),e.path)&&e.path.startsWith(resolve(store.dataRoot,'ticket-work',job.id)+'/conflict-readback-'));if(entries.length!==1)throw Error('One owned original conflict readback required');
  const file=artifact(store,entries[0].path),proof=JSON.parse(readFileSync(file.path,'utf8'));files.push(file);
  if(proof.kind!=='verified-conflict-only'||proof.projectId!==store.project.id||proof.repository!==store.project.repository||proof.jobId!==job.id||proof.ticket!==job.key||proof.head!==conflict.result.commit||proof.branch!==job.branch||proof.worktree!==job.worktree||proof.pr!==job.pr||proof.target!==store.project.target||!hash(proof.base)||!hash(proof.targetHead))throw Error('Original conflict identity changed');
  const preparations=steps.slice(pi+1,end).filter(s=>s.stage==='prepare-pr'&&s.result.commit===cursor&&s.result.outcome==='passed');
  if(requireLatestPreparation||links.length){if(preparations.length!==1)throw Error('Prior published conflict head lacks native preparation audit');const audited=preparedHop(store,job,preparations[0],anchor,cursor,files,file,repair,publication);nativeArtifacts.push(audited.native,audited.readerNative);}
  links.push({from:proof.head,head:cursor,target:proof.targetHead,base:proof.base,conflict,repair,publication,preparation:preparations[0],proof});cursor=proof.head;end=ci;
 }
 links.reverse();return {anchor,gates,files,nativeArtifacts,links};
}
/** Commit/tree identity and recorded native audit jointly fence semantic scope; no generated-file waiver. */
export async function verifyConflictChainGit(delivery:GitHubDelivery,job:TicketJob,chain:NonNullable<ReturnType<typeof retainedConflictChain>>){
 for(const link of chain.links){
  const opts={cwd:job.worktree,readOnly:true,timeout:30000};
  const parents=(await delivery.execute('git',['rev-list','--parents','-n','1',link.head],opts)).trim().split(/\s+/);
  if(!isDeepStrictEqual(parents,[link.head,link.from,link.target]))throw Error('Conflict integration is not the exact retained forward merge');
  await delivery.execute('git',['merge-base','--is-ancestor',link.base,link.from],opts);
  await verifyInitialDraftConflictDelta(delivery,job,link.proof,link.head);
  // All authenticated tracked source references must retain their exact +/- semantic delta.
  for(const path of chain.gates.trackedSources){
   const normalized=async(base:string,head:string)=>(await delivery.execute('git',['diff','--no-ext-diff','--no-renames','--unified=0',base,head,'--',path],opts)).split('\n').filter(l=>!l.startsWith('index ')&&!l.startsWith('@@')).join('\n');
   if(await normalized(link.base,link.from)!==await normalized(link.target,link.head))throw Error('Conflict integration changed an approved tracked source delta');
  }
 }
 if(chain.nativeArtifacts.some(n=>!isDeepStrictEqual(rootArtifact(n.root,n.file.path),n.file)))throw Error('Conflict native history changed during verification');
 if(chain.files.some(f=>!isDeepStrictEqual(within(delivery.store.dataRoot,f.path)?artifact(delivery.store,f.path):rootArtifact(job.worktree,f.path),f)))throw Error('Conflict chain evidence changed during verification');
}

/** Pure original-bound admission; current provider checks still run under the scheduler claim. */
export function repeatConflictRepairAdmission(store:Store,job:TicketJob,qualifies:(result:StageResult)=>boolean){
 try{
  if(store.state.paused||store.state.draining||!store.state.coordination?.enabled||HOLDS[job.key]||job.stage!=='lead-pr'||!['blocked','interrupted'].includes(job.status)||!job.pr||job.prUrl!==`https://github.com/${store.project.repository}/pull/${job.pr}`||job.sourceAmendment||job.dependsOnPR||job.prerequisites?.length||job.mergeAttempt||job.mergeIntentId||job.boardUpdates?.some(u=>u.status!=='verified')||job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain))||store.state.coordination.jobs?.filter(j=>j.key===job.key&&j.status!=='cancelled').length!==1||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  const work=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-lead-pr').at(-1),result=job.steps.filter(s=>s.stage==='lead-pr').at(-1)?.result;
  if(!work||!['completed','blocked'].includes(work.status)||existsSync(resolve(store.dataRoot,'sessions',work.id,'error.json'))||existsSync(resolve(store.dataRoot,'sessions',work.id,'output-error.json'))||work.role!=='lead'||!result||!qualifies(result)||result.commit!==job.head||result.prId!==job.pr||result.worktree!==job.worktree||result.branch!==job.branch)return;
  const bound=continuationWorkerProof(store,job,work,true,job.worktree),saved=ResultSchema.parse({prerequisites:null,...bound.result}) as StageResult;
  for(const k of ['outcome','commit','worktree','branch','prId','paidRuns','resolution','findings','receipts']as const)if(!isDeepStrictEqual(saved[k],result[k]))return;
  if(!saved.evidence.every(e=>result.evidence.some(r=>isDeepStrictEqual(e,r))))return;
  const native=continuationNativeReview(store,work,saved),rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
  if(rows.length!==1)return;const claim=JSON.parse(rows[0].body);
  if(claim.status!=='completed'||claim.stage!=='lead-pr'||claim.lane!=='delivery'||claim.work?.kind!=='delivery'||claim.work.id!==job.id||claim.work.projectId!==store.project.id||!claim.endedAt)return;
  const chain=retainedConflictChain(store,job,qualifies);if(!chain)return;
  return {id:`repeat-conflict:${job.id}:${work.id}:${job.head}`,head:job.head,key:job.key,workerId:work.id,chain,native,files:bound.files};
 }catch{return;}
}
export function repeatConflictRepairUnresolved(store:Store,id:string){
 const [kind,jobId,,head]=id.split(':');if(kind!=='repeat-conflict')return false;
 const job=store.state.coordination?.jobs?.find(j=>j.id===jobId);if(!job||['completed','cancelled'].includes(job.status))return false;
 return job.head===head&&!job.steps.some(s=>s.stage==='conflict-readback'&&s.result.commit===head);
}
