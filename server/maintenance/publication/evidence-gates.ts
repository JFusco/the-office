import { containedFile } from '../../cec/workflow';
import { retainedChecks } from './retain-evidence';
import { versionedAt } from './weekly-context';
import type { CandidateGroup } from './candidate-group';
import type { MaintenanceResult } from '../../../src/shared';

type Candidate = MaintenanceResult['candidates'][number];
const binding = (proposal: Candidate) => ({ issue: proposal.issue, branch: proposal.branch, head: proposal.head });

/**
 * The implementation gate: a versioned step's check output retained under the run for this head (on first use and
 * on replay); a historical step's saved path in the run's directory, as before.
 */
export function implementationChecked(group: CandidateGroup, built: MaintenanceResult, proposal: Candidate, root: string): boolean {
    return group.versioned ? retainedChecks(group.ctx.store, group.ctx.run, group.proposalStep, binding(proposal)).some(check => check.kind === 'checks')
        : !!built.checks?.some(check => (!check.kind || check.kind === 'checks') && check.commit === proposal.head && containedFile(check.path, root));
}

/** The independent QA gates for the step just saved: actual checks for this head, and for browser validation real browser and screenshot evidence with a URL. */
export function qaChecked(group: CandidateGroup, qa: MaintenanceResult, proposal: Candidate, root: string): { checks: boolean; browser: boolean } {
    const position = group.ctx.at() - 1;
    if (versionedAt(group.ctx, position)) {
        const retained = retainedChecks(group.ctx.store, group.ctx.run, position, binding(proposal));
        return { checks: retained.some(check => check.kind === 'checks'), browser: ['browser', 'screenshot'].every(kind => retained.some(check => check.kind === kind && !!check.url)) };
    }
    return { checks: !!qa.checks?.some(check => (!check.kind || check.kind === 'checks') && check.commit === proposal.head && containedFile(check.path, root)),
        browser: ['browser', 'screenshot'].every(kind => qa.checks?.some(check => check.kind === kind && check.commit === proposal.head && containedFile(check.path, root) && !!check.url)) };
}
