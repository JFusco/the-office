import { expect, test } from 'vitest';
import { BROWSER_QA_LIMIT_MS, qaTimeLimit, qaTimeLimitGuidance } from '../../../server/qa/time-limit';

const approach = (validation: string) => ({ plan: 'none', review: 'focused', validation, checks: ['Check'], reason: 'Fixture' }) as any;

test('only a QA stage on the browser route gets the longer limit, and is told what it is', () => {
    expect(BROWSER_QA_LIMIT_MS).toBe(90 * 60 * 1000);
    expect(qaTimeLimit(true, approach('browser'))).toBe(BROWSER_QA_LIMIT_MS);
    // No recorded route means browser acceptance is still required.
    expect(qaTimeLimit(true)).toBe(BROWSER_QA_LIMIT_MS);
    expect(qaTimeLimit(true, approach('independent-checks'))).toBeUndefined();
    expect(qaTimeLimit(true, approach('developer-checks'))).toBeUndefined();
    expect(qaTimeLimit(false, approach('browser'))).toBeUndefined();
    expect(qaTimeLimitGuidance(approach('browser'))).toContain('stopped 90 minutes after it starts');
    expect(qaTimeLimitGuidance(approach('independent-checks'))).toBe('');
});
