import { expect, test } from 'vitest';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { signInFailure } from '../../../server/office/sign-in-failure';
import { workerFailure, type command } from '../../../server/workers/process';
import type { OfficeSnapshot } from '../../../src/shared';

const state = () => ({ project: { id: 'brain', name: 'Brain' }, paused: false, coordination: { listener: { lastCheckedAt: new Date().toISOString(), error: '' } }, workLog: [], slackDeliveries: [] } as unknown as OfficeSnapshot);

async function checkedService(id: string, execute: typeof command) {
    const { services } = await new ServiceHealthChecks(execute).report([state()]);
    return services.find(service => service.id === id)!;
}

test('a refused sign-in check keeps the provider\'s own error; a timeout keeps none', async () => {
    const chunks = ['Authentication failed. password="fixture, ', 'secret"\n\nYour OAuth session has expired.'];
    const checks = new ServiceHealthChecks(async (program, _args, options) => {
        if (program !== 'twg') throw new Error('command timed out');
        for (const chunk of chunks) options?.onOutput?.('stderr', chunk);
        throw new Error(workerFailure(program, 77, '', chunks.join('')));
    });
    const { services } = await checks.report([state()]);
    const atlassian = services.find(service => service.id === 'atlassian')!, github = services.find(service => service.id === 'github')!;
    expect(atlassian).toMatchObject({
        status: 'disconnected',
        detail: 'The Office process could not authenticate.',
        failure: 'Authentication failed. password="[redacted]" Your OAuth session has expired.',
    });
    expect(github.status).toBe('unknown');
    expect(github).not.toHaveProperty('failure');
});

test('an error a tool prints on stdout is kept when nothing came on stderr', async () => {
    // twg reports a refused sign-in as a JSON error event; the runner puts its message in the thrown error.
    const event = JSON.stringify({ type: 'error', message: 'GraphQL request failed: 401 Your OAuth session has expired.' });
    const atlassian = await checkedService('atlassian', async program => {
        if (program !== 'twg') throw new Error('command timed out');
        throw new Error(workerFailure(program, 1, `${event}\n`, ''));
    });
    expect(atlassian).toMatchObject({ status: 'disconnected', failure: 'Error: twg exited 1: GraphQL request failed: 401 Your OAuth session has expired.' });
});
test('oversized stderr is omitted even when the runner shortens the thrown error below the limit', async () => {
    const chunks = ['x'.repeat(1000), '\nBearer ' + 'x'.repeat(1400), '\nAuthentication failed.'];
    const stderr = chunks.join('');
    const error = workerFailure('twg', 77, '', stderr);
    expect(stderr.length).toBeGreaterThan(2000);
    expect(error.length).toBeLessThan(1500);

    const atlassian = await checkedService('atlassian', async (program, _args, options) => {
        if (program !== 'twg') throw new Error('command timed out');
        for (const chunk of chunks) options?.onOutput?.('stderr', chunk);
        throw new Error(error);
    });
    expect(atlassian.status).toBe('disconnected');
    expect(atlassian).not.toHaveProperty('failure');
});

async function githubService(hosts: object, stderr = '') {
    return checkedService('github', async (program, _args, options) => {
        if (program !== 'gh') throw new Error('command timed out');
        options?.onOutput?.('stderr', stderr);
        return JSON.stringify({ hosts });
    });
}

test('an active GitHub host with a 401 keeps its redacted diagnostic', async () => {
    const github = await githubService({ 'github.com': [
        { active: false, state: 'error', error: 'HTTP 401: Other account' },
        { active: true, state: 'error', error: 'HTTP 401: Bad credentials. token="fixture, secret"' },
    ] });
    expect(github).toMatchObject({ status: 'disconnected', failure: 'HTTP 401: Bad credentials. token="[redacted]"' });
});

test('GitHub sign-out stderr is kept when there is no active host', async () => {
    const github = await githubService({}, 'You are not logged into any GitHub hosts.\nToken: "fixture, secret"');
    expect(github).toMatchObject({ status: 'disconnected', failure: 'You are not logged into any GitHub hosts. Token: "[redacted]"' });
});

test('a successful GitHub host omits diagnostics', async () => {
    const github = await githubService({ 'github.com': [
        { active: true, state: 'success', error: 'HTTP 401: Stale error' },
    ] }, 'You are not logged into any GitHub hosts.');
    expect(github.status).toBe('connected');
    expect(github).not.toHaveProperty('failure');
});

test('the kept error is on one line, has no secrets and is at most 400 characters', () => {
    expect(signInFailure('401\n  Bearer   abc123\n')).toBe('401 Bearer [redacted]');
    expect(signInFailure('x'.repeat(900))).toHaveLength(400);
});

test('provider token formats the office-wide redaction does not cover are removed, with the useful words kept', () => {
    const fine = 'github_pat_' + 'A1b2C3d4E5f6G7h8I9j0K1'.repeat(3);
    const kept = signInFailure(`HTTP 401: Bad credentials for ${fine} at https://someone:hunter2@example.invalid/api {"access_token":"abc.def-123","error":"invalid_grant"} eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl`);
    expect(kept).toContain('HTTP 401: Bad credentials');
    expect(kept).toContain('invalid_grant');
    for (const secret of [fine, 'hunter2', 'abc.def-123', 'eyJhbGciOiJIUzI1NiJ9']) expect(kept, secret).not.toContain(secret);
    expect(kept).not.toMatch(/\n/);
});

test('oversized diagnostics are omitted at the original length limit', () => {
    expect(signInFailure('x'.repeat(1501))).toBe('');
    expect(signInFailure('x'.repeat(1500))).toHaveLength(400);
});
