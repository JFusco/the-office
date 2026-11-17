import { expect, test } from 'vitest';
import { deferredPickup } from '../../../src/work/pickup-state';

/** One assigned issue in `status`, no saved pickup setting, no job or pilot. */
const snapshot = (provider: 'azure' | 'github', status: string): any => ({
    project: { id: 'p', provider }, tickets: [],
    coordination: { jobs: [], listener: { assigned: [{ key: 'K-1', status, pickupStatus: status }], reviews: [] } },
});

test('without a supplied default the display fallback is unchanged', () => {
    expect(deferredPickup(snapshot('azure', 'To Do'), 'K-1')).toBe(false);
    expect(deferredPickup(snapshot('azure', 'Backlog'), 'K-1')).toBe(true);
    expect(deferredPickup(snapshot('github', 'Ready'), 'K-1')).toBe(false);
});

test('a server-resolved default decides deferral, and a saved pickup setting still wins', () => {
    expect(deferredPickup(snapshot('azure', 'Ready'), 'K-1', 'Ready')).toBe(false);
    expect(deferredPickup(snapshot('azure', 'To Do'), 'K-1', 'Ready')).toBe(true);
    const saved = snapshot('azure', 'Selected');
    saved.coordination.pickup = { enabled: true, status: 'Selected' };
    expect(deferredPickup(saved, 'K-1', 'Ready')).toBe(false);
    expect(deferredPickup(snapshot('azure', 'To Do'), '', 'Ready')).toBe(false);
});
