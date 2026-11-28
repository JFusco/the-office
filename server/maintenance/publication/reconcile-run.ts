import { captureMaintenanceStep } from '../../knowledge/maintenance-learning';
import { harnessOnlyStop, reconcilePublication, runEffects, versionedMaintenanceRun } from './reconcile-publication';
import { assertReconcileAuthority } from './reconcile-authority';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { MaintenanceResult, MaintenanceRun } from '../../../src/shared';

/**
 * The #612 part of `GitHubMaintenance.reconcile`: a versioned run's publication writes are read back from their
 * own saved payloads and writers first, only under a running scheduler claim bound to this run
 * (`reconcile-authority.ts`), rechecked before anything is saved. An incomplete read keeps the run stopped; a stop
 * the harness made with no worker execution in doubt is then settled from those Effects, with its unfinished work in
 * the ledger. Returns the run when it handled it, or undefined to continue with the native read-back.
 */
export async function reconcileVersionedRun(store: Store, run: MaintenanceRun, execute: typeof command): Promise<MaintenanceRun | undefined> {
    if (!versionedMaintenanceRun(run)) return undefined;
    assertReconcileAuthority(store, run.id);
    const settled = await reconcilePublication(store, run, execute, () => assertReconcileAuthority(store, run.id));
    assertReconcileAuthority(store, run.id);
    if (!settled.settled) {
        run.error = `Publication read-back is incomplete: ${settled.remaining.join('; ')}`;
        store.emit('maintenance-blocked', run.error, 'pm');
        store.save();
        return run;
    }
    if (!harnessOnlyStop(store, run)) return undefined;
    const effects = runEffects(store, run.id).filter(effect => effect.dispatchedAt || effect.status === 'verified');
    const result: MaintenanceResult = { outcome: 'passed', summary: 'Harness-only stop settled from the run\'s own Effects; no worker execution was in doubt.', ledger: '', blocker: '', candidates: [],
        receipts: effects.map(effect => ({ id: effect.id, action: effect.operation, target: effect.target, verified: effect.status === 'verified', uncertain: false, detail: JSON.stringify(effect.receipt) })) };
    run.steps.push({ role: 'pm', stage: 'maintenance-readback', result, at: new Date().toISOString() });
    captureMaintenanceStep(store, run, result, 'original effects reconciled; unfinished work remains', true);
    const ledger = store.state.maintenance!.ledger.trimEnd();
    store.state.maintenance!.ledger = `${ledger}${ledger ? '\n' : ''}UNFINISHED MAINTENANCE ${run.id} (stopped at ${run.stage}, publication writes settled by read-back): ${run.error}`;
    run.status = 'reconciled';
    run.error = '';
    store.emit('maintenance-reconciled', 'Original publication effects read back. Unfinished maintenance remains in the ledger; a new deliberate run can continue from current evidence.', 'pm');
    store.save();
    return run;
}
