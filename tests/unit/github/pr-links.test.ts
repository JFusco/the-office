import { expect, test } from 'vitest';
import { closingDirectives } from '../../../server/github/pr-links';

test('closing directives are read from the whole body in order, with repeats, whatever their case', () => {
    expect(closingDirectives('Closes #11. fixes #3, Resolved #11 and refs #4; close #9x; fix #5')).toEqual([11, 3, 11, 5]);
    expect(closingDirectives(`${'x'.repeat(10_000)} Fixed #12`)).toEqual([12]);
    expect([closingDirectives(null), closingDirectives(undefined), closingDirectives('')]).toEqual([[], [], []]);
});
