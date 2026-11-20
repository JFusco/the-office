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
