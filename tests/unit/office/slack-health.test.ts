import { expect, test } from 'vitest';
import { slackHealth } from '../../../server/office/slack-health';
import type { OfficeSnapshot } from '../../../src/shared';

const now = Date.parse('2026-11-04T20:00:00Z');
const state = (deliveries: unknown[]) => [{ slackDeliveries: deliveries }] as OfficeSnapshot[];
test('Slack has no invented check timestamp or login request without delivery evidence', () => {
    expect(slackHealth(state([]), now)).toMatchObject({ status: 'unknown', checkedAt: '', statusLabel: 'No delivery evidence' });
    expect(slackHealth(state([]), now).nextStep).toBeUndefined();
});
test('confirmed activity uses the receipt timestamp and ages into historical evidence', () => {
    const snapshots = state([{ status: 'confirmed', updatedAt: '2026-11-04T00:24:41.687Z' }]);
    expect(slackHealth(snapshots, now)).toMatchObject({ status: 'connected', statusLabel: 'Delivery verified', checkedAt: '2026-11-04T00:24:41.687Z' });
    expect(slackHealth(snapshots, now + 86400000)).toMatchObject({ status: 'unknown', statusLabel: 'Previously working', checkedAt: '2026-11-04T00:24:41.687Z' });
});
test('newer uncertain delivery is visible and never becomes a login failure; older failures stay historical', () => {
    const snapshots = state([{ status: 'confirmed', updatedAt: '2026-11-04T19:00:00Z' }, { status: 'uncertain', updatedAt: '2026-11-04T19:30:00Z' }]);
    expect(slackHealth(snapshots, now)).toMatchObject({ status: 'warning', statusLabel: 'Delivery needs readback' });
    snapshots[0].slackDeliveries!.push({ status: 'confirmed', updatedAt: '2026-11-04T19:45:00Z' } as any);
    expect(slackHealth(snapshots, now).status).toBe('connected');
});
