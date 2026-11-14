import { expect, test } from 'vitest';
import { blockedSummary } from '../../../../src/health/blocked-summary';

const causes = { 'needs-decision': 17, interrupted: 0, unconfirmed: 1, dependency: 0, paused: 0, failed: 11 };

test('names each non-zero cause, history last', () => {
    expect(blockedSummary({ blocked: 29, blockedCauses: causes })).toBe('29 stopped: 17 need a decision · 1 unconfirmed · 11 failed (history)');
    expect(blockedSummary({ blocked: 1, blockedCauses: { ...causes, 'needs-decision': 1, unconfirmed: 0, failed: 0 } })).toBe('1 stopped: 1 needs a decision');
});

test('an older service without the split, or nothing stopped, still reads plainly', () => {
    expect(blockedSummary({ blocked: 4 })).toBe('4 stopped');
    expect(blockedSummary({ blocked: 0, blockedCauses: causes })).toBe('0 stopped');
});
