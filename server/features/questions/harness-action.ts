import {randomUUID} from 'node:crypto';
import type {Feature} from '../../../src/contracts/features';
import type {Store} from '../../store/store';
import {FeatureError} from '../progression/failure';
import {stageBudget} from '../progression/attempt-budget';
import {captureRequest,saveCaptureRequest} from '../handoff/capture-store';
import {pendingRound,roundAuthor} from './pending-round';
import {recoveryPreconditions,recoveryTarget} from './harness-question';
import {canReleaseOrdinary,releaseOrdinary,type QuestionOwnership} from './release-ordinary';
export type HarnessActionInput={roundId:string;operation:'note';note:string}|{roundId:string;operation:'apply';optionId:string};
/** Must run inside commandFeature's idempotent mutation transaction. */
export function applyHarnessAction(store:Store,feature:Feature,input:HarnessActionInput,ownership:QuestionOwnership={status:'unknown',reason:'Current ownership is unavailable'}) {
    const round=feature.rounds.find(r=>r.id===input.roundId);
    if(!round||roundAuthor(round)!=='harness'||!pendingRound(feature,round))throw new FeatureError('stale-round','Recovery question is no longer current');
    const now=store.clock.now().toISOString();
    if(input.operation==='note'){(round.notes??=[]).push({id:randomUUID(),text:input.note,at:now});return;}
    const option=round.options?.find(o=>o.id===input.optionId);
    if(!option||option.preconditionsDigest!==recoveryPreconditions(feature))throw new FeatureError('changed-precondition','Recovery changed; reload the current action');
    if(option.action==='release-to-ordinary'){
        if(option.target!=='source:'+feature.sourceTicket||!canReleaseOrdinary(store,feature,ownership))throw new FeatureError('changed-precondition','Current ownership or publication evidence prevents ordinary delivery');
        releaseOrdinary(store,feature,now);
    }else if(option.action==='pause'){
        const budget=stageBudget(feature,feature.phase);budget.wait='pause';budget.nextAt=null;
        feature.paused=true;feature.detail='Feature paused; retained ownership and recovery evidence are unchanged.';
    }else{
        if(store.state.paused||feature.paused||store.activeClaims().some(c=>c.work.kind==='feature'&&c.work.id===feature.id)||store.state.workLog?.some(w=>w.requestId===feature.id&&['running','stopping'].includes(w.status))||[feature.review,...feature.reviewHistory].some(r=>r?.processes.length))throw new FeatureError('changed-precondition','Wait for owned processes to stop and resume the project before retrying');
        const budget=stageBudget(feature,feature.phase);
        if(option.target.startsWith('capture:')){
            const target=option.target.slice(8),capture=captureRequest(store,target);
            if(!capture||capture.status!=='failed')throw new FeatureError('changed-precondition','Evidence capture no longer needs recovery');
            capture.status='queued';capture.generation++;capture.enqueuedAt=now;capture.dueAt=now;saveCaptureRequest(store,capture);
            budget.wait='provider';budget.nextAt=null;feature.status='waiting';
        }else if(option.target===recoveryTarget(feature,true)){
            budget.wait='fence';budget.nextAt=now;feature.status='waiting';
        }else if(option.target==='stage:'+feature.phase){
            budget.wait=undefined;budget.nextAt=null;feature.status='queued';if(feature.phase==='review'&&feature.review)feature.review.pendingRecovery=true;
        }else throw new FeatureError('changed-precondition','Recovery target changed');
        budget.generation++;feature.enqueuedAt=now;feature.detail='One explicit recovery attempt is authorized. Previous automatic limits remain recorded.';
    }
    round.resolvedAt=now;round.appliedOptionId=option.id;
}
