import {executionProof} from './worker-completion';
import {ResultSchema} from './agents';
import {negativeTechnicalReview} from './implementation-continuation';
import {createHash} from 'node:crypto';
import {readFileSync,lstatSync,realpathSync,existsSync,readdirSync} from 'node:fs';
import {homedir} from 'node:os';
import {resolve} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {artifact, digest, terminationObservation,ownedPath,rootArtifact} from './readback-evidence';
import {sanitizeObject} from './security';
import {workerProfile} from './worker-profiles';
import type {Store} from './store';
import type {TicketJob, WorkTime, StageResult} from '../src/shared';
const allowed=new Set(['provider.json','result.json','assignment.json','assignment-identity.json','capabilities.json','error.json','completed-output.json']);
export function continuationJsonArtifact(store:Store,path:string){
 const file=artifact(store,path),bytes=readFileSync(file.path);
 if(createHash('sha256').update(bytes).digest('hex')!==file.sha256||!isDeepStrictEqual(artifact(store,file.path),file))throw new Error('Continuation artifact changed while reading');
 return {file,value:JSON.parse(bytes.toString('utf8'))};
}
/** Parse only the bytes whose digest and owned inode were captured. */
export function continuationArtifacts(store:Store,workId:string,names:string[]){
 if(!/^[a-zA-Z0-9-]+$/.test(workId)||!names.length||new Set(names).size!==names.length||names.some(n=>!allowed.has(n)))throw new Error('Invalid continuation artifact identity');
 return names.map(name=>continuationJsonArtifact(store,resolve(store.dataRoot,'sessions',workId,name)));
}

function negativeWorker(store:Store,work:WorkTime,result:unknown,readOnly:boolean,job?:TicketJob){
 const parsed=ResultSchema.safeParse(result),root=resolve(store.dataRoot,'sessions',work.id);
 return work.status==='failed'&&work.role==='lead'&&work.stage==='github-review'&&readOnly&&parsed.success&&negativeTechnicalReview(parsed.data,job)&&
  !existsSync(resolve(root,'error.json'))&&!existsSync(resolve(root,'output-error.json'));
}
/** Correlate the actual worker, native session, assignment and capabilities. */
export function continuationWorkerProof(store:Store,job:TicketJob,work:WorkTime,readOnly:boolean,cwd:string,kind:'delivery'|'reconciliation'='delivery'){
 terminationObservation(store,work);
 const files=continuationArtifacts(store,work.id,['provider.json','result.json','assignment.json','assignment-identity.json','capabilities.json']);
 const [provider,saved,assignment,identity,capabilities]=files.map(f=>f.value);
 const expectedProfile=workerProfile(work.stage,readOnly),execution=work.status==='failed'?executionProof(store,work,cwd):undefined;
 if(!work.sessionId||!work.endedAt||!['completed','blocked'].includes(work.status)&&!negativeWorker(store,work,saved.result,readOnly,job)&&!execution||work.requestId!==job.id||work.ticket!==job.key||
  store.state.workLog?.some(other=>other.id!==work.id&&other.sessionId===work.sessionId)||
  work.provider!==(work.role==='developer'?'claude':'codex')||provider.project!==store.project.id||provider.repository!==store.project.repository||
  provider.role!==work.role||provider.provider!==work.provider||provider.readOnly!==readOnly||saved.session!==work.sessionId||work.provider==='claude'&&provider.session!==work.sessionId||
  assignment.id!==work.id||assignment.stage!==work.stage||assignment.role!==work.role||assignment.lane!=='delivery'||work.lane!=='delivery'||!work.claimId||assignment.claimId!==work.claimId||
  assignment.work?.projectId!==store.project.id||assignment.work?.kind!==kind||!assignment.work?.id||
  kind==='delivery'&&assignment.work.id!==job.id||assignment.scope?.repository!==store.project.repository||assignment.scope?.worktree!==cwd||
  assignment.scope?.artifacts!==resolve(store.dataRoot,'sessions',work.id)||assignment.profile!==expectedProfile.name||!isDeepStrictEqual(capabilities,expectedProfile)||
  identity.attemptId!==work.id||identity.requestId!==job.id||identity.projectId!==store.project.id||identity.repository!==store.project.repository||
  identity.role!==work.role||identity.threadId!==work.sessionId)throw new Error('Continuation worker/session/assignment/capability mismatch');
 return {worker:structuredClone(work),files:files.map(f=>f.file),result:saved.result,assignment,...(execution?{execution}:{})};
}
export function assertContinuationWorker(store:Store,proof:ReturnType<typeof continuationWorkerProof>,job?:TicketJob){
 terminationObservation(store,proof.worker);
 if(proof.execution&&!isDeepStrictEqual(executionProof(store,proof.worker,proof.assignment.scope.worktree),proof.execution))throw new Error('Original execution proof changed');
 if(proof.worker.status==='failed'&&!proof.execution&&!negativeWorker(store,proof.worker,proof.result,true,job))throw new Error('Negative continuation assessment acquired provider/process failure');
 const matches=store.state.workLog?.filter(w=>w.id===proof.worker.id)||[];
 if(matches.length!==1||!isDeepStrictEqual(matches[0],proof.worker)||
  store.state.workLog?.some(w=>w.id!==proof.worker.id&&w.sessionId===proof.worker.sessionId)||
  proof.files.some(file=>!isDeepStrictEqual(artifact(store,file.path),file)))throw new Error('Continuation worker or owned evidence changed');
}
/** Capture cited diagnostics without converting a historical source locator into current-head proof. */
export function continuationReviewArtifacts(store:Store,job:TicketJob,result:StageResult){
 if(!negativeTechnicalReview(result,job))return [];
 return result.resolution!.evidenceIds.map(id=>{
  const evidence=result.evidence.find(e=>e.id===id)!;
  if(evidence.commit!==result.commit)return artifact(store,evidence.path);
  try{return artifact(store,evidence.path);}catch{return rootArtifact(job.worktree,evidence.path);}
 });
}
/** Bind a saved read-only review to its original Codex session and terminal response. */
export function continuationNativeReview(store:Store,work:WorkTime,result:StageResult,root=resolve(homedir(),'.codex','sessions')){
 if(work.provider!=='codex'||!work.sessionId||!/^[a-zA-Z0-9-]+$/.test(work.sessionId)||!Number.isFinite(Date.parse(work.startedAt)))throw new Error('Original review native identity missing');
 const matches:string[]=[];
 for(const delta of [-1,0,1]){
  const day=new Date(Date.parse(work.startedAt)+delta*86400000).toISOString().slice(0,10).replaceAll('-','/'),dir=resolve(root,day);
  if(!existsSync(dir))continue;const entries=readdirSync(dir);
  if(entries.length>10000)throw new Error('Native review directory exceeds bound');
  matches.push(...entries.filter(name=>name.endsWith(`-${work.sessionId}.jsonl`)).map(name=>resolve(dir,name)));
 }
 if(matches.length!==1)throw new Error('One original review native session required');
 const file=rootArtifact(root,matches[0]),bytes=readFileSync(file.path);
 if(createHash('sha256').update(bytes).digest('hex')!==file.sha256||!isDeepStrictEqual(rootArtifact(root,file.path),file))throw new Error('Native review changed while reading');
 const records=bytes.toString('utf8').trim().split('\n').map(line=>JSON.parse(line)),meta=records.filter(r=>r.type==='session_meta'),terminal=records.at(-1);
 if(meta.length!==1||meta[0].payload.id!==work.sessionId||meta[0].payload.cwd!==result.worktree||terminal?.type!=='event_msg'||terminal.payload.type!=='task_complete')throw new Error('Original review native session or completion mismatch');
 const nativeResult=ResultSchema.parse(sanitizeObject(JSON.parse(terminal.payload.last_agent_message)));
 // WorkerRuntime fills only empty review paths after parsing and sanitizing the response.
 for(const evidence of nativeResult.evidence)if(evidence.kind==='review'&&!evidence.path)evidence.path=resolve(store.dataRoot,'ticket-work',work.requestId,`${work.id}-analysis.md`);
 if(!isDeepStrictEqual(nativeResult,result))throw new Error('Original review native completion differs from saved result');
 return {root,file};
}
/** Bind the same isolated directory and Git indirection across writer commits. */
export function continuationWorktree(path:string){
 if(path!==resolve(path))throw new Error('Absolute continuation worktree required');
 const directory=lstatSync(path),canonical=realpathSync(path);
 if(directory.isSymbolicLink()||!directory.isDirectory())throw new Error('Owned continuation worktree required');
 const git=resolve(canonical,'.git'),ownership=ownedPath({dataRoot:canonical},git),stat=lstatSync(git);
 if(!stat.isFile()&&!stat.isDirectory())throw new Error('Owned continuation worktree required');
 return {path:canonical,canonical,dev:directory.dev,ino:directory.ino,ownership,gitdir:stat.isFile()?readFileSync(git,'utf8'):null};
}

/** Only answered same-ticket human -> PM messages bind durable scope. */
export function continuationScope(store:Store,job:TicketJob){
 const recoveries=[...(job.discoveryRecoveryHistory||[]),...(job.discoveryRecovery?[job.discoveryRecovery]:[])];
 if(!recoveries.length)throw new Error('Bound discovery history required');
 const notes=store.state.projectNotes.filter(note=>note.ticket===job.key).map(note=>{
  const messages=store.state.messages.filter(message=>message.id===note.requestId&&message.from==='human'&&message.to==='pm'&&message.ticket===job.key&&message.status==='answered'&&!message.error&&(!message.contextProject||message.contextProject===store.project.id)&&message.receipts.every(r=>r.verified&&!r.uncertain));
  if(messages.length!==1)return null;
  return {note:structuredClone(note),original:structuredClone(messages[0])};
 }).filter((value):value is NonNullable<typeof value>=>!!value).sort((a,b)=>a.note.id.localeCompare(b.note.id));
 if(!notes.length||new Set(notes.map(s=>s.note.id)).size!==notes.length)throw new Error('Confirmed human scope required');
 for(const recovery of recoveries){
  const requests=store.state.coordination?.requests?.filter(r=>r.id===recovery.requestId)||[],request=requests[0],scope=notes.find(s=>s.note.id===recovery.noteId);
  if(requests.length!==1||request.status!=='completed'||request.action!=='resume-discovery'||request.key!==job.key||request.head!==recovery.originalWorkId||
   request.discoveryResume?.noteId!==recovery.noteId||!scope||request.discoveryResume.scopeDigest!==digest(scope))throw new Error('Discovery human scope binding changed');
 }
 return {notes,noteIds:notes.map(s=>s.note.id),scopeSha256:digest(notes)};
}
