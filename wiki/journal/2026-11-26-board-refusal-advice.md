---
topics: [office-ui-and-telemetry]
plans: [2026-11-26-issue-681-give-refused-board-reads-quota-guidance-105cc16c2e.md]
issue: 'https://github.com/jfusco/the-office/issues/681'
issues: ['https://github.com/jfusco/the-office/issues/681']
---

# Give a refused board read quota guidance, not auth advice

A failed board read records `GitHub Project read failed: <error>. <remedy>` as its error. The remedy used to be chosen
by matching `permission|forbidden|scope|403`, which gave the wrong advice for rate-limit refusals:
- **Secondary limit with HTTP 403.** It was told to run `gh auth refresh`, which can't clear a quota hold.
- **Refusal stated only in stdout.** It got the generic retry advice instead.

Since issue 672, that diagnostic stays visible as the monitor's error through the hold.

`server/github/board-read-failure.ts` now picks the remedy:
- **The runner matched a refusal on this read.** `board()` passes its own `onGitHubRefusal` callback to every page and
  forwards each match once to the caller. The remedy becomes "Wait for GitHub's rate limit to clear before retrying the
  board read."
- **No match, but the caught text states a refusal.** It gets the same wait sentence. This check only chooses wording and
  starts no backoff.
- **Anything else.** Permission and scope failures, including "Resource not accessible by integration", keep the access
  hint. Other errors keep the retry remedy.

The provider's message appears exactly once. The assignment reader's listener error carries the same guidance.

Found by integration review `51782df0` on PR 677.

Evidence: `tests/unit/github/board-read-failure.test.ts`, `tests/unit/scheduling/deferred-observation.test.ts` and
`tests/unit/scheduling/assignment-board-hold.test.ts`.

[Archived plan](../plans/2026-11-26-issue-681-give-refused-board-reads-quota-guidance-105cc16c2e.md) · [Issue JFusco/the-office#681](https://github.com/JFusco/the-office/issues/681)
