---
status: "implemented"
executed: true
evidence: ["tests/unit/scheduling/deferred-observation.test.ts and tests/unit/github/metered-runner.test.ts (JFusco/the-office#672)"]
source_tool: "repository"
source: "/Users/joe.fusco/.codex/review-runs/885c1685-2d53-438f-892e-3123c462b248/final.md"
topics: ["office-ui-and-telemetry"]
digest: "009e7089209dc51268a9e941d27a8e0b12e8faeccbc97ab8c5a8b643ad687f7d"
---

# Issue 672. Keep the board refusal visible through the quota hold

## Provider and monitor edits

- [ ] After independent plan recheck, implement issue 672 on `codex/672-board-refusal-diagnostic`, based on `ce9e7c68`.
- [ ] Add an optional `onGitHubRefusal?: (message: string) => void` to `CommandOptions` in `server/workers/spawn-command.ts:10`. Both `Runner` and `command()` use this type. `server/workers/process.ts:44–45` already forwards the options to the bound runner, and the service injects `GitHubCalls.run` into the engine at `server/scheduling/offices.ts:108–114`.
- [ ] In `server/github/metered-runner.ts:52–76`, pair each successful `quotaRefusal` match with the text that produced it. On fulfillment, use the parsed GraphQL errors. On a spawned rejection, keep the existing order of exception text followed by parsed stdout errors. In each refusal branch, pass the existing refusal metadata to `governor.refused` once, then notify the optional callback with the matched text inside the guarded accounting block. Keep the text local to the invocation. Preserve output hooks, returned stdout, and the original rejected object.
- [ ] At `server/github/github.ts:21` and `:31`, let `board(check?, onGitHubRefusal?)` forward the optional callback on each board-page command. Retain its current `GitHubBoard | undefined` result and `board.error` formatting for assignment and protected callers. The assignment reader continues to consume `board.error` at `server/scheduling/assignment-poll.ts:44–47`.
- [ ] At `server/github/github.ts:78–79`, collect the message in a variable local to this observation and catch only the final `check()`. If `heldBy(error)`, `board?.error`, and the board’s matched refusal are all present, throw a plain error carrying the board diagnostic. Prefix the matched text if the diagnostic does not already contain it. The ordinary failure branch at line 93 then retains the prior rows and `observedAt`, records `blocked` and the diagnostic, and emits `github-blocked`. Rethrow every other check exception unchanged. A passing check continues through normal publication.
- [ ] Add one sentence to the GitHub quota section at `docs/office-process.md:1167` explaining that a refused board read records its diagnostic against the last observation and subsequent held polls preserve it.

## Regression checks

- [ ] Extend the existing cases at `tests/unit/github/metered-runner.test.ts:148–176` to assert the callback’s exact message for a returned errors envelope, an explicit command error, and a generic rejection with the refusal only in stdout. Duplicate evidence must produce one notification. Permission and pre-dispatch failures must produce zero. Retain the rejection-identity and governor-count assertions.
- [ ] Extend `tests/unit/scheduling/deferred-observation.test.ts` with a board-enabled project, isolated store, controlled clock, and injected raw provider behind `GitHubCalls`. Drive `github.bind(() => engine.observe())` and use a call-through spy on `engine.github.poll`. Complete a healthy baseline with nonempty issues, PRs, runs, and board cards. Confirm it reaches `actions/workflows?per_page=100`, save a deep copy with a distinguishable prior timestamp, then clear the call log. Stage different row values for the measured read. Answer the governor’s `rate_limit` probe with a controlled healthy sample.
- [ ] For the refusal, have the dispatched board call invoke `onSpawn`, stream `{"errors":[{"message":"API rate limit exceeded for user ID 1."}]}` to stdout, then reject with a dispatched `CommandFailure` carrying `gh exited 1: query failed`. Require an undefined poll result, `blocked` status, the actual provider message, equality with the saved rows, board and `observedAt`, zero dependent workflow requests, and exactly one `governor.refused` call. The earlier monitor request for `actions/runs` is expected. After any first-poll probe settles, clear the call log and observe again before expiry. Require the active hold deadline, zero provider calls, and the same diagnostic and observation.
- [ ] For success at the reserve, keep quota healthy through entry to the final board page. While that page is dispatched, apply a shared GraphQL reading with `limit` 5,000, `used` 4,500, `remaining` 500, and a future reset using `github.quota.headers(...)`. Return the normal final `projectV2` page. Require the recorded final page, the reset deadline, zero refusals, and restoration of the complete earlier observation, including its status and error.
- [ ] For the permission control, let the real board reader dispatch and handle `Resource not accessible by integration` while quota is clear. Use a call-through wrapper to observe that text in the returned `board.error`, then install the independent hold before returning the board to `observe`. Require the board request in the log, the returned hold, the earlier status and error, and zero board refusals. Promoting every captured board error to `blocked` must fail this case.

## Verification and delivery

- [ ] Run `pnpm exec tsc --noEmit`, then `pnpm exec vitest run tests/unit/github tests/unit/scheduling tests/unit/it tests/unit/delivery/board/github-board.test.ts`. The direct board suite covers pagination, retained cards, and repository issue publication on a clear-quota permission failure. Hosted Quality supplies the full build and unit gate.
- [ ] Complete `/review-implementation` against the issue diff before opening the PR, resolve accepted findings, and repeat affected checks. Archive the executed plan and add its journal entry per `wiki/MECHANICS.md`. Open the repository-template PR with `Closes #672` and record the review and verification.
- [ ] After hosted Quality and all required checks pass, merge under the repository delivery flow and synchronize `main`. Verify the merged head and clean worktree before removing the issue worktree and its local and remaining remote branches. Keep issue 533’s measurement on its current release through 15:55:42 UTC on 2026-11-26. Deployment belongs to the Overseer after that hold.
