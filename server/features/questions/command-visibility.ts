import type {Store} from '../../store/store';
import type {SourceRegistry} from '../../knowledge/sources/registry';
import {knowledgeOfficeState} from '../../knowledge/office-state-view';
import {FeatureError} from '../progression/failure';
import {pendingQuestions} from './pending-questions';
/** Reused before dispatch and after asynchronous ownership reads. */
export function assertQuestionVisibility(store:Store,sources:SourceRegistry,id:string,officeWide:boolean) {
    const visible=knowledgeOfficeState(sources,store.project.id,store.state,officeWide);
    if(!visible.features?.some(f=>f.id===id)||officeWide&&!pendingQuestions([store],sources).some(q=>q.featureId===id))
        throw new FeatureError('source-unavailable','Feature source access or question availability changed');
}
/** A raw assignment feed cannot override a revoked retained ticket or feature scope. */
export function assertAssessmentVisibility(store:Store,sources:SourceRegistry,key:string) {
    const visible=knowledgeOfficeState(sources,store.project.id,store.state);
    const hiddenFeature=store.state.features?.some(f=>(f.sourceTicket===key||f.publication.some(p=>p.key===key))&&!visible.features?.some(v=>v.id===f.id));
    const hiddenTicket=store.state.tickets.some(t=>t.key===key&&!visible.tickets.some(v=>v.runId===t.runId));
    const hiddenJob=store.state.coordination?.jobs?.some(j=>j.key===key&&!visible.coordination?.jobs?.some(v=>v.id===j.id));
    if(hiddenFeature||hiddenTicket||hiddenJob)throw new FeatureError('source-unavailable','Ticket source access changed');
}
