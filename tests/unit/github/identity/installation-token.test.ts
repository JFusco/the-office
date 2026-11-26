import { createVerify, generateKeyPairSync } from 'node:crypto';
import { expect, test } from 'vitest';
import { appJwt, signingKey } from '../../../../server/github/identity/app-jwt';
import { API_VERSION, InstallationTokens, REFRESH_BEFORE_MS, type HttpsTransport } from '../../../../server/github/identity/installation-token';
import { CredentialUnavailable } from '../../../../server/github/identity/write-refusals';

// Generated per run: nothing secret is committed.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const NOW = Date.parse('2026-11-26T12:00:00.000Z');
const decode = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
const synthetic = (n: number) => `ghs_${String(n).padStart(4, '0')}SyntheticInstallationToken`;

test('the App JWT is RS256, issued by the App id, backdated 60 seconds and expiring nine minutes ahead', () => {
    const jwt = appJwt(5932019, signingKey(privateKey), new Date(NOW));
    const [header, claims, signature] = jwt.split('.');
    expect(decode(header)).toEqual({ alg: 'RS256', typ: 'JWT' });
    expect(decode(claims)).toEqual({ iat: NOW / 1000 - 60, exp: NOW / 1000 + 540, iss: '5932019' });
    expect(createVerify('RSA-SHA256').update(`${header}.${claims}`).verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);
});

test('a key that is not an RSA private key is refused without repeating it', () => {
    const ec = generateKeyPairSync('ec', { namedCurve: 'P-256', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } }).privateKey;
    expect(() => signingKey(ec)).toThrow('not an RSA private key');
    expect(() => signingKey('-----BEGIN PRIVATE KEY-----\nnot-a-key\n-----END PRIVATE KEY-----')).toThrow(/^The App signing key could not be parsed$/);
});

function issuer(answer: (body: any, now: number) => { status: number; body: unknown }) {
    let now = NOW, keyReads = 0;
    const requests: Parameters<HttpsTransport>[0][] = [];
    const transport: HttpsTransport = async request => { requests.push(request); const { status, body } = answer(JSON.parse(request.body), now); return { status, body: typeof body === 'string' ? body : JSON.stringify(body) }; };
    const tokens = new InstallationTokens(5932019, { read: async () => { keyReads++; return privateKey; } }, transport, () => now);
    return { tokens, requests, advance: (ms: number) => { now += ms; }, keyReads: () => keyReads };
}
const grant = (body: any, change: Record<string, unknown> = {}, n = 1, now = NOW) => ({ status: 201, body: {
    token: synthetic(n), expires_at: new Date(now + 3_600_000).toISOString(), permissions: { ...body.permissions, metadata: 'read' },
    repository_selection: 'selected', repositories: [{ id: body.repository_ids[0], full_name: 'JFusco/the-office' }], ...change } });
const request = { installationId: 186014638, repositoryId: 42, permissions: { issues: 'write' as const } };

test('the exchange asks for exactly one repository id and the operation permission subset, signed by the App JWT', async () => {
    const f = issuer(body => grant(body));
    expect(f.keyReads()).toBe(0);
    const token = await f.tokens.token(request);
    expect(token).toMatchObject({ token: synthetic(1), repositoryId: 42, installationId: 186014638, permissions: { issues: 'write' } });
    const [sent] = f.requests;
    expect(sent.url).toBe('https://api.github.com/app/installations/186014638/access_tokens');
    expect(JSON.parse(sent.body)).toEqual({ repository_ids: [42], permissions: { issues: 'write' } });
    expect(sent.headers['x-github-api-version']).toBe(API_VERSION);
    const jwt = sent.headers.authorization.replace(/^Bearer /, '');
    expect(decode(jwt.split('.')[1]).iss).toBe('5932019');
    expect(f.tokens.counters).toEqual({ exchanges: 1, failures: 0, cached: 0 });
});

test.each([
    ['an omitted repository restriction', (body: any) => grant(body, { repository_selection: 'all', repositories: undefined })],
    ['an extra repository', (body: any) => grant(body, { repositories: [{ id: 42 }, { id: 43 }] })],
    ['another repository', (body: any) => grant(body, { repositories: [{ id: 43 }] })],
    ['an excess grant', (body: any) => grant(body, { permissions: { issues: 'write', contents: 'write', metadata: 'read' } })],
    ['a missing Metadata read', (body: any) => grant(body, { permissions: { issues: 'write' } })],
    ['a lower grant', (body: any) => grant(body, { permissions: { issues: 'read', metadata: 'read' } })],
    ['an expiry too soon to use', (body: any) => grant(body, { expires_at: new Date(NOW + REFRESH_BEFORE_MS - 1000).toISOString() })],
    ['an empty token', (body: any) => grant(body, { token: '' })],
    ['a refused exchange', () => ({ status: 403, body: { message: 'Resource not accessible by integration', token: synthetic(9) } })],
    ['an answer that is not JSON', () => ({ status: 201, body: `not json ${synthetic(9)}` })],
])('%s is refused before use, and the refusal never carries the answer', async (_, answer) => {
    const f = issuer(answer);
    const refusal = await f.tokens.token(request).catch(error => error);
    expect(refusal).toBeInstanceOf(CredentialUnavailable);
    expect(refusal.message).not.toMatch(/ghs_|Synthetic|Resource not accessible/);
    expect(f.tokens.counters.failures).toBe(1);
});

test('tokens are cached by installation, repository and normalized permissions; concurrent refreshes share one exchange', async () => {
    let n = 0;
    const f = issuer((body, now) => grant(body, {}, ++n, now));
    const [a, b] = await Promise.all([f.tokens.token(request), f.tokens.token({ ...request, permissions: { metadata: 'read', issues: 'write' } })]);
    expect(a).toBe(b);
    expect(f.requests).toHaveLength(1);
    const other = await f.tokens.token({ ...request, repositoryId: 43 });
    const wider = await f.tokens.token({ ...request, permissions: { issues: 'write', pull_requests: 'write' } as never });
    expect(new Set([a.token, other.token, wider.token]).size).toBe(3);
    expect(f.keyReads()).toBe(1);
    expect(await f.tokens.token(request)).toBe(a);
    // Five minutes before expiry the cached token is replaced, not handed out.
    f.advance(3_600_000 - REFRESH_BEFORE_MS + 1);
    const refreshed = await f.tokens.token(request);
    expect(refreshed.token).not.toBe(a.token);
    expect(f.tokens.counters.cached).toBe(1);
});

test('a failed refresh is unavailable, keeps nothing stale and is tried again later', async () => {
    let fail = false;
    const f = issuer((body, now) => fail ? { status: 502, body: 'bad gateway' } : grant(body, {}, 1, now));
    await f.tokens.token(request);
    f.advance(3_600_000);
    fail = true;
    await expect(f.tokens.token(request)).rejects.toBeInstanceOf(CredentialUnavailable);
    fail = false;
    await expect(f.tokens.token(request)).resolves.toMatchObject({ token: synthetic(1) });
    expect(f.requests).toHaveLength(3);
});

test('an unreadable key is unavailable, read lazily and read again on the next request', async () => {
    let reads = 0;
    const tokens = new InstallationTokens(1, { read: async () => { reads++; throw new Error('The App signing key is not available in the Keychain (service s): security exited 44'); } }, async () => { throw new Error('unreachable'); }, () => NOW);
    expect(reads).toBe(0);
    await expect(tokens.token(request)).rejects.toThrow('security exited 44');
    await expect(tokens.token(request)).rejects.toBeInstanceOf(CredentialUnavailable);
    expect(reads).toBe(2);
});
