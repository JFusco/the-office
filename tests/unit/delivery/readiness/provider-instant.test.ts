import { expect, test } from 'vitest';
import { sameProviderInstant } from '../../../../server/delivery/readiness/provider-instant';

test('accepts the one-second created_at skew GitHub reports across endpoints, nothing larger', () => {
    expect(sameProviderInstant('2026-10-31T08:57:16Z', '2026-10-31T08:57:15Z')).toBe(true);
    expect(sameProviderInstant('2026-10-31T08:57:16Z', '2026-10-31T08:57:16Z')).toBe(true);
    expect(sameProviderInstant('2026-10-31T08:57:16Z', '2026-10-31T08:57:12Z')).toBe(false);
    expect(sameProviderInstant('2026-10-31T08:57:16Z', undefined)).toBe(false);
    expect(sameProviderInstant('not a time', '2026-10-31T08:57:16Z')).toBe(false);
});
