import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {homedir} from 'node:os';
import {isDeepStrictEqual} from 'node:util';
import {scopeRepairReadbackCandidate} from '../scope-repair/scope-repair-readback';
import {continuationWorkerProof} from './continuation-evidence';
import {acceptedNativeGate} from '../preparation/preparation-gates';
import {rootArtifact,digest} from '../../../store/readback-evidence';
import {deliveryInputSha256} from '../../../github/github-context';
import {sanitizeObject} from '../../../office/security';
import {HOLDS} from '../../../office/config';
import type {Store} from '../../../store/store';
import type {TicketJob} from '../../../../src/shared';
const parentHead='25868923c5d69a7c98d807f537a3c757f6822431';
const children=[{key:'GH-113',finding:'cms12-string-wording',profile:'optimizely-paas.cms12-model'},{key:'GH-114',finding:'cms13-content-elements',profile:'optimizely-paas.cms13-admin'},{key:'GH-115',finding:'saas-content-types-claims',profile:'optimizely-saas.cms-api-v1'}]as const;
export interface SavedCandidateAdmission {id:string;action:'reconcile-scope-repair'|'adopt-candidate';key:string;head:string;detail:string;fingerprint?:string;}
function candidateInput(text:string){
 const marker='Exact candidate ',at=text.indexOf(marker);if(at<0)return;
 const value=text.slice(at+marker.length);let depth=0,quoted=false,escaped=false;
 for(let i=0;i<value.length;i++){const c=value[i];if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(value.slice(0,i+1));}
 throw new Error('Original adoption input is incomplete');
}
/** Original negative assessment is context, never source acceptance or permission. */
function oldAdoptionBasis(store:Store,job:TicketJob,candidate:{head:string;worktree:string;branch:string},root:string){
 const works=(store.state.workLog||[]).filter(w=>w.requestId===job.id&&w.stage==='candidate-adoption'&&w.role==='lead'&&w.provider==='codex'&&w.status==='completed').sort((a,b)=>a.endedAt.localeCompare(b.endedAt));
 for(const work of works){
  const proof=continuationWorkerProof(store,job,work,true,candidate.worktree,'reconciliation'),a=proof.result;
  const requests=store.state.coordination!.requests!.filter(r=>r.id===proof.assignment.work.id),request=requests[0];
  if(requests.length!==1||request.action!=='adopt-candidate'||request.key!==job.key||request.status!=='blocked'||request.head&&request.head!==candidate.head||request.lane!=='delivery'||a.allowed!==false||a.repairable!==false||a.preservedDispositions!==11||!Array.isArray(a.heldProfiles)||!isDeepStrictEqual([...a.heldProfiles].sort(),children.map(c=>c.profile).sort())||!Array.isArray(a.findings)||a.findings.length!==3||!children.every(c=>a.findings.some((f:any)=>f.id===c.finding&&f.status==='open')))continue;
  const rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
  if(rows.length!==1)continue;const claim=JSON.parse(rows[0].body);
  if(claim.id!==work.claimId||claim.status!=='completed'||!claim.endedAt||claim.stage!=='adopt-candidate'||claim.work?.kind!=='reconciliation'||claim.work.id!==request.id||claim.work.projectId!==store.project.id)continue;
  const matches:string[]=[];
  for(const offset of [-1,0,1]){const dir=resolve(root,new Date(Date.parse(work.startedAt)+offset*86400000).toISOString().slice(0,10).replaceAll('-','/'));if(!existsSync(dir))continue;const names=readdirSync(dir);if(names.length>10000)throw Error('Adoption native inventory exceeds bound');matches.push(...names.filter(n=>n.endsWith(`-${work.sessionId}.jsonl`)).map(n=>resolve(dir,n)));}
  if(matches.length!==1)continue;const file=rootArtifact(root,matches[0]),records=readFileSync(file.path,'utf8').trim().split('\n').map(line=>JSON.parse(line)),meta=records.filter(r=>r.type==='session_meta'),last=records.at(-1);
  if(meta.length!==1||meta[0].payload.id!==work.sessionId||meta[0].payload.cwd!==candidate.worktree||last?.type!=='event_msg'||last.payload.type!=='task_complete'||!isDeepStrictEqual(sanitizeObject(JSON.parse(last.payload.last_agent_message)),a))continue;
  const inputs=records.filter(r=>r.type==='response_item'&&r.payload.role==='user').flatMap(r=>(r.payload.content||[]).filter((c:any)=>c.type==='input_text').map((c:any)=>candidateInput(c.text))).filter(Boolean);
  if(inputs.length!==1||inputs[0].issue!==100||inputs[0].head!==candidate.head||inputs[0].worktree!==candidate.worktree||inputs[0].branch!==candidate.branch)continue;
  return {workId:work.id,endedAt:work.endedAt,requestId:request.id,native:{path:file.path,sha256:file.sha256},resultSha256:proof.files.find(f=>f.path.endsWith('/result.json'))!.sha256};
 }
}
/** Cached/owned facts only: enqueue existing readback, never call Git/providers/models or adopt here. */
export function savedCandidateAdmission(store:Store,job:TicketJob,nativeRoot=resolve(homedir(),'.codex','sessions')):SavedCandidateAdmission|undefined{
 try{
  const state=store.state,c=state.coordination;
  if(store.project.id!=='cms-field-vocabulary'||store.project.provider!=='github'||store.project.repository!=='JFusco/cms-field-vocabulary'||!c?.enabled||state.paused||state.draining||HOLDS[job.key]||!['blocked','interrupted'].includes(job.status)||c.jobs?.filter(j=>j.key===job.key&&j.status!=='cancelled').length!==1||job.prerequisites?.length||job.dependsOnPR||job.pr||job.existingPR||job.mergeAttempt||job.mergeIntentId||job.boardUpdates?.some(u=>u.status!=='verified')||job.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain))||state.workLog?.some(w=>w.requestId===job.id&&['running','stopping'].includes(w.status)))return;
  if(job.key==='GH-91'){
   if(!job.sourceAmendment?.adoptedAt)return;
   const selected=scopeRepairReadbackCandidate(store,job);if(!selected)return;
   return {id:`saved-scope-repair:${job.id}:${selected.work.id}`,action:'reconcile-scope-repair',key:job.key,head:selected.work.id,detail:'Exact saved amendment descendant qualifies for original native readback; source acceptance, unrelated freshness and all delivery gates remain pending.'};
  }
  if(job.key!=='GH-100'||job.stage!=='implement'||job.head||job.worktree||job.branch||job.candidateRecovery||c.requests?.some(r=>r.key===job.key&&r.action==='adopt-candidate'&&['queued','working'].includes(r.status)))return;
  const candidates=[...(state.maintenance?.runs||[]).flatMap(r=>r.steps.flatMap(s=>s.result.candidates)),...job.steps.filter(s=>s.stage==='implement'&&s.result.commit===parentHead).map(s=>({issue:100,head:s.result.commit,worktree:s.result.worktree,branch:s.result.branch}))].filter(candidate=>candidate.issue===100&&candidate.head===parentHead);
  const unique=[...new Map(candidates.map(candidate=>[`${candidate.worktree}:${candidate.branch}:${candidate.head}`,candidate])).values()];if(unique.length!==1||!unique[0].worktree||!unique[0].branch)return;
  const candidate={head:unique[0].head,worktree:unique[0].worktree,branch:unique[0].branch},basis=oldAdoptionBasis(store,job,candidate,nativeRoot);if(!basis)return;
  const related=children.map(relation=>{
   const matches=c.jobs!.filter(j=>j.key===relation.key&&j.status!=='cancelled');if(matches.length!==1)throw Error('One original related child required');const child=matches[0];
   if(!Number.isFinite(Date.parse(child.requestedAt))||Date.parse(child.requestedAt)<=Date.parse(basis.endedAt)||!/^[a-f0-9]{40}$/.test(child.head)||!Number.isSafeInteger(child.pr)||child.pr<1||child.prUrl!==`https://github.com/${store.project.repository}/pull/${child.pr}`||!child.branch||child.steps.some(s=>s.result.receipts.some(r=>!r.verified||r.uncertain)))throw Error('New related child identity or certain receipts required');
   const review=child.steps.filter(s=>s.stage==='review').at(-1)?.result,qa=child.steps.filter(s=>s.stage==='validate').at(-1)?.result;
   if(!review||!qa||review.commit!==qa.commit)throw Error('Actual related source anchors required');const gate=acceptedNativeGate(store,{...child,head:review.commit});
   const files=[...new Map(gate.files.map(f=>[f.path,{path:f.path,sha256:f.sha256}])).values()].sort((a,b)=>a.path.localeCompare(b.path));
   const closeout=child.status==='completed'?child.steps.filter(s=>s.stage==='closeout'&&s.result.outcome==='passed').at(-1)?.result:undefined;
   return {jobId:child.id,key:relation.key,finding:relation.finding,head:child.head,branch:child.branch,pr:child.pr,url:child.prUrl,sourceHead:review.commit,reviewWorker:gate.reviewWorker,qaWorker:gate.qaWorker,files,humanInput:deliveryInputSha256(store,child.key),mergeCommit:child.mergeCommit||'',complete:!!closeout,closeoutReceipts:closeout?.receipts||[]};
  });
  const fingerprint=digest({project:store.project.id,repository:store.project.repository,jobId:job.id,candidate,basis,related,humanInput:deliveryInputSha256(store,job.key),holds:HOLDS[job.key]||null});
  return {id:`saved-candidate-adoption:${job.id}:${parentHead}:${fingerprint}`,action:'adopt-candidate',key:job.key,head:parentHead,fingerprint,detail:'Three newly created, natively verified child source/PR references materially change the original blocked adoption context. Read-only reassessment preserves the original unaccepted candidate, eleven dispositions, three held profiles and eight pending baseline acceptance gates.'};
 }catch{return;}
}
/** Keep budget/history while paused, draining, running or temporarily unqualified; only real adoption/readback or terminal work clears it. */
export function savedAdmissionUnresolved(store:Store,id:string){
 const parts=id.split(':'),kind=parts[0];if(!['saved-scope-repair','saved-candidate-adoption'].includes(kind))return false;
 const job=store.state.coordination?.jobs?.find(j=>j.id===parts[1]);if(!job||['completed','cancelled'].includes(job.status))return false;
 return kind==='saved-scope-repair'?job.scopeRepairReadback?.originalWorkId!==parts[2]:job.candidateRecovery?.head!==parts[2];
}
