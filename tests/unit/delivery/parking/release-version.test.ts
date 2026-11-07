import { expect, test } from 'vitest';
import { highestStableAtLeast } from '../../../../server/delivery/parking/release-version';

test('only a stable version at or above the minimum qualifies, and the highest wins', () => {
    expect(highestStableAtLeast(['3.0.2', '3.1.0-beta.0', '3.1.0-beta.2'], '3.1.0')).toBe('');
    expect(highestStableAtLeast(['3.0.2', '3.1.0-beta.2', '3.1.0'], '3.1.0')).toBe('3.1.0');
    expect(highestStableAtLeast(['3.1.0', '3.10.1', '3.2.0', '4.0.0-rc.1'], '3.1.0')).toBe('3.10.1');
    expect(highestStableAtLeast(['2.9.9', '3.0.9'], '3.1.0')).toBe('');
    expect(highestStableAtLeast(['3.1.0+build.5', 'latest'], '3.1.0')).toBe('');
    expect(highestStableAtLeast(['3.1.0'], 'not-a-version')).toBe('');
});
