import {scopeRepairResumeCandidate,resumeBlockedScopeRepair} from './scope-repair-resume';
import {randomUUID} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {ResultSchema} from './agents';
import {currentAssignment} from './assignment-context';
import {HOLDS} from './config';
import {continuationWorkerProof,assertContinuationWorker,continuationJsonArtifact,continuationWorktree} from './continuation-evidence';
import {artifact,digest,ownedPath,rootArtifact,terminationObservation} from './readback-evidence';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import {RELEASE_AMENDMENT_PATHS} from './source-amendment-scope';
import {SourceAmendmentCommand,amendmentInstruction} from './source-amendment';
import {OUTSIDE_AMENDMENT_FINDING,proveOutsideAmendmentUnchanged} from './source-amendment-held';
import {verifyRepairCandidate} from './delivery-repairs';
import {containedFile} from './workflow';
import {workKey} from '../src/shared';
import type {TicketJob,HarnessRequest} from '../src/shared';
import type {Store} from './store';
import type {GitHubDelivery} from './github-delivery';
const sha=z.string().regex(/^[a-f0-9]{64}$/);
const Assessment=z.object({outcome:z.enum(['passed','blocked']),originalWorkId:z.string(),nativeSessionId:z.string(),checkpointSha256:sha,commit:z.string(),
 completeNativeExecution:z.boolean(),noExternalEffects:z.boolean(),scansVerified:z.boolean(),noHumanHold:z.boolean(),nativeSessionPath:z.string().min(1),nativeRecordCount:z.number().int().min(1),
 summary:z.string().trim().min(1),evidence:z.array(z.object({path:z.string().min(1),summary:z.string().min(1)}).strict()).min(1)}).strict();
type Ownership={complete:boolean;fresh:boolean;ownership?:{status:string}};
function requireThat(value:unknown,message:string):asserts value{if(!value)throw new Error(message);}

/** Historical failures become terminal only through the exact original's admitted, owned proof. */
export function scopeRepairRequestResolved(store:Store,request:HarnessRequest){
 try{
  if(request.action!=='reconcile-scope-repair'||!['blocked','interrupted'].includes(request.status)||!request.head)return false;
  const jobs=store.state.coordination?.jobs?.filter(job=>job.key===request.key&&job.status!=='cancelled')||[];
  if(jobs.length!==1)return false;
  const job=jobs[0],records=[...(job.scopeRepairReadback?[{kind:'readback' as const,record:job.scopeRepairReadback}]:[]),...(job.scopeRepairResumes||[]).map(record=>({kind:'resume' as const,record}))].filter(value=>value.record.originalWorkId===request.head);
  if(records.length!==1)return false;
  const {kind,record}=records[0],successes=store.state.coordination?.requests?.filter(value=>value.id===record.intentId)||[];
  if(successes.length!==1)return false;
  const success=successes[0],times=[request.requestedAt,success.requestedAt].map(Date.parse);
  if(success.action!==request.action||success.key!==request.key||success.head!==request.head||success.lane!=='delivery'||success.status!=='completed'||times.some(value=>!Number.isFinite(value))||times[1]<times[0]||!containedFile(record.proofPath,resolve(store.dataRoot,'ticket-work',job.id)))return false;
  const file=artifact(store,record.proofPath),proof=JSON.parse(readFileSync(file.path,'utf8'));
  if(file.sha256!==record.proofSha256||proof.intentId!==success.id||proof.originalWorkId!==request.head||proof.head!==record.head||proof.assessment?.outcome!=='passed'||proof.assessment.originalWorkId!==request.head||proof.assessment.completeNativeExecution!==true||proof.assessment.noExternalEffects!==true||proof.assessment.noHumanHold!==true)return false;
  const originals=store.state.workLog?.filter(work=>work.id===request.head)||[],reader=proof.reader?.worker||proof.reader;
  if(originals.length!==1||originals[0].requestId!==job.id||originals[0].role!=='developer'||originals[0].sessionId!==proof.originalSessionId||proof.assessment.nativeSessionId!==proof.originalSessionId||!originals[0].endedAt||['running','stopping'].includes(originals[0].status)||!reader||reader.id===request.head||!reader.sessionId||reader.sessionId===proof.originalSessionId||reader.requestId!==job.id||reader.role!=='lead'||reader.status!=='completed'||!reader.endedAt||store.state.workLog?.filter(work=>work.id===reader.id&&work.sessionId===reader.sessionId&&work.requestId===job.id&&work.role==='lead'&&work.status==='completed').length!==1)return false;
  if(kind==='resume')return proof.version===1&&proof.projectId===store.project.id&&proof.repository===store.project.repository&&proof.jobId===job.id&&proof.key===job.key&&proof.checkpointSha256===(record as NonNullable<TicketJob['scopeRepairResumes']>[number]).checkpointSha256&&proof.assessment.repairWithinExistingScope===true;
  const authorization=SourceAmendmentCommand.parse(job.sourceAmendment?.authorization);
  return authorization.projectId===store.project.id&&authorization.repository===store.project.repository&&authorization.jobId===job.id&&proof.authorizationSha256===digest(authorization)&&proof.fromHead===job.scopeRepairReadback!.fromHead&&proof.assessment.scansVerified===true&&proof.assessment.commit===record.head;
 }catch{return false;}
}

/** Derive only actual indexed/version or claim drift; unsupported or approved-source failures cannot be held. */
export function outsideScanSources(index:any,full:any,approved:string[],head:string,logs:string[]){
 const outside=new Set<string>();
 for(const [mode,scan,log]of [['index',index,logs[0]],['full',full,logs[1]]]as const){
  requireThat(scan?.schemaVersion===2&&scan.mode===mode&&scan.attentionRequired===true&&Number.isFinite(Date.parse(scan.observedAt))&&Array.isArray(scan.observations)&&scan.observations.length>0,'Complete native index/full scans required');
  requireThat(log.startsWith(`head=${head} startedAt=`)&&log.includes(`node scripts/source-scan.mjs --mode ${mode} --output `)&&/\nexitCode=2\s*$/.test(log),'Native scan head/command/exit identity differs');
  const seen=new Set<string>();
  for(const row of scan.observations){
   requireThat(typeof row.sourceId==='string'&&row.sourceId&&!seen.has(row.sourceId)&&['unchanged','cosmetic','claim-changing','version-changing'].includes(row.classification)&&/^[a-f0-9]{64}$/.test(row.rawSha256)&&Number.isFinite(Date.parse(row.observedAt)),'Unknown or duplicated native scan observation');seen.add(row.sourceId);
   if(['claim-changing','version-changing'].includes(row.classification)){requireThat(!approved.includes(row.sourceId),'Approved source drift is blocking');outside.add(row.sourceId);}
  }
  requireThat(approved.every(id=>seen.has(id)),'All approved sources must occur in both scans');
 }
 requireThat(outside.size>0,'No exact outside source finding proved');return [...outside].sort();
}

/** A passed but unaccepted saved scope-repair descendant, never a new candidate or altered old result. */
export function scopeRepairReadbackCandidate(store:Store,job:TicketJob){
 try{
  if(store.project.provider!=='github'||!job.sourceAmendment?.adoptedAt||job.scopeRepairReadback||job.stage!=='scope-repair'||!['blocked','interrupted'].includes(job.status)||
   !job.candidateRecovery||job.candidateRecovery.head!==job.head||!job.worktree||!job.branch||job.pr||job.existingPR||job.mergeAttempt||job.mergeIntentId||job.prerequisites?.length||job.dependsOnPR||
   store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  amendmentInstruction(store,job);
  const authorization=SourceAmendmentCommand.parse(job.sourceAmendment.authorization);
  const originals=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-scope-repair')||[],work=originals.at(-1);
  if(!work||work.role!=='developer'||work.status!=='completed')return;
  const proof=continuationWorkerProof(store,job,work,false,job.worktree),raw=proof.result;
  const result=ResultSchema.parse({...raw,resolution:raw.resolution??null,evidence:raw.evidence?.map((e:any)=>({...e,commit:e.commit??'',environment:e.environment??'',url:e.url??'',observedAt:e.observedAt??''}))});
  if(result.outcome!=='passed'||result.commit===job.head||!/^[a-f0-9]{40}$/.test(result.commit)||result.worktree!==job.worktree||result.branch!==job.branch||result.prId!==0||result.paidRuns!==0||result.prerequisites?.length||
   result.receipts.some(r=>!r.verified||r.uncertain)||!isDeepStrictEqual(result.findings.map(f=>f.id).sort(),[...job.candidateRecovery.findingIds].sort())||
   result.findings.some(f=>f.status==='open'&&f.id!==OUTSIDE_AMENDMENT_FINDING)||!result.findings.some(f=>f.id===OUTSIDE_AMENDMENT_FINDING&&f.status==='open')||
   job.steps.filter(s=>s.stage==='scope-repair'&&s.result.commit===result.commit).length!==1)return;
  const step=job.steps.find(s=>s.stage==='scope-repair'&&s.result.commit===result.commit)!;
  // Display-only nullish normalization never invents an outcome, identity, finding, effect or acceptance.
  if(!isDeepStrictEqual(ResultSchema.parse({...step.result,resolution:step.result.resolution??null}),result))return;
  const root=resolve(store.dataRoot,'ticket-work',job.id),files=[...proof.files];
  for(const e of result.evidence){if(!containedFile(e.path,root))return;files.push(artifact(store,e.path));}
  const completion=continuationJsonArtifact(store,resolve(store.dataRoot,'sessions',work.id,'provider-completion.json'));
  if(completion.value.expectedSession!==work.sessionId||completion.value.result?.terminal_reason!=='completed'||completion.value.result?.session_id!==work.sessionId||completion.value.result?.is_error!==false||completion.value.result?.subtype!=='success')return;files.push(completion.file);
  const scans=['index','full'].map(mode=>continuationJsonArtifact(store,resolve(root,`amendment-scan-${mode}.json`)));
  const scanLogs=['index','full'].map(mode=>artifact(store,resolve(root,`amendment-scan-${mode}.log`)));
  files.push(...scans.map(s=>s.file),...scanLogs);
  const outsideSourceIds=outsideScanSources(scans[0].value,scans[1].value,authorization.sourceIds,result.commit,scanLogs.map(f=>readFileSync(f.path,'utf8')));
  return {work,proof,result,files,authorization,outsideSourceIds,scanSourceIds:scans.map(s=>s.value.observations.map((row:any)=>row.sourceId).sort()),checkpointSha256:proof.files.find(f=>f.path.endsWith('/result.json'))!.sha256};
 }catch{return;}
}

/** Sam audits the stopped original; only the scheduler can claim this durable reconciliation. */
export async function reconcileScopeRepairReadback(delivery:GitHubDelivery,key:string,originalWorkId:string,ownership:()=>Promise<Ownership>,intentId:string){
 const {store,engine}=delivery,job=delivery.jobs.find(j=>j.key===key&&j.status!=='cancelled');
 if(job&&scopeRepairResumeCandidate(store,job)?.work.id===originalWorkId)return resumeBlockedScopeRepair(delivery,key,originalWorkId,ownership,intentId);
 const selected=job&&scopeRepairReadbackCandidate(store,job);
 requireThat(job&&selected&&selected.work.id===originalWorkId,'Exact stopped amendment scope-repair original required');
 const intent=store.state.coordination?.requests?.find(r=>r.id===intentId),claim=currentAssignment()?.claim;
 requireThat(intent?.action==='reconcile-scope-repair'&&intent.key===key&&intent.head===originalWorkId&&intent.status==='working'&&intent.lane==='delivery'&&
  claim?.stage==='reconcile-scope-repair'&&claim.lane==='delivery'&&claim.status==='running'&&claim.work.projectId===store.project.id&&claim.work.kind==='reconciliation'&&claim.work.id===intentId,'Exact scheduler-owned scope-repair intent required');
 const claimIdentity=structuredClone(claim),intentIdentity=digest(intent),expected=digest({job,project:store.project,selected}),worktree=continuationWorktree(job.worktree);
 const assertCurrent=(live:Ownership)=>{
  const current=scopeRepairReadbackCandidate(store,job),effects=store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({projectId:store.project.id,kind:'delivery',id:job.id}))as{body:string}[];
  requireThat(!store.state.paused&&!HOLDS[key]&&delivery.jobs.find(j=>j.id===job.id)===job&&current&&digest({job,project:store.project,selected:current})===expected&&
   isDeepStrictEqual(currentAssignment()?.claim,claimIdentity)&&store.activeClaims().some(c=>isDeepStrictEqual(c,claimIdentity))&&isDeepStrictEqual(continuationWorktree(job.worktree),worktree)&&
   store.state.coordination?.requests?.filter(r=>r.id===intentId).length===1&&digest(intent)===intentIdentity&&
   effects.every(row=>{const e=JSON.parse(row.body);return e.status==='verified'||e.status==='rejected'&&!e.dispatchedAt;})&&job.boardUpdates?.every(u=>u.status==='verified')!==false&&
   !job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain))&&live.complete&&live.fresh&&live.ownership?.status==='clear','Scope repair identity, evidence, authorization, claim or ownership changed');
  assertContinuationWorker(store,selected.proof);
 };
 const local=async()=>{
  await verifyRepairCandidate(store.project,{head:selected.result.commit,branch:job.branch,worktree:job.worktree},delivery.execute);
  await delivery.execute('git',['merge-base','--is-ancestor',job.head,selected.result.commit],{cwd:job.worktree,readOnly:true,timeout:30000});
  requireThat(!(await delivery.execute('git',['ls-remote','--heads','origin',`refs/heads/${job.branch}`],{cwd:job.worktree,readOnly:true,timeout:30000})).trim(),'Saved scope repair has already been published');
  const pages=JSON.parse(await delivery.execute('gh',['api',`repos/${store.project.repository}/pulls?state=all&head=${encodeURIComponent(store.project.repository.split('/')[0]+':'+job.branch)}&per_page=100`,'--paginate','--slurp'],{cwd:store.project.repo,readOnly:true,timeout:60000}));
  requireThat(Array.isArray(pages)&&pages.length>0&&pages.every(p=>Array.isArray(p)&&p.length===0),'Saved scope repair PR identity is not unpublished');
  const base=await delivery.api(`commits/${store.project.target}`);requireThat(/^[a-f0-9]{40}$/.test(base.sha),'Current provider base required');
  const cacheOptions={cwd:job.worktree,readOnly:true,timeout:30000};
  const cachedBase=async()=>{
   const observed=(await delivery.execute('git',['cat-file','--batch-check=%(objectname) %(objecttype)'],{...cacheOptions,input:`${base.sha}\n`})).trim();
   requireThat(observed===`${base.sha} commit`||observed===`${base.sha} missing`,'Provider base cache has an unknown object identity or type');
   return observed===`${base.sha} commit`;
  };
  if(!await cachedBase()){
   // The admitted claim may finish a drain; a pause or changed claim still forbids
   // this bounded object-cache write. No branch, tracking ref or FETCH_HEAD moves.
   assertCurrent(await ownership());
   await verifyRepairCandidate(store.project,{head:selected.result.commit,branch:job.branch,worktree:job.worktree},delivery.execute);
   const origin=(await delivery.execute('git',['remote','get-url','origin'],cacheOptions)).trim();
   requireThat([`https://github.com/${store.project.repository}`,`https://github.com/${store.project.repository}.git`,`git@github.com:${store.project.repository}`,`git@github.com:${store.project.repository}.git`,`ssh://git@github.com/${store.project.repository}`,`ssh://git@github.com/${store.project.repository}.git`].some(url=>url.toLowerCase()===origin.toLowerCase()),'Exact project origin required for provider base cache fetch');
   requireThat((await delivery.api(`commits/${store.project.target}`)).sha===base.sha,'Provider base changed before cache fetch');
   assertCurrent(await ownership());
   await delivery.execute('git',['fetch','--no-tags','--no-write-fetch-head','--refmap=','--no-recurse-submodules','--no-auto-maintenance','origin',base.sha],{cwd:job.worktree,readOnly:false,timeout:60000});
   assertCurrent(await ownership());
   await verifyRepairCandidate(store.project,{head:selected.result.commit,branch:job.branch,worktree:job.worktree},delivery.execute);
   requireThat((await delivery.execute('git',['remote','get-url','origin'],cacheOptions)).trim()===origin,'Origin changed during provider base cache fetch');
   requireThat((await delivery.api(`commits/${store.project.target}`)).sha===base.sha,'Provider base changed during cache fetch');
   requireThat(await cachedBase(),'Fetched provider base commit is still absent');
  }
  const fork=(await delivery.execute('git',['merge-base',base.sha,selected.result.commit],{cwd:job.worktree,readOnly:true,timeout:30000})).trim();requireThat(/^[a-f0-9]{40}$/.test(fork),'Saved candidate fork identity required');
  const options={cwd:job.worktree,readOnly:true,timeout:30000};
  const changed=(await delivery.execute('git',['diff','--name-only','--no-renames',fork,selected.result.commit],options)).trimEnd().split('\n').filter(Boolean);
  const metadata=await delivery.execute('git',['diff','--summary','--no-renames',fork,selected.result.commit],options);
  requireThat(changed.length>0&&new Set(changed).size===changed.length&&changed.every(path=>RELEASE_AMENDMENT_PATHS.includes(path))&&!/mode change|delete mode|create mode (?!100644)/.test(metadata),'Saved descendant exceeds the bounded amendment paths or file metadata');
  const files:Record<string,{base:string;candidate:string}>={};
  for(const path of ['sources.lock.json','sources/official-sources.json','sources/evidence-locators.json','catalog/catalog.json'])files[path]={base:await delivery.execute('git',['show',`${fork}:${path}`],options),candidate:await delivery.execute('git',['show',`${selected.result.commit}:${path}`],options)};
  const registered=JSON.parse(files['sources/official-sources.json'].candidate).sources;
  requireThat(Array.isArray(registered)&&isDeepStrictEqual(selected.scanSourceIds,[registered.filter((row:any)=>row.role==='release-index').map((row:any)=>row.id).sort(),registered.map((row:any)=>row.id).sort()]),'Retained scans do not cover the complete candidate registry');
  proveOutsideAmendmentUnchanged(files,selected.authorization.sourceIds,selected.outsideSourceIds);
  return {providerBase:base.sha as string,fork,candidate:selected.result.commit,fromHead:job.head,
   changedPaths:[...changed].sort(),approvedSourceIds:[...selected.authorization.sourceIds],outsideSourceIds:[...selected.outsideSourceIds],
   maskInputsSha256:digest(files),metadataSha256:digest(metadata)};
 };
 const beforeOwnership=await ownership();assertCurrent(beforeOwnership);const beforeComparison=await local(),before=await readValidationProviderContext(delivery,key),terminationBefore=terminationObservation(store,selected.work),prior=new Set((store.state.workLog||[]).map(w=>w.id));
 const schema=Assessment.extend({originalWorkId:z.literal(originalWorkId),nativeSessionId:z.literal(selected.work.sessionId!),checkpointSha256:z.literal(selected.checkpointSha256),commit:z.literal(selected.result.commit),scopeBase:z.literal(beforeComparison.fork),currentProviderBase:z.literal(beforeComparison.providerBase),scopeComparisonSha256:z.literal(digest(beforeComparison))});
 const assessment=await engine.agents.run('lead',`READ ONLY saved scope-repair reconciliation for ${key}. Read the COMPLETE original native session ${selected.work.sessionId} and EVERY tool call/result, including failed operations and background handles. The only permitted writes were local scoped source/commit and owned private evidence. Positively account for every operation; any external mutation, unknown effect, unowned process or human hold BLOCKS. Neither a passed checkpoint nor receipt prose establishes non-execution. Verify actual native index/full scan commands/results created these exact owned JSON/log artifacts, their completeness and source identities, and that the saved summary was derived from them. Office deterministically rejects any approved-source drift, unknown observation, changed outside source row or changed profile claim. Outside finding ${OUTSIDE_AMENDMENT_FINDING} remains OPEN, visible separate freshness work for exact sources ${JSON.stringify(selected.outsideSourceIds)}; it is NEVER source acceptance or catalog freshness success. Scope repair original ${originalWorkId}, saved descendant ${selected.result.commit}, stored ancestor ${job.head}. CODE-OWNED SCOPE COMPARISON ${JSON.stringify(beforeComparison)}; comparison SHA256 ${digest(beforeComparison)}. The owned candidate delta is ONLY actual merge-base fork ${beforeComparison.fork} -> immutable candidate ${beforeComparison.candidate}. Current provider base ${beforeComparison.providerBase} is integration/freshness context, NOT the baseline for candidate-introduced scope. Changes already merged on the target after the fork are inherited target changes, not candidate edits; the later integration/fresh-proof/acceptance gates must still preserve them. Do not approve any actual fork-to-candidate outside lock, locator or profile change. Return literal scopeBase=${beforeComparison.fork}, currentProviderBase=${beforeComparison.providerBase} and scopeComparisonSha256=${digest(beforeComparison)}. Historical source bodies/proof remain unaccepted; this audit does not claim current-main integration or waive current-head checks. Original owned artifacts ${JSON.stringify(selected.files)}; original result ${JSON.stringify(selected.result)}. Kernel termination ${JSON.stringify(terminationBefore)}. Current complete issue/comments/board ${JSON.stringify(before)}; ownership ${JSON.stringify(beforeOwnership)}. Confirm same saved unpublished descendant and unmodified durable three-source human amendment. Return actual complete native path/record count and evidence. No research, refetch, checks, generation, editing, writes, source acceptance, provider operations, nested workers or delivery dispatch. This read-back ONLY permits Alex's same-candidate journal/generation repair next; Sam/Riley source review and QA remain mandatory. ${amendmentInstruction(store,job)}`,schema,
  {cwd:job.worktree,readOnly:true,effortKind:'administrative',ticket:key,stage:'scope-repair-readback',requestId:job.id});
 requireThat(assessment.outcome==='passed'&&assessment.completeNativeExecution&&assessment.noExternalEffects&&assessment.scansVerified&&assessment.noHumanHold,'Scope repair full native execution/effects/scans remain unverified');
 schema.parse(assessment);
 const readers=(store.state.workLog||[]).filter(w=>!prior.has(w.id)&&w.stage==='scope-repair-readback');requireThat(readers.length===1&&readers[0].role==='lead'&&readers[0].sessionId!==selected.work.sessionId,'One distinct independent Sam read-back required');
 const reader=continuationWorkerProof(store,job,readers[0],true,job.worktree,'reconciliation');requireThat(reader.assignment.work.id===intentId&&isDeepStrictEqual(reader.result,assessment),'Owned independent scope-repair assessment differs');
 requireThat(basename(assessment.nativeSessionPath)===`${selected.work.sessionId}.jsonl`,'Exact original native transcript required');
 const nativeRoot=resolve(homedir(),'.claude/projects'),nativeFile=rootArtifact(nativeRoot,assessment.nativeSessionPath),records=readFileSync(nativeFile.path,'utf8').trimEnd().split('\n').map(line=>JSON.parse(line));
 requireThat(records.length===assessment.nativeRecordCount&&records.some(record=>record.sessionId===selected.work.sessionId)&&records.every(record=>!record.sessionId||record.sessionId===selected.work.sessionId),'Complete original native transcript identity/count differs');
 const after=await readValidationProviderContext(delivery,key),afterComparison=await local(),afterOwnership=await ownership();assertCurrent(afterOwnership);assertContinuationWorker(store,reader);
 requireThat(isDeepStrictEqual(beforeComparison,afterComparison)&&validationProviderVersion(before)===validationProviderVersion(after),'Scope repair provider scope or comparison changed');
 const commitComparison=await local();assertCurrent(await ownership());
 requireThat(isDeepStrictEqual(beforeComparison,commitComparison),'Scope repair comparison changed before commit');
 const root=resolve(store.dataRoot,'ticket-work',job.id),path=resolve(root,`${randomUUID()}-scope-repair-readback.json`),at=store.clock.now().toISOString();ownedPath(store,root);
 const evidenceDigests=[...selected.files,...reader.files],proof={intentId,originalWorkId,originalSessionId:selected.work.sessionId,fromHead:job.head,head:selected.result.commit,authorizationSha256:digest(SourceAmendmentCommand.parse(selected.authorization)),assessment,reader:reader.worker,
  outsideFinding:{id:OUTSIDE_AMENDMENT_FINDING,sourceIds:selected.outsideSourceIds},evidenceDigests,originalNative:{root:nativeRoot,file:nativeFile},providerObservations:[before,after],base:beforeComparison.providerBase,scopeComparison:beforeComparison,scopeComparisonSha256:digest(beforeComparison),ownership:[beforeOwnership,afterOwnership],terminationObservations:[terminationBefore,terminationObservation(store,selected.work)],at};
 writeFileSync(path,JSON.stringify(proof,null,2),{flag:'wx',mode:0o600});const proofSha256=artifact(store,path).sha256;
 store.transaction(()=>{
  assertCurrent(afterOwnership);assertContinuationWorker(store,reader);
  requireThat(isDeepStrictEqual(beforeComparison,afterComparison)&&isDeepStrictEqual(beforeComparison,commitComparison)&&assessment.scopeBase===beforeComparison.fork&&assessment.currentProviderBase===beforeComparison.providerBase&&assessment.scopeComparisonSha256===digest(beforeComparison),'Scope repair comparison identity changed at commit');requireThat(isDeepStrictEqual(rootArtifact(nativeRoot,nativeFile.path),nativeFile),'Original native transcript changed');
  job.scopeRepairReadback={intentId,originalWorkId,fromHead:job.head,head:selected.result.commit,proofPath:path,proofSha256,outsideSourceIds:selected.outsideSourceIds,at};
  job.head=selected.result.commit;job.status='queued';job.stage='scope-repair';job.updatedAt=at;
  job.detail='Saved unaccepted scope-repair descendant independently reconciled. Alex continues the same journal/generation repair; unrelated freshness remains OPEN. Source acceptance and independent review/QA are still required.';
  intent.status='completed';intent.detail=job.detail;
  store.emit('scope-repair-reconciled',`${key}: ${job.detail}`,'developer',key);
 });
}
