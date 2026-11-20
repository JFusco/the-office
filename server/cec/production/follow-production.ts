import type { AzureBinding } from '../../office/project-bindings-config';
import { sanitize } from '../../office/security';
import type { Store } from '../../store/store';
import { awaitingJiraStatus, awaitingProduction } from './awaiting-production';
import { advanceJiraStatus } from './production-status';
import type { Execute } from '../parking/jira-issue';
import { ensurePromotionPR, type PromotionIO } from './promotion-pr';
import { observeProductionDeploy } from './production-deploy';

const lastFailure = new WeakMap<object, string>();

/**
 * One look at every ticket verified on staging and not yet Done: its promotion pull request, its
 * production deploy, then its Jira status. A project with no production settings is left alone. A
 * failure is said once and tried again at the next look; it never stops the rest of the observation.
 */
export async function followProduction(store: Store, azure: AzureBinding, io: PromotionIO, jira?: Execute): Promise<void> {
    if (!azure.production) return;
    const production = azure.production, tickets = awaitingProduction(store);
    if (!tickets.length && !awaitingJiraStatus(store).length) return;
    let failure = '';
    // Each step is tried even when an earlier one could not finish: the deploy is looked for without a pull request, and Jira follows whatever is recorded.
    const steps: (() => Promise<void>)[] = [() => ensurePromotionPR(store, io, azure, tickets), () => observeProductionDeploy(store, io.read, azure, awaitingProduction(store)),
        ...(jira ? awaitingJiraStatus(store).map(t => () => advanceJiraStatus(store, jira, store.ticket(t.key), production.pipeline)) : [])];
    for (const step of steps) {
        try { await step(); }
        catch (error) { failure ||= `Production follow-through could not finish this look: ${sanitize(String(error))}`; }
    }
    if (failure && lastFailure.get(store) !== failure) store.emit('production-follow-failed', failure, 'pm');
    if (failure) lastFailure.set(store, failure); else lastFailure.delete(store);
}
