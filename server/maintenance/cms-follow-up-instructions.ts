export interface CmsFollowUpContext {
    /** Note about earlier unverified runs this run supersedes (empty when none). */
    unverifiedNote: string;
    githubProjectUrl: string | undefined;
    repository: string;
}

/**
 * Stage limits for the CMS maintenance follow-up. Dependency updates arrive as Pin Courier
 * (self-hosted Renovate) pull requests that delivery adopts and merges through its guarded
 * merge, so this stage only watches them; maintenance merges carry `[skip release]` and
 * publish nothing, so no release is expected after them (the-office#43).
 */
export function cmsFollowUpInstructions({ unverifiedNote, githubProjectUrl, repository }: CmsFollowUpContext): string {
    return `${unverifiedNote}Read all open PRs/issues and previously watched closed/merged items. Compare exact heads, reviews/checks and issues with the retained ledger. This stage merges no pull request and edits no PR. Dependency updates come from Pin Courier (self-hosted Renovate, pin-courier[bot]) on renovate/* branches, usually on Mondays, titled like "chore(deps): bump npm minor and patch [skip release]"; they reach the Office through delivery adoption and its guarded merge, so treat them as read-only here and record each one's head, adoption, board lane and merge state in the ledger. A merge whose subject carries [skip release] publishes nothing: verify its post-merge Quality only, expect no tag, GitHub release or npm version, and never record a missing release for it as a blocker. For other merges verify post-merge Quality/Release, tag, GitHub release, npm version/provenance as applicable, without retrying side effects. Retain missing verification as blockers in the ledger, not invented acceptance. Never edit source code or PRs. No merges, pipeline reruns/dispatches, manual version/tag/publish or issue closure. Return candidates=[].
GITHUB PROJECT COORDINATION (Joe authorized 2026-10-28): Use ONLY ${githubProjectUrl} and issues in ${repository}. Read current board Status options/cards, relevant issue bodies/comments, actual work evidence and current PR heads/checks. Update existing cards when evidence supports Backlog (unassessed/future/deferred or waiting on prerequisites), Ready (actionable unblocked scope), In progress (work actually started), In review (actual proposal awaiting applicable review/checks), or Done (verified acceptance after maintainer merge or documented completed no-impact disposition). Use actual lane names; report a blocker rather than inventing a lane. Preserve human holds and version prerequisites; SDK prereleases never prove a stable contract. A queued run, hash change, passing local check or open PR alone cannot establish completion. For each substantive change leave one focused issue comment with evidence, blocker if any and next step; read existing comments first to avoid repetition and read back both saved lane and comment. Record every attempted board/comment write in receipts; uncertain effects block and must not be replayed. This stage alone permits these board updates/comments; all PRs remain read-only, and no issue closure, source edits, profile/lock acceptance, merge or release is authorized by a board move. Report unchanged cards without heartbeat comments.`;
}
