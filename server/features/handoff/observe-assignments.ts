import { holdAssessmentIntake } from './intake-routing';
import type { AssignedIssue, PickupPolicy } from '../../../src/shared';
import type { Store } from '../../store/store';
import { FEATURE_PLANNING } from '../../office/config';
import { featurePolicy } from '../progression/policy';
import { enrolled } from '../enrollment-gate';
import { assessmentEnabled, assessmentEpisodes, latestAssessment, openAssessment, saveAssessment, closeAssessment } from './disposition-store';
import { requestCapture, captureRequest } from './capture-store';
/** Assignment metadata schedules evidence reads before ordinary intake can obtain ownership. */
export function observeAssessmentAssignments(store:Store,assigned:AssignedIssue[],pickup:PickupPolicy,now=store.clock.now()) {
 if(!assessmentEnabled(store))return;
 store.transaction(()=>{
  const present=new Set(assigned.map(i=>i.key));
  for(const episode of assessmentEpisodes(store))if(!present.has(episode.key)&&!episode.departedAt){episode.departedAt=now.toISOString();if(!episode.closedAt)closeAssessment(store,episode,'departed',now);else saveAssessment(store,episode);}
  for(const issue of assigned){
   const eligible=pickup.enabled&&(issue.pickupStatus??issue.status)===pickup.status;
   let episode=latestAssessment(store,issue.key);
   const owned=store.state.coordination?.jobs?.some(j=>j.key===issue.key&&j.status!=='cancelled')||store.state.tickets.some(t=>t.key===issue.key&&t.pilot);
   if(!episode||episode.departedAt&&!enrolled(store,issue.key)&&!owned)episode=openAssessment(store,issue.key,issue.updated,eligible,now);
   if(episode.closedAt){
    if(episode.outcome==='planning-enrolled'&&enrolled(store,issue.key)&&episode.providerVersion!==issue.updated){requestCapture(store,'assessment:'+episode.id,issue.key,'provider-version',issue.updated,now.toISOString());episode.providerVersion=issue.updated;saveAssessment(store,episode);}
    continue;
   }
   if(store.state.coordination?.listener.reviews.some(r=>r.key===issue.key&&r.workRequested==='manual'&&!r.featureBinding&&['queued','working'].includes(r.status))){closeAssessment(store,episode,'ordinary-by-start',now,'Existing explicit Start retained');continue;}
   if(eligible&&!episode.eligibleAt)episode.eligibleAt=now.toISOString();
   const policy=featurePolicy(store.project.id,FEATURE_PLANNING),capture=captureRequest(store,'assessment:'+episode.id);
   if(episode.providerVersion!==issue.updated||episode.policyDigest!==policy.digest||!capture){
    requestCapture(store,'assessment:'+episode.id,issue.key,capture?'provider-version':'observation',issue.updated,now.toISOString());
    episode.providerVersion=issue.updated;
    if(episode.policyDigest!==policy.digest){episode.policyDigest=policy.digest;episode.generation++;episode.result=undefined;episode.enqueuedAt=now.toISOString();}
   }
   saveAssessment(store,episode);
   for(const review of store.state.coordination?.listener.reviews||[])if(review.key===issue.key&&review.status==='queued'&&review.workRequested!=='manual'){
    holdAssessmentIntake(store,review);
   }
  }
 });
}
