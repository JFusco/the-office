import { randomUUID } from 'node:crypto';
import type { Feature, FeatureHarnessAction } from '../../../src/contracts/features';
import { digest } from '../documents';
import { pendingRounds } from './pending-round';
export function recoveryPreconditions(feature: Feature) {
    const r = feature.recovery;
    return digest([feature.id,feature.revision,feature.phase,feature.paused,feature.activeAttempt,
        r && [r.stage,r.revision,r.generation,r.attempts,r.replacements],feature.publication,feature.approvals.at(-1)?.digest]);
}
export function recoveryTarget(feature: Feature, reconciliation: boolean) {
    return reconciliation ? 'effects:' + digest(feature.publication.flatMap(p=>p.effects)) : 'stage:' + feature.phase;
}
/** Executable descriptors are authored only by the harness, never copied from model output. */
export function harnessQuestion(feature: Feature, now: Date, detail: string, reconciliation = false, target = recoveryTarget(feature,reconciliation)) {
    if (pendingRounds(feature,'harness').length) return;
    const preconditionsDigest = recoveryPreconditions(feature);
    const options = [
        {id:'retry',label:reconciliation?'Reconcile again':'Retry once',tradeoff:reconciliation?'Read back the original operation; never resend it.':'Authorize one further attempt while retaining recovery history.',action:'retry' as FeatureHarnessAction},
        {id:'pause',label:'Pause',tradeoff:'Keep the evidence and resume when ready.',action:'pause' as FeatureHarnessAction},
    ].map(option=>({...option,target,preconditionsDigest}));
    feature.rounds.push({id:randomUUID(),revision:feature.revision,author:'harness',createdAt:now.toISOString(),answers:{},questions:[{id:'recovery',question:detail,recommendation:'',choices:[]}],options});
    feature.status='waiting';feature.detail=detail;
}
