import { expect, test } from 'vitest';
import { qaRunDirectory } from '../../../../server/cec/qa/run-directory';
import { ticket } from '../parking/fixtures';

test('keeps ordinary QA in its canonical run and refuses a substituted continuation head or path', () => {
    const t = ticket(); t.attempt = 4;
    expect(qaRunDirectory(t, 'retest', '/artifacts')).toBe('/artifacts/.qa/runs/qa-retest-4');
    t.qaPlanContinuations = [{ stage: 'retest', attempt: 4, commit: t.commit, requestId: 'resume', workerId: 'old-qa',
        fromRunDir: '/artifacts/.qa/runs/qa-retest-4', toRunDir: '/artifacts/.qa/runs/qa-retest-4-acceptance', at: '2026-11-14',
        previousPaidRuns: 0, verificationDigest: 'digest', artifacts: [] }];
    expect(qaRunDirectory(t, 'retest', '/artifacts')).toBe('/artifacts/.qa/runs/qa-retest-4-acceptance');
    t.commit = 'b'.repeat(40); expect(() => qaRunDirectory(t, 'retest', '/artifacts')).toThrow('identity changed');
    t.qaPlanContinuations[0].commit = t.commit; t.qaPlanContinuations[0].toRunDir = '/outside';
    expect(() => qaRunDirectory(t, 'retest', '/artifacts')).toThrow('identity changed');
});
