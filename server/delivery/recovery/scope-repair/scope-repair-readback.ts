import {scopeRepairResumeCandidate,resumeBlockedScopeRepair} from './scope-repair-resume';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {artifact} from '../../../store/readback-evidence';
import {containedFile} from '../../../cec/workflow';
import type {TicketJob,HarnessRequest} from '../../../../src/shared';
import type {Store} from '../../../store/store';
import type {GitHubDelivery} from '../../pipeline/github-delivery';
type Ownership={complete:boolean;fresh:boolean;ownership?:{status:string}};

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
  return false;
 }catch{return false;}
}

/** Sam audits the stopped original; only the scheduler can claim this durable reconciliation. */
export async function reconcileScopeRepairReadback(delivery:GitHubDelivery,key:string,originalWorkId:string,ownership:()=>Promise<Ownership>,intentId:string){
 const {store}=delivery,job=delivery.jobs.find(j=>j.key===key&&j.status!=='cancelled');
 if(job&&scopeRepairResumeCandidate(store,job)?.work.id===originalWorkId)return resumeBlockedScopeRepair(delivery,key,originalWorkId,ownership,intentId);
 throw new Error('Exact stopped scope-repair original required');
}
