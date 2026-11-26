# Wiki automation adoption

GitHub projects opt in with `autoAdopt: ["wiki-sync"]` (alongside `pin-courier`
when desired). The Office discovers canonical `bot/wiki-sync/<merged PR>` and
`bot/wiki-maintenance` pull requests. Backlog, Ready, missing cards and In review
are eligible; Block, Done and In progress remain untouched. Paused/draining
projects, disabled pickup and explicit holds still prevent adoption.

Qualification requires the installed BOT_TOKEN account (JFusco, numeric ID
486049), same-repository head and configured target, canonical title/body,
complete Actions-authored/committed history (numeric ID 41898282), and complete
changes limited to `wiki/**/*.md` and `scripts/wiki/graph/data/graph.json`.
A numbered, missed-merges or weekly title may end with exactly one
` [skip release]` (a repository whose release policy marks wiki PRs). No other
suffix or prefix qualifies.
Renames must stay within that scope. A numbered reconciliation must refer to a
merged, non-wiki parent on the configured target. The workflow uses unsigned
local Actions commits, so GitHub signature verification is not its provenance
contract.

The Office repository validates the compact writer PR body against its
canonical branch, account and Markdown/graph diff. PR title and commit-range
lint still run.

The harness creates one assigned tracking issue using the durable wiki-specific
marker, appends its closing reference, and puts both cards In review. The PR's
exact identity, head and qualification are checked at every mutation boundary.
All writes use Effects and read-back; uncertain dispatch is never blindly
replayed. Workflow rebases reuse the tracking issue and restore its link.
After existing-PR preparation, qualified wiki PRs proceed directly to required
current-head GitHub checks and repository merge rules. The harness observes the
merge, closes the issue, and completes board closeout.

The installed wiki workflow excludes `bot/wiki-*` merges from reconciliation,
so adopting a wiki PR does not recursively create another merge-sync PR.

## Conflicts

When an adopted wiki PR conflicts with its target (GitHub's live `mergeable: false`), the
Office never commits to the bot branch. The merge stage asks the wiki workflow to write the
PR again, once per conflicted head (`server/delivery/repairs/bot-redo/`):

- A numbered PR dispatches `wiki-sync.yml` with `pr_number` set to its merged parent.
- A maintenance PR dispatches `wiki-issue-sync.yml` for the weekly title and body, or
  `wiki-sync.yml` for the missed-merges title and body, with no inputs.

The dispatch ref is the live default branch, which must also be the configured target and
the PR's base. The dispatch is one Effect. Its returned run ID is read back and matched on
repository, ID, workflow path, `workflow_dispatch` event, ref and dispatch time. A request
whose outcome is unknown is reconciled by reading and never resent. When the response was
lost there is no run ID, and only the outcome settles it.

The run's new head is qualified exactly as at adoption. The workflow resets the PR body, so
the adoption poll restores `Closes #<issue>` for the new head. The PR then merges on that
head after its checks. A run that ends unsuccessfully is one stop. A run still unfinished
six hours after the dispatch is reported once, and observation goes on.

A successful run can leave the head unchanged: the reconciliation already matched, or the
workflow reused its commit and only reset the body.

- A maintenance PR stays open, with its tracking issue and cards, for the next weekly
  refresh to replace. It is reported once if the head has not moved eight days after that
  run.
- A numbered PR is closed as superseded only when the target already holds every
  substantive change the PR makes (`server/delivery/closeout/`). The proof reads the PR's
  complete file list between two reads of its head and base. It compares Git tree entries
  at the PR head and the target tip. Each added or modified path must have the same type,
  mode and object, each removed path must be absent at both commits, and both ends of a
  rename are checked on their own. `wiki/connections.md` and the graph JSON are exempt
  only when both commits carry the inspected `scripts/wiki/build-graph.cjs`. An incomplete,
  truncated or inconsistent inventory leaves the PR open with the reason recorded. A failed
  provider read leaves the proof pending for the next claim.

With a proof, the Office saves the close record before its first write. Earlier attempted
adoption link writes are read back against their original head and issue. The Office restores
a lost link once and waits for GitHub's native link, then posts one marked proof comment on the
PR. The comment's returned ID is saved before verification. The close preflight reads the PR
and target again after qualification. A moved target must still contain every change, or no
close is sent. A moved PR head returns to qualification with its earlier receipts intact.
The Office closes the PR at the proven head without merging, comments on and closes the tracking issue as not planned (an issue
someone already closed keeps its reason), and moves the cards to Done. Before retiring the job
and withdrawing the adoption, it confirms the live PR and issue still match their recorded closures.
The bot branch is kept.

GitHub's PR close takes no expected head, so the proof holds for the snapshot it names. A
target that moves after the close and no longer contains the change leaves a partial
outcome, and no further write follows it.
