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
Renames must stay within that scope. A numbered reconciliation must refer to a
merged, non-wiki parent on the configured target. The workflow uses unsigned
local Actions commits, so GitHub signature verification is not its provenance
contract. These checks admit the PR for independent review; they are not proof
that the diff is correct. There is no Dependabot lint/review waiver for wiki PRs.

The harness creates one assigned tracking issue using the durable wiki-specific
marker, appends its closing reference, and puts both cards In review. The PR's
exact identity, head and qualification are checked at every mutation boundary.
All writes use Effects and read-back; uncertain dispatch is never blindly
replayed. Workflow rebases reuse the tracking issue and restore its link.
Discovery then uses the ordinary existing-PR preparation, current-head Lead
review, guarded merge, merge-check observation, issue closure and board closeout.

The installed wiki workflow excludes `bot/wiki-*` merges from reconciliation,
so adopting a wiki PR does not recursively create another merge-sync PR.
