import {canonicalProviderEffectIdentity} from './canonical-provider-effect';
import {homedir} from 'node:os';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {digest,rootArtifact} from './readback-evidence';
import {assertContinuationWorker,continuationWorkerProof,continuationJsonArtifact} from './continuation-evidence';
import {bindBrainAuditEffects} from './brain-audit-effects';
import {validationProviderVersion} from './validation-provider-context';
import type {readValidationProviderContext} from './validation-provider-context';
import type {Store} from './store';
import type {TicketJob,HarnessRequest} from '../src/shared';
type Context={prior:TicketJob;scope:{notes:unknown[]};local:{head:string;branch:string;worktree:string};knownEffects:Parameters<typeof bindBrainAuditEffects>[1];original:ReturnType<typeof continuationWorkerProof>;provider:Awaited<ReturnType<typeof readValidationProviderContext>>};
function terminalPriorAuditIntent(request:HarnessRequest|undefined,expected:{action:string;key:string;head:string},currentId?:string){
 return !!request&&request.id!==currentId&&request.action===expected.action&&request.key===expected.key&&request.head===expected.head&&request.lane==='delivery'&&
  ['blocked','interrupted'].includes(request.status)&&typeof request.detail==='string'&&request.detail.startsWith('Error: ');
}
function jsonAfter(text:string,marker:string){
 const at=text.lastIndexOf(marker);if(at<0)throw new Error('Original Brain audit input binding missing');
 const value=text.slice(at+marker.length);let depth=0,quoted=false,escaped=false;
 for(let i=0;i<value.length;i++){
  const c=value[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
  if(c==='"')quoted=true;else if(c==='{'||c==='[')depth++;else if(c==='}'||c===']'){if(--depth===0)return JSON.parse(value.slice(0,i+1));}
 }
 throw new Error('Original Brain audit JSON input is incomplete');
}
function nativeSessionPath(root:string,id:string,startedAt:string){
 if(!/^[a-zA-Z0-9-]+$/.test(id)||!Number.isFinite(Date.parse(startedAt)))throw new Error('Original Brain reader native identity missing');
 const matches:string[]=[];
 for(const delta of [-1,0,1]){
  const day=new Date(Date.parse(startedAt)+delta*86400000).toISOString().slice(0,10).replaceAll('-','/'),dir=resolve(root,day);
  if(!existsSync(dir))continue;const entries=readdirSync(dir);if(entries.length>10000)throw new Error('Native audit directory exceeds bound');
  matches.push(...entries.filter(n=>n.endsWith(`-${id}.jsonl`)).map(n=>resolve(dir,n)));
 }
 if(matches.length!==1)throw new Error('One original Brain reader native session required');return matches[0];
}
/** Reuse only the exact stopped positive reader of a bound terminal failed intent, with its actual immutable native inputs. */
export function readPriorBrainAudit(store:Store,job:TicketJob,intent:HarnessRequest,context:Context,roots={codex:resolve(homedir(),'.codex','sessions'),claude:resolve(homedir(),'.claude','projects')}){
 const attempts=(store.state.workLog||[]).filter(w=>w.requestId===job.id&&w.stage==='implementation-readback'&&w.role==='lead'&&w.status==='completed');
 const candidates=attempts.map(work=>{
  const assignment=continuationJsonArtifact(store,resolve(store.dataRoot,'sessions',work.id,'assignment.json')).value;
  const old=(store.state.coordination?.requests||[]).filter(r=>r.id===assignment.work?.id);
  if(old.length!==1||!old[0].head||!terminalPriorAuditIntent(old[0],{...intent,head:old[0].head},intent.id))throw new Error('Original Brain audit prior intent binding changed or missing');
  const sameOriginal=old[0].head===context.original.worker.id;
  const proof=continuationWorkerProof(store,job,work,true,sameOriginal?context.local.worktree:assignment.scope?.worktree,'reconciliation');
  if(proof.assignment.work.id!==old[0].id||proof.result?.originalWorkId!==old[0].head)throw new Error('Original Brain audit prior intent binding changed or missing');
  if(!sameOriginal)return;
  return {proof,old:old[0]};
 }).filter((x):x is NonNullable<typeof x>=>!!x);
 if(!candidates.length)return;
 candidates.sort((a,b)=>(a.proof.worker.endedAt||'').localeCompare(b.proof.worker.endedAt||'')||a.proof.worker.id.localeCompare(b.proof.worker.id));
 const baseline=candidates[0].proof.result;
 const providerEffects=(effects:{kind:string;target:string}[])=>JSON.stringify(effects.filter(e=>['issue-comment','board-status','native-claim','git-fetch'].includes(e.kind)).map(e=>canonicalProviderEffectIdentity(e,{repositoryPath:store.project.repo,originalWorkId:context.original.worker.id})).map(e=>JSON.stringify([e.kind,e.target])).sort());
 for(const candidate of candidates){const a=candidate.proof.result,b=baseline;
  if(a.outcome!=='passed'||a.originalWorkId!==context.original.worker.id||a.nativeSessionId!==context.original.worker.sessionId||a.commit!==context.local.head||a.verifiedNoEffects!==false||['completeNativeExecution','effectsVerified','noPaidOperations','noHumanHold','nativeClaimsClear'].some(k=>a[k]!==true)||a.nativeRecordCount!==b.nativeRecordCount||a.nativeSessionPath!==b.nativeSessionPath||!Array.isArray(a.effects)||a.effects.some((e:any)=>!e.verified||e.uncertain||e.kind==='source-commit'&&![context.original.result.commit,`${context.original.result.branch}@${context.original.result.commit}`].includes(e.target))||providerEffects(a.effects)!==providerEffects(b.effects))throw new Error('Conflicting completed Brain audit evidence');
 }
 const sourcePath=baseline.nativeSessionPath;
 if(typeof sourcePath!=='string'||!sourcePath.endsWith(`/${context.original.worker.sessionId}.jsonl`))throw new Error('Audited original Brain native identity missing');
 const sourceFile=rootArtifact(roots.claude,sourcePath),source=readFileSync(sourcePath,'utf8').trim().split('\n');
 for(const candidate of candidates){const result=candidate.proof.result,witnesses=result.evidence.filter((e:{path:string;summary:string})=>e.path===sourcePath&&new RegExp(`SHA-256 ${sourceFile.sha256}(?:[.,;]|$)`).test(e.summary));if(result.nativeRecordCount!==source.length||!witnesses.length)throw new Error('Conflicting original native audit digest witness');}
 // Skip unsupported representations only; contradictory evidence and selected-reader binding failures remain fatal.
 const selected=candidates.find(candidate=>{
  const result=candidate.proof.result,witnesses=result.evidence.filter((e:{path:string;summary:string})=>e.path===sourcePath&&new RegExp(`^${result.nativeRecordCount} records; SHA-256 ([a-f0-9]{64})\\.`).test(e.summary));
  if(witnesses.length!==1||!witnesses[0].summary.startsWith(`${source.length} records; SHA-256 ${sourceFile.sha256}.`))return false;
  try{bindBrainAuditEffects({worktree:context.local.worktree,branch:context.local.branch,commit:context.local.head},context.knownEffects,result.effects);return true;}catch{return false;}
 });
 if(!selected)throw new Error('Positive complete Brain native effects audit required: no usable original native digest and effect binding');
 const {proof,old}=selected;
 const claimRows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(proof.worker.claimId!)as {body:string}[];
 if(claimRows.length!==1)throw new Error('Original Brain audit claim missing');const claim=JSON.parse(claimRows[0].body);
 if(claim.status!=='completed'||!claim.endedAt||claim.lane!=='delivery'||claim.stage!==old.action||claim.work?.kind!=='reconciliation'||claim.work.id!==old.id||claim.work.projectId!==store.project.id||claim.id!==proof.assignment.claimId||!Number.isFinite(Date.parse(claim.claimedAt))||!Number.isFinite(Date.parse(claim.endedAt))||!Number.isFinite(Date.parse(proof.worker.startedAt))||!Number.isFinite(Date.parse(proof.worker.endedAt!))||Date.parse(claim.claimedAt)>Date.parse(proof.worker.startedAt)||Date.parse(proof.worker.endedAt!)>Date.parse(claim.endedAt))throw new Error('Original Brain audit claim is not terminal and bound');
 const path=nativeSessionPath(roots.codex,proof.worker.sessionId!,proof.worker.startedAt),file=rootArtifact(roots.codex,path),records=readFileSync(path,'utf8').trim().split('\n').map(line=>JSON.parse(line));
 const meta=records.filter(r=>r.type==='session_meta');
 if(meta.length!==1||meta[0].payload.id!==proof.worker.sessionId||meta[0].payload.cwd!==context.local.worktree)throw new Error('Original Brain audit native session mismatch');
 const prefix=`READ ONLY complete original native execution audit for Brain candidate recovery. Original worker ${context.original.worker.id}, session ${context.original.worker.sessionId}, exact candidate `;
 const tasks=records.filter(r=>r.type==='response_item'&&r.payload.type==='message'&&r.payload.role==='user').map(r=>r.payload.content.map((c:{text?:string})=>c.text||'').join('')).filter(t=>t.startsWith(prefix));
 const terminal=records.at(-1);
 if(tasks.length!==1||terminal.type!=='event_msg'||terminal.payload.type!=='task_complete'||!isDeepStrictEqual(JSON.parse(terminal.payload.last_agent_message),proof.result))throw new Error('Original Brain audit native completion differs');
 const text=tasks[0],candidate=jsonAfter(text,'exact candidate '),notes=jsonAfter(text,'. Bound human scope '),provider=jsonAfter(text,'. Current provider facts '),files=jsonAfter(text,'. Owned original evidence '),prior=jsonAfter(text,'Prior state ');
 if(!isDeepStrictEqual(candidate,context.local)||!isDeepStrictEqual(notes,context.scope.notes)||!isDeepStrictEqual(files,context.original.files)||!isDeepStrictEqual(prior,context.prior)||validationProviderVersion(provider)!==validationProviderVersion(context.provider))throw new Error('Original Brain audit candidate, scope, provider or evidence changed');
 const saved={old:structuredClone(old),claim:structuredClone(claim),proof,file,sourceFile,roots,alternates:candidates.filter(c=>c!==selected).map(c=>({proof:c.proof,old:structuredClone(c.old)}))};
 assertPriorBrainAudit(store,saved);return saved;
}
export function assertPriorBrainAudit(store:Store,saved:NonNullable<ReturnType<typeof readPriorBrainAudit>>){
 assertContinuationWorker(store,saved.proof);
 for(const alternate of saved.alternates){assertContinuationWorker(store,alternate.proof);const matches=store.state.coordination?.requests?.filter(r=>r.id===alternate.old.id)||[];if(matches.length!==1||digest(matches[0])!==digest(alternate.old))throw new Error('Alternate completed Brain audit changed');}
 const requests=store.state.coordination?.requests?.filter(r=>r.id===saved.old.id)||[],rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(saved.claim.id)as {body:string}[];
 if(requests.length!==1||digest(requests[0])!==digest(saved.old)||rows.length!==1||digest(JSON.parse(rows[0].body))!==digest(saved.claim)||!isDeepStrictEqual(rootArtifact(saved.roots.codex,saved.file.path),saved.file)||!isDeepStrictEqual(rootArtifact(saved.roots.claude,saved.sourceFile.path),saved.sourceFile))throw new Error('Original Brain audit reuse proof changed');
}

/** Stops IT from paying for the same completed audit again; adoption still requires readPriorBrainAudit's complete native binding. */
export function brainAuditRetryFingerprint(store:Store,job:TicketJob,originalWorkId:string){
 if(store.project.id!=='brain')return;
 const works=(store.state.workLog||[]).filter(w=>w.requestId===job.id&&w.stage==='implementation-readback'&&w.role==='lead'&&w.status==='completed');
 for(const work of works){
  try{const proof=continuationWorkerProof(store,job,work,true,job.steps.at(-1)!.result.worktree,'reconciliation'),old=store.state.coordination?.requests?.filter(r=>r.id===proof.assignment.work.id)||[];
   if(old.length!==1||!terminalPriorAuditIntent(old[0],{action:'reconcile-implementation',key:job.key,head:originalWorkId})||proof.result.originalWorkId!==originalWorkId||proof.result.outcome!=='passed')continue;
   return digest({protocol:'brain-native-audit-bindings-v1',job,project:store.project,notes:store.state.projectNotes.filter(n=>n.ticket===job.key),messages:store.state.messages.filter(m=>m.ticket===job.key&&m.from==='human'&&m.to==='pm')});
  }catch{/* No positive owned reader may be inferred from an incomplete attempt. */}
 }
}
