import type { Store } from '../../store/store';
import type { Feature } from '../../../src/contracts/features';
import { FEATURE_PLANNING } from '../../office/config';
import { automaticFeature, automaticEnabled } from './policy';
import { randomUUID } from 'node:crypto';
import { classifyFeatureFailure } from './failure';
import { reserveReplacement, stageBudget } from './attempt-budget';
import { recoveryQuestion } from '../questions/recovery-question';
import { pendingRounds } from '../questions/pending-round';

/** Called inside the failure transaction after recording the failed attempt. */
export function recoverFailure(store: Store, feature: Feature, error: unknown, identity: string, liveProcesses = false): boolean {
    if (!automaticFeature(feature)) return false;
    if (pendingRounds(feature, 'harness').length) return true;
    const uncertainEffect = feature.publication.some(p => p.fence || p.effects.some(id => ['uncertain', 'dispatching'].includes(store.getEffect(id)?.status ?? '')));
    const decision = !automaticEnabled(feature, FEATURE_PLANNING) ? { kind: 'wait' as const, wait: 'policy' as const } : classifyFeatureFailure(error, {
        uncertainEffect, liveProcesses: liveProcesses || store.activeClaims().some(c=>c.work.kind==='feature'&&c.work.id===feature.id&&c.status==='stopping'), paused: feature.paused || store.state.paused, replaySafe: ['discovery', 'plan', 'review', 'approval'].includes(feature.phase),
    });
    if (decision.kind === 'rework' && ['approval','review'].includes(feature.phase)) {
        if (feature.review) feature.reviewHistory.push(feature.review);
        feature.review=undefined;feature.manifest=undefined;feature.phase='plan';feature.activeAttempt=undefined;
    }
    const budget = stageBudget(feature, feature.phase);
    budget.detail = String(error); feature.detail = budget.detail;
    if (decision.kind === 'rework') feature.conversation.push({id:randomUUID(),role:'harness',text:'Correct the rejected '+feature.phase+' output: '+String(error),at:store.clock.now().toISOString()});
    if (decision.kind === 'wait') { budget.wait = decision.wait; budget.nextAt = null; feature.status = 'waiting'; return true; }
    if (decision.kind !== 'question' && reserveReplacement(feature, feature.phase, identity, store.clock.now(), decision.kind === 'retry' && decision.diagnostic)) {
        if (feature.review && decision.kind !== 'reconcile') feature.review.pendingRecovery = true;
        budget.wait = decision.kind === 'reconcile' ? 'fence' : 'retry';
        feature.status = 'waiting'; return true;
    }
    budget.nextAt = null; budget.wait = 'questions';
    recoveryQuestion(feature, store.clock.now(), feature.detail + ' Recovery needs your decision.', decision.kind === 'reconcile');
    return true;
}
