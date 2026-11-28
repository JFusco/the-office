import { realpathSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'zod';
import { QualificationRecord } from '../../workers/launch-qualification';
import { policyId, providerFor, type MaintenanceLaunchPolicy } from '../../workers/maintenance-launch';
import type { Role } from '../../../src/shared';
import type { Store } from '../../store/store';
import type { MaintenanceRun } from '../../../src/shared';

const LaunchRecord = z.object({
    workerId: z.string().min(1), stage: z.string().min(1), policy: z.string().min(1),
    executable: QualificationRecord.shape.executable, recordSha256: z.string().regex(/^[a-f0-9]{64}$/),
    args: z.array(z.string()).min(1), cwd: z.string().min(1), at: z.iso.datetime(),
}).strict();
type RecordedPolicy = Pick<MaintenanceLaunchPolicy, 'version' | 'kind' | 'browser' | 'cwd'> & { id: string; scratch?: string | null };

/**
 * The two directories a versioned (#612) maintenance worker's records must show for its read-back, validated
 * separately. `worktree` is the assignment's candidate (`assignment.scope.worktree`): the policy it saved names it,
 * and it must be the primary checkout (a reader with no candidate yet) or a candidate this run recorded. `process` is
 * where the child actually ran, which its native session records: the same directory, except for a checks runner,
 * which starts in its own private scratch, so its saved policy scratch must be the one its retained launch record
 * shows. Anything else is a mismatch.
 */
export function versionedWorkerDirectories(store: Pick<Store, 'project'>, run: Pick<MaintenanceRun, 'publication' | 'steps'>,
    assignment: { id: string; stage: string; role: Role; maintenancePolicy: RecordedPolicy }, launch: unknown, spawned: boolean): { worktree: string; process: string } {
    const policy = assignment.maintenancePolicy, cwd = policy.cwd;
    const real = (path: string) => { try { return realpathSync(path); } catch { return resolve(path); } };
    // A harness-prepared candidate, or a legacy group's verified candidate carried forward into versioned readers and checks.
    const recorded = [...(run.publication?.candidates || []).flatMap(candidate => candidate.candidate ? [candidate.candidate.worktree] : []),
        ...run.steps.filter(step => step.stage === 'proposal').flatMap(step => step.result.candidates.map(candidate => candidate.worktree ? real(candidate.worktree) : ''))].filter(Boolean);
    if (cwd !== store.project.repo && !recorded.includes(cwd)) throw new Error('The versioned maintenance worker ran outside its harness-bound cwd');
    const checks = policy.kind === 'checks', process = checks ? policy.scratch || '' : cwd;
    if (checks && (!isAbsolute(process) || resolve(process) !== process)) throw new Error('The versioned checks worker has no harness-bound scratch');
    if (spawned) {
        const parsed = LaunchRecord.safeParse(launch);
        if (!parsed.success) throw new Error('The original maintenance launch record is missing or malformed');
        const record = parsed.data;
        if (policy.version !== 1 || !['reader', 'editor', 'checks'].includes(policy.kind) || policy.id !== policyId(providerFor(assignment.role), policy)
            || record.workerId !== assignment.id || record.stage !== assignment.stage || record.policy !== policy.id)
            throw new Error('The original maintenance launch record names another worker, stage or policy');
        if (record.cwd !== process) throw new Error('The versioned maintenance launch record shows another cwd');
    }
    return { worktree: cwd, process };
}
