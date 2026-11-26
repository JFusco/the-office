---
topics: [delivery-and-recovery]
plans: [2026-11-26-591-recover-conflicted-adopted-bot-prs-and-merge-qualified-replacements-e855672b0c.md]
issue: 'https://github.com/jfusco/the-office/issues/591'
issues: ['https://github.com/jfusco/the-office/issues/591']
---

# Conflicted bot PRs are redone by their own bot

An adopted wiki-sync, Dependabot or Pin Courier PR that conflicted with its target had no way forward: observation threw "Automation PR waits for GitHub merge readiness" on every poll. Joe's direction was that the Office should solve the conflict and merge, with no manual step, and that the bot redoes its own PR. The Office never commits to a bot branch, and qualification is unchanged.

Observation now only reads. It records the conflicted head on the adoption and queues the merge stage. Under the merge claim the harness asks the bot once for that head, through one Effect with read-back:

- a wiki PR's own workflow dispatch (`wiki-sync.yml` with the parent PR for a numbered PR, or the maintenance workflow its title names);
- `@dependabot rebase`;
- Renovate's own rebase box on a Pin Courier PR.

The allowance belongs to the PR and head, not to the job, so a replacement job or a restart cannot ask twice. A request whose outcome is unknown is never resent. A qualified, natively linked replacement head settles it, even without a receipt, and that head merges through the ordinary checks and guarded merge. Each bot has a reporting clock, but the clock only reports.

The wiki workflow can succeed without a new commit and reset the PR body. A maintenance PR then waits for its weekly refresh. A numbered PR is closed as superseded, with its tracking issue closed as not planned, only when Git tree entries prove that the target already holds every substantive change. The close is saved before its first write and each write is read back, so an interrupted close resumes without repeating anything.

Evidence: `tests/unit/delivery/readiness/automation-conflict.test.ts`, `tests/unit/delivery/repairs/bot-redo/`, `tests/unit/delivery/closeout/wiki-containment.test.ts` and `tests/unit/delivery/closeout/superseded-wiki-pr.test.ts`.

[Archived plan](../plans/2026-11-26-591-recover-conflicted-adopted-bot-prs-and-merge-qualified-replacements-e855672b0c.md) · [Issue JFusco/the-office#591](https://github.com/JFusco/the-office/issues/591)
