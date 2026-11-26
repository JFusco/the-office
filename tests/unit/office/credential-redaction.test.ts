import { generateKeyPairSync } from 'node:crypto';
import { expect, test } from 'vitest';
import { redactedText, sanitize, sanitizeObject } from '../../../server/office/security';
import { appJwt, signingKey } from '../../../server/github/identity/app-jwt';

// Generated per run: no committed key, token or JWT.
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 1024, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
const rsaKey = generateKeyPairSync('rsa', { modulusLength: 1024, privateKeyEncoding: { type: 'pkcs1', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } }).privateKey;
const jwt = appJwt(5932019, signingKey(privateKey), new Date('2026-11-26T12:00:00Z'));
/** The stateless installation-token shape: a `ghs_` prefix and dotted base64url segments. */
const stateless = `ghs_${'Abc123_-'.repeat(4)}.${'eyJ0eXAiOiJKV1QifQ'}.${'s1g-n_atur3'.repeat(3)}`;
const secrets = [stateless, jwt, privateKey.trim(), rsaKey.trim(), `github_pat_${'Synthetic0'.repeat(6)}`];

test.each(secrets.map(secret => [secret.slice(0, 15), secret]))('%s is redacted whole, in text and in serialized diagnostics', (_, secret) => {
    const text = sanitize(`push failed: ${secret} after`);
    expect(text).toMatch(/^push failed: \[(?:private key )?redacted\] after$/);
    const serialized = sanitize(JSON.stringify({ error: `child said ${secret}`, stderr: [secret] }));
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(serialized).not.toContain(secret.slice(4, 30));
    expect(redactedText({ deep: { value: secret } })).not.toContain(secret.slice(4, 30));
    expect(JSON.stringify(sanitizeObject({ receipt: secret }))).not.toContain(secret.slice(4, 30));
});

test('a truncated key block is redacted to its end and JSON text holding it stays JSON', () => {
    const truncated = privateKey.slice(0, 200);
    expect(sanitize(`stderr: ${truncated}`)).toBe('stderr: [private key redacted]');
    const json = sanitize(JSON.stringify({ stderr: truncated, next: 'kept' }));
    expect(JSON.parse(json)).toEqual({ stderr: '[private key redacted]', next: 'kept' });
});

test('the existing classic token and ordinary prose are unchanged', () => {
    expect(sanitize(`token ghp_${'a'.repeat(36)}.`)).toBe('token [redacted].');
    expect(sanitize('the ghs_ prefix names an installation token; eyJ alone is not one')).toBe('the ghs_ prefix names an installation token; eyJ alone is not one');
});
