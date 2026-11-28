import { expect, test } from 'vitest';
import { unresolvedWorkerFailure } from '../../../../server/delivery/pipeline/unresolved-worker';
import type { WorkTime } from '../../../../src/shared';

const work = (id: string, stage: string, status: WorkTime['status'], startedAt: string, requestId = 'job-1') => ({ id, requestId, stage, status, startedAt }) as WorkTime;

test('a failed, interrupted or blocked worker of the job counts until a later completed worker of the same stage supersedes it', () => {
    for (const status of ['failed', 'interrupted', 'blocked'] as const) {
        const failed = work('w1', 'github-review', status, '2026-11-20T10:00:00.000Z');
        expect(unresolvedWorkerFailure([failed], { id: 'job-1' })).toBe(true);
        // A completed worker of another stage, or an earlier one of the same stage, resolves nothing.
        expect(unresolvedWorkerFailure([work('w0', 'github-review', 'completed', '2026-11-20T09:00:00.000Z'), failed, work('w2', 'github-implement', 'completed', '2026-11-20T11:00:00.000Z')], { id: 'job-1' })).toBe(true);
        expect(unresolvedWorkerFailure([failed, work('w3', 'github-review', 'completed', '2026-11-20T11:00:00.000Z')], { id: 'job-1' })).toBe(false);
    }
    // Other jobs' workers, running workers and an empty log are no failure of this job.
    expect(unresolvedWorkerFailure([work('w4', 'github-review', 'failed', '2026-11-20T10:00:00.000Z', 'job-2')], { id: 'job-1' })).toBe(false);
    expect(unresolvedWorkerFailure([work('w5', 'github-review', 'running', '2026-11-20T10:00:00.000Z')], { id: 'job-1' })).toBe(false);
    expect(unresolvedWorkerFailure(undefined, { id: 'job-1' })).toBe(false);
});
