import { failEvidenceCapture } from './capture-failure';
import { refreshFeatureEvidence } from '../release/refresh-evidence';
import type { OfficeEntry } from '../../scheduling/scheduled-work';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { Store } from '../../store/store';
import { FEATURE_PLANNING } from '../../office/config';
import { automaticEnabled, featurePolicy } from '../progression/policy';
import { enrolled } from '../enrollment-gate';
import { assessmentEnabled, assessmentEpisode, assessmentEpisodes, saveAssessment, closeAssessment } from './disposition-store';
import { captureRequests, captureRequest, saveCaptureRequest, requestCapture, type CaptureRequest } from './capture-store';
import { captureTicketEvidence } from './ticket-evidence';
import { assessmentSignal } from './assessment-signals';
export function captureAllowed(store: Store, target: string) { return assessmentEnabled(store) || (store.state.features||[]).some(f=>f.phase!=='complete'&&automaticEnabled(f,FEATURE_PLANNING)&&(f.handoff?'assessment:'+f.handoff.episodeId:'feature:'+f.id)===target); }
export function capturesEnabled(store: Store) { return assessmentEnabled(store) || (store.state.features||[]).some(f=>!!f.sourceTicket&&f.phase!=='complete'&&automaticEnabled(f,FEATURE_PLANNING)); }
export function maintainCaptureRequests(store:Store,now=store.clock.now()) {
 if(!capturesEnabled(store))return;
 const targets=[...(assessmentEnabled(store)?assessmentEpisodes(store):[]).filter(e=>!e.closedAt).map(e=>({target:'assessment:'+e.id,key:e.key,version:e.providerVersion})),...(store.state.features||[]).filter(f=>f.sourceTicket&&f.phase!=='complete'&&automaticEnabled(f,FEATURE_PLANNING)).map(f=>({target:f.handoff?'assessment:'+f.handoff.episodeId:'feature:'+f.id,key:f.sourceTicket,version:f.handoff?assessmentEpisode(store,f.handoff.episodeId)?.providerVersion||'':''}))];
 for(const target of new Map(targets.map(t=>[t.target,t])).values()){
  const current=captureRequest(store,target.target),due=current?.completedAt?new Date(Date.parse(current.completedAt)+5*60_000):now;
  if(!current||current.status==='complete'&&due<=now)store.transaction(()=>requestCapture(store,target.target,target.key,current?'periodic':'observation',target.version,due.toISOString()));
 }
}
export function scheduledCaptures({store}:OfficeEntry,capture:typeof captureTicketEvidence=captureTicketEvidence):ScheduledWork[] {
 if(!capturesEnabled(store))return [];
 return captureRequests(store).filter(r=>captureAllowed(store,r.target)&&(r.status==='queued'||r.status==='working')).map(request=>({store,work:{projectId:store.project.id,kind:'reconciliation',id:'evidence-capture:'+request.target},stage:'evidence-capture',rank:3,enqueuedAt:request.enqueuedAt,
  eligibility:{state:store.state.paused||store.state.draining?'waiting':request.status==='working'?'running':Date.parse(request.dueAt)>store.clock.now().getTime()?'waiting':'runnable',reason:store.state.paused?'Project is paused':'Capture assigned ticket evidence',owner:'Morgan',nextCheckAt:request.dueAt},
  identity:()=>JSON.stringify(captureRequest(store,request.target)),
  claimEligible:()=>captureAllowed(store,request.target)&&captureRequest(store,request.target)?.generation===request.generation&&captureRequest(store,request.target)?.status==='queued'&&Date.parse(request.dueAt)<=store.clock.now().getTime()&&!store.state.paused&&!store.state.draining,
  execute:async()=>{
   store.transaction(()=>{const current=captureRequest(store,request.target);if(!current||current.generation!==request.generation)throw new Error('Capture generation changed');current.status='working';current.attempts=(current.attempts??0)+1;saveCaptureRequest(store,current);});
   try{const result=await capture(store,request.key);store.transaction(()=>{
    const current=captureRequest(store,request.target);if(!current||current.generation!==request.generation||!captureAllowed(store,request.target))return;
    current.status='complete';current.completedAt=result.reference.capturedAt;saveCaptureRequest(store,current);
    const episode=request.target.startsWith('assessment:')?assessmentEpisode(store,request.target.slice(11)):undefined;
    if(episode&&!episode.closedAt&&assessmentEnabled(store)){
     const changed=episode.evidence?.evidenceDigest!==result.reference.evidenceDigest;
     episode.evidence=result.reference;
     if(changed){episode.generation++;episode.result=undefined;episode.enqueuedAt=store.clock.now().toISOString();}
     if(['issue','comments','children'].some(section=>result.evidence.coverage[section]?.state!=='complete')){closeAssessment(store,episode,'ordinary-by-unavailable',store.clock.now(),'Required provider evidence is unavailable or incomplete');return;}
     const policy=featurePolicy(store.project.id,FEATURE_PLANNING),active=enrolled(store,episode.key)?.feature;
     const owner=store.state.coordination?.jobs?.find(j=>j.key===episode.key&&j.status!=='cancelled')?.id||store.state.tickets.find(t=>t.key===episode.key&&t.pilot)?.runId||store.state.deliveryQueue?.find(r=>r.key===episode.key&&['queued','working','interrupted'].includes(r.status))?.id||store.state.coordination?.listener.reviews.find(r=>r.key===episode.key&&r.status==='working')?.id;
     const signal=assessmentSignal({activeFeatureId:active?.id,ownerId:owner,adoptedPr:store.state.coordination?.adoptions?.find(a=>'GH-'+a.issue===episode.key)?.pr,type:result.evidence.type,labels:result.evidence.labels},policy);
     if(signal){episode.decidedBy='harness';episode.rule=signal.rule;episode.observedFields=signal.observedFields;episode.reason=signal.rule;
      episode.result={disposition:signal.disposition,rationale:signal.rule,requirements:[result.evidence.summary],acceptanceCriteria:[],settledDecisions:[],openQuestions:[],imageObservations:[]};
      if(signal.disposition==='ordinary')closeAssessment(store,episode,'ordinary-by-rule');
      else if(active){episode.featureId=active.id;closeAssessment(store,episode,'planning-enrolled');}
     }
     // Unchanged evidence validates Morgan's deferred ordinary result; a planning result enrolls through assessPlanning.
     if(!changed&&!episode.closedAt&&episode.decidedBy==='pm'&&episode.result?.disposition==='ordinary'&&episode.policyDigest===policy.digest)closeAssessment(store,episode,'ordinary-by-model');
     if(!episode.closedAt)saveAssessment(store,episode);
    }
    refreshFeatureEvidence(store, request.target, result.reference, result.evidence);
    store.emit('ticket-evidence-captured',request.key+': captured ticket evidence','pm',request.key);
   });}catch(error){store.transaction(()=>{const current=captureRequest(store,request.target);if(!current||current.generation!==request.generation)return;failEvidenceCapture(store,current,error);});}
  }
 } satisfies ScheduledWork));
}
