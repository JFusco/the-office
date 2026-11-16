import { expect, test } from 'vitest';
import { reviewWait } from '../../../../server/delivery/readiness/review-wait';

test('a draft, a refreshable conflict or running checks wait without a review; anything else is reviewed', () => {
    expect(reviewWait({ draft: true, mergeable: false }, true, true)).toMatchObject({ kind: 'pr-not-ready', detail: expect.stringContaining('draft') });
    expect(reviewWait({ draft: false, mergeable: false }, true, true)).toMatchObject({ kind: 'pr-not-ready', detail: expect.stringContaining('conflicts') });
    expect(reviewWait({ draft: false, mergeable: true }, false, true)).toMatchObject({ kind: 'provider-checks' });
    // A conflict the harness cannot refresh, a still-computing merge state and a settled PR all reach Sam.
    expect(reviewWait({ draft: false, mergeable: false }, false, false)).toBeNull();
    expect(reviewWait({ draft: false, mergeable: null }, false, false)).toBeNull();
    expect(reviewWait({ draft: false, mergeable: true }, false, false)).toBeNull();
});
