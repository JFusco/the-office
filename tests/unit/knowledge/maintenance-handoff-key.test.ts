import { expect, test } from 'vitest';
import { adoptLegacyKey, maintenanceStopKey } from '../../../server/knowledge/maintenance-handoff-key';
import { learningDigest } from '../../../server/knowledge/learning-events';
import { knowledgeStore, maintenanceResult, maintenanceRun } from './knowledge-fixture';
import type { BlockerFollowup, MaintenanceRun } from '../../../src/shared';

const END = '2026-11-24T22:38:43.125Z';
/** An isolated store holding one stopped Brain run, as the maintenance pump leaves it. */
function stored() {
    const f = knowledgeStore('brain', '2026-11-24T22:38:44.000Z');
    const run = maintenanceRun({ id: 'm', status: 'blocked', stage: 'brain-maintenance', endedAt: END, error: 'Error: ownership-coverage-unavailable',
        steps: [{ role: 'pm', stage: 'brain-maintenance', at: '2026-11-24T22:38:42.732Z', result: maintenanceResult({ outcome: 'blocked', blocker: 'ownership-coverage-unavailable' }) }] });
    f.store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    return { f, run: () => f.store.state.maintenance!.runs[0] };
}

test('read-backs keep the stop key', () => {
    const { f, run } = stored();
    try {
        const key = `maintenance-stop:${learningDigest(['blocked', 'brain-maintenance', END])}`;
        expect(maintenanceStopKey(run())).toBe(key);
        run().error = 'The Office stage owner must resolve the ownership-coverage prerequisite.';
        expect(maintenanceStopKey(run())).toBe(key);
        run().steps.push({ role: 'pm', stage: 'maintenance-readback', at: '2026-11-24T23:10:45.301Z', result: maintenanceResult({ outcome: 'blocked', blocker: 'Assignment-scoped ownership is unverified.' }) });
        expect(maintenanceStopKey(run())).toBe(key);
    } finally { f.close(); }
});

// Synthetic inputs: a stopped run is never pumped again, so these isolate the key function.
test.each([['status', { status: 'interrupted' }], ['stage', { stage: 'follow-up' }], ['endedAt', { endedAt: '2026-11-24T22:38:44.000Z' }]] as const)('each stop field changes the key (%s)', (_field, change: Partial<MaintenanceRun>) => {
    const { f, run } = stored();
    try {
        const before = maintenanceStopKey(run());
        Object.assign(run(), change);
        expect(maintenanceStopKey(run())).not.toBe(before);
    } finally { f.close(); }
});

test('a key saved before stop keys is read as the stop; a stop key or no key is left as it is', () => {
    const { f, run } = stored();
    try {
        const key = maintenanceStopKey(run()), other = maintenanceStopKey({ ...run(), endedAt: '2026-11-25T01:00:00.000Z' });
        const followups = f.store.state.knowledge!.followups ??= [];
        const item = (handoffMaterialKey?: string) => { const entry = { id: 'maintenance:m', handoffMaterialKey } as BlockerFollowup; followups.push(entry); return entry; };
        // The earlier derivation: a bare digest of the follow-up's text, whatever that text was.
        const legacy = item(learningDigest(['action', 'Error: ownership-coverage-unavailable'])), current = item(key), stop = item(other), none = item();
        for (const entry of followups) adoptLegacyKey(entry, key);
        expect(legacy.handoffMaterialKey).toBe(key);
        expect(current.handoffMaterialKey).toBe(key);
        expect(stop.handoffMaterialKey).toBe(other);
        expect(none.handoffMaterialKey).toBeUndefined();
    } finally { f.close(); }
});
