import { reconcileFeatureCompletion } from './completion';
import { helperTelemetry } from './helper-telemetry';
import { randomUUID } from 'node:crypto';
import type { Store } from '../store/store';
import { processGroupAlive } from '../workers/process';
import { observeHelperGroups } from './review-processes';
import { automaticFeature, automaticEnabled } from './progression/policy';
import { FEATURE_PLANNING } from '../office/config';
import { reserveReplacement, stageBudget } from './progression/attempt-budget';
import { recoveryQuestion } from './questions/recovery-question';
import { wakeFeature } from './progression/wake';
import {retainStoppingClaim} from '../scheduling/stopping-claims';

/** Called at startup and after stopping work is reconciled; never retries ordinary failures. */
export function recoverFeatures(store: Store, startup = false, alive = processGroupAlive) {
    reconcileFeatureCompletion(store);
    for (const feature of store.state.features || []) {
        if (startup && feature.status === 'working') {
            const attempt = feature.attempts.find(a => a.id === feature.activeAttempt);
            store.transaction(() => {
                if (attempt?.status === 'working') attempt.status = 'interrupted';
                feature.status = 'blocked'; feature.detail = 'Interrupted feature assignment retained for reconciliation.';
            });
        }
        const owners = [feature, ...feature.reviewHistory.map(review => ({ ...feature, review }))];
        let groups:number[];
        try {
            for (const owner of owners) helperTelemetry(store, owner, alive);
            groups = owners.flatMap(owner => observeHelperGroups(store, owner, alive));
        } catch(error) {
            store.transaction(()=>{
                const known=owners.flatMap(owner=>owner.review?.processes||[]).filter(pid=>Number.isSafeInteger(pid)&&pid>1&&alive(pid));
                for(const claim of store.activeClaims().filter(c=>c.work.kind==='feature'&&c.work.id===feature.id))retainStoppingClaim(store,claim,known,String(error));
                feature.status=automaticFeature(feature)?'waiting':'blocked';feature.detail='Helper process evidence needs reconciliation: '+String(error);
                if(automaticFeature(feature)){const budget=stageBudget(feature,feature.phase);budget.wait='processes';budget.nextAt=null;}
            });
            continue;
        }
        const workers = store.state.workLog?.filter(w => w.requestId === feature.id && ['running', 'stopping'].includes(w.status)) || [];
        if (groups.length || workers.some(w => w.processId && alive(w.processId))) continue;
        wakeFeature(store, feature, true);
        if (automaticFeature(feature)) {
            if (!automaticEnabled(feature, FEATURE_PLANNING) || feature.paused || store.state.paused) continue;
            if (feature.status === 'blocked' && ['review', 'approval', 'delivery'].includes(feature.phase)) {
                store.transaction(() => {
                    // Each wake advances the generation, so a re-block after a retry spends a new slot.
                    const budget = stageBudget(feature, feature.phase);
                    if (reserveReplacement(feature, feature.phase, `startup:${feature.revision}:${feature.phase}:${budget.generation}`, store.clock.now())) {
                        if (feature.review && feature.phase === 'review') feature.review.pendingRecovery = true;
                        feature.status = 'waiting';
                    } else {
                        budget.wait = 'questions'; budget.nextAt = null;
                        recoveryQuestion(feature, store.clock.now(), 'Interrupted feature recovery has exhausted its automatic attempts.', feature.phase === 'delivery');
                    }
                });
            }
        }
        const attempt = feature.attempts.find(a => a.id === feature.activeAttempt);
        if (attempt?.status !== 'interrupted' || feature.paused || store.state.paused || !['discovery', 'plan'].includes(feature.phase) || feature.revision !== attempt.revision || feature.baseline?.sha !== attempt.baselineSha) continue;
        store.transaction(() => {
            const prior = feature.attempts.find(a => a.replacementOf === attempt.id);
            if (automaticFeature(feature) && !prior && !reserveReplacement(feature, feature.phase, attempt.id, store.clock.now())) {
                feature.recovery!.wait = 'questions'; feature.recovery!.nextAt = null;
                recoveryQuestion(feature, store.clock.now(), 'Interrupted reader has exhausted its automatic attempts.'); return;
            }
            const replacement = prior || { ...attempt, id: randomUUID(), replacementOf: attempt.id, status: 'queued' as const, startedAt: '', endedAt: '' };
            if (!prior) feature.attempts.push(replacement);
            feature.activeAttempt = replacement.id; feature.status = automaticFeature(feature) ? 'waiting' : 'queued';
            feature.enqueuedAt = store.clock.now().toISOString(); feature.detail = 'Interrupted reader is stopped; one replacement assignment is queued.';
        });
    }
}
