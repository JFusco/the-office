import type {ImplementationContinuation,StageResult,TicketJob} from '../../../../src/shared';
/** A negative technical assessment is a structured source-repair result, not a provider/process error. */
export function negativeTechnicalReview(result:StageResult,job?:TicketJob){
 const resolution=result.resolution,open=result.findings.filter(f=>f.status==='open').map(f=>f.id);
 return result.outcome==='failed'&&resolution?.kind==='source-repair'&&result.paidRuns===0&&result.prId===0&&!result.prerequisites?.length&&
  result.receipts.every(r=>r.verified&&!r.uncertain)&&open.length>0&&new Set(open).size===open.length&&resolution.findingIds.length===open.length&&
  new Set(resolution.findingIds).size===open.length&&open.every(id=>resolution.findingIds.includes(id))&&resolution.evidenceIds.length>0&&
  new Set(resolution.evidenceIds).size===resolution.evidenceIds.length&&resolution.evidenceIds.every(id=>id.trim().length>0)&&
  resolution.evidenceIds.some(id=>result.evidence.some(e=>e.id===id&&!!e.path&&e.commit===result.commit&&['review','checks'].includes(e.kind)))&&
  resolution.evidenceIds.every(id=>{
   const matches=result.evidence.filter(e=>e.id===id),evidence=matches[0];
   if(matches.length!==1||!evidence.path)return false;
   if(evidence.commit===result.commit)return true;
   // Historical source evidence is context only. It must already belong to a retained
   // result carrying an original still-open source finding, never a new locator.
   const state=job?.implementationContinuation;
   return !!state&&state.phase==='technical-review'&&result.commit===job!.head&&
    state.pendingFindingIds.length>0&&state.pendingFindingIds.every(id=>result.findings.some(f=>f.id===id&&f.status==='open'))&&
    result.findings.some(f=>f.status==='open'&&!state.pendingFindingIds.includes(f.id))&&
    /^[a-f0-9]{40}$/.test(evidence.commit)&&job!.steps.some(step=>
     step.stage!=='superseded-stage-result'&&!(step.stage==='review'&&['failed','blocked'].includes(step.result.outcome))&&
     step.result.findings.some(f=>state.pendingFindingIds.includes(f.id)&&f.status==='open')&&
     step.result.evidence.some(old=>old.path===evidence.path&&old.commit===evidence.commit));
  });
}
export type ContinuationDecision={action:'repair'|'activation'|'technical-review'|'acceptance'|'blocked';next:ImplementationContinuation;reason:string};
/** Pure policy only. Callers must verify scope grant, original native effects, exact Git identity and claims before applying it. */
export function implementationContinuationDecision(job:TicketJob,result:StageResult,implementationChanged=false):ContinuationDecision|null{
 const state=job.implementationContinuation;
 if(!state||state.phase==='acceptance')return null;
 const blocked=(reason:string):ContinuationDecision=>({action:'blocked',next:structuredClone(state),reason});
 if(!state.originalWorkId||!/^[a-f0-9]{40}$/.test(state.originalHead)||!/^[a-f0-9]{64}$/.test(state.scopeSha256)||!state.proofPath.startsWith('/')||!state.noteIds.length||new Set(state.noteIds).size!==state.noteIds.length||!state.pendingFindingIds.length||new Set(state.pendingFindingIds).size!==state.pendingFindingIds.length||state.maxRounds!==3||!Number.isSafeInteger(state.round)||state.round<0||state.round>3)return blocked('Continuation grant is incomplete');
 if(result.prId||result.paidRuns!==0||result.receipts.some(r=>!r.verified||r.uncertain)||new Set(result.findings.map(f=>f.id)).size!==result.findings.length)return blocked('Continuation effects or findings are uncertain');
 if(state.phase!=='technical-review'&&result.findings.some(f=>![...state.pendingFindingIds,...state.repairFindingIds].includes(f.id)))return blocked('Unknown continuation finding');
 if(!state.pendingFindingIds.every(id=>result.findings.some(f=>f.id===id)))return blocked('Original pending findings must remain explicit');
 const next=structuredClone(state),pending=new Set(state.pendingFindingIds),open=result.findings.filter(f=>f.status==='open'),technical=open.filter(f=>!pending.has(f.id));
 if(state.phase==='technical-review'){
  if(state.repairFindingIds.some(id=>!result.findings.some(f=>f.id===id)))return blocked('Every retained technical finding requires an independent disposition');
  if(job.stage!=='review'||result.commit!==job.head||!['passed','blocked','failed'].includes(result.outcome)||result.outcome==='failed'&&!negativeTechnicalReview(result,job))return blocked('Exact-head independent technical review required');
  if(state.pendingFindingIds.some(id=>!result.findings.some(f=>f.id===id&&f.status==='open')))return blocked('Technical review cannot accept the pending source findings');
  next.repairFindingIds=[...new Set([...state.repairFindingIds,...result.findings.filter(f=>!pending.has(f.id)).map(f=>f.id)])];
  if(technical.length){
   if(state.round>=state.maxRounds)return blocked('Bounded technical repair budget exhausted');
   next.phase='repair';next.round++;
   return {action:'repair',next,reason:'Technical defects require repair on the same saved candidate; source acceptance remains pending'};
  }
  if(result.outcome!=='passed')return blocked('Technical review did not positively pass');
  next.phase='activation';return {action:'activation',next,reason:'Technical code review passed; only the reviewed source activation is queued, not source acceptance'};
 }
 if(job.stage!=='scope-repair'||result.outcome!=='passed'||!/^[a-f0-9]{40}$/.test(result.commit))return blocked('Certain same-branch continuation result required');
 if(state.phase==='repair'){
  if(technical.length||state.repairFindingIds.some(id=>!result.findings.some(f=>f.id===id&&f.status!=='open')))return blocked('Every technical defect requires an explicit repaired disposition');
  if(state.pendingFindingIds.some(id=>!result.findings.some(f=>f.id===id&&f.status==='open')))return blocked('Code-only repair cannot accept pending source findings');
  next.phase='technical-review';return {action:'technical-review',next,reason:'Repaired candidate requires a fresh independent technical review before activation'};
 }
 if(implementationChanged){
  if(state.repairFindingIds.some(id=>!result.findings.some(f=>f.id===id)))return blocked('Every retained technical finding requires an independent disposition');
  next.phase='technical-review';return {action:'technical-review',next,reason:'Activation changed reviewed implementation; fresh technical review required before activation or acceptance'};
 }
 if(open.length||state.repairFindingIds.some(id=>!result.findings.some(f=>f.id===id&&f.status!=='open')))return blocked('Activation has not resolved all required source and technical findings');
 next.phase='acceptance';return {action:'acceptance',next,reason:'Activated candidate still requires normal independent source review and QA before publication'};
}
