import { expect, test } from 'vitest';
import { listenerHealth } from '../../../server/office/listener-health';
import type { OfficeSnapshot } from '../../../src/shared';
const now = Date.parse('2026-11-04T20:00:00Z');
const snapshot = () => ({ project: { id: 'cec', name: 'CEC' }, paused: false, coordination: { enabled: true, listener: { lastCheckedAt: '2026-11-04T19:59:00Z', error: '' }, requests: [] } }) as unknown as OfficeSnapshot;
test('successful CEC assignment evidence retains its own timestamp and expires', () => {
    const s = snapshot();
    expect(listenerHealth(s, now)).toMatchObject({ status: 'connected', checkedAt: s.coordination!.listener.lastCheckedAt, checkedLabel: 'Last successful assignment check' });
    expect(listenerHealth(s, now + 150000)).toMatchObject({ status: 'unknown', statusLabel: 'Check overdue' });
});
test('paused or disabled projects are not described as overdue even with old failures', () => {
    const s = snapshot(); s.coordination!.listener.error = 'old failure'; s.paused = true;
    expect(listenerHealth(s, now)).toMatchObject({ status: 'unknown', statusLabel: 'Paused' });
    s.paused = false; s.coordination!.enabled = false;
    expect(listenerHealth(s, now)?.statusLabel).toBe('Not enabled');
});
test('pending scheduler checks are explicit and missing history never gets the report timestamp', () => {
    const s = snapshot(); s.coordination!.listener.lastCheckedAt = '';
    s.coordination!.requests = [{ action: 'poll', status: 'queued' }] as any;
    expect(listenerHealth(s, now)).toMatchObject({ statusLabel: 'Check queued', checkedAt: '' });
    s.coordination!.requests![0].status = 'working';
    expect(listenerHealth(s, now)?.statusLabel).toBe('Checking assignments');
    s.coordination!.listener.error = 'read failed';
    expect(listenerHealth(s, now)?.statusLabel).toBe('Check failed');
});
