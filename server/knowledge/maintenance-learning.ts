import type { Store } from '../store/store';
import type { MaintenanceRun, MaintenanceResult } from '../../src/shared';
import { captureLearning } from './learning-events';
/** Call only after the owning stage's receipts, candidate and verification gates. */
export function captureMaintenanceStep(store: Store, run: MaintenanceRun, result: MaintenanceResult, disposition = 'accepted', runEnded = false): void {
    const index = run.steps.findIndex(step => step.result === result);
    if (index < 0) throw new Error('Maintenance evidence must belong to the saved run');
    captureLearning(store, { kind: 'maintenance', id: run.id }, '', run.steps[index].stage, String(index), { disposition, ...result }, `${disposition}: ${result.summary}`, 'work', runEnded);
}
