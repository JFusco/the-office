import { HOST_ENVIRONMENT, LaunchQualificationRefusal, policiesQualified, readQualification, templateMismatch, type QualificationEnvironment } from '../launch-qualification';
import { policyTemplate, maintenanceRoots } from './policy-templates';
import type { ProtectedRoots } from '../claude-maintenance-arguments';

/**
 * Whether every policy a chain needs is qualified now, for its stage, as the launch itself would judge it: the host
 * part (record present, stage covered, current pin, registered binary, host, managed configuration, controls) and
 * the template part (the record's arguments, settings, tools, filesystem and network equal the template this build
 * launches). Returns the first refusal, or undefined. Publication admission and `status` both use this check.
 */
export function chainQualified(dataRoot: string, needs: readonly { policy: string; stage: string }[], environment: QualificationEnvironment = HOST_ENVIRONMENT,
    roots: ProtectedRoots = maintenanceRoots()): LaunchQualificationRefusal | undefined {
    for (const need of needs) {
        const host = policiesQualified(dataRoot, [need], environment);
        if (host) return host;
        const found = readQualification(dataRoot, need.policy, environment);
        if ('missing' in found) return new LaunchQualificationRefusal(need.stage, need.policy, found.missing);
        const stale = templateMismatch(found.record, policyTemplate(need.policy, roots));
        if (stale) return new LaunchQualificationRefusal(need.stage, need.policy, `${stale} (stale)`);
    }
}
