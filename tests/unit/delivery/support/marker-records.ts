import type { ReleaseMarkerReturn } from '../../../../src/contracts/release-marker';
import type { EffectIntent, StageResult, TicketJob } from '../../../../src/shared';
import type { Store } from '../../../../server/store/store';

/** A saved developer return, as `recordReturn` writes one, with any field overridden. */
export function savedReturn(over: Partial<ReleaseMarkerReturn> = {}): ReleaseMarkerReturn {
    return { workId: 'writer-1', claimId: 'claim-1', originalWorkId: 'writer-1', at: '2026-11-20T10:00:00.000Z', status: 'pending', boundary: 'b'.repeat(40), branch: 'codex/5-x',
        worktree: '/tmp/none', refusedHead: 'c'.repeat(40), refusedTree: 'd'.repeat(40),
        offending: [{ sha: 'e'.repeat(40), paths: ['README.md'], inventoryPaths: [], message: 'docs(readme): x [skip release]\n' }],
        publication: { candidate: '', target: 'b'.repeat(40), pullRequests: 0, observedAt: '2026-11-20T10:00:00.000Z' }, step: 0, ...over };
}

/** A passing implement result at `commit`, with evidence and approach overridable. */
export function passingResult(commit: string, over: Partial<StageResult> = {}): StageResult {
    return { outcome: 'passed', summary: 'Synthetic', commit, worktree: '/tmp/none', branch: 'codex/5-x', blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', prId: 0,
        qaRunDir: '', paidRuns: 0, approach: null, prerequisites: [], ...over } as unknown as StageResult;
}

/** One Effects row for this job, saved through the store. */
export function saveEffect(store: Store, job: Pick<TicketJob, 'id'>, id: string, operation: string, status: EffectIntent['status'], dispatchedAt = '') {
    store.putEffect({ id, work: { projectId: store.project.id, kind: 'delivery', id: job.id }, attemptId: job.id, operation, target: 'x', authorization: 'office-harness', payload: {}, expectedState: {},
        status, createdAt: '2026-11-20T10:00:00.000Z', dispatchedAt, verifiedAt: '', receipt: null, error: '', elapsedMs: null });
}
