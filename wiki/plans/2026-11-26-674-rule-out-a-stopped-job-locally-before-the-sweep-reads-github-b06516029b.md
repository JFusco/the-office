---
status: "implemented"
executed: true
evidence: ["https://github.com/JFusco/the-office/issues/674 and tests/unit/delivery/repairs/refresh-stopped-conflicts.test.ts"]
source_tool: "repository"
source: "/private/tmp/claude-505/-Users-joe-fusco-Projects-the-office--claude-worktrees-bot-pr-conflicts-a3aa34/823af3b5-e91c-4845-8fe1-e6347c65a303/scratchpad/plan-674-final.md"
topics: ["delivery-and-recovery"]
digest: "b06516029b3d7aa6162eb6a627164c23ff037ab8d5f44a37377c7a5692742dd6"
---

# #674 — Rule out a stopped job locally before the sweep reads GitHub

- [ ] The existing #590 session owns `JFusco/the-office#674`. Tell Harness who owns it. Use the existing issue, record the independent plan review, and branch from current `origin/main` as `codex/674-stopped-sweep-local-eligibility`.

## Change

- [ ] In `server/delivery/repairs/refresh-stopped-conflicts.ts`, use the row already selected by `cachedConflict` at lines 15–19. On its existing match for PR number, open non-draft state, head SHA, target and `mergeable === false`, return the candidate shape the shared predicate reads. Take `state` and `draft` from the row. Use `merged_at: null`, `mergeable: false`, `head: { sha: row.head, ref: job.branch }` and `base: { ref: row.base }`. A cache miss yields no candidate. The cache supplies the SHA and target. `job.branch` supplies the expected source ref until the live read.
- [ ] In `refreshStoppedConflicts`, retain the stopped `lead-pr` filter before the cache lookup, plus `admissible` and `refreshSettled`. Before cloning the job or reading GitHub, require `refreshEligible(delivery.store, job, cached, false, true)` from `./refresh-conflicted`. On refusal, continue to the next job. Calling the existing predicate on each sweep covers the three-update budget, review or accepted-refresh proof, merge switch or matching head authorization, saved worktree/branch/PR, merge attempt or pending approval, pending repair findings, pause, drain and holds.
- [ ] For candidates that pass, retain `delivery.verifyPR(job, true)` for strict repository, target and native issue-link verification. Preserve the same-object check, `isDeepStrictEqual` comparison and fresh `admissible` check after the await. Pass the live PR to `refreshConflicted(delivery.store, job, pr, true)` so it checks the actual source branch, SHA, conflict, current eligibility and settlement before queuing.
- [ ] Update the stopped-review **Trigger** bullet in `docs/office-process.md`. A matching cached conflict costs a provider read only when the local refresh rules could admit the job. Queuing still requires live confirmation and the post-read checks.

## Verification and delivery

- [ ] In `tests/unit/delivery/repairs/refresh-stopped-conflicts.test.ts`, use the isolated `stopped()` fixture with both cached and live PRs conflicting. Exercise four otherwise eligible jobs independently: three saved `update-base` steps including a source update, neither form of head proof, merges disabled without authorization for the head, and an empty saved `job.worktree`. After setup, snapshot the job and `reads()`. Await two consecutive `sweep()` calls on the same fixture. After each, require the original command count, a job equal to its snapshot and `events()` equal to zero.
- [ ] Retain the GH-189 `delivery.observe()` integration test. For the direct passing case, capture the `state.calls` baseline on `stopped()`. The first `sweep()` must add exactly two entries in order: the `gh api` read of `repos/JFusco/cms-field-vocabulary/pulls/200`, then `gh pr view 200 --repo JFusco/cms-field-vocabulary --json closingIssuesReferences`. Require `update-base` / `queued` and one `pr-conflict-refresh-queued` event. The second `sweep()` must add zero commands and leave the event count at one. Also verify that disabled merges with authorization for exactly `job.head` still permit live verification and queuing.
- [ ] Mutation-check only the new pre-read eligibility call. Bypassing it must fail the zero-call assertions while the direct passing control still succeeds. Restore the guard. Run `pnpm exec tsc --noEmit`, then `pnpm exec vitest run tests/unit/delivery/repairs tests/unit/delivery/pipeline/observe-prs.test.ts tests/unit/delivery/readiness tests/unit/delivery/publication`. Retain the existing live-refusal, race and save-rollback coverage.
- [ ] Archive the executed plan, add the journal entry and update the `delivery-and-recovery` topic in the same delivery per `wiki/MECHANICS.md`. Build and check the wiki. Open a separate PR closing #674, record independent implementation review, and require hosted `quality` to pass `pnpm build` and `pnpm test`. Merge after all required checks pass, then clean up the merged issue branch and its worktree under `AGENTS.md`.
