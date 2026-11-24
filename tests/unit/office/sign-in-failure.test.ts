import { expect, test } from 'vitest';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { signInFailure } from '../../../server/office/sign-in-failure';
import { workerFailure, type command } from '../../../server/workers/process';
import type { OfficeSnapshot, ServiceHealth } from '../../../src/shared';
import { AZURE_SIGNED_OUT, CLAUDE_SIGNED_OUT, GITHUB_BAD_TOKEN, GITHUB_NO_ACCOUNT, READ_TIMED_OUT, type RecordedRun } from './signed-out-fixture';

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

/** Replays a recorded run for one program the way the runner reports it; every other check times out. */
function replay(target: string, run: RecordedRun): typeof command {
    return async (program, _args, options) => {
        if (program !== target) throw new Error('command timed out');
        if (run.stdout) options?.onOutput?.('stdout', run.stdout);
        if (run.stderr) options?.onOutput?.('stderr', run.stderr);
        if (run.code !== 0) throw new Error(workerFailure(program, run.code, run.stdout, run.stderr));
        return run.stdout;
    };
}

/** Not a sign-out: no quoted failure, and the next step leaves the credentials alone. */
function expectUnverified(service: ServiceHealth) {
    expect(service.status).toBe('unknown');
    expect(service).not.toHaveProperty('failure');
    expect(service.nextStep).toContain('No login change is indicated');
}

const hostsOf = (run: RecordedRun) => JSON.parse(run.stdout).hosts;
const nonOk = (status: string, message: string) => String.raw`non-200 OK status code: ${status} body: "{\"message\": \"${message}\"}"`;

test('Claude\'s recorded sign-out is read from its own status output, keeping only loggedIn and authMethod', async () => {
    const stdout = CLAUDE_SIGNED_OUT.stdout.replace('"loggedIn": false,', '"loggedIn": false,\n  "accessToken": "never-return-this",');
    const claude = await checkedService('anthropic', replay('claude', { ...CLAUDE_SIGNED_OUT, stdout }));
    expect(claude).toMatchObject({ status: 'disconnected', detail: 'Claude reports no active login in the Office environment.', failure: 'loggedIn: false, authMethod: none', nextStep: expect.stringContaining('/login') });
    for (const value of ['never-return-this', '/Users/office']) expect(JSON.stringify(claude), value).not.toContain(value);
});

test('a Claude sign-out by another method quotes only loggedIn', async () => {
    const claude = await checkedService('anthropic', replay('claude', { code: 1, stdout: '{"loggedIn": false, "authMethod": "fixture-method"}\n', stderr: '' }));
    expect(claude).toMatchObject({ status: 'disconnected', failure: 'loggedIn: false' });
});

test.each([
    ['an unrelated JSON object', { code: 1, stdout: '{"error": "Internal failure"}\n', stderr: '' }],
    ['a partial status document', { code: 1, stdout: CLAUDE_SIGNED_OUT.stdout.slice(0, 40), stderr: '' }],
    ['a signal exit after the sign-out', { code: null as unknown as number, stdout: CLAUDE_SIGNED_OUT.stdout, stderr: '' }],
    ['a connected status', { code: 1, stdout: '{"loggedIn": true, "email": "fixture@example.test"}\n', stderr: '' }],
])('a failed Claude check with %s is unverified', async (_name, run) => {
    expectUnverified(await checkedService('anthropic', replay('claude', run)));
});

test('Claude\'s complete sign-out output cut off by the runner deadline is a timeout, not a sign-out', async () => {
    const claude = await checkedService('anthropic', async (program, _args, options) => {
        if (program !== 'claude') throw new Error('command timed out');
        options?.onOutput?.('stdout', CLAUDE_SIGNED_OUT.stdout);
        throw new Error(READ_TIMED_OUT(program));
    });
    expectUnverified(claude);
    expect(claude.detail).toContain('timed out');
});

test('Claude\'s exit-zero status: true is connected, false is a sign-out, anything else is unverified', async () => {
    const status = (stdout: string) => checkedService('anthropic', replay('claude', { code: 0, stdout, stderr: '' }));
    expect(await status('{"loggedIn": true, "email": "fixture@example.test"}')).toMatchObject({ status: 'connected', identity: 'fixture@example.test' });
    expect(await status('{"loggedIn": false, "authMethod": "none"}')).toMatchObject({ status: 'disconnected', failure: 'loggedIn: false, authMethod: none' });
    for (const stdout of ['{"authMethod": "none"}', '{"loggedIn": "false"}']) expectUnverified(await status(stdout));
});

test('Azure DevOps\'s recorded sign-out reads as signed out, in its own words', async () => {
    const azure = await checkedService('azure', replay('az', AZURE_SIGNED_OUT));
    expect(azure).toMatchObject({
        status: 'disconnected',
        failure: 'ERROR: Before you can run Azure DevOps commands, you need to run the login command(az login if using AAD/MSA identity else az devops login if using PAT token) to setup credentials. Please see https://aka.ms/azure-devops-cli-auth for more information.',
        nextStep: expect.stringContaining('Azure DevOps access'),
    });
});

test('an Azure DevOps deadline or missing project is unverified, and the Azure wording signs no other service out', async () => {
    expectUnverified(await checkedService('azure', async program => { throw new Error(program === 'az' ? READ_TIMED_OUT(program) : 'command timed out'); }));
    expectUnverified(await checkedService('azure', replay('az', { code: 1, stdout: '', stderr: 'ERROR: TF200016: The following project does not exist: Fixture. Verify that the name of the project is correct and that the project exists on the specified Azure DevOps Server.\n' })));
    expectUnverified(await checkedService('atlassian', replay('twg', AZURE_SIGNED_OUT)));
});

test('GitHub\'s recorded sign-outs stay signed out, and a token beside the error never reaches the result', async () => {
    const [host] = hostsOf(GITHUB_BAD_TOKEN)['github.com'];
    const badToken = await githubService({ 'github.com': [{ ...host, token: 'never-return-this' }] });
    expect(badToken).toMatchObject({ status: 'disconnected', nextStep: GITHUB_SIGN_IN });
    expect(badToken.failure).toContain('401 Unauthorized');
    expect(badToken.failure).toContain('Bad credentials');
    expect(JSON.stringify(badToken)).not.toContain('never-return-this');
    const noAccount = await githubService(hostsOf(GITHUB_NO_ACCOUNT), GITHUB_NO_ACCOUNT.stderr);
    expect(noAccount).toMatchObject({ status: 'disconnected', failure: 'You are not logged into any GitHub hosts. To log in, run: gh auth login', nextStep: GITHUB_SIGN_IN });
    expect(await githubService({}, 'You are not logged into any accounts on github.com\n')).toMatchObject({ status: 'disconnected', nextStep: GITHUB_SIGN_IN });
});

test.each([
    ['a 401 without "Bad credentials"', nonOk('401 Unauthorized', 'Requires authentication')],
    ['a stated permission refusal', nonOk('403 Forbidden', 'Resource not accessible by integration')],
    ['a SAML refusal', nonOk('403 Forbidden', 'Resource protected by organization SAML enforcement.')],
])('GitHub refusing the account with %s is a sign-out', async (_name, error) => {
    const github = await githubService({ 'github.com': [{ active: true, state: 'error', login: 'fixture', error }] });
    expect(github).toMatchObject({ status: 'disconnected', nextStep: GITHUB_SIGN_IN });
});

test.each([
    ['a bare 403', nonOk('403 Forbidden', 'Forbidden')],
    ['a DNS failure', 'Get "https://api.github.com/": dial tcp: lookup api.github.com: no such host'],
    ['a 502', nonOk('502 Bad Gateway', 'Server Error')],
    ['an identity lookup past its deadline', 'Post "https://api.github.com/graphql": context deadline exceeded'],
])('a GitHub check that failed with %s is unverified', async (_name, error) => {
    const github = await githubService({ 'github.com': [{ active: true, state: 'error', login: 'fixture', error }] });
    expectUnverified(github);
    expect(github).toMatchObject({ identity: 'fixture', detail: 'GitHub could not complete the sign-in check. Login status is unverified.' });
});

test('a GitHub host that timed out is unverified and says so', async () => {
    const github = await githubService({ 'github.com': [{ active: true, state: 'timeout', login: 'fixture', error: 'Get "https://api.github.com/": context deadline exceeded (Client.Timeout exceeded while awaiting headers)' }] });
    expectUnverified(github);
    expect(github.detail).toContain('timed out');
});

test('no active GitHub host is a sign-out only when gh says no one is signed in', async () => {
    expectUnverified(await githubService({}));
    expectUnverified(await githubService({}, 'warning: an unrelated configuration notice\n'));
    expectUnverified(await checkedService('github', async program => { if (program !== 'gh') throw new Error('command timed out'); return '{}'; }));
});
