import type { Store } from '../../store/store';
import type { FeatureBinding } from '../../../src/contracts/features';
import { enrolled, currentApproval } from '../enrollment-gate';
import { approvedDelivery } from '../delivery-binding';
import { assessmentEnabled, latestAssessment, openAssessment, closeAssessment, ASSESSMENT_DEADLINE_MS } from './disposition-store';
import { requestCapture } from './capture-store';
export type IntakeDisposition={kind:'proceed'}|{kind:'planning';featureId:string;reason:string}|{kind:'assessing';episodeId:string;deadline:string|null;reason:string};
export function intakeDisposition(store:Store,key:string,binding?:FeatureBinding):IntakeDisposition {
 if(!assessmentEnabled(store))return {kind:'proceed'};
 if(binding){const approved=approvedDelivery(store,binding);if(currentApproval(approved.feature)?.id!==binding.approvalId)throw new Error('Feature handoff approval changed');if(approved.item.key!==key&&!approved.feature.publication.some(p=>p.id===binding.itemId&&p.key===key))throw new Error('Feature handoff ticket identity changed');return {kind:'proceed'};}
 const feature=enrolled(store,key)?.feature;if(feature)return {kind:'planning',featureId:feature.id,reason:'Feature planning: '+feature.title};
 let episode=latestAssessment(store,key);
 if(!episode){store.transaction(()=>{episode=latestAssessment(store,key)||openAssessment(store,key,store.state.tickets.find(t=>t.key===key)?.updated||'',true);requestCapture(store,'assessment:'+episode.id,key,'observation',episode.providerVersion);});}
 if(episode!.closedAt)return {kind:'proceed'};
 return {kind:'assessing',episodeId:episode!.id,deadline:episode!.eligibleAt?new Date(Date.parse(episode!.eligibleAt)+ASSESSMENT_DEADLINE_MS).toISOString():null,reason:'Morgan is assessing whether this ticket needs a feature plan'};
}
/** Caller commits this with the accepted Start/enqueue, never before validation. */
export function closeIntakeEpisode(store:Store,key:string,manual=false) {
 if(!assessmentEnabled(store)||enrolled(store,key))return;
 const episode=latestAssessment(store,key)||openAssessment(store,key,'',true);
 closeAssessment(store,episode,manual?'ordinary-by-start':'ordinary-by-admission',store.clock.now(),manual?'Explicit Start selected ordinary delivery':'Ordinary delivery admitted');
}
