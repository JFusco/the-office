import { reconcileFeatureCompletion } from './completion';
import { helperTelemetry } from './helper-telemetry';
import { randomUUID } from 'node:crypto';
import type { Store } from '../store/store';
import { processGroupAlive } from '../workers/process';
import { observeHelperGroups } from './review-processes';

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
        for (const owner of owners) helperTelemetry(store, owner, alive);
        const groups = owners.flatMap(owner => observeHelperGroups(store, owner, alive));
        const workers = store.state.workLog?.filter(w => w.requestId === feature.id && ['running', 'stopping'].includes(w.status)) || [];
        if (groups.length || workers.some(w => w.processId && alive(w.processId))) continue;
        const attempt = feature.attempts.find(a => a.id === feature.activeAttempt);
        if (attempt?.status !== 'interrupted' || feature.paused || store.state.paused || !['discovery', 'plan'].includes(feature.phase) || feature.revision !== attempt.revision || feature.baseline?.sha !== attempt.baselineSha) continue;
        store.transaction(() => {
            const prior = feature.attempts.find(a => a.replacementOf === attempt.id);
            const replacement = prior || { ...attempt, id: randomUUID(), replacementOf: attempt.id, status: 'queued' as const, startedAt: '', endedAt: '' };
            if (!prior) feature.attempts.push(replacement);
            feature.activeAttempt = replacement.id; feature.status = 'queued';
            feature.enqueuedAt = store.clock.now().toISOString(); feature.detail = 'Interrupted reader is stopped; one replacement assignment is queued.';
        });
    }
}
