---
status: "implemented"
executed: true
evidence: ["tests/unit/delivery/recovery/implementation/saved-prerequisite-handoff.test.ts", "tests/unit/incidents/repair/route-head.test.ts", "review-plan run 020d5409-3b00-4cc8-9a30-07062b6323e2 complete"]
source_tool: "claude"
source: "JFusco/the-office#598"
topics: ["delivery-and-recovery"]
digest: "da14a572b851f654cbca21c61dce585ea9fe7354aa8cc25f1929a2479bb90e89"
---

# Accept explicit `paidRuns: null` in the saved-prerequisite handoff

JFusco/the-office#598 addresses the refusal reported for accessibility-standards GH-3. `ResultSchema` requires `paidRuns` and preserves explicit null. The supplied historical readback located the refusal at the strict-zero comparison in `savedPrerequisiteOriginal`.

## Runtime change

- [ ] In `server/delivery/recovery/implementation/saved-prerequisite-handoff.ts:60`, replace only `result.paidRuns===0` with `(result.paidRuns??0)===0`. This accepts null and zero after parsing and refuses every positive count. Preserve the raw result, the refusal text `Saved result candidate or effects are unverified`, every adjacent condition and all later proof checks.
- [ ] Verify the runtime diff is confined to that expression. `acceptStageResult` and `executeRequest` reach it through `handoffSavedPrerequisites`. `routeHeadFault` reaches it through `HANDLER_RULES.savedPrerequisiteOriginal`. The reroute and continuation checks at `server/delivery/pipeline/accept-stage-result.ts:130,212` and `server/delivery/recovery/implementation/implementation-continuation.ts:5,33` require a reported zero. The existing writer schema, prompts, incident routes and documented stage boundaries serve this change as written.

## Fixture and regression tests

- [ ] Extract `fixture()` into `tests/unit/delivery/recovery/implementation/saved-prerequisite-fixture.ts`. Move its registry, `head`, `oldHead` and `cleanupFixtures` together. Register `afterEach(cleanupFixtures)` in both test suites to restore spies, close fixture stores and remove temporary roots. Preserve the route suite’s teardown for `world()` stores. Retain the injected command runner and temporary native root.
- [ ] Keep the current fixture defaults, including `paidRuns: 0`. For each new case, set `f.result.paidRuns` before `normal()` or `prepareRecovery()` so the saved step, result file, completion digest and transcript agree. Have `prepareRecovery()` save the step under `job.stage`. Add a default-off fixture option for a stopped `implement` job with its harness-created worktree and branch recorded and `job.head === ''`. Use the original `job.worktree || repo` consistently for the assignment scope, transcript cwd, native directory and returned native path.
- [ ] In `tests/unit/delivery/recovery/implementation/saved-prerequisite-handoff.test.ts`, exercise ordinary `GitHubDelivery.step` with null for `scope-repair` and legacy `implement`. For legacy `implement`, start with empty head, worktree and branch and spy `harnessDelivers` to false as in the existing test at line 220. Require exactly one original writer call, `savedPrerequisiteHandoff.originalWorkId === f.original.id`, the candidate head and declared prerequisites on the job, `review` with status `queued`, and explicit null in the saved step. Expect zero coordination requests and zero Effects rows. With `1` on ordinary `scope-repair`, expect exactly one writer call, `scope-repair` with status `blocked`, the refusal text in `job.detail`, an absent handoff and zero Effects rows.
- [ ] In the same suite, run null through `executeRequest` for stopped `scope-repair` and harness-created `implement` with an empty head. After `prepareRecovery()`, set the request back to `queued` and call `executeRequest` under `withAssignment` for its reconciliation reader. Supply `f.execute` and a session bridge whose synchronous `forProject` returns fresh, clear ownership. Require a completed request, the handoff bound to `f.original.id`, the saved candidate and prerequisites, `review` with status `queued`, and the original step still reporting null. With `1` on the stopped `implement` job, require a blocked request with the refusal text in `request.detail`, the job still at `implement` with status `blocked`, and an absent handoff. Expect zero worker calls and zero rows in the isolated Effects table for both request outcomes.
- [ ] In `tests/unit/incidents/repair/route-head.test.ts`, prepare a fresh stopped `scope-repair` fixture for each count. Call `routeHeadFault(f.store, f.job, 'reconcile-implementation', f.original.id, rules)` with `HANDLER_RULES`, wrapping only `savedPrerequisiteOriginal` to pass `f.nativeRoot` to the real function. Require a null fault for explicit null and a fault containing the writer-check refusal for `1`. Keep the existing stale-writer and missing-completion cases.

## Verification and delivery

- [ ] Run `pnpm exec tsc --noEmit` and `pnpm exec vitest run tests/unit/delivery/recovery/implementation/ tests/unit/incidents/repair/` serially. The existing zero-count cases cover compatibility. The harness-shaped request and real route-reader cases provide the GH-3 regression evidence on synthetic records.
- [ ] Apply each one-line mutation independently and run the two touched test files. Restoring `result.paidRuns===0` or using `(result.paidRuns??1)===0` must fail a new null-success assertion. Removing the count condition or using `(result.paidRuns??0)<=1` must fail a new positive-refusal assertion. Record the failing assertion for each mutation, restore the intended guard between runs, and rerun the focused suites on the final diff. Require hosted `quality` to pass both `pnpm build` and `pnpm test` before merge.
- [ ] In the implementation delivery, run `node scripts/wiki/discover-plans.cjs` and archive the executed plan with `node scripts/wiki/archive-plan.cjs "<executed plan path>" --status implemented --evidence "<actual verification evidence>" --topic delivery-and-recovery`. Add a dated entry under `wiki/journal/` linking the archive and topic. Update `wiki/topics/delivery-and-recovery.md` to record that an otherwise verified saved writer may report zero or explicit null, and that a positive count prevents adoption. Run `node scripts/wiki/build-graph.cjs` and `node scripts/wiki/check.cjs` after the edits.

## GH-3 after deployment

Joe owns any live resume for incident `inc-e4a057f03a3e73d4`, through a repair bound to issue 598 or an operator `reconcile-implementation` request naming writer `6a450c2f-8ef9-452a-b9b0-698d687c2789`. A null route fault establishes eligibility for that writer. Execution still checks ownership, Git and provider state. Admission, the working state and the final outcome have separate writes, so a refusal can leave a blocked request. On success the handoff writes its proof file, then adopts the candidate and queues review in one transaction. It starts zero workers and sends zero Effects. Prerequisite completion still gates review dispatch, and independent review and QA remain required.
