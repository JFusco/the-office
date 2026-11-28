import type { MaintenanceGroupRecord, MaintenancePublicationCandidate, MaintenanceRun } from '../../../src/shared';

/**
 * The versioned completion record of one proposal group (#612): written only after the issue, the remote ref, the
 * draft and the issue link were each verified, and kept outside every worker result. Promotion and cleanup read it
 * for a versioned group; a group with no record (or a partial one) authorizes neither.
 */
export function completeGroup(progress: MaintenancePublicationCandidate, at: string): MaintenanceGroupRecord {
    const { issue, candidate, draft, push, pr, link } = progress;
    if (progress.proposalStep === undefined || !issue || !candidate || !draft || !push || !pr || !link)
        throw new Error('A maintenance group is complete only when its issue, push, draft and link are all verified');
    if (pr.head !== draft.head || draft.issue !== issue.number || draft.branch !== candidate.branch || draft.worktree !== candidate.worktree || push.head !== draft.head)
        throw new Error('The verified parts of this maintenance group do not describe one candidate');
    return progress.completed = {
        version: 1, proposalStep: progress.proposalStep, issue: issue.number, issueUrl: issue.url, pr: pr.number, prUrl: pr.url,
        branch: candidate.branch, head: draft.head, worktree: candidate.worktree,
        issueEffect: issue.effectId || `observed:issue:${issue.number}`, pushEffect: push.effectId || `observed:${push.observed}:${push.head}`,
        prEffect: pr.effectId || `observed:adopted-pr:${pr.number}`, linkEffect: link.effectId || `observed:link-comment:${link.commentId}`, at,
    };
}

const named = (value: unknown) => typeof value === 'string' && value.trim() !== '' && value === value.trim();
const positive = (value: unknown) => Number.isSafeInteger(value) && (value as number) > 0;

/**
 * Whether a versioned completion record is complete (#612): all four publication references (issue, push, draft and
 * link Effects or verified observations), its proposal position, and the issue, branch, head, path and PR identity.
 * With the repository, the issue and PR URLs must be its canonical ones. Promotion and cleanup accept nothing less.
 */
export function recordComplete(record: MaintenanceGroupRecord | undefined, repository?: string): record is MaintenanceGroupRecord {
    if (!record || record.version !== 1 || !Number.isSafeInteger(record.proposalStep) || record.proposalStep < 0) return false;
    if (!positive(record.issue) || !positive(record.pr) || !/^[a-f0-9]{40}$/.test(record.head) || !named(record.branch) || !named(record.worktree) || !record.worktree.startsWith('/')) return false;
    if (![record.issueEffect, record.pushEffect, record.prEffect, record.linkEffect, record.issueUrl, record.prUrl, record.at].every(named)) return false;
    return !repository || record.issueUrl === `https://github.com/${repository}/issues/${record.issue}` && record.prUrl === `https://github.com/${repository}/pull/${record.pr}`;
}

/**
 * The completion record of the versioned group whose proposal step is at this position, if it is complete
 * (`recordComplete`), the only one for that position, and consistent with the saved proposal step's candidate.
 */
export function groupRecord(run: Pick<MaintenanceRun, 'publication' | 'steps'>, proposalStep: number, repository?: string): MaintenanceGroupRecord | undefined {
    const records = (run.publication?.candidates || []).filter(candidate => candidate.proposalStep === proposalStep && candidate.completed);
    if (records.length !== 1) return undefined;
    const record = records[0].completed!;
    const built = run.steps[proposalStep]?.result.candidates?.[0];
    if (!recordComplete(record, repository) || record.proposalStep !== proposalStep || !built || built.issue !== record.issue || built.branch !== record.branch || built.head !== record.head) return undefined;
    return record;
}
