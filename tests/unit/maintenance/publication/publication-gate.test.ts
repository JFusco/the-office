import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { assertNoOutstandingPublication, outstandingPublication } from '../../../../server/maintenance/publication/publication-gate';
import { supersedablePriorRuns } from '../../../../server/maintenance/unverified-prior-runs';
afterEach(cleanupFakes);

const effect = (run: string, operation: string, target: string, status = 'uncertain') => ({ id: `maintenance:${run}:k:${operation}`, work: { projectId: 'cms-field-vocabulary', kind: 'maintenance' as const, id: run }, attemptId: run,
    operation, target, authorization: 'office-harness', payload: {}, expectedState: {}, status: status as any, createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });

test('an earlier run\'s unsettled push, draft or link blocks fresh publication on the same target and supersession of that run', () => {
    const f = fakeMaintenanceGitHub();
    f.store.putEffect(effect('old', 'git-push', 'R:codex/5-x'));
    f.store.putEffect(effect('old', 'github-project-status', 'card'));
    expect(outstandingPublication(f.store).map(intent => intent.operation)).toEqual(['git-push']);
    expect(() => assertNoOutstandingPublication(f.store, 'new', ['R:codex/5-x'])).toThrow(/unsettled/);
    expect(() => assertNoOutstandingPublication(f.store, 'new', ['R:codex/6-y'])).not.toThrow();
    expect(() => assertNoOutstandingPublication(f.store, 'old', ['R:codex/5-x'])).not.toThrow();
    const runs: any[] = [{ id: 'old', status: 'blocked' }];
    expect(supersedablePriorRuns(f.store, runs, true)).toBeNull();
    f.store.putEffect(effect('old', 'git-push', 'R:codex/5-x', 'verified'));
    expect(supersedablePriorRuns(f.store, runs, true)).toEqual(['old']);
});
