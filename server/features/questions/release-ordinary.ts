import type { Feature } from '../../../src/contracts/features';
import type { Store } from '../../store/store';
import { assertEnrollable } from '../enrollment-gate';
import { assessmentEpisode, saveAssessment } from '../handoff/disposition-store';
import { pendingRounds } from './pending-round';
import { recoveryPreconditions } from './harness-question';
import {observeHelperGroups} from '../review-processes';
export interface QuestionOwnership { status: 'clear' | 'owned' | 'unknown'; reason: string }
/** Unknown external ownership is never an offer to release. Caller supplies a fresh observation. */
export function canReleaseOrdinary(store: Store, feature: Feature, ownership: QuestionOwnership): boolean {
    if (ownership.status !== 'clear' || !feature.sourceTicket || feature.phase==='complete' || feature.status==='working' ||
        feature.publication.some(p=>p.key||p.fence||p.startedApprovalId||p.effects.some(id=>store.getEffect(id)?.status!=='rejected')) ||
        store.activeClaims().some(c=>c.work.kind==='feature'&&c.work.id===feature.id) ||
        store.state.workLog?.some(w=>w.requestId===feature.id&&['running','stopping'].includes(w.status)) ||
        [feature.review,...feature.reviewHistory].some(r=>r?.processes.length)) return false;
    const requests=store.state.coordination?.requests?.filter(r=>r.key===feature.sourceTicket&&r.lane==='delivery')||[];
    if(requests.some(r=>['queued','working','interrupted','blocked'].includes(r.status))||
        store.activeClaims().some(c=>requests.some(r=>r.id===c.work.id))||
        store.state.coordination?.adoptions?.some(a=>'GH-'+a.issue===feature.sourceTicket&&a.status!=='withdrawn'&&a.status!=='refused'))return false;
    try {
        if([feature,...feature.reviewHistory.map(review=>({...feature,review}))].some(owner=>observeHelperGroups(store,owner).length))return false;
        assertEnrollable(store,feature.sourceTicket,feature.id); return true;
    } catch { return false; }
}
export function offerOrdinaryRelease(store: Store, feature: Feature, ownership: QuestionOwnership) {
    const round=pendingRounds(feature,'harness')[0];
    if(!round)return;
    const offered=round.options?.some(o=>o.action==='release-to-ordinary'),safe=canReleaseOrdinary(store,feature,ownership);
    if(offered===safe)return;
    store.transaction(()=>{
        if(safe)(round.options??=[]).push({id:'release-to-ordinary',label:'Return to ordinary delivery',tradeoff:'Stop this feature plan and let existing ticket delivery rules apply.',action:'release-to-ordinary',target:'source:'+feature.sourceTicket,preconditionsDigest:recoveryPreconditions(feature)});
        else round.options=round.options?.filter(o=>o.action!=='release-to-ordinary');
    });
}
/** Already guarded synchronously by the action transaction; retains all historical evidence. */
export function releaseOrdinary(store: Store, feature: Feature, now: string) {
    const key=feature.sourceTicket;
    feature.releasedSourceTicket=key;feature.releasedAt=now;feature.sourceTicket='';feature.phase='complete';feature.status='completed';feature.paused=true;
    feature.detail='Returned to ordinary ticket delivery by your decision.';
    (feature.releases??=[]).push({id:'ordinary:'+feature.id+':'+feature.revision,revision:feature.revision,at:now,outcome:'ordinary',detail:feature.detail});
    if(feature.handoff){const episode=assessmentEpisode(store,feature.handoff.episodeId);if(episode){episode.disposition='ordinary';episode.outcome='ordinary-by-release';episode.closedAt=now;episode.reason=feature.detail;saveAssessment(store,episode);}}
}
