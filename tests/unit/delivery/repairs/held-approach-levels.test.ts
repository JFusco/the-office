import { expect, test } from 'vitest';
import { heldApproachLevels } from '../../../../server/delivery/repairs/held-approach-levels';

const revised = { plan: 'brief', review: 'full', validation: 'independent-checks', checks: ['Request stays under the limit'], reason: 'Trim the bundle' } as const;

test('a revised approach keeps its checks and reason; no gate level drops below the current one', () => {
    expect(heldApproachLevels({ plan: 'reviewed', review: 'focused', validation: 'browser' }, { ...revised, checks: [...revised.checks] }))
        .toEqual({ plan: 'reviewed', review: 'full', validation: 'browser', checks: ['Request stays under the limit'], reason: 'Trim the bundle' });
});

test('a stricter or equal revised level is taken as proposed; a ticket with no approach is held to the assumed levels', () => {
    expect(heldApproachLevels({ plan: 'none', review: 'none', validation: 'developer-checks' }, { ...revised, checks: [...revised.checks] })).toMatchObject({ plan: 'brief', review: 'full', validation: 'independent-checks' });
    expect(heldApproachLevels(undefined, { ...revised, checks: [...revised.checks] })).toMatchObject({ plan: 'reviewed', review: 'full', validation: 'browser' });
});
