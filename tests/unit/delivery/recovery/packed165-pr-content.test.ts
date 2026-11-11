import { expect, test } from 'vitest';
import { packed165PRContent } from '../../../../server/delivery/recovery/packed165-pr-content';

test('metadata closes only 165 and separates original accepted work from the newly authorized checks-only revision', () => {
    const value = packed165PRContent('new-head', 'old-head');
    expect(value.source).toBe('office'); expect(value.body.match(/Closes #\d+/g)).toEqual(['Closes #165']);
    expect(value.body).toContain('Original implementation and focused review completed at old-head');
    expect(value.body).toContain('without another model review or local QA cycle');
    expect(value.body).toContain('No successful original push or historical non-mutation is claimed');
    expect(value.body).toContain('successful execution at new-head');
    expect(value.body.match(/^## /gm)).toHaveLength(6);
});
