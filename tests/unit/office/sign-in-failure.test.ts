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

const quotedPasswordChunks = ['Authentication failed. password="fixture, ', 'secret"\n\nYour OAuth session has expired.'];
const stdoutEvent = (message: string) => JSON.stringify({ type: 'error', message }) + '\n';

function checkedStdoutFailure(stdout: string, chunks = [stdout]) {
    return checkedService('atlassian', async (program, _args, options) => {
        if (program !== 'twg') throw new Error('command timed out');
        for (const chunk of chunks) options?.onOutput?.('stdout', chunk);
        throw new Error(workerFailure(program, 1, stdout, ''));
    });
}

test('a refused sign-in check keeps the provider\'s own error; a timeout keeps none', async () => {
    const checks = new ServiceHealthChecks(async (program, _args, options) => {
        if (program !== 'twg') throw new Error('command timed out');
        for (const chunk of quotedPasswordChunks) options?.onOutput?.('stderr', chunk);
        throw new Error(workerFailure(program, 77, '', quotedPasswordChunks.join('')));
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
    const atlassian = await checkedStdoutFailure(stdoutEvent('GraphQL request failed: 401 Your OAuth session has expired.'));
    expect(atlassian).toMatchObject({ status: 'disconnected', failure: 'Error: twg exited 1: GraphQL request failed: 401 Your OAuth session has expired.' });
});

test('a stdout sign-in error redacts the complete quoted password before displaying the reason', async () => {
    const event = stdoutEvent(quotedPasswordChunks.join(''));
    const split = event.indexOf('secret');
    const atlassian = await checkedStdoutFailure(event, [event.slice(0, split), event.slice(split)]);
    expect(atlassian).toMatchObject({
        status: 'disconnected',
        failure: 'Error: twg exited 1: Authentication failed. password="[redacted]" Your OAuth session has expired.',
    });
});

test('an oversized decoded stdout error is omitted even when the runner shortens it below the limit', async () => {
    const message = `401 Your OAuth session has expired. Bearer ${'x'.repeat(1500)}`;
    const event = stdoutEvent(JSON.stringify({ error: { message } }));
    expect(message.length).toBeGreaterThan(1500);
    expect(workerFailure('twg', 1, event, '').length).toBeLessThan(1500);

    const atlassian = await checkedStdoutFailure(event);
    expect(atlassian.status).toBe('disconnected');
    expect(atlassian).not.toHaveProperty('failure');
});

test('a runner error with an incomplete stdout event omits the diagnostic', async () => {
    const event = stdoutEvent(quotedPasswordChunks.join(''));
    const atlassian = await checkedStdoutFailure(event, [event.slice(0, -2)]);
    expect(atlassian.status).toBe('disconnected');
    expect(atlassian).not.toHaveProperty('failure');
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

const RATE_LIMITED = { status: 'unknown', identity: 'fixture', detail: 'A GitHub API rate limit blocked this check. The Office could not verify sign-in.', nextStep: 'Ellis will check again automatically.' };
const GITHUB_SIGN_IN = 'Check gh auth status in your terminal. Confirm repo and project scopes for the intended account.';

test.each([
    ['the primary limit', 'HTTP 403: API rate limit exceeded for user ID 486049. If you reach out to GitHub Support for help, please include the request ID C8B2:369A92 and timestamp 2026-11-24 13:36:36 UTC.'],
    ['a secondary limit', 'HTTP 429: You have exceeded a secondary rate limit. Please wait a few minutes before you try again.'],
    ['an unprefixed secondary limit', 'You have exceeded a secondary rate limit and have been temporarily blocked from content creation.'],
    ['a limit reached', 'HTTP 429: Rate limit reached'],
])('an active GitHub host refused by %s is unverified, not signed out', async (_name, error) => {
    const github = await githubService({ 'github.com': [{ active: true, state: 'error', login: 'fixture', error }] });
    expect(github).toMatchObject(RATE_LIMITED);
    expect(github).not.toHaveProperty('failure');
    expect(github.nextStep).not.toMatch(/gh auth|scopes/);
});

test('a credential failure that mentions rate limits, or a permission refusal that mentions quota, is still a sign-out', async () => {
    const credential = await githubService({ 'github.com': [
        { active: true, state: 'error', login: 'fixture', error: 'HTTP 401: Bad credentials. If you see API rate limit exceeded, wait for the hour to reset.' },
    ] });
    expect(credential).toMatchObject({ status: 'disconnected', failure: 'HTTP 401: Bad credentials. If you see API rate limit exceeded, wait for the hour to reset.', nextStep: GITHUB_SIGN_IN });
    const permission = await githubService({ 'github.com': [
        { active: true, state: 'error', login: 'fixture', error: 'HTTP 403: Resource not accessible by integration. Your quota resets hourly.' },
    ] });
    expect(permission).toMatchObject({ status: 'disconnected', nextStep: GITHUB_SIGN_IN });
    expect(permission.detail).not.toContain('rate limit');
    const signedOut = await githubService({}, 'You are not logged into any GitHub hosts.');
    expect(signedOut).toMatchObject({ status: 'disconnected', nextStep: GITHUB_SIGN_IN });
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
