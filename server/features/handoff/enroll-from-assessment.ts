import type { Store } from '../../store/store';
import { FEATURE_PLANNING } from '../../office/config';
import { featurePolicy } from '../progression/policy';
import { createFeature } from '../commands';
import { enrolled, assertEnrollable } from '../enrollment-gate';
import { captureRequest } from './capture-store';
import { FeatureError } from '../progression/failure';
import { assessmentEpisode, closeAssessment, saveAssessment } from './disposition-store';
import { automaticTicketIntakeWait } from './intake-eligibility';

/** The only automatic enrollment site. Async observations must precede this transaction. */
export function enrollFromAssessment(store:Store,id:string,generation:number,ownership:{status:'clear'|'owned'|'unknown';reason:string},title:string) {
 return store.transaction(()=>{
  const episode=assessmentEpisode(store,id),policy=featurePolicy(store.project.id,FEATURE_PLANNING);
  if(['queued','working'].includes(captureRequest(store,'assessment:'+id)?.status||'')||!policy.assessment.enabled||!episode||episode.projectId!==store.project.id||episode.closedAt||episode.generation!==generation||!episode.evidence||!episode.result||episode.result.disposition!=='planning'||episode.policyDigest!==policy.digest)return;
  if(automaticTicketIntakeWait(store,episode.key))return;
  const existing=enrolled(store,episode.key);
  if(existing){episode.featureId=existing.feature.id;closeAssessment(store,episode,'planning-enrolled');return existing.feature;}
  if(ownership.status==='unknown'){episode.reason=ownership.reason||'Waiting for current ownership evidence';episode.nextAt=new Date(store.clock.now().getTime()+60_000).toISOString();saveAssessment(store,episode);return;}
  if(ownership.status==='owned'){closeAssessment(store,episode,'ordinary-by-rule',store.clock.now(),ownership.reason);return;}
  try{assertEnrollable(store,episode.key);}catch(error){if(!(error instanceof FeatureError)||error.code!=='ownership')throw error;closeAssessment(store,episode,'ordinary-by-rule',store.clock.now(),error.message);return;}
  const result=episode.result,requestId=`pm-handoff:${store.project.id}:${episode.key}:${episode.id}`;
  const feature=createFeature(store,{action:'create',requestId,title,intent:result.rationale,sourceTicket:episode.key});
  feature.handoff={episodeId:episode.id,key:episode.key,assessmentId:episode.attemptId||episode.id,policyDigest:policy.digest,evidence:episode.evidence,...result};
  feature.evidence=episode.evidence;feature.conversation[0].role='pm';
  feature.requests[requestId].response=JSON.stringify({...feature,requests:{}});
  episode.featureId=feature.id;closeAssessment(store,episode,'planning-enrolled');return feature;
 });
}
