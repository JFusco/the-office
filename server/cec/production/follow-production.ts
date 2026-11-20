import type { AzureBinding } from '../../office/project-bindings-config';
import { sanitize } from '../../office/security';
import type { Store } from '../../store/store';
import { awaitingProduction } from './awaiting-production';
import { ensurePromotionPR, type PromotionIO } from './promotion-pr';
import { observeProductionDeploy } from './production-deploy';

const lastFailure = new WeakMap<object, string>();

/**
 * One look at every ticket verified on staging and not yet seen in production: its promotion pull
 * request, then its production deploy. A project with no production settings is left alone. A
 * failure is said once and tried again at the next look; it never stops the rest of the observation.
 */
export async function followProduction(store: Store, azure: AzureBinding, io: PromotionIO): Promise<void> {
    if (!azure.production) return;
    const tickets = awaitingProduction(store);
    if (!tickets.length) return;
    let failure = '';
    // The deploy is looked for even when the pull request step could not finish.
    for (const step of [() => ensurePromotionPR(store, io, azure, tickets), () => observeProductionDeploy(store, io.read, azure, awaitingProduction(store))]) {
        try { await step(); }
        catch (error) { failure ||= `Production follow-through could not finish this look: ${sanitize(String(error))}`; }
    }
    if (failure && lastFailure.get(store) !== failure) store.emit('production-follow-failed', failure, 'pm');
    if (failure) lastFailure.set(store, failure); else lastFailure.delete(store);
}
