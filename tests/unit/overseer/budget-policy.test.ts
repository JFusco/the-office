import { expect, test } from 'vitest';
import { BILLING_MODE, budgetRequest, diffWithinCap, parseCeiling, reservationFor, ROUND_LIMITS, STAGES, stagePolicy, timeoutsValid } from '../../../server/overseer/budget-policy';

test('every stage maps to its priced allocation, round counter and timeouts, and reserves 150% of the allocation', () => {
    const rows = Object.entries(STAGES).map(([stage, policy]) => [stage, policy.allocation, reservationFor(policy.allocation), policy.counter, ROUND_LIMITS[policy.counter], policy.totalTimeoutMs / 60_000, policy.inactivityTimeoutMs / 60_000]);
    expect(rows).toEqual([
        ['research', 'triage', 3_000_000, 'triage', 2, 15, 5],
        ['triage', 'triage', 3_000_000, 'triage', 2, 15, 5],
        ['second-opinion', 'triage', 3_000_000, 'second-opinion', 1, 15, 5],
        ['plan', 'review', 4_500_000, 'fix', 2, 20, 5],
        ['plan-review', 'review', 4_500_000, 'fix', 2, 20, 5],
        ['fix', 'fix', 22_500_000, 'fix', 2, 60, 10],
        ['review', 'review', 4_500_000, 'review-repair', 2, 20, 5],
        ['repair', 'fix', 22_500_000, 'review-repair', 2, 60, 10],
    ]);
    expect(rows.every(row => Number.isSafeInteger(row[2]))).toBe(true);
    expect(stagePolicy('deploy')).toBeNull();
    expect(stagePolicy('toString')).toBeNull();
    expect(budgetRequest('inc-0000000000000001', 'fix', 2)).toEqual({ incident: 'inc-0000000000000001', stage: 'fix', round: 2, totalTimeoutMs: 3_600_000, inactivityTimeoutMs: 600_000 });
});

test('timeouts must be finite integer milliseconds with 1 000 <= inactivity <= total <= 7 200 000', () => {
    expect(timeoutsValid(1_000, 1_000)).toBe(true);
    expect(timeoutsValid(7_200_000, 7_200_000)).toBe(true);
    expect(timeoutsValid(7_200_000, 1_000)).toBe(true);
    for (const [total, inactivity] of [[undefined, 1_000], [1_000, undefined], [7_200_001, 1_000], [1_000, 999], [999, 999], [1_000, 2_000], [1_500.5, 1_000], [Infinity, 1_000], [Number.NaN, 1_000], [-5_000, -5_000], [0, 0], ['60000', '1000']])
        expect(timeoutsValid(total, inactivity), `${total}/${inactivity}`).toBe(false);
});

test('the ceiling file is a strict version 1 record of an integer from 1 to 1 000 000 000', () => {
    expect(parseCeiling(JSON.stringify({ version: 1, dailyCeilingMicroUsd: 50_000_000 }))).toBe(50_000_000);
    expect(parseCeiling(JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1 }))).toBe(1);
    expect(parseCeiling(JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1_000_000_000 }))).toBe(1_000_000_000);
    for (const text of ['{', '[]', 'null', JSON.stringify({ version: 2, dailyCeilingMicroUsd: 5 }), JSON.stringify({ version: 1, dailyCeilingMicroUsd: 0 }), JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1_000_000_001 }),
        JSON.stringify({ version: 1, dailyCeilingMicroUsd: 1.5 }), JSON.stringify({ version: 1, dailyCeilingMicroUsd: '100' }), JSON.stringify({ version: 1 }), JSON.stringify({ version: 1, dailyCeilingMicroUsd: 5, extra: 1 })])
        expect(parseCeiling(text), text).toBeNull();
});

test('the diff cap allows 15 files and 600 changed lines, and refuses either bound passed', () => {
    expect(diffWithinCap({ files: 15, changedLines: 600 })).toBe(true);
    expect(diffWithinCap({ files: 0, changedLines: 0 })).toBe(true);
    expect(diffWithinCap({ files: 16, changedLines: 1 })).toBe(false);
    expect(diffWithinCap({ files: 1, changedLines: 601 })).toBe(false);
    expect(diffWithinCap({ files: -1, changedLines: 10 })).toBe(false);
    expect(diffWithinCap({ files: 2.5, changedLines: 10 })).toBe(false);
});

test('the billing record states the subscription logins and the account backstop as not configured', () => {
    expect(BILLING_MODE).toMatchObject({
        mode: 'subscription-logins', providers: ['claude', 'codex'], dedicatedApiKeys: false, sharedUsageLimits: true,
        accountBackstop: { status: 'not-configured', availability: 'not-verified' }, claudeMaxBudgetUsd: 'not-applied',
    });
});
