import type { OfficeConfigProjectSettings, OfficeProject } from '../../../src/shared';
import { effectiveAutoAdopt } from '../../delivery/intake/dependency-bots/effective-auto-adopt';
import { resolveProjectPolicy } from '../project-policy';
import type { ProjectPolicyInput } from '../project-policy-config';
import type { ProjectBindings } from '../project-bindings-config';

/**
 * One project's resolved policy, a GitHub project's effective bot adoption under that policy and, when it has a
 * Jira/Azure binding, an explicit allowlist of its connection: never accounts, login profiles, credential selectors,
 * cloud, subscription or repository ids, local paths or authority text.
 */
export function projectSettingsSummary(project: Pick<OfficeProject, 'id' | 'provider' | 'autoAdopt' | 'githubProject'>, bindings: ReadonlyMap<string, ProjectBindings>, policies: ReadonlyMap<string, ProjectPolicyInput>): Partial<OfficeConfigProjectSettings> {
    const { merge, handsOff, releaseMarkerCheck, checkpoint } = resolveProjectPolicy(project, policies.get(project.id));
    const policy = { merge, handsOff, releaseMarkerCheck, checkpoint: { hour: checkpoint.hour, weekends: checkpoint.weekends } };
    if (project.provider === 'github') return { policy, autoAdopt: effectiveAutoAdopt(project, handsOff) };
    const bound = project.provider === 'azure' ? bindings.get(project.id) : undefined;
    if (!bound) return { policy };
    const intake = bound.jira.statuses.intake.map(status => status.name);
    return {
        policy,
        // The default pickup is the first intake status, as `defaultPickupStatus` resolves it.
        jira: { site: bound.jira.site, projectKey: bound.jira.projectKey, intakeStatuses: intake, defaultPickup: intake[0] },
        azure: { organization: bound.azure.organization, project: bound.azure.project },
    };
}
