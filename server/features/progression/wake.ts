import type { Store } from '../../store/store';
import type { Feature } from '../../../src/contracts/features';
import { FEATURE_PLANNING } from '../../office/config';
import { automaticEnabled, automaticFeature } from './policy';
import { pendingRounds } from '../questions/pending-round';

/** A current recovery wait or unresolved harness question withholds automatic progression until it wakes or resolves. */
export function recoveryHeld(feature: Feature): boolean {
    const recovery = feature.recovery;
    return automaticFeature(feature) && (!!recovery?.wait && recovery.revision === feature.revision && recovery.stage === feature.phase || pendingRounds(feature, 'harness').length > 0);
}

/** Only executable, freshly observed predicates may wake a saved wait. */
export function wakeFeature(store: Store, feature: Feature, stopped: boolean): boolean {
    if (!automaticEnabled(feature, FEATURE_PLANNING) || feature.paused || store.state.paused || !stopped || pendingRounds(feature).length || feature.status !== 'waiting') return false;
    const recovery = feature.recovery;
    if (!recovery || recovery.revision !== feature.revision || recovery.stage !== feature.phase) return false;
    if (!['policy', 'pause', 'processes', 'retry', 'fence'].includes(recovery.wait || '')) return false;
    if (recovery.nextAt && Date.parse(recovery.nextAt) > store.clock.now().getTime()) return false;
    // A fence wakes only a scheduled read-back, never an unscheduled write retry.
    if (recovery.wait === 'fence' && !recovery.nextAt) return false;
    store.transaction(() => {
        feature.status = 'queued'; feature.enqueuedAt = recovery.nextAt || store.clock.now().toISOString();
        recovery.wait = undefined; recovery.nextAt = null; recovery.generation++;
    });
    return true;
}
