import { test, expect } from 'vitest';
import { ciFixture, newHead } from '../../../fixtures/ci-repair';
import { readCIFailure } from '../../../../server/delivery/repairs/ci-evidence';

test('binds actual failed logs to the exact PR head and retains checks and run identities', async () => {
    const f = ciFixture(), result = await readCIFailure(f.delivery, f.job);
    expect(result?.logs[0].text).toContain('body-max-line-length'); expect(result?.runs[0].id).toBe(20);
    expect(f.calls.every(c => c.options.readOnly || c.args[0] === 'pr')).toBe(true);
});
test('passing checks never enter recovery; foreign job identity fails closed', async () => {
    const f = ciFixture(); f.check.conclusion = 'success'; expect(await readCIFailure(f.delivery, f.job)).toBeNull();
    f.check.conclusion = 'failure'; f.native.head_sha = newHead;
    await expect(readCIFailure(f.delivery, f.job)).rejects.toThrow('identity');
});
test('third-party failures enter diagnosis without pretending they are retryable Actions', async () => {
    const f = ciFixture(); f.check.app.slug = 'external-ci';
    const evidence = await readCIFailure(f.delivery, f.job); expect(evidence?.selection.effective).toHaveLength(1); expect(evidence?.runs).toEqual([]);
});
