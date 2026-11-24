import { expect, test } from 'vitest';
import { boundedEvidence } from '../../../server/incidents/bounded-evidence';
import { normalizeCause } from '../../../server/incidents/normalize-cause';
import { redactEvidence } from '../../../server/incidents/redact-evidence';

const SECRETS = [`github_pat_${'A1b2'.repeat(10)}_${'z9'.repeat(20)}`, `ghp_${'a'.repeat(36)}`, `ghs_${'b'.repeat(36)}`, `xoxb-1234567890-0987654321-${'c'.repeat(24)}`, `xoxp-1-2-${'d'.repeat(16)}`, 'AKIAIOSFODNN7EXAMPLE', `eyJhbGciOiJIUzI1NiJ9.${'e'.repeat(20)}.${'f'.repeat(20)}`];

test('provider tokens the office-wide redaction does not cover are removed, standing alone or inside a sentence', () => {
    for (const secret of SECRETS) {
        expect(redactEvidence(secret)).toBe('[redacted]');
        expect(redactEvidence(`push failed using ${secret}; retrying`)).toBe('push failed using [redacted]; retrying');
    }
});

test('credentials inside a URL are removed and the rest of the URL is kept', () => {
    expect(redactEvidence('clone https://joe:hunter2@github.com/a/b.git failed')).toBe('clone https://[redacted]@github.com/a/b.git failed');
});

test('what the office-wide redaction already covers still is, and ordinary text is untouched', () => {
    expect(redactEvidence('Authorization: Bearer abc.def.ghi')).not.toContain('abc.def');
    expect(redactEvidence('Worktree for GH-12 is missing head 4f2a9c1e')).toBe('Worktree for GH-12 is missing head 4f2a9c1e');
});

test('neither evidence nor normalized cause text keeps a token', () => {
    for (const secret of SECRETS) {
        expect(boundedEvidence(`Error: refused ${secret}`)).not.toContain(secret);
        expect(normalizeCause(`Error: refused ${secret}`)).not.toContain(secret.toLowerCase());
    }
});

test('the value of a credential property is removed whatever it looks like, in pasted JSON or key-value text', () => {
    expect(redactEvidence('response {"access_token":"opaque-value-123","scope":"repo","expires_in":3600}')).toBe('response {"access_token":"[redacted]","scope":"repo","expires_in":3600}');
    expect(redactEvidence(`{'refresh_token' : 'r-1', "client_secret": "s 2", "token":"t3", "apiKey":"k4", "password":"p5"}`)).toBe(`{'refresh_token' : '[redacted]', "client_secret": "[redacted]", "token":"[redacted]", "apiKey":"[redacted]", "password":"[redacted]"}`);
    expect(redactEvidence('retry with access_token=opaque-1 then refresh_token: opaque-2, done')).toBe('retry with access_token=[redacted] then refresh_token: [redacted], done');
    // Redacting twice changes nothing, and names that only resemble a credential are left alone.
    const once = redactEvidence('{"access_token":"opaque"} access_token=opaque');
    expect(redactEvidence(once)).toBe(once);
    expect(redactEvidence('{"tokens_used": "1200", "kind":"token-limit"} the token budget ran out')).toBe('{"tokens_used": "1200", "kind":"token-limit"} the token budget ran out');
});

test('only an unescaped matching quote ends a quoted credential', () => {
    expect(redactEvidence(String.raw`{"password":"pa'ss","token":"a\"b"}`)).toBe('{"password":"[redacted]","token":"[redacted]"}');
});

test('quoted and bare assignments and cookie properties preserve surrounding text', () => {
    const text = String.raw`before access_token="a\"b" token=fixture {"cookie":"session=fixture"} password='two words' after`;
    const redacted = redactEvidence(text);
    expect(redacted).toBe(`before access_token="[redacted]" token=[redacted] {"cookie":"[redacted]"} password='[redacted]' after`);
    expect(redactEvidence(redacted)).toBe(redacted);
    expect(redactEvidence('Cookie: name=fixture; token="fixture"; session=fixture')).toBe('Cookie: [redacted]');
});

/** The characters `JSON.stringify` writes as an escape: `\n`, `\t`, `\r`, `\b`, `\f` and `\u001b`. */
const ESCAPED = ['\n', '\t', '\r', '\b', '\f', '\u001b'];
const PREFIXED = [`sk-${'g'.repeat(40)}`, `github_pat_${'A1b2'.repeat(10)}_${'z9'.repeat(20)}`, ...['p', 'o', 'u', 's', 'r'].map(kind => `gh${kind}_${'h'.repeat(36)}`),
    ...['a', 'b', 'p', 'r', 's'].map(kind => `xox${kind}-1234567890-${'i'.repeat(24)}`), 'AKIAIOSFODNN7EXAMPLE', 'ASIAIOSFODNN7EXAMPLE',
    `eyJhbGciOiJIUzI1NiJ9.${'e'.repeat(20)}.${'f'.repeat(20)}`];
const jsonLine = (separator: string, tail: string) => JSON.stringify({ prior: `line${separator}${tail}` });

test.each(ESCAPED.map(separator => [JSON.stringify(separator), separator]))('a provider token right after a %s escape in JSON text is removed', (_, separator) => {
    for (const token of PREFIXED) expect(redactEvidence(jsonLine(separator, token))).toBe(jsonLine(separator, '[redacted]'));
    for (const word of ['ghost', 'gh-pages', 'task-runner', 'skip']) expect(redactEvidence(jsonLine(separator, word))).toBe(jsonLine(separator, word));
});
