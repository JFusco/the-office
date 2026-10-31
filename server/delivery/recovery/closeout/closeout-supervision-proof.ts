import {lstatSync,readFileSync} from 'node:fs';
import {isAbsolute,relative,resolve,sep} from 'node:path';
import {isDeepStrictEqual} from 'node:util';
import {z} from 'zod';
import {artifact,digest,sha} from '../../../store/readback-evidence';
import {offlineNativeEvidence} from '../../../workers/worker-completion';
import type {Store} from '../../../store/store';
import type {TicketJob,WorkTime} from '../../../../src/shared';

const hash=z.string().regex(/^[a-f0-9]{64}$/),head=z.string().regex(/^[a-f0-9]{40}$/),identity=z.string().min(1).max(200),pid=z.number().int().positive();
export const CloseoutSupervisionProofRef=z.object({path:z.string().min(1).max(4096),sha256:hash}).strict();
const Envelope=z.object({version:z.literal(1),contract:z.literal('owned-group-shutdown-v1'),projectId:identity,repository:identity,jobId:identity,originalWorkId:identity,nativeSessionId:identity,claimId:identity,
 originalWorkSha256:hash,originalClaimSha256:hash,checkpointSha256:hash,errorSha256:hash,nativeSessionSha256:hash,
 artifacts:z.object({sourceManifest:CloseoutSupervisionProofRef,processSource:CloseoutSupervisionProofRef,workerRuntimeSource:CloseoutSupervisionProofRef,runtimeReceipt:CloseoutSupervisionProofRef,successorTarget:CloseoutSupervisionProofRef,preDrain:CloseoutSupervisionProofRef}).strict()}).strict();
const known={process:'5d7b3d6047f598fa9375d128623c200be482fd6c80b5db8a6468c2a0e12c1c3b',workerRuntime:'257a58d226dd81dc26be7a43ab3098a657fef7c9aee8e04b5c9c44bba4c2cc29'};
function requireProof(value:unknown,message:string):asserts value{if(!value)throw Error(message);}
const within=(root:string,path:string)=>{const suffix=relative(root,path);return path===resolve(path)&&!!suffix&&suffix!=='..'&&!suffix.startsWith('..'+sep)&&!isAbsolute(suffix);};
const instant=(value:string)=>{const at=Date.parse(value);requireProof(Number.isFinite(at),'Historical supervision time is invalid');return at;};

/** An explicit owned historical envelope is required; current source never proves an earlier runtime. */
export function readCloseoutSupervisionProof(store:Store,job:TicketJob,work:WorkTime,input:unknown){
 const descriptor=CloseoutSupervisionProofRef.parse(input),root=resolve(store.dataRoot,'closeout-recovery',job.id),files:ReturnType<typeof artifact>[]=[];
 const read=(ref:z.infer<typeof CloseoutSupervisionProofRef>,limit=1024*1024)=>{
  requireProof(within(root,ref.path),'Historical supervision proof must belong to the original job');
  const file=artifact(store,ref.path),stat=lstatSync(file.path);requireProof(stat.size>0&&stat.size<=limit&&file.sha256===ref.sha256,'Historical supervision artifact size or hash differs');
  const text=readFileSync(file.path,'utf8');requireProof(sha(text)===file.sha256&&isDeepStrictEqual(artifact(store,file.path),file),'Historical supervision artifact changed while reading');files.push(file);return text;
 };
 const envelope=Envelope.parse(JSON.parse(read(descriptor,16384)));
 const actual=store.state.workLog?.filter(w=>w.id===work.id),rows=store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId!)as{body:string}[];
 requireProof(actual?.length===1&&isDeepStrictEqual(actual[0],work)&&work.requestId===job.id&&work.ticket===job.key&&work.role==='pm'&&work.provider==='codex'&&work.stage==='github-closeout'&&work.status==='failed'&&work.endedAt&&work.sessionId&&work.claimId,'Historical supervision original worker differs');
 requireProof(envelope.projectId===store.project.id&&envelope.repository===store.project.repository&&envelope.jobId===job.id&&envelope.originalWorkId===work.id&&envelope.nativeSessionId===work.sessionId&&envelope.claimId===work.claimId&&envelope.originalWorkSha256===digest(work)&&rows.length===1&&sha(rows[0].body)===envelope.originalClaimSha256,'Historical supervision original identity differs');
 const claim=JSON.parse(rows[0].body);requireProof(claim.id===work.claimId&&claim.status==='completed'&&claim.stage==='closeout'&&claim.lane==='delivery'&&claim.work?.projectId===store.project.id&&claim.work.kind==='delivery'&&claim.work.id===job.id&&instant(claim.claimedAt)<=instant(work.startedAt)&&instant(claim.endedAt)>=instant(work.endedAt),'Historical supervision original claim differs');
 const checkpoint=artifact(store,resolve(store.dataRoot,'sessions',work.id,'completed-output.json')),error=artifact(store,resolve(store.dataRoot,'sessions',work.id,'error.json')),savedError=JSON.parse(readFileSync(error.path,'utf8')),native=offlineNativeEvidence(store,work,job.worktree);
 requireProof(checkpoint.sha256===envelope.checkpointSha256&&error.sha256===envelope.errorSha256&&savedError.provider==='codex'&&savedError.session===work.sessionId&&savedError.error==='Error: Worker exited with surviving subprocesses; effects require reconciliation'&&native.file.sha256===envelope.nativeSessionSha256,'Historical supervision checkpoint, error or native transcript differs');
 files.push(checkpoint,error);
 const refs=envelope.artifacts,sourceManifest=z.object({head,files:z.record(z.string(),hash)}).parse(JSON.parse(read(refs.sourceManifest)));
 read(refs.processSource);read(refs.workerRuntimeSource);
 requireProof(refs.processSource.sha256===known.process&&refs.workerRuntimeSource.sha256===known.workerRuntime&&sourceManifest.files['server/process.ts']===known.process&&sourceManifest.files['server/worker-runtime.ts']===known.workerRuntime,'Historical supervision source is not the recognized shutdown contract');
 const runtime=z.object({status:z.literal('complete'),completedAt:z.string(),verifiedHead:head,pid,loadedHash:hash,expectedRuntimeHash:hash}).parse(JSON.parse(read(refs.runtimeReceipt)));
 const successor=z.object({base:head,expectedReviewedHead:head,parentRolloutReceiptSha256:hash,parentRuntime:z.object({pid,loadedHash:hash,serviceInstanceId:identity})}).parse(JSON.parse(read(refs.successorTarget)));
 const preDrain=z.object({status:z.literal('draining'),startedAt:z.string(),pid,loadedHash:hash,serviceInstanceId:identity,verifiedHead:head}).parse(JSON.parse(read(refs.preDrain)));
 requireProof(sourceManifest.head===runtime.verifiedHead&&runtime.verifiedHead===successor.base&&successor.parentRolloutReceiptSha256===refs.runtimeReceipt.sha256&&runtime.loadedHash===runtime.expectedRuntimeHash&&runtime.pid===successor.parentRuntime.pid&&runtime.loadedHash===successor.parentRuntime.loadedHash&&preDrain.pid===runtime.pid&&preDrain.loadedHash===runtime.loadedHash&&preDrain.serviceInstanceId===successor.parentRuntime.serviceInstanceId&&preDrain.verifiedHead===successor.expectedReviewedHead,'Historical supervision runtime/source continuity differs');
 requireProof(instant(runtime.completedAt)<=instant(work.startedAt)&&instant(work.startedAt)<=instant(work.endedAt)&&instant(work.endedAt)<=instant(preDrain.startedAt),'Original closeout is outside the verified historical runtime window');
 return {descriptor,envelope,files,native:native.file,binding:{head:runtime.verifiedHead,pid:runtime.pid,loadedHash:runtime.loadedHash,serviceInstanceId:preDrain.serviceInstanceId,completedAt:runtime.completedAt,preDrainStartedAt:preDrain.startedAt},
  semantics:'Recognized owned-group-shutdown-v1: this error is created after detecting residue in the original owned process group; command() terminates and waits for that group before rejecting, and worker-runtime writes error.json after rejection. This is no report or proof of escaped/out-of-group processes, no per-process receipt, no proof of no escaped effects, and no cleanup or acceptance authority.'};
}
