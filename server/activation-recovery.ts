import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {z} from 'zod';
import {isDeepStrictEqual} from 'node:util';
import {currentAssignment} from './assignment-context';
import {ResultSchema} from './agents';
import {continuationWorkerProof,assertContinuationWorker,continuationJsonArtifact} from './continuation-evidence';
import {claudeExecution,completedExecution,offlineNativeEvidence} from './worker-completion';
import {artifact,rootArtifact,ownedPath,digest,terminationObservation} from './readback-evidence';
import {readValidationProviderContext,validationProviderVersion} from './validation-provider-context';
import type {Store} from './store';
import {workerProfile} from './worker-profiles';
import {planReadRetry,temporaryReadFailure} from './read-retries';
import type {TicketJob,StageResult,WorkTime} from '../src/shared';
import type {GitHubDelivery} from './github-delivery';
const Text=z.string().trim().min(1),Hash=z.string().regex(/^[a-f0-9]{64}$/);
export const ActivationAuditSchema=z.object({outcome:z.enum(['passed','blocked']),originalWorkId:Text,nativeSha256:Hash,
 completeNativeExecution:z.boolean(),noPaidOperations:z.boolean(),noHumanHold:z.boolean(),nativeClaimsClear:z.boolean(),
 calls:z.array(z.object({id:Text,inputSha256:Hash,verified:z.boolean(),effects:Text}).strict()).max(512),
 receipts:z.array(z.object({id:Text,target:Text,verified:z.boolean(),uncertain:z.boolean(),evidence:Text}).strict()).max(128),
 sourceId:Text,baselinePath:Text,runRecordPath:Text,findingId:Text,summary:Text}).strict();
/** Mechanical bounds are supplied before dispatch; audit commentary is never an original effect receipt. */
export function activationAuditResponseSchema(calls:readonly {id:string}[],receipts:readonly {id:string}[]){
 const ids=(rows:readonly {id:string}[],max:number)=>{
  const values=rows.map(row=>row.id);
  if(values.length>max||values.some(id=>typeof id!=='string'||!id||id!==id.trim())||new Set(values).size!==values.length)throw new Error('Unique exact original activation audit IDs required');
  return values;
 };
 const callIds=ids(calls,512),receiptIds=ids(receipts,128);
 // Empty arrays use a valid ordinary item schema plus length0, never an unsupported empty enum.
 const identifier=(values:string[])=>values.length?z.enum(values as [string,...string[]]):Text;
 return ActivationAuditSchema.extend({
  calls:z.array(ActivationAuditSchema.shape.calls.element.extend({id:identifier(callIds)})).length(callIds.length).refine(rows=>new Set(rows.map(row=>row.id)).size===rows.length,'Every original call ID must appear exactly once'),
  receipts:z.array(ActivationAuditSchema.shape.receipts.element.extend({id:identifier(receiptIds)})).length(receiptIds.length).refine(rows=>new Set(rows.map(row=>row.id)).size===rows.length,'Every original receipt ID must appear exactly once'),
 }).strict();
}
const Proposal=z.object({excludePath:Text,coverage:Text,evidence:z.array(Text).min(1).max(16)}).strict();
export const SourceConfigurationSchema=z.object({outcome:z.enum(['passed','blocked']),summary:Text,proposal:Proposal.nullable(),proposalSha256:z.string(),coverageVerified:z.boolean()}).strict();
/** Qualification only: preserve original negative status and bytes. No model or writes. */
export function savedActivationFailure(store:Store,job:TicketJob,originalWorkId:string){
 try{
  if(store.project.id!=='brain'||job.stage!=='scope-repair'||!['blocked','interrupted'].includes(job.status)||job.implementationContinuation?.phase!=='activation'||job.pr||job.existingPR||job.mergeAttempt||job.mergeIntentId)return;
  const works=store.state.workLog?.filter(w=>w.requestId===job.id&&w.stage==='github-scope-repair')||[],work=works.at(-1);
  if(!work||work.id!==originalWorkId||work.status!=='failed'||work.role!=='developer'||store.state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  const proof=continuationWorkerProof(store,job,work,false,job.worktree),result:StageResult=ResultSchema.parse(proof.result),state=job.implementationContinuation;
  if(result.outcome!=='failed'||result.commit!==job.head||result.worktree!==job.worktree||result.branch!==job.branch||result.prId||result.paidRuns!==0||result.prerequisites?.length||result.resolution?.kind!=='source-repair'||result.receipts.some(r=>!r.verified||r.uncertain)||new Set(result.receipts.map(r=>r.id)).size!==result.receipts.length||new Set(result.findings.map(f=>f.id)).size!==result.findings.length)return;
  const open=result.findings.filter(f=>f.status==='open').map(f=>f.id),novel=open.filter(id=>!state.pendingFindingIds.includes(id)&&!state.repairFindingIds.includes(id));
  if(novel.length!==1||!state.pendingFindingIds.every(id=>open.includes(id))||state.repairFindingIds.some(id=>!result.findings.some(f=>f.id===id&&f.status!=='open'))||open.length!==result.resolution.findingIds.length||!open.every(id=>result.resolution!.findingIds.includes(id)))return;
  if(job.steps.some(s=>s.workerId===work.id&&!(s.stage==='scope-repair'&&isDeepStrictEqual(s.result,result))))return;
  const native=claudeExecution(store,work,job.worktree,resolve(homedir(),'.claude','projects',job.worktree.replace(/[^a-zA-Z0-9-]/g,'-'),`${work.sessionId}.jsonl`));
  const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as {body:string}[];
  if(rows.length!==1)return;const claim=JSON.parse(rows[0].body);
  if(claim.id!==work.claimId||claim.status!=='completed'||!claim.endedAt||claim.lane!=='delivery'||claim.stage!=='scope-repair'||claim.work?.projectId!==store.project.id||claim.work.kind!=='delivery'||claim.work.id!==job.id)return;
  return {proof,result,claim,native,findingId:novel[0]};
 }catch{return;}
}
/** Only an exact failed redirect outside the already approved scope may yield an offline input proposal. */
export function sourceFailureFacts(baseline:Record<string,unknown>,record:any,sourceId:string){
 const run=record[sourceId],crawl=run?.crawl,redirects=crawl?.redirects;
 if(baseline.id!==sourceId||baseline.kind!=='collection'||baseline.indexFormat!=='markdown-traversal'||baseline.installPolicy!=='reference-only'||!Number.isSafeInteger(baseline.maxDiscoveryInputs)||Number(baseline.maxDiscoveryInputs)>512||Number(baseline.maxDiscoveryInputs)<1||!Array.isArray(baseline.allowedHosts)||!Array.isArray(baseline.includePrefixes)||!Array.isArray(baseline.excludePrefixes)||!Array.isArray(redirects)||!redirects.length||crawl.id!==sourceId||crawl.maxIndexes!==baseline.maxDiscoveryInputs||!Number.isFinite(Date.parse(run.nextAttemptAt))||!Number.isFinite(Date.parse(run.lastAttempt))||Date.parse(run.nextAttemptAt)<=Date.parse(run.lastAttempt)||!Number.isSafeInteger(run.failures)||run.failures<1||!run.error?.startsWith('Redirect left the selected scope at ')||!run.error.endsWith('; refusing a partial catalog'))throw new Error('Bounded native source configuration failure evidence required');
 const failed=run.error.slice('Redirect left the selected scope at '.length,-'; refusing a partial catalog'.length),matches=redirects.filter((r:any)=>r.from===failed);
 if(matches.length!==1)throw new Error('Exact failed redirect evidence required');
 const from=new URL(failed),to=new URL(matches[0].to),hosts=baseline.allowedHosts as string[],prefixes=baseline.includePrefixes as string[];
 if(from.protocol!=='https:'||to.protocol!=='https:'||!hosts.includes(from.hostname)||!hosts.includes(to.hostname)||!prefixes.some(p=>from.pathname.startsWith(p))||prefixes.some(p=>to.pathname.startsWith(p))||from.search||from.hash||from.username||from.password||from.port||to.username||to.password||to.port||!Array.isArray(crawl.remaining)||!crawl.remaining.some((u:string)=>new URL(u).pathname===from.pathname.replace(/\.md$/,'')))throw new Error('Redirect is not a proven same-host exit from approved documentation scope');
 return {sourceId,retryAt:run.nextAttemptAt,failedUrl:failed,redirectTarget:to.href,excludePath:from.pathname.replace(/\.md$/,''),run};
}
/** No host/limit/input expansion, metadata changes or blanket section exclusions. */
export function validateSourceProposal(baseline:Record<string,unknown>,entry:Record<string,unknown>,facts:ReturnType<typeof sourceFailureFacts>){
 const old=baseline.excludePrefixes as string[],next=entry.excludePrefixes;
 if(!Array.isArray(next)||new Set(next).size!==next.length||!isDeepStrictEqual({...entry,excludePrefixes:old},baseline)||!isDeepStrictEqual(next,[...old,facts.excludePath]))throw new Error('Only the evidenced single out-of-scope redirect document may be excluded; coverage review remains required');
 return true;
}
export async function reconcileActivation(delivery:GitHubDelivery,key:string,originalWorkId:string){
 const {store,engine}=delivery,jobs=delivery.jobs.filter(j=>j.key===key&&j.status!=='cancelled'),job=jobs[0],selected=jobs.length===1&&savedActivationFailure(store,job,originalWorkId);
 if(job?.implementationContinuation?.sourceConfig?.reservation)return reconcileSourceConfiguration(delivery,key,originalWorkId);
 if(!selected)throw new Error('Exact completed-execution failed activation and full original native evidence required');
 const assignment=currentAssignment(),intents=store.state.coordination?.requests?.filter(r=>r.id===assignment?.claim.work.id)||[],intent=intents[0];
 if(intents.length!==1||intent.action!=='reconcile-activation'||intent.key!==key||intent.head!==originalWorkId||intent.status!=='working'||intent.lane!=='delivery'||assignment?.lane!=='delivery')throw new Error('Exact scheduler-owned activation readback required');
 const expected=digest(selected),guard=await delivery.continuationGuard(job,intent),before=await readValidationProviderContext(delivery,key),beforeReaders=new Set(store.state.workLog?.map(w=>w.id));
 const assertCurrent=()=>{guard.assertCurrent();assertContinuationWorker(store,selected.proof,job);if(digest(savedActivationFailure(store,job,originalWorkId))!==expected)throw new Error('Original failed activation changed');};
 assertCurrent();
 const auditSchema=activationAuditResponseSchema(selected.native.calls,selected.result.receipts);
 const assessment=auditSchema.parse(await engine.agents.run('lead',`READ ONLY original failed activation audit. Exact original ${originalWorkId}, session ${selected.proof.worker.sessionId}, native ${selected.native.file.path} SHA-256 ${selected.native.file.sha256}. Read the COMPLETE native session and every tool input/output/background operation; no conclusions from searches alone. Match every call ID and input hash from ${JSON.stringify(selected.native.calls.map(c=>({id:c.id,inputSha256:digest(c.input)})))}. Account for EVERY receipt ${JSON.stringify(selected.result.receipts)} and actual effects. MECHANICAL RESPONSE CONTRACT: calls contains EXACTLY ${selected.native.calls.length} entries and receipts contains EXACTLY ${selected.result.receipts.length} entries, each original ID exactly once. Never add audit-owned or commentary receipt IDs. Put additional audit diagnostics in summary or the matching calls[].effects, NEVER in receipts. Account for actual effects, including temporary registry changes/restoration, failed native sync/private run state and all inherited receipts as historical context only. Unknown/uncertain effects, paid operations, incomplete tool coverage or source/human holds block. Original termination ${JSON.stringify(terminationObservation(store,selected.proof.worker))}. Current provider facts ${JSON.stringify(before)}. Verify the baselinePath is the actual already independently reviewed source entry used by this exact native sync, bound to retained human scope and original review history, not the newer unreviewed repair proposal. Verify runRecordPath contains this exact native failure and matches current .state/official-runs.json source record. Return only an evidenced redirect leaving the approved include scope on an unchanged official host, original source ID and finding ${selected.findingId}; do not approve exclusions or source acceptance. Read all existing prior scope/review proof ${job.implementationContinuation!.proofPath}. No edits, source probes/sync, checks, intents, provider writes, sends or nested agents. Original result ${JSON.stringify(selected.result)}.`,auditSchema,{readOnly:true,effortKind:'administrative',stage:'activation-readback',requestId:job.id,ticket:key,cwd:job.worktree}));
 const readers=(store.state.workLog||[]).filter(w=>!beforeReaders.has(w.id)&&w.requestId===job.id&&w.stage==='activation-readback');
 if(readers.length!==1||readers[0].role!=='lead'||readers[0].status!=='completed'||readers[0].sessionId===selected.proof.worker.sessionId)throw new Error('One independent completed activation audit required');
 const reader=continuationWorkerProof(store,job,readers[0],true,job.worktree,'reconciliation');
 if(reader.assignment.work.id!==intent.id||reader.assignment.claimId!==assignment!.claim.id||!isDeepStrictEqual(reader.result,assessment)||assessment.outcome!=='passed'||assessment.originalWorkId!==originalWorkId||assessment.nativeSha256!==selected.native.file.sha256||!assessment.completeNativeExecution||!assessment.noPaidOperations||!assessment.noHumanHold||!assessment.nativeClaimsClear||assessment.findingId!==selected.findingId)throw new Error('Positive original-bound full activation audit required');
 if(assessment.calls.length!==selected.native.calls.length||new Set(assessment.calls.map(c=>c.id)).size!==assessment.calls.length||selected.native.calls.some(c=>!assessment.calls.some(a=>a.id===c.id&&a.inputSha256===digest(c.input)&&a.verified))||assessment.receipts.length!==selected.result.receipts.length||new Set(assessment.receipts.map(r=>r.id)).size!==assessment.receipts.length||selected.result.receipts.some(r=>!assessment.receipts.some(a=>a.id===r.id&&a.target===r.target&&a.verified&&!a.uncertain)))throw new Error('Incomplete original native calls or effects audit');
 const baseline=continuationJsonArtifact(store,assessment.baselinePath),record=continuationJsonArtifact(store,assessment.runRecordPath),facts=sourceFailureFacts(baseline.value,record.value,assessment.sourceId),nativeRuns=rootArtifact(job.worktree,resolve(job.worktree,'.state/official-runs.json'));
 if(!isDeepStrictEqual(JSON.parse(readFileSync(nativeRuns.path,'utf8'))[assessment.sourceId],facts.run))throw new Error('Native retry/failure state changed');
 const after=await readValidationProviderContext(delivery,key);await guard.verify(selected.result);
 if(validationProviderVersion(before)!==validationProviderVersion(after))throw new Error('Provider scope changed during activation readback');assertCurrent();assertContinuationWorker(store,reader,job);
 const root=resolve(store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true,mode:0o700});ownedPath(store,root);
 const path=resolve(root,`${intent.id}-activation-readback.json`),at=store.clock.now().toISOString();
 writeFileSync(path,JSON.stringify({prior:job,original:selected,reader,assessment,baseline,record,nativeRuns,providerBefore:before,providerAfter:after,scope:job.implementationContinuation,verifiedAt:at},null,2),{flag:'wx',mode:0o600});const file=artifact(store,path);
 store.transaction(()=>{
  assertCurrent();assertContinuationWorker(store,reader,job);for(const f of [baseline.file,record.file,file])if(!isDeepStrictEqual(artifact(store,f.path),f))throw new Error('Activation proof changed');if(!isDeepStrictEqual(rootArtifact(job.worktree,nativeRuns.path),nativeRuns))throw new Error('Native retry state changed');
  const c=job.implementationContinuation!,attempts=c.sourceConfig?.attempts||0;
  if(attempts>=2)throw new Error('Bounded offline source-configuration budget exhausted');
  c.sourceConfig={attempts,maxAttempts:2,originalWorkId,proofPath:path,proofSha256:file.sha256,sourceId:assessment.sourceId,baseline:baseline.value,retryAt:facts.retryAt,findingIds:[selected.findingId],history:[...(c.sourceConfig?.history||[])]};
  c.pendingFindingIds=[...new Set([...c.pendingFindingIds,selected.findingId])];c.phase='repair';
  if(!job.steps.some(s=>s.workerId===originalWorkId))job.steps.push({stage:'scope-repair',workerId:originalWorkId,nativeResultSha256:digest(selected.result),result:structuredClone(selected.result)});
  job.candidateRecovery!.findingIds=[...new Set([...job.candidateRecovery!.findingIds,selected.findingId])];
  job.status='queued';job.detail='Alex prepares a bounded offline source-input proposal; original source failures remain OPEN. Independent review and native retry time are required before activation.';job.updatedAt=at;
  store.emit('activation-reconciled',job.detail,'developer',key);
 });
}
/** Read-only developer proposal and separate exact-proposal Sam review. No registry or capture happens here. */
export async function runSourceConfiguration(delivery:GitHubDelivery,job:TicketJob){
 const {store,engine}=delivery,c=job.implementationContinuation!,config=c.sourceConfig!;
 if(!config||!['repair','technical-review'].includes(c.phase))throw new Error('Offline source-configuration phase required');
 const reviewing=c.phase==='technical-review';
 if(config.attemptOpen||config.reservation)throw new Error('Offline source configuration requires exact original reservation readback before another worker');
 if(!reviewing&&config.attempts>=config.maxAttempts)throw new Error('Bounded two-proposal source configuration budget exhausted');
 if(config.readRetry?.nextAt&&Date.parse(config.readRetry.nextAt)>store.clock.now().getTime())throw new Error('Confirmed read-only transport retry waits for its recorded time');
 const guard=await delivery.continuationGuard(job),proof=continuationJsonArtifact(store,config.proofPath),facts=sourceFailureFacts(config.baseline,proof.value.record.value,config.sourceId);
 const role=reviewing?'lead':'developer',stage=reviewing?'github-review':'github-scope-repair',expectedProposal=config.proposal?digest(config.proposal):'';
 if(reviewing&&(!config.proposal||expectedProposal!==config.proposalSha256))throw new Error('Frozen exact source-input proposal required');
 const reservation=guard.reserveSourceConfiguration();
 try{
 const response=SourceConfigurationSchema.parse(await engine.agents.run(role,`OFFLINE READ ONLY source configuration ${reviewing?'independent review':'proposal'} for ${job.key} on exact ${job.head} ${job.worktree}. Scope proof ${config.proofPath} SHA-256 ${config.proofSha256}. Failure ${JSON.stringify(facts)}. Approved baseline ${JSON.stringify(config.baseline)}. ${reviewing?`Independently inspect this EXACT proposal ${JSON.stringify(config.proposal)}, SHA-256 ${expectedProposal}. Return the same appended excludePath plus byte-equivalent coverage/evidence in proposal and the given proposalSha256; coverageVerified=true and passed ONLY if actual retained diagnostics and official scope show that excluding this single redirected document preserves selected developer-documentation coverage. A blanket help-section exclusion or assumed completeness is forbidden.`:'Return a concrete excludePath proposal and coverage analysis in the structured result; the harness builds the entry by appending ONLY that path to the approved baseline; the harness persists it. Only append the evidenced single out-of-scope redirect document to excludePrefixes. Preserve EVERY other baseline property and seed. Cite actual retained scope, traversal and redirect evidence and describe remaining selected inventory; no invented coverage or acceptance.'} No network requests, source edits, Git writes, registry changes, sync, capture, checks, provider writes, sends, nested agents or source acceptance. Preserve every original OPEN source finding, full failed capture history and last-good native state. No human title/scope/host/limit changes. Native retry cannot start before ${config.retryAt}; no force/reset. A passed proposal review approves ONLY this input repair, never a catalog, source lock or ticket completion. Return blocked when this bounded proposal cannot be justified.`,SourceConfigurationSchema,{readOnly:true,stage,requestId:job.id,ticket:job.key,cwd:job.worktree}));
 const works=(store.state.workLog||[]).filter(w=>w.claimId===reservation.claimId);
 if(works.length!==1||works[0].role!==role||!['completed','blocked'].includes(works[0].status))throw new Error('One actual restricted source-configuration worker required');
 const worker=continuationWorkerProof(store,job,works[0],true,job.worktree);
 if(worker.assignment.claimId!==reservation.claimId||!isDeepStrictEqual(worker.result,response)||!completedExecution(store,worker.worker))throw new Error('Offline worker result or provider completion identity changed');
 await applySourceConfiguration(delivery,job,guard,worker,response,reservation);
 }catch(error){
  if(cancelUnusedSourceReservation(delivery,job,reservation,String(error))){job.status='queued';job.detail='Offline admission ended before any durable worker/provider dispatch; unused reservation cancelled, proposal budget unchanged.';store.save();return;}
  const works=(store.state.workLog||[]).filter(w=>w.claimId===reservation.claimId),target=works.length===1?works[0].id:reservation.claimId;
  job.status='blocked';job.detail=`Offline source configuration original ${target} needs reservation/provider/effect readback; no retry or budget reset. ${String(error)}`;store.save();
  throw new Error(job.detail);
 }
}
async function applySourceConfiguration(delivery:GitHubDelivery,job:TicketJob,guard:Awaited<ReturnType<GitHubDelivery['continuationGuard']>>,worker:ReturnType<typeof continuationWorkerProof>,response:z.infer<typeof SourceConfigurationSchema>,reservation:NonNullable<NonNullable<TicketJob['implementationContinuation']>['sourceConfig']>['reservation']){
 const {store}=delivery,c=job.implementationContinuation!,config=c.sourceConfig!,reviewing=c.phase==='technical-review',expectedProposal=config.proposal?digest(config.proposal):'',role=worker.worker.role,proof=continuationJsonArtifact(store,config.proofPath),facts=sourceFailureFacts(config.baseline,proof.value.record.value,config.sourceId);
 if(!reservation||!isDeepStrictEqual(config.reservation,reservation)||reservation.phase!==c.phase||reservation.head!==job.head||reservation.proposalSha256!==(config.proposalSha256||'')||worker.assignment.claimId!==reservation.claimId||!isDeepStrictEqual(worker.result,response))throw new Error('Exact original offline reservation/result required');
 let accepted=response.outcome==='passed'&&response.proposal!==null;
 const proposed=response.proposal?{entry:{...config.baseline,excludePrefixes:[...(config.baseline.excludePrefixes as string[]),response.proposal.excludePath]},coverage:response.proposal.coverage,evidence:response.proposal.evidence}:null;
 if(accepted){
  validateSourceProposal(config.baseline,proposed!.entry,facts);
  for(const path of response.proposal!.evidence){try{artifact(store,path);}catch{rootArtifact(job.worktree,path);}}
  if(reviewing&&(!response.coverageVerified||response.proposalSha256!==expectedProposal||!isDeepStrictEqual(proposed,config.proposal)))throw new Error('Independent coverage review must bind the exact frozen proposal');
 }
 await guard.verify(proof.value.original.result);guard.assertCurrent();assertContinuationWorker(store,worker,job);
 const root=resolve(store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true,mode:0o700});ownedPath(store,root);
 const path=resolve(root,`${worker.worker.id}-source-config-${reviewing?'review':'proposal'}.json`);
 const persisted={phase:c.phase,head:job.head,worker,response,reservation,originalProof:config.proofSha256};
 if(existsSync(path)){if(!isDeepStrictEqual(continuationJsonArtifact(store,path).value,persisted))throw new Error('Existing original offline result proof differs; reconcile without overwriting');}
 else writeFileSync(path,JSON.stringify(persisted,null,2),{flag:'wx',mode:0o600});const file=artifact(store,path);
 store.transaction(()=>{
  guard.assertCurrent();assertContinuationWorker(store,worker,job);if(!isDeepStrictEqual(artifact(store,path),file))throw new Error('Offline proposal artifact changed');
  delete config.reservation;config.attemptOpen=false;
  (config.history??=[]).push({path,sha256:file.sha256});
  if(!reviewing){if(accepted){config.proposal=proposed!;config.proposalSha256=digest(proposed);config.proposalProof={path,sha256:file.sha256};delete config.reviewProof;delete config.reviewedSha256;c.phase='technical-review';job.stage='review';}else job.status='blocked';}
  else if(accepted){config.reviewedSha256=expectedProposal;config.reviewProof={path,sha256:file.sha256};c.phase='activation';job.stage='scope-repair';}
  else if(config.attempts<config.maxAttempts){delete config.proposal;delete config.proposalSha256;delete config.proposalProof;delete config.reviewProof;delete config.reviewedSha256;c.phase='repair';job.stage='scope-repair';}
  else job.status='blocked';
  if(accepted||reviewing&&config.attempts<config.maxAttempts)job.status='queued';
  job.detail=accepted?(reviewing?`Exact source-input repair reviewed; activation waits for native retry time ${config.retryAt}. OPEN source findings still require actual capture.`:'Offline proposal retained; Sam independently reviews its exact scope and coverage before any source activation.'):response.summary;
  store.emit('source-configuration',job.detail,role,job.key);
 });
}
/** Recheck immutable original/reader/diagnostic bindings on every later phase, not only at admission. */
export function assertSourceConfiguration(store:Store,job:TicketJob){
 const config=job.implementationContinuation?.sourceConfig;if(!config)return;
 const proof=continuationJsonArtifact(store,config.proofPath);
 if(proof.file.sha256!==config.proofSha256||proof.value.original.proof.worker.id!==config.originalWorkId||proof.value.assessment.sourceId!==config.sourceId||!isDeepStrictEqual(proof.value.baseline.value,config.baseline))throw new Error('Source-configuration original binding changed');
 assertContinuationWorker(store,proof.value.original.proof,job);assertContinuationWorker(store,proof.value.reader,job);
 for(const bound of [proof.value.baseline.file,proof.value.record.file,...(config.history||[])])if(artifact(store,bound.path).sha256!==bound.sha256)throw new Error('Source configuration diagnostic or proposal changed');
 const claims=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(proof.value.original.claim.id)as {body:string}[];
 if(claims.length!==1||!isDeepStrictEqual(JSON.parse(claims[0].body),proof.value.original.claim))throw new Error('Original activation claim changed');
 if(config.readRetryProof){
  const bound=continuationJsonArtifact(store,config.readRetryProof.path),value=bound.value;
  if(bound.file.sha256!==config.readRetryProof.sha256||value.kind!=='source-config-no-effect'||value.assessment.outcome!=='passed'||!value.assessment.noWrites||!value.assessment.completeNativeExecution||!value.assessment.noPaidOperations||!isDeepStrictEqual(sourceConfigurationWorker(store,job,value.reservation),value.original)||!isDeepStrictEqual(rootArtifact(value.native.root,value.native.file.path),value.native.file)||!isDeepStrictEqual(artifact(store,value.error.file.path),value.error.file))throw new Error('Confirmed offline transport proof changed');
  assertContinuationWorker(store,value.reader,job);
 }
 const facts=sourceFailureFacts(config.baseline,proof.value.record.value,config.sourceId);
 if(facts.retryAt!==config.retryAt||!config.findingIds.includes(proof.value.assessment.findingId)||!job.implementationContinuation!.pendingFindingIds.includes(proof.value.assessment.findingId))throw new Error('Original source failure or retry binding changed');
 if(config.proposal){
  validateSourceProposal(config.baseline,config.proposal.entry,facts);
  if(config.proposalSha256!==digest(config.proposal)||!config.proposalProof)throw new Error('Frozen source proposal proof missing');
  const proposal=continuationJsonArtifact(store,config.proposalProof.path);
  if(proposal.file.sha256!==config.proposalProof.sha256||proposal.value.phase!=='repair'||proposal.value.worker.worker.role!=='developer'||proposal.value.originalProof!==config.proofSha256||proposal.value.response.outcome!=='passed')throw new Error('Original offline proposal worker binding changed');
  assertContinuationWorker(store,proposal.value.worker,job);
  const response=SourceConfigurationSchema.parse(proposal.value.response),entry={...config.baseline,excludePrefixes:[...(config.baseline.excludePrefixes as string[]),response.proposal?.excludePath]};
  if(!isDeepStrictEqual({entry,coverage:response.proposal?.coverage,evidence:response.proposal?.evidence},config.proposal))throw new Error('Source proposal differs from actual developer result');
  if(config.reviewedSha256){
   if(!config.reviewProof||config.reviewedSha256!==config.proposalSha256)throw new Error('Exact proposal review proof missing');
   const review=continuationJsonArtifact(store,config.reviewProof.path),assessment=SourceConfigurationSchema.parse(review.value.response);
   if(review.file.sha256!==config.reviewProof.sha256||review.value.phase!=='technical-review'||review.value.head!==proposal.value.head||review.value.originalProof!==config.proofSha256||review.value.worker.worker.role!=='lead'||review.value.worker.worker.sessionId===proposal.value.worker.worker.sessionId||assessment.outcome!=='passed'||!assessment.coverageVerified||assessment.proposalSha256!==config.reviewedSha256||!isDeepStrictEqual(assessment.proposal,response.proposal))throw new Error('Exact independent proposal review changed');
   assertContinuationWorker(store,review.value.worker,job);
  }
 }

}
type SourceReservation=NonNullable<NonNullable<NonNullable<TicketJob['implementationContinuation']>['sourceConfig']>['reservation']>;
function reservationClaim(store:Store,job:TicketJob,reservation:SourceReservation){
 const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(reservation.claimId)as {body:string}[];
 if(rows.length!==1)throw new Error('One exact original source-configuration claim required');const claim=JSON.parse(rows[0].body);
 if(claim.id!==reservation.claimId||claim.lane!=='delivery'||claim.work?.projectId!==store.project.id||claim.work.kind!=='delivery'||claim.work.id!==job.id||claim.stage!==reservation.stage)throw new Error('Original source-configuration claim mismatch');return claim;
}
/** WorkTime is durably written before provider dispatch. Cancelling a proven unused reservation is not a dispatched-attempt reset. */
export function cancelUnusedSourceReservation(delivery:Pick<GitHubDelivery,'store'|'jobs'>,job:TicketJob,reservation:SourceReservation,reason:string){
 const {store}=delivery,config=job.implementationContinuation?.sourceConfig;
 if(!config||!delivery.jobs.some(current=>current===job)||!isDeepStrictEqual(config.reservation,reservation)||reservation.head!==job.head||reservation.phase!==job.implementationContinuation!.phase||reservation.proposalSha256!==(config.proposalSha256||'')||store.state.workLog?.some(w=>w.claimId===reservation.claimId))return false;
 const claim=reservationClaim(store,job,reservation),own=currentAssignment()?.claim;
 if(claim.status==='running'?own?.id!==claim.id||currentAssignment()?.lane!=='delivery':!['completed','interrupted'].includes(claim.status)||!claim.endedAt)return false;
 if(config.attempts!==reservation.priorAttempts+(reservation.phase==='repair'?1:0))return false;
 const root=resolve(store.dataRoot,'ticket-work',job.id);mkdirSync(root,{recursive:true,mode:0o700});ownedPath(store,root);
 const path=resolve(root,`${reservation.claimId}-${crypto.randomUUID()}-unused-source-reservation.json`);
 const proof={reservation,claim,reason,classification:'no-durable-worker-before-provider-dispatch',dispatchContract:'Store.beginWork durably saves WorkTime before WorkerRuntime.execute',at:store.clock.now().toISOString()};
 writeFileSync(path,JSON.stringify(proof,null,2),{flag:'wx',mode:0o600});const file=artifact(store,path);
 store.transaction(()=>{
  if(!isDeepStrictEqual(config.reservation,reservation)||store.state.workLog?.some(w=>w.claimId===reservation.claimId)||!isDeepStrictEqual(reservationClaim(store,job,reservation),claim))throw new Error('Unused source reservation changed');
  config.attempts=reservation.priorAttempts;delete config.reservation;config.attemptOpen=false;(config.history??=[]).push({path,sha256:file.sha256});store.save();
 });return true;
}
function sourceConfigurationWorker(store:Store,job:TicketJob,reservation:SourceReservation){
 const works=store.state.workLog?.filter(w=>w.claimId===reservation.claimId)||[],work=works[0],role=reservation.phase==='repair'?'developer':'lead',stage=reservation.phase==='repair'?'github-scope-repair':'github-review';
 if(works.length!==1||!work.sessionId||!work.endedAt||!['completed','failed','blocked','interrupted'].includes(work.status)||work.requestId!==job.id||work.ticket!==job.key||work.role!==role||work.stage!==stage||work.lane!=='delivery'||work.provider!==(role==='developer'?'claude':'codex')||store.state.workLog?.some(w=>w.id!==work.id&&w.sessionId===work.sessionId))throw new Error('Exact terminated original offline source worker required');
 const claim=reservationClaim(store,job,reservation);if(!['completed','interrupted'].includes(claim.status)||!claim.endedAt)throw new Error('Original offline source claim has not terminated');terminationObservation(store,work);
 const root=resolve(store.dataRoot,'sessions',work.id),names=['provider.json','assignment.json','assignment-identity.json','capabilities.json'];
 const files=names.map(n=>continuationJsonArtifact(store,resolve(root,n))),[provider,assignment,identity,caps]=files.map(f=>f.value),profile=workerProfile(stage,true);
 if(provider.project!==store.project.id||provider.repository!==store.project.repository||provider.role!==role||provider.provider!==work.provider||provider.readOnly!==true||work.provider==='claude'&&provider.session!==work.sessionId||assignment.id!==work.id||assignment.claimId!==claim.id||assignment.lane!=='delivery'||assignment.stage!==stage||assignment.role!==role||assignment.work?.projectId!==store.project.id||assignment.work.kind!=='delivery'||assignment.work.id!==job.id||assignment.scope?.repository!==store.project.repository||assignment.scope.worktree!==job.worktree||assignment.scope.artifacts!==root||assignment.profile!==profile.name||!isDeepStrictEqual(caps,profile)||identity.attemptId!==work.id||identity.requestId!==job.id||identity.projectId!==store.project.id||identity.repository!==store.project.repository||identity.role!==role||identity.threadId!==work.sessionId)throw new Error('Original offline source worker profile/claim/session mismatch');
 return {worker:structuredClone(work),claim,files:files.map(f=>f.file)};
}
export function sourceConfigurationRecoveryTarget(store:Store,job:TicketJob){
 try{const config=job.implementationContinuation?.sourceConfig,reservation=config?.reservation;if(!reservation||!['blocked','interrupted'].includes(job.status)||reservation.head!==job.head||reservation.phase!==job.implementationContinuation!.phase)return;
  const claim=reservationClaim(store,job,reservation);if(!['completed','interrupted'].includes(claim.status)||!claim.endedAt)return;
  const works=store.state.workLog?.filter(w=>w.claimId===reservation.claimId)||[];if(!works.length)return reservation.claimId;
  return sourceConfigurationWorker(store,job,reservation).worker.id;
 }catch{return;}
}
export const SourceNoEffectSchema=z.object({outcome:z.enum(['passed','blocked']),originalWorkId:Text,nativeSha256:Hash,completeNativeExecution:z.boolean(),noWrites:z.boolean(),noPaidOperations:z.boolean(),summary:Text,calls:z.array(z.object({id:Text,inputSha256:Hash,verifiedNoWrite:z.boolean(),evidence:Text}).strict()).min(1).max(512)}).strict();
/** Same durable action, separate exact-original reader contract; no source capture or result replay. */
export async function reconcileSourceConfiguration(delivery:GitHubDelivery,key:string,originalId:string){
 const {store,engine}=delivery,jobs=delivery.jobs.filter(j=>j.key===key&&j.status!=='cancelled'),job=jobs[0],config=job?.implementationContinuation?.sourceConfig,reservation=config?.reservation;
 if(jobs.length!==1||!config||!reservation||sourceConfigurationRecoveryTarget(store,job)!==originalId)throw new Error('Exact original offline source reservation/worker readback required');
 const assignment=currentAssignment(),intents=store.state.coordination?.requests?.filter(r=>r.id===assignment?.claim.work.id)||[],intent=intents[0];
 if(intents.length!==1||intent.action!=='reconcile-activation'||intent.key!==key||intent.head!==originalId||intent.status!=='working'||intent.lane!=='delivery'||assignment?.lane!=='delivery')throw new Error('Exact scheduler-owned offline source readback intent required');
 const guard=await delivery.continuationGuard(job,intent),proof=continuationJsonArtifact(store,config.proofPath),before=await readValidationProviderContext(delivery,key),works=store.state.workLog?.filter(w=>w.claimId===reservation.claimId)||[];
 if(!works.length){
  await guard.verify(proof.value.original.result);guard.assertCurrent();
  if(!cancelUnusedSourceReservation(delivery,job,reservation,'Original delivery claim ended without a durable worker; no provider dispatch possible'))throw new Error('Unused original reservation could not be reconciled');
  job.status='queued';job.detail='Unused offline source reservation reconciled without consuming a proposal attempt; fresh guarded admission queued.';store.save();return;
 }
 if(validationProviderVersion(before)!==reservation.providerVersion)throw new Error('Provider issue/comments/board changed since offline reservation; fresh scope assessment required before result reuse or retry');
 const original=sourceConfigurationWorker(store,job,reservation),expected=digest(original);
 const assertOriginal=()=>{guard.assertCurrent();if(digest(sourceConfigurationWorker(store,job,reservation))!==expected)throw new Error('Original offline source worker/evidence changed');};assertOriginal();
 if(completedExecution(store,original.worker)){
  const worker=continuationWorkerProof(store,job,original.worker,true,job.worktree),response=SourceConfigurationSchema.parse(worker.result);
  await applySourceConfiguration(delivery,job,guard,worker,response,reservation);return;
 }
 const error=continuationJsonArtifact(store,resolve(store.dataRoot,'sessions',original.worker.id,'error.json'));
 if(error.value.session!==original.worker.sessionId||error.value.provider!==original.worker.provider||!temporaryReadFailure(String(error.value.error)))throw new Error(`Original offline source worker ${original.worker.id} requires provider/effect readback; failure is not a proven transient read, no retry`);
 const native=offlineNativeEvidence(store,original.worker,job.worktree),start=new Set(store.state.workLog?.map(w=>w.id));
 const assessment=SourceNoEffectSchema.parse(await engine.agents.run('lead',`READ ONLY full original offline source-configuration transport audit. Original worker ${original.worker.id}, claim ${original.claim.id}, terminated group ${JSON.stringify(terminationObservation(store,original.worker))}, native ${native.file.path} SHA-256 ${native.file.sha256}. Inspect the COMPLETE retained native execution and EVERY input/output/background operation, actual command semantics and effects, not summaries/search absences. Exact calls ${JSON.stringify(native.calls.map(c=>({id:c.id,inputSha256:digest(c.input)})))}. Original assignment/caps ${JSON.stringify(original.files)}, error ${error.file.path}. Positively establish no source/filesystem/provider mutation or paid operation occurred; reader badge/prompt is insufficient. Any unknown command, missing completion, uncertain effect, denied permission or incomplete native coverage blocks. Preserve the original failed row, claim/error/native history, max2 proposal attempts, max3 technical rounds, OPEN source findings and native capture backoff. No edits/checks/source probes/capture, provider writes, sends, nested workers, source acceptance or retry. This audit can authorize only a bounded fresh OFFLINE reader assignment after safe classification, never source activation.`,SourceNoEffectSchema,{readOnly:true,effortKind:'administrative',stage:'source-config-readback',requestId:job.id,ticket:key,cwd:job.worktree}));
 const readers=(store.state.workLog||[]).filter(w=>!start.has(w.id)&&w.requestId===job.id&&w.stage==='source-config-readback');
 if(readers.length!==1||readers[0].role!=='lead'||readers[0].status!=='completed'||readers[0].sessionId===original.worker.sessionId)throw new Error('One independent completed offline transport audit required');
 const reader=continuationWorkerProof(store,job,readers[0],true,job.worktree,'reconciliation');
 if(reader.assignment.work.id!==intent.id||reader.assignment.claimId!==assignment.claim.id||!isDeepStrictEqual(reader.result,assessment)||assessment.outcome!=='passed'||assessment.originalWorkId!==original.worker.id||assessment.nativeSha256!==native.file.sha256||!assessment.completeNativeExecution||!assessment.noWrites||!assessment.noPaidOperations||assessment.calls.length!==native.calls.length||new Set(assessment.calls.map(c=>c.id)).size!==assessment.calls.length||native.calls.some(c=>!assessment.calls.some(a=>a.id===c.id&&a.inputSha256===digest(c.input)&&a.verifiedNoWrite)))throw new Error('Positive full original native no-write audit required; transport remains stopped');
 const after=await readValidationProviderContext(delivery,key);await guard.verify(proof.value.original.result);assertOriginal();assertContinuationWorker(store,reader,job);
 if(validationProviderVersion(before)!==validationProviderVersion(after)||!isDeepStrictEqual(offlineNativeEvidence(store,original.worker,job.worktree),native)||!isDeepStrictEqual(artifact(store,error.file.path),error.file))throw new Error('Original transport/provider evidence changed');
 const root=resolve(store.dataRoot,'ticket-work',job.id),path=resolve(root,`${intent.id}-source-config-no-effect.json`);mkdirSync(root,{recursive:true,mode:0o700});ownedPath(store,root);
 writeFileSync(path,JSON.stringify({kind:'source-config-no-effect',reservation,original,native,error,reader,assessment,providerBefore:before,providerAfter:after},null,2),{flag:'wx',mode:0o600});const file=artifact(store,path);
 store.transaction(()=>{
  assertOriginal();assertContinuationWorker(store,reader,job);if(!isDeepStrictEqual(artifact(store,path),file))throw new Error('Offline no-effect audit changed');
  delete config.reservation;config.attemptOpen=false;config.readRetryProof={path,sha256:file.sha256};(config.history??=[]).push({path,sha256:file.sha256});
  const retry={status:'blocked',detail:String(error.value.error),retry:config.readRetry};planReadRetry(retry,store.clock.now());config.readRetry=retry.retry;
  const exhausted=reservation.phase==='repair'&&config.attempts>=config.maxAttempts||config.readRetry?.exhausted||!config.readRetry?.nextAt;
  job.status=exhausted?'blocked':'queued';job.detail=exhausted?'Original offline transport is proven no-write, but its bounded retry/proposal budget is exhausted. Original failures and source findings remain.':`Original offline transport verified no-write; bounded reader retry waits until ${config.readRetry!.nextAt}. Consumed source attempt and native capture backoff remain unchanged.`;
  store.emit('source-config-transport-readback',job.detail,'pm',key);
 });
}
