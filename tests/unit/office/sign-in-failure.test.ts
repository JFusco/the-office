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

test('provider token formats the office-wide redaction does not cover are removed, with the useful words kept', () => {
    const fine = 'github_pat_' + 'A1b2C3d4E5f6G7h8I9j0K1'.repeat(3);
    const kept = signInFailure(new Error(`gh exited 1: HTTP 401: Bad credentials for ${fine} at https://someone:hunter2@example.invalid/api {"access_token":"abc.def-123","error":"invalid_grant"} eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl`));
    expect(kept).toContain('HTTP 401: Bad credentials');
    expect(kept).toContain('invalid_grant');
    for (const secret of [fine, 'hunter2', 'abc.def-123', 'eyJhbGciOiJIUzI1NiJ9']) expect(kept, secret).not.toContain(secret);
    expect(kept).not.toMatch(/\n/);
});

test('a failure long enough to be a cut-off fragment is not quoted at all', () => {
    // The runner keeps the end of a long error: a credential there can have lost the start that marks it.
    expect(signInFailure(`gh exited 1: ${'x'.repeat(1500)}`)).toBe('');
    expect(signInFailure(`gh exited 1: ${'x'.repeat(1400)}`)).toHaveLength(400);
});
