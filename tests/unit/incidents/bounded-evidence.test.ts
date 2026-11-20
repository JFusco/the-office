import { expect, test } from 'vitest';
import { boundedEvidence } from '../../../server/incidents/bounded-evidence';

test('evidence is the first line, with secrets redacted', () => {
    expect(boundedEvidence(`token ghp_${'a'.repeat(30)} refused\nsecond line`)).toBe('token [redacted] refused');
});

test('evidence is bounded, and a value that is not text is no evidence', () => {
    expect(boundedEvidence('y'.repeat(900))).toHaveLength(301);
    expect(boundedEvidence('short', 3)).toBe('sho…');
    expect(boundedEvidence(null)).toBe('');
});
