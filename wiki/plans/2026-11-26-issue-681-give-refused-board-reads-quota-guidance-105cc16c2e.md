---
status: "implemented"
executed: true
evidence: ["tests/unit/github/board-read-failure.test.ts and tests/unit/scheduling/deferred-observation.test.ts (JFusco/the-office#681)"]
source_tool: "repository"
source: "/Users/joe.fusco/.codex/review-runs/aafd6398-0cae-434c-ad03-3b36363d0553/final.md"
topics: ["office-ui-and-telemetry"]
digest: "105cc16c2e36037f68cf6fceef64647a266616b02b45b02e88f1d743d51e18a5"
---

# Issue 681 — Give refused board reads quota guidance

Use `codex/681-board-refusal-advice` from `origin/main` at `82a56a20`. The current board diagnostic sends a secondary HTTP 403 to the access hint and a stdout-only primary refusal to the generic retry hint.

## Edits

- [ ] Add `server/github/board-read-failure.ts` with the pure function `boardReadFailure(error: unknown, refusal?: string): string`. Build the diagnostic from `GitHub Project read failed: ` and `String(error)`. Include the captured refusal verbatim, appending it only when the caught text does not already contain it.
- [ ] A supplied refusal selects quota guidance immediately. Only when the runner supplied no match, evaluate `refusedByRateLimit` from `server/github/call-outcome.ts:19` on the caught text. This fallback chooses wording only. Use the same sentence for both refusal paths: `Wait for GitHub's rate limit to clear before retrying the board read.` For remaining failures, apply `/permission|forbidden|scope|resource not accessible by integration|403/i`. Copy the existing access and generic retry sentences verbatim from `server/github/github.ts:51`.
- [ ] In `GitHubMonitor.board()` at `server/github/github.ts:24`, keep the capture local to each invocation. At line 34, pass a callback to every page command, including when the caller supplied none. Record the matched text before forwarding it once to the optional caller callback. At line 51, keep the early `heldBy(e)` rethrow and replace only the fallback board’s `error` expression with the formatter call. The metered runner owns the governor notification. `observe()` at line 87 will find the match in the diagnostic, and `readAssignments()` at `server/scheduling/assignment-poll.ts:44` will propagate it to `listener.error` at line 211.

## Regression checks

- [ ] Add `tests/unit/github/board-read-failure.test.ts`. Exercise the formatter through `board()` with an isolated store and injected page executor. Cover a thrown secondary HTTP 403, a returned GraphQL primary `errors` body, and a captured stdout-only match paired with a generic exception. Assert the literal wait sentence. On the captured case, verify the caller callback receives the original text once. Assert `gh auth refresh -h github.com -s project` for both `gh exited 1: gh: Resource not accessible by integration` and bare `HTTP 403`. An unrelated failure must select `Retry the read-only project refresh`.
- [ ] Extend `boardOffice()` coverage at `tests/unit/scheduling/deferred-observation.test.ts:181`. Use a fresh healthy baseline for the existing stdout-only `API rate limit exceeded for user ID 1.` case and for a later board page throwing `gh: You have exceeded a secondary rate limit (HTTP 403)`. Each must leave the monitor `blocked`. Require the board prefix, provider message exactly once, and literal wait sentence in the monitor error. Exclude both `gh auth refresh` and `Retry the read-only project refresh`. Compare the saved board, issues, PRs, runs, and observation time with the baseline. The next held poll must make zero provider reads and preserve the complete diagnostic. Require one governor `refused` call across the two polls for each case.
- [ ] In `tests/unit/scheduling/assignment-board-hold.test.ts:28`, extend the `office()` fixture with a refusal case starting outside a hold. Have its spawned board command emit `API rate limit exceeded for user ID 1.` in the GraphQL stdout `errors` body and throw `gh exited 1: query failed`. Drive `c.poll()` through the real `readAssignments(check)` path. Require `c.state.listener.error` to contain the board prefix, original exception, provider message exactly once, and literal wait sentence. Exclude both wrong remedies and verify the saved board is retained. Dropping the board’s own callback must fail this case.
- [ ] Extend the no-hold publication case at `tests/unit/delivery/board/github-board.test.ts:24` with a permission failure. Verify the monitor publishes its repository issues, its top-level error is empty, and `board.error` carries the access hint. Keep the later-page scope-failure and independent-hold deferral checks as regression coverage.

## Verification and delivery

- [ ] After implementation, run `pnpm exec tsc --noEmit`, then `pnpm exec vitest run tests/unit/github tests/unit/scheduling tests/unit/delivery/board tests/unit/it`. Submit the scoped diff and these criteria to `/review-implementation`. Resolve accepted findings and verify the final revision. Hosted Quality supplies the full build and unit-test gate.
- [ ] Archive the executed plan and record the wiki journal entry in the same delivery. Follow the repository PR flow with `Closes #681` and the review on record. Merge after required checks pass, clean up the merged issue branch and its worktree, and leave deployment to the Overseer.
