import { expect, test } from 'vitest';
import { satisfiesRange } from '../../../server/release/engine-range';

test('the repository engines range admits the 24 line from 24.14.0 and nothing else', () => {
    const range = '>=24.14.0 <25';
    for (const version of ['24.14.0', 'v24.14.0', '24.20.3']) expect(satisfiesRange(version, range)).toBe(true);
    for (const version of ['24.13.9', '25.0.0', '22.12.0']) expect(satisfiesRange(version, range)).toBe(false);
});

test('a full bare version is an exact pin, and every full comparator applies', () => {
    expect(satisfiesRange('10.34.9', '10.34.9')).toBe(true);
    expect(satisfiesRange('10.34.8', '10.34.9')).toBe(false);
    expect(satisfiesRange('24.0.0', '>24.0.0 <=24.1.0')).toBe(false);
    expect(satisfiesRange('24.1.0', '>24.0.0 <=24.1.0')).toBe(true);
});

test('ranges it cannot evaluate exactly are refused, not guessed', () => {
    for (const range of ['^24.14.0', '~24', '24.x', '>=22 || >=24', '']) expect(() => satisfiesRange('24.14.0', range)).toThrow();
    // Short versions are wildcards in semver: `>24` excludes all of 24.x, `<=24.1` admits 24.1.5, `24` admits 24.14.0.
    for (const range of ['>24', '<=24.1', '24', '=24.1']) expect(() => satisfiesRange('24.14.0', range)).toThrow();
});
