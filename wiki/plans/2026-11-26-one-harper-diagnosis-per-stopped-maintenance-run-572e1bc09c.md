---
status: "implemented"
executed: true
evidence: ["https://github.com/JFusco/the-office/issues/588 and tests/unit/knowledge/blocker-followups.test.ts"]
source_tool: "claude"
source: "review-plan run e5d6ed35 refined plan"
topics: ["planning-and-learning"]
digest: "572e1bc09cbd3aad3030ff58531986b39e9cbb829804fcc35b4c6a4c13c702bf"
---

# One Harper diagnosis per stopped maintenance run

Target `JFusco/the-office#588` on `codex/588-maintenance-stop-key`, reviewed against `1c531f4`.

The 2026-11-25 00:48Z snapshot on release `5b3ba39` records four blocker wordings and three Harper sends for Brain run `fc5437de-3dbd-4507-a487-df89f52cbc6f`. `GitHubMaintenance.reconcile()` appends a read-back step and updates `run.error` when verification remains incomplete. The maintenance caller hashes that wording, so answering one request can immediately admit another.

## Admission and compatibility

- [ ] Add `server/knowledge/maintenance-handoff-key.ts`. Have `maintenanceStopKey(run: Pick<MaintenanceRun, 'status' | 'stage' | 'endedAt'>)` return `maintenance-stop:` followed by `learningDigest([run.status, run.stage, run.endedAt])` using the recorded values. The follow-up ID `maintenance:<run.id>` scopes the comparison to one run.
- [ ] In that module, give `adoptLegacyKey(item, stopKey)` access only to `handoffMaterialKey`. Replace a defined unprefixed value with `stopKey`. Leave an absent value for the first-admission check and a prefixed value for comparison.
- [ ] At `server/knowledge/blocker-followups.ts:138`, inside the unresolved-and-enabled gate of `reconcileBlockerFollowups()`, compute the stop key, call `adoptLegacyKey()`, then pass the same key to `handoff()`. Do this after `observe()` so `legacyMaterialKey()` can backfill pre-key records first. If backfill lacks evidence, `handoff()` already checks for bound Harper requests. Use its existing open-request, claim, worker, pause, drain, hold and repair checks. The comparison at line 155 saves a key conversion even when the message count stays fixed.
- [ ] Update the comments on `handoff()` and `materialKey()` to identify the maintenance call site. Keep `actionKey` private in `server/knowledge/handoff-admission.ts`. In `tests/unit/knowledge/handoff-admission.test.ts`, use an investigation follow-up for the generic normalized-text example and retain its footer and changed-target assertions.

## AC2 and the Office process

**Maintenance AC2, approved by Joe Fusco on 2026-11-25.** Harper admits one read-only diagnosis per eligible stopped maintenance run. Morgan’s read-back diagnoses a different unverified or uncertain write discovered during the same stop. A different prerequisite reaches Harper when an eligible replacement run itself stops, under its own `maintenance:<replacement.id>` follow-up.

- [ ] Record this rule in the Harper paragraph at `docs/office-process.md:743–766`, before the generic text-key rule. Explain that `GitHubMaintenance.pump()` and `BrainMaintenance.pump()` select queued runs. Startup recovery can stamp a working run interrupted at `server/store/interrupted-work-recovery.ts:99–104`. A blocked or interrupted run never re-enters either pump. An unsuccessful read-back preserves its stop fields, and successful reconciliation can set `reconciled`. Morgan owns the eligible `unresolved` follow-up. Supersession, reconciliation and source loss take the original out of eligibility.
- [ ] Document conversion on the first reconciliation of an unresolved maintenance follow-up with knowledge enabled. A pre-change key belongs to that run’s only stop. For the incident record, conversion would leave the total at three historical sends. In the existing fenced/offline downgrade guidance, explain that a text-key build can admit one request solely from the key mismatch on each eligible converted follow-up once its previous request closes. Later rewordings can admit further requests.

## Behavioral verification

- [ ] Add `tests/unit/knowledge/maintenance-handoff-key.test.ts`. Use `knowledgeStore()` and `maintenanceRun()` with an explicit `endedAt`, exercise the helpers directly on stored records, and close the fixture in `finally`. In `read-backs keep the stop key`, assert the expected prefixed digest across error rewording and appended steps. In `each stop field changes the key`, vary status, stage and end time individually as synthetic inputs. Check conversion of an unprefixed key, absence of a key, and preservation of matching and different prefixed keys.
- [ ] Rewrite the maintenance example at `tests/unit/knowledge/blocker-followups.test.ts:317`. Answer the first diagnosis. Reconcile after a provider-footer change and again after changing the instruction from issue 7 to issue 8. Expect one total send for the stopped run at both points.
- [ ] Add `issue 588 admits only send-1` in the same file. Use `knowledgeStore('brain', …)`, a `brain-maintenance` stop with `endedAt` set to `2026-11-24T22:38:43.125Z`, and the four published excerpts in order. Reconcile on `Error: ownership-coverage-unavailable` and assert the first `send-1`. For each later observation, append a blocked `maintenance-readback` step, copy its excerpt into `run.error`, and reconcile. Keep `send-1` open through the 23:10:47 and 23:38:22 UTC observations. Answer it and reconcile on the 23:38:22 text **before applying the 00:07:11 text**. After the fourth observation, answer any open request and reconcile, then answer any remaining request and reconcile again. Assert four ordered history details, the sole Harper-to-Morgan request ID `harper-followup:maintenance:<run.id>:send-1`, and the stored stop key. Count answered requests as admissions. Use the excerpts as published without relying on production digest prefixes.
- [ ] Add `a stopped replacement gets its own diagnosis`. Give the original two identifiable writes and a blocker naming the first outstanding write. Admit and answer its diagnosis. Append a blocked read-back whose coverage verifies the first write and marks the second uncertain. Copy its distinct blocker naming the second write into `run.error`, as `GitHubMaintenance.reconcile()` does. Keep status, stage and `endedAt` fixed. Reconcile twice and assert that the original is still `unresolved`, its `nextAction` contains the second blocker, and it has exactly one send. Only then add a stopped replacement with a distinct ID and `supersedes: [original.id]`. Reconcile, answer the replacement and reconcile again. Assert that the original is `superseded` with one send and the replacement has exactly its own `send-1`.
- [ ] Add `saved legacy maintenance keys survive reopen` using `diskStore()` for three independent cases. Seed a bound, answered `send-1` and a historical text key for the latest wording, an earlier wording changed while the request was open, or an earlier wording whose history detail has been deleted and whose text differs from `nextAction`. Use the historical text derivation in setup. Save and reopen each store, reconcile twice and assert zero additional sends. Reopen again and read the converted stop key from disk. In the latest-wording case, make conversion the only pending change so the disk read proves reconciliation saved it.
- [ ] Add the disk control `a different prefixed stop admits one new diagnosis`. Seed the answered request with a prefixed key computed from different stop fields. Reopen and reconcile. Expect exactly one additional send and the current stop key. Answer it and repeat reconciliation to verify the count holds. This is a synthetic check of key comparison.

## Mutation checks and delivery evidence

- [ ] Apply each one-line mutation separately, run its focused case, record the failing assertion and restore the line. Dropping `status`, `stage` or `endedAt` must each fail its row of `each stop field changes the key`. Adding `(run as MaintenanceRun).error` to the digest input must fail `read-backs keep the stop key`. Passing `due(item)` to the maintenance `handoff()` must fail `issue 588 admits only send-1` and the original-run count in `a stopped replacement gets its own diagnosis` before supersession.
- [ ] Skipping the conversion assignment must fail `saved legacy maintenance keys survive reopen`. Adopting every defined key must fail `a different prefixed stop admits one new diagnosis`. Adopting an absent key must fail the first-send assertion in `issue 588 admits only send-1`.
- [ ] With all mutations restored, run `pnpm exec tsc --noEmit`, then `pnpm exec vitest run tests/unit/knowledge`. Hosted `quality` supplies the full build and unit-test gate. Record the actual replay, mutation and verification results in the PR. Put the issue’s separate observations about history and learning churn, first-send timing, IT rate-limit returns, investigation and CEC follow-ups, and read-only reply failures in the PR scope note.
- [ ] In the canonical PR body for `Closes #588`, map AC1–AC4 to the actual results in the existing verification section.

  - **AC1** — Cite `issue 588 admits only send-1` for the total after Morgan answers and reconciliation sees reworded blockers. Cite the rewritten issue-7/issue-8 example for the same-stop instruction change.
  - **AC2** — Restate Joe Fusco’s dated maintenance AC2 above. Cite `a stopped replacement gets its own diagnosis` for the original’s count with the second write visible and for the replacement’s own `send-1`. Cite the Harper paragraph in `docs/office-process.md` for the rule.
  - **AC3** — Cite `issue 588 admits only send-1` for the four ordered observations in the isolated Brain store and the complete list of admitted request IDs.
  - **AC4** — Cite `saved legacy maintenance keys survive reopen` for all three historical cases and the persisted conversion. Cite `a different prefixed stop admits one new diagnosis` for the comparison control.

- [ ] In the same delivery, archive the executed plan with `node scripts/wiki/archive-plan.cjs <plan> --status implemented --evidence <actual-evidence> --topic planning-and-learning`. Add a dated entry under `wiki/journal/` that repeats the PR’s maintenance AC2 wording and attributes it to Joe’s 2026-11-25 decision. Update `wiki/topics/planning-and-learning.md` with the admission rule, then run `node scripts/wiki/build-graph.cjs` and `node scripts/wiki/check.cjs`.
