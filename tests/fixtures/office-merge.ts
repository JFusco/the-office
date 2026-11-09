import type { ciFixture } from './ci-repair';
/** Synthetic durable Office merge provenance; no provider operation is performed. */
export function recordOfficeMerge(f: ReturnType<typeof ciFixture>) {
    const id = `merge:${f.job.id}:${f.job.head}`, at = '2026-11-09T08:00:00Z';
    f.job.mergeIntentId = id; f.job.mergeAttempt = { head: f.job.head, at };
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id,
        operation: 'github-merge', target: f.job.prUrl, authorization: 'fixture', payload: { sha: f.job.head, method: 'merge' },
        expectedState: { head: f.job.head, base: f.store.project.target }, status: 'verified', createdAt: at, dispatchedAt: at,
        verifiedAt: at, receipt: { merged: true, sha: f.job.mergeCommit }, error: '', elapsedMs: 0 });
    return id;
}
