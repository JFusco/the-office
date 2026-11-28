import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MaintenanceCandidateBinding } from '../../workers/maintenance-launch';
import type { command } from '../../workers/process';
import type { MaintenanceResult, WorkApproach } from '../../../src/shared';

/**
 * The versioned `draft-pr` stage contract (#612): content only. No instruction to push, open a pull request or
 * comment reaches the worker; the harness lints, pushes, opens and links the draft from this content.
 */
export const DRAFT_CONTENT_INSTRUCTIONS = 'READ ONLY. Write ONLY the draft pull request title and body for this candidate from the supplied candidate, review and check evidence and the repository\'s pull request template (read .github/pull_request_template.md in your working directory when present). Include the official source evidence, applicability, generated output, the actual checks with their commits, the rationale for every omitted step, risks and the lock-review requirement, and the native closing reference "Closes #<issue>". Use a conventional title. Skipped steps are not passed steps. Return pr.title and pr.body, receipts=[] and the same single candidate. The harness lints, pushes, opens and links the draft; you publish nothing.';

/** The versioned editor's stage limits: the owned worktree, branch and verified issue are the harness's, not the worker's to choose. */
export function editorInstructions(binding: MaintenanceCandidateBinding, issue: { number: number; url: string }, approach: WorkApproach, surface: MaintenanceResult['candidates'][number]): string {
    return `Implement ONLY this evidenced surface as ONE focused proposal in the owned worktree ${binding.worktree} on branch ${binding.branch}, for the verified issue #${issue.number} (${issue.url}). Use the selected approach; no separate plan/review is required unless selected. Inspect source first and return reroute BEFORE any code change if a different route is needed. Read repository instructions. Install dependencies inside this sandbox when the checks need them. Follow canonical wiki requirements and the required release:preflight, verify:ci, test:packed and npm pack --dry-run --ignore-scripts checks. Commit locally on this branch with hooks enabled. Save actual check outputs as files under your scratch and return checks tied to the committed head. Lock observations remain proposals. No push, pull request, issue, comment, merge, acceptance or publish: the harness publishes after review. Return exactly one candidate with issue ${issue.number}, this worktree and branch and the full committed head. Selected approach: ${JSON.stringify(approach)}. Surface: ${JSON.stringify(surface)}`;
}

/** A legacy group's verified candidate, as the readers and checks of its remaining versioned stages are bound to it. */
export async function legacyBinding(execute: typeof command, proposal: MaintenanceResult['candidates'][number]): Promise<MaintenanceCandidateBinding> {
    const worktree = realpathSync(proposal.worktree), git = async (...args: string[]) => (await execute('git', args, { cwd: worktree, timeout: 30000, readOnly: true })).trim();
    return { worktree, branch: proposal.branch, gitDir: realpathSync(await git('rev-parse', '--absolute-git-dir')), gitCommonDir: realpathSync(resolve(worktree, await git('rev-parse', '--git-common-dir'))) };
}
