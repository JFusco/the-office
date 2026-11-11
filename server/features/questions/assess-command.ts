import type {Store} from '../../store/store';
import {validTicket} from '../../office/projects';
import {assessmentEnabled,latestAssessment,openAssessment,saveAssessment,closeAssessment} from '../handoff/disposition-store';
import {captureRequest,requestCapture} from '../handoff/capture-store';
import {enrolled,assertEnrollable} from '../enrollment-gate';
import {FeatureError} from '../progression/failure';
/** The episode is the idempotency key. Explicit terminal Start/fail-open decisions are never reopened. */
export function requestAssessment(store:Store,key:string) {
    if(!assessmentEnabled(store))throw new FeatureError('policy-disabled','Ticket assessment is not enabled for this project');
    if(!validTicket(store.project,key))throw new FeatureError('invalid-content','Invalid ticket identity');
    return store.transaction(()=>{
        const feature=enrolled(store,key)?.feature;if(feature)return {featureId:feature.id};
        let episode=latestAssessment(store,key);if(episode?.closedAt&&episode.outcome!=='ordinary-by-deadline')return {episodeId:episode.id,outcome:episode.outcome};
        if(episode?.outcome==='ordinary-by-deadline'){assertEnrollable(store,key);episode=undefined;}
        const issue=store.state.coordination?.listener.assigned?.find(i=>i.key===key);
        const ticket=store.state.tickets.find(t=>t.key===key);
        if(!issue&&!ticket)throw new FeatureError('invalid-content','Ticket must be visible in this project before assessment');
        episode??=openAssessment(store,key,issue?.updated||'',false);
        try{assertEnrollable(store,key);}catch(error){if(!(error instanceof FeatureError)||error.code!=='ownership')throw error;closeAssessment(store,episode,'ordinary-by-rule',store.clock.now(),error.message);return {episodeId:episode.id,outcome:episode.outcome};}
        const target='assessment:'+episode.id;
        if(!captureRequest(store,target))requestCapture(store,target,key,'observation',issue?.updated||'');
        saveAssessment(store,episode);store.emit('assessment-requested',key+': Morgan will assess captured evidence.','pm',key);
        return {episodeId:episode.id};
    });
}
