import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { versionedWorkerDirectories } from '../../../../server/maintenance/publication/versioned-readback';
afterEach(cleanupFakes);

const launchRecord = (workerId: string, stage: string, policy: string, cwd: string) => ({
    workerId, stage, policy, cwd, executable: { path: '/cli', realpath: '/cli', version: '1', sha256: 'a'.repeat(64) },
    recordSha256: 'b'.repeat(64), args: ['exec'], at: '2026-11-28T00:00:00Z',
});

test("a spawned reader's retained launch must bind its worker, stage, policy and cwd", () => {
    const f = fakeMaintenanceGitHub(), run = { steps: [] };
    const assignment = { id: 'w1', stage: 'vendor-review', role: 'pm' as const, maintenancePolicy: { version: 1 as const, kind: 'reader' as const, id: 'codex-reader', cwd: f.store.project.repo } };
    const launch = launchRecord(assignment.id, assignment.stage, assignment.maintenancePolicy.id, f.store.project.repo);
    const directories = (record: unknown, spawned = true) => versionedWorkerDirectories(f.store, run, assignment, record, spawned);
    const expected = { worktree: f.store.project.repo, process: f.store.project.repo };
    expect(directories(launch)).toEqual(expected);
    expect(directories(undefined, false)).toEqual(expected);
    for (const record of [undefined, { cwd: launch.cwd }]) expect(() => directories(record)).toThrow(/missing or malformed/);
    for (const mismatch of [{ workerId: 'other' }, { stage: 'other' }, { policy: 'claude-reader' }])
        expect(() => directories({ ...launch, ...mismatch })).toThrow(/another worker, stage or policy/);
    expect(() => directories({ ...launch, cwd: '/other' })).toThrow(/another cwd/);
});

test('a checks worker is bound to its candidate and ran in its recorded scratch; substituting either fails', () => {
    const f = fakeMaintenanceGitHub();
    const run: any = { steps: [], publication: { version: 1, evidence: [], candidates: [{ index: 0, key: 'k', candidate: { worktree: '/owned/w' } }] } };
    const assignment = { id: 'qa', stage: 'package-verification', role: 'qa' as const, maintenancePolicy: { version: 1 as const, kind: 'checks' as const, id: 'codex-checks', cwd: '/owned/w', scratch: '/scratch/assignment-1' } };
    const launch = launchRecord(assignment.id, assignment.stage, assignment.maintenancePolicy.id, assignment.maintenancePolicy.scratch);
    const directories = (change: { cwd?: string; scratch?: string | null } = {}) =>
        versionedWorkerDirectories(f.store, run, { ...assignment, maintenancePolicy: { ...assignment.maintenancePolicy, ...change } }, launch, true);
    expect(directories()).toEqual({ worktree: '/owned/w', process: '/scratch/assignment-1' });
    expect(() => directories({ scratch: '/scratch/assignment-2' })).toThrow(/another cwd/);
    expect(() => directories({ cwd: '/elsewhere' })).toThrow(/outside its harness-bound cwd/);
    expect(() => directories({ scratch: null })).toThrow(/no harness-bound scratch/);
});
