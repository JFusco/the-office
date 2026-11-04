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

test('captures colored Actions logs as plain text without terminal controls', async () => {
    const f = ciFixture(), execute = f.execute.getMockImplementation()!;
    f.execute.mockImplementation(async (bin, args, options) => {
        if (bin === 'gh' && args[1]?.endsWith('/logs')) {
            expect(args).toContain('--allow-escape-sequences');
            return '\u001b[31mbody-max-line-length\u001b[0m: body lines exceed 72\n\u001b]8;;https://example.invalid\u0007details\u001b]8;;\u0007';
        }
        return execute(bin, args, options);
    });
    const result = await readCIFailure(f.delivery, f.job);
    expect(result?.logs[0].text).toBe('body-max-line-length: body lines exceed 72\ndetails');
});
