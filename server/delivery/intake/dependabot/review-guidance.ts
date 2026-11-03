import type { Store } from '../../../store/store';
import type { TicketJob } from '../../../../src/shared';

/**
 * Joe's rule for adopted Dependabot PRs: they never meet the repository's commit and PR-body lint
 * standards, so those are bypassed, and the hosted checks Dependabot's own head runs are the gate.
 */
export function dependabotReviewGuidance(store: Store, job: TicketJob): string {
    const adoption = store.state.coordination?.adoptions?.find(a => !a.bot && a.status === 'adopted' && `GH-${a.issue}` === job.key && a.pr === job.pr);
    if (!adoption || job.stage !== 'lead-pr')
        return '';
    return `DEPENDABOT ADOPTION: PR #${adoption.pr} is a Dependabot dependency update (every commit written by Dependabot and GitHub-verified) that Joe moved to the pickup lane. Joe's standing rule: Dependabot PRs never meet the repository's commit-message and PR-body lint standards, so those standards are bypassed and are not findings. The gate is the hosted checks on the exact current head. Review the dependency changes for real risk (breaking majors, removed APIs, security advisories, lockfile or workflow changes beyond the named dependencies). Do not block for local evidence the hosted checks do not produce, such as packaging or release-preflight commands, unless the diff itself creates a concrete packaging risk. Return outcome=passed when the hosted checks pass and you find no real defect.`;
}
