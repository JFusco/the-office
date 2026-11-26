import { expect, test } from 'vitest';
import { GRAPHQL_WORK, quotaLow } from '../../../server/github/quota-governor';
import { heldBy, QuotaHeld, quotaCheck } from '../../../server/github/quota-hold';

const UNTIL = '2026-11-26T14:00:00.000Z';

test('a check raises the hold for the resources a read needs, GraphQL-dependent by default, on GitHub projects only', () => {
    const asked: unknown[] = [];
    const gate = { hold: (resources?: readonly string[]) => { asked.push(resources); return resources?.includes('graphql') ? { until: UNTIL } : undefined; } };
    const error = (() => { try { quotaCheck({ provider: 'github' }, gate)(); } catch (e) { return e; } })();
    expect(error).toBeInstanceOf(QuotaHeld);
    expect(heldBy(error)).toEqual({ until: UNTIL });
    expect((error as Error).message).toBe(quotaLow({ until: UNTIL }));
    expect(() => quotaCheck({ provider: 'github' }, gate, ['core'])()).not.toThrow();
    expect(() => quotaCheck({ provider: 'azure' }, gate)()).not.toThrow();
    expect(() => quotaCheck({ provider: 'github' })()).not.toThrow();
    expect(asked).toEqual([GRAPHQL_WORK, ['core']]);
});

test('only a recognized deferral carries a hold; any other failure is an error', () => {
    expect(heldBy(new Error(quotaLow({ until: UNTIL })))).toBeUndefined();
    expect(heldBy('held')).toBeUndefined();
    expect(heldBy(new QuotaHeld({ until: UNTIL }))).toEqual({ until: UNTIL });
});
