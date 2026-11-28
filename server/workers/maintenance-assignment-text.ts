import type { MaintenanceLaunchPolicy } from './maintenance-launch';

/**
 * The runtime wording of a confined #612 maintenance launch, in place of instructions that assume native tools or
 * Office access the policy denies: the session bridge GET, the knowledge lookup endpoint, the assignment identity
 * file, the TWG approval request and the completion checkpoint in Office data. The harness supplies what those
 * would have read in the stage's evidence packet.
 */
export const MAINTENANCE_OWNERSHIP_TEXT = 'OWNERSHIP EVIDENCE: The harness read current ownership, holds, comments, pull requests, board state and session observations as applicable and supplies them in this assignment. You cannot reach Office services, provider APIs or the network for more; a gap in the supplied evidence is a blocker to name, never a reason to fetch.';

export function maintenanceIdentityText(identity: { session: string; projectId: string; requestId: string; role: string }): string {
    return `ACTUAL ASSIGNMENT IDENTITY: provider session ${identity.session}, project ${identity.projectId}, request ${identity.requestId}, role ${identity.role}. Non-Brain work must not claim Brain maintenance.`;
}

export function maintenancePolicyText(policy: MaintenanceLaunchPolicy, scratch?: string): string {
    const authority = 'Nothing you run can push, open or edit a pull request, create, edit, assign or comment on an issue, move a board card or reach GitHub: the harness publishes after the stage owner accepts your structured result.';
    if (policy.kind === 'reader') return `LAUNCH POLICY (reader): read only within ${policy.cwd}. ${authority}`;
    if (policy.kind === 'editor') return `LAUNCH POLICY (editor): edit, commit and run checks only through Bash inside ${policy.cwd} on branch ${policy.candidate!.branch}. Save check outputs as regular files under ${scratch}. Dependency setup and checks run inside the sandbox; only the registry ${(policy.registry || []).join(', ')} is reachable. Hooks stay enabled; never change Git configuration, hooks, other branches or worktrees. ${authority}`;
    return `LAUNCH POLICY (checks): read the bound candidate ${policy.cwd} without changing it; write outputs only under ${scratch}.${policy.browser ? ' The isolated test browser and its local fixture are available for the selected browser validation.' : ' No network is available.'} ${authority}`;
}

export const MAINTENANCE_IMPLEMENTER_TEXT = 'IMPLEMENTER: Use the pinned Opus 5.5 model. Do not launch nested agent/model processes or switch models. Follow the same stage gates and scoped authorization. Only the tools of this launch policy are available; unavailable tools or access are blockers. Do not treat a provider failure as permission to replay an uncertain write.';
