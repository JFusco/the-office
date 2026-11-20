import type { Ticket } from '../../../src/shared';
import type { AzureBinding } from '../../office/project-bindings-config';
import type { Store } from '../../store/store';
import { containedIn, type AzureRead } from './contained';

/**
 * Records a ticket as deployed to production once the newest passed run of the production pipeline,
 * on the production branch, ran a commit that contains the ticket's commit. A run already checked
 * for a ticket is not checked again. A stale or failed pipeline read decides nothing.
 */
export async function observeProductionDeploy(store: Store, read: AzureRead, azure: AzureBinding, tickets: readonly Ticket[]): Promise<void> {
    const production = azure.production!, watch = store.state.pipelines;
    if (!watch || watch.error) return;
    const run = watch.items.find(p => p.name === production.pipeline)?.runs.find(r => r.outcome === 'passed' && !r.pullRequest && r.branch === production.branch && /^[a-f0-9]{40}$/i.test(r.commit));
    if (!run) return;
    for (const t of tickets) {
        if (t.production?.checkedBuildId === run.id) continue;
        let contained: boolean;
        try { contained = await containedIn(read, azure, { commit: run.commit }, t.commit); }
        catch { continue; }
        if (contained) {
            const { note: _, checkedBuildId: __, ...kept } = t.production || {};
            t.production = { ...kept, buildId: run.id, deployedAt: run.finishedAt || store.clock.now().toISOString() };
            store.save();
            store.emit('production-deployed', `${t.key} is in production: ${production.pipeline} run ${run.id} passed on a commit that contains it. ${run.url}`, 'pm', t.key);
        }
        else { t.production = { ...t.production, checkedBuildId: run.id }; store.save(); }
    }
}
