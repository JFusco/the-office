import { test, expect } from 'vitest';
import { captureMaintenanceStep } from '../../../server/knowledge/maintenance-learning';
import { knowledgeStore, maintenanceRun, maintenanceResult } from './knowledge-fixture';
test('maintenance evidence must be the exact owning saved result; partial observations stay partial', () => {
    const { store, close } = knowledgeStore('cms-field-vocabulary');
    try {
        const result = maintenanceResult(), run = maintenanceRun({ steps: [{ role: 'pm', stage: 'vendor-review', result, at: '' }] });
        expect(() => captureMaintenanceStep(store, run, { ...result })).toThrow('saved run');
        captureMaintenanceStep(store, run, result, 'partial observation');
        expect(store.state.knowledge!.pending[0].opportunities![0].summary).toContain('partial observation');
    } finally { close(); }
});
