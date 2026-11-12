import type {Store} from '../../store/store';
import {FeatureError} from '../progression/failure';
import {pendingQuestions} from './pending-questions';
/** Reused before dispatch and after asynchronous ownership reads. */
export function assertQuestionVisibility(store:Store,id:string,officeWide:boolean) {
    if(!store.state.features?.some(f=>f.id===id)||officeWide&&!pendingQuestions([store]).some(q=>q.featureId===id))
        throw new FeatureError('source-unavailable','Feature or question availability changed');
}
