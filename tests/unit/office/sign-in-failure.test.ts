import { expect, test } from 'vitest';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { signInFailure } from '../../../server/office/sign-in-failure';
import type { OfficeSnapshot } from '../../../src/shared';

const state = () => ({ project: { id: 'brain', name: 'Brain' }, paused: false, coordination: { listener: { lastCheckedAt: new Date().toISOString(), error: '' } }, workLog: [], slackDeliveries: [] } as unknown as OfficeSnapshot);
const EXPIRED = 'twg exited 77: Error: Authentication failed.\n\nYour OAuth session has expired or been revoked. Run `twg login --force` to re-authenticate.';

test('a refused sign-in check keeps the provider\'s own error; a timeout keeps none', async () => {
    const checks = new ServiceHealthChecks((async (program: string) => { throw new Error(program === 'twg' ? EXPIRED : 'command timed out'); }) as never);
    const { services } = await checks.report([state()]);
    const atlassian = services.find(service => service.id === 'atlassian')!, github = services.find(service => service.id === 'github')!;
    expect(atlassian).toMatchObject({ status: 'disconnected', detail: 'The Office process could not authenticate.' });
    expect(atlassian.failure).toBe('Error: twg exited 77: Error: Authentication failed. Your OAuth session has expired or been revoked. Run `twg login --force` to re-authenticate.');
    expect(github.status).toBe('unknown');
    expect(github).not.toHaveProperty('failure');
});

test('the kept error is on one line, has no secrets and is at most 400 characters', () => {
    expect(signInFailure(new Error('gh exited 1:\n  401   Bearer abc123\n'))).toBe('Error: gh exited 1: 401 Bearer [redacted]');
    expect(signInFailure('x'.repeat(900))).toHaveLength(400);
});
