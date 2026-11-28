import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { assertInterval, observeTargets } from '../../../../server/maintenance/publication/worker-interval';
import { MaintenanceStop } from '../../../../server/maintenance/publication/maintenance-stop';
afterEach(cleanupFakes);

test('an unrelated comment on the issue lets the run proceed; a moved owned branch stops it with authority', async () => {
    const f = await publicationRun(), targets = { branch: f.branch, worktree: f.project.repo, gitDir: f.project.repo, gitCommonDir: f.project.repo, issue: f.issue.number };
    const execute = (async (program: string, args: string[], options?: any) =>
        args[0] === 'rev-parse' ? targets.worktree : f.execute(program, args, options)) as any;
    const before = await observeTargets(f.store, execute, targets);
    f.state.comments[f.issue.number] = [{ id: 1, body: 'CMS follow-up: lane Ready', user: { login: 'JFusco' } }];
    expect(() => assertInterval(f.store, f.run, f.progress, 'proposal-review', before, before)).not.toThrow();
    f.state.remote[f.branch] = 'c'.repeat(40);
    const after = await observeTargets(f.store, execute, targets);
    let stop: unknown;
    try { assertInterval(f.store, f.run, f.progress, 'proposal-review', before, after); } catch (error) { stop = error; }
    expect(stop).toBeInstanceOf(MaintenanceStop);
    expect((stop as MaintenanceStop).kind).toBe('authority');
    expect(f.progress.observations?.[0]).toMatchObject({ stage: 'proposal-review', detail: expect.stringMatching(/owned branch moved/) });
});

test('an unsettled attempted write of the run is an uncertain-effect stop', async () => {
    const f = await publicationRun(), targets = { branch: f.branch, worktree: f.project.repo, gitDir: f.project.repo, gitCommonDir: f.project.repo, issue: f.issue.number };
    const execute = (async (program: string, args: string[], options?: any) =>
        args[0] === 'rev-parse' ? targets.worktree : f.execute(program, args, options)) as any;
    const before = await observeTargets(f.store, execute, targets);
    f.store.putEffect({ id: 'maintenance:run-1:cms-k:x', work: { projectId: f.store.project.id, kind: 'maintenance', id: 'run-1' }, attemptId: 'run-1', operation: 'git-push', target: 't',
        authorization: 'office-harness', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: 'x', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    let stop: unknown;
    try { assertInterval(f.store, f.run, f.progress, 'draft-pr', before, before); } catch (error) { stop = error; }
    expect(stop).toMatchObject({ kind: 'uncertain-effect' });
});
