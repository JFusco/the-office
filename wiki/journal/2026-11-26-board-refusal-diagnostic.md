---
topics: [office-ui-and-telemetry]
plans: [2026-11-26-issue-672-keep-the-board-refusal-visible-through-the-quota-hold-009e708920.md]
---

# Keep a refused board read visible through the quota hold

PR 668 added a quota check right before the GitHub monitor publishes a completed read, so a hold reached on the last
page stops the dependent workflow read.

**What went wrong.** When GitHub refused the board read itself:
1. `board()` caught the failure into `board.error`.
2. The metered runner had already started the shared hold.
3. The final check then deferred, restoring the status and error from before the read.

The refusal's diagnostic was lost, and a project that had been healthy kept looking healthy for the whole backoff.

**What changed.**
- The metered runner already classified the refusal when it started the hold. It now also hands the matched text to an
  optional `onGitHubRefusal` callback on the command options. That text is the GraphQL body's errors, the exception
  text, or the stdout errors.
- The board read passes that callback on each page.
- If the final check holds after the board read was refused, the observation ends through its ordinary failure path:
  - it is `blocked`, with the provider's refusal as its error;
  - it keeps the prior rows and observation time;
  - there is no pipelines read and no second backoff.
- Later polls meet the hold at entry and keep that diagnostic.
- A successful read that reaches the reserve, or an unrelated board error coinciding with a hold, still defers as
  before.

Found by diff review `ec94faf0` on PR 668.

Evidence: `tests/unit/github/metered-runner.test.ts` covers the callback's exact message for each refusal shape, and
that no other failure triggers it. `tests/unit/scheduling/deferred-observation.test.ts` covers a refused board page
after a healthy observation, success at the reserve, and an unrelated permission error under a hold.

[Archived plan](../plans/2026-11-26-issue-672-keep-the-board-refusal-visible-through-the-quota-hold-009e708920.md) · [Issue JFusco/the-office#672](https://github.com/JFusco/the-office/issues/672)
