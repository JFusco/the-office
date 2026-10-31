import { expect, test } from 'vitest';
import { findingsBlock } from '../../../../server/delivery/findings/advisory';

const open = [{ id: 'f', summary: 'Needs maintainer acceptance', expected: '', actual: '', status: 'open' as const, attempts: 0 }];
test('open findings are advisory only for hands-off projects', () => {
    expect(findingsBlock({ project: { id: 'cms-field-vocabulary' } } as any, open, f => f.status === 'open')).toBe(false);
    expect(findingsBlock({ project: { id: 'brain' } } as any, open, f => f.status === 'open')).toBe(true);
});
