import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { maintenanceInvocation, type MaintenanceInvocation } from './maintenance-invocation';
import { maintenanceRoots } from './qualification/policy-templates';
import { policyId, type MaintenanceLaunchPolicy } from './maintenance-launch';
import type { QualificationEnvironment } from './launch-qualification';
import type { Store } from '../store/store';

/** What a #612 maintenance launch adds to `WorkerRuntime.run`: its explicit policy and, for an editor or checks worker, its fresh private scratch. */
export interface MaintenanceLaunchInput { policy: MaintenanceLaunchPolicy; scratch?: string }

/** The policy a maintenance worker's `assignment.json` records beside its historical capability profile. */
export const maintenanceAssignment = (maintenance: MaintenanceLaunchInput | undefined, claude: boolean) =>
    maintenance ? { maintenancePolicy: { ...maintenance.policy, id: policyId(claude ? 'claude' : 'codex', maintenance.policy), scratch: maintenance.scratch || null } } : {};

/**
 * The qualified invocation of one maintenance worker, built from its template and admitted by its host record
 * (`maintenance-invocation.ts`), with the admitted launch retained in the session directory. Throws
 * `LaunchQualificationRefusal` before anything starts.
 */
export function qualifiedLaunch(input: { store: Store; dir: string; id: string; stage: string; claude: boolean; maintenance: MaintenanceLaunchInput; schema: string; schemaPath: string;
    route?: { model: string; effort: string }; environment: QualificationEnvironment }): MaintenanceInvocation {
    const invocation = maintenanceInvocation({ dataRoot: input.store.dataRoot, stage: input.stage, provider: input.claude ? 'claude' : 'codex', policy: input.maintenance.policy, session: input.id,
        schema: input.schema, schemaPath: input.schemaPath, scratch: input.maintenance.scratch, route: input.route, roots: maintenanceRoots(), environment: input.environment });
    writeFileSync(resolve(input.dir, 'maintenance-launch.json'), JSON.stringify({ workerId: input.id, stage: input.stage, policy: invocation.policyId, executable: invocation.qualified.executable,
        recordSha256: invocation.qualified.recordSha256, args: invocation.args, cwd: invocation.spawnCwd, at: input.store.clock.now().toISOString() }, null, 2), { mode: 0o600, flag: 'wx' });
    return invocation;
}
