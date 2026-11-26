---
status: "implemented"
executed: true
evidence: ["https://github.com/JFusco/the-office/issues/589 and tests/unit/delivery/intake/dependency-bots/wiki-sync.test.ts"]
source_tool: "claude"
source: "review-plan run 2340e656 refined plan"
topics: ["delivery-and-recovery"]
digest: "fbe538826b10ca7b6891ea55a460e7db90222cc562820938cec28954bef5616f"
---

# #589 Accept the optional `[skip release]` suffix on wiki PR titles

The reviewed branch point for `codex/589-wiki-sync-skip-release` is `2397e7e`. The installed wiki writer emits unmarked PR titles. `accessibility-standards` tests its three marked titles as squash subjects. The issue reported six title-based refusals there. [Issue #589](https://github.com/JFusco/the-office/issues/589)

## Edits

- [ ] In `server/delivery/intake/dependency-bots/wiki-sync.ts`, add a local `SKIP_RELEASE` constant containing exactly `' [skip release]'`, including one leading ASCII space. Define `titled(title: unknown, canonical: string)` to return `title === canonical || title === canonical + SKIP_RELEASE`.
- [ ] In `wikiSync.refusal` at line 27, use `!titled(p.title, canonical)` with `docs(wiki): reconcile PR #<parent>` built from the branch capture at line 25. At line 30, use `!maintenanceTitles.some(canonical => titled(p.title, canonical))` on the existing two-title array, which can stay inline. Limit both replacements to the title operand of the existing body-and-title check and use its existing refusal text.
- [ ] In `docs/wiki-sync-adoption.md` at line 10, describe the one optional literal suffix on the numbered, missed-merges and weekly titles. `adoptOne`, `reverify`, `headGuard` and `automationMergePolicy` all obtain wiki qualification from `wikiSync.refusal`. The Office writer’s `scripts/validate_wiki_pr_body.cjs` serves its own PR format.

## Regression tests

Use the isolated `fixture()` in `tests/unit/delivery/intake/dependency-bots/wiki-sync.test.ts`.

- [ ] On `bot/wiki-sync/139`, set the title to `docs(wiki): reconcile PR #139 [skip release]`. Assert an empty refusal, automatic adoption, one tracking issue and both the PR card and issue card In review.
- [ ] Extend the maintenance cases on `bot/wiki-maintenance` to cover `docs(wiki): reconcile missed merges [skip release]` and `docs(wiki): weekly issue and merge reconciliation [skip release]` with their valid fixture bodies. Assert qualification and adoption. Retain the existing unmarked cases for all three canonical titles.
- [ ] Vary only the title on otherwise qualifying fixtures. Reject `#138` on branch `/139` with and without the marker. Also reject a `[skip ci]` suffix, free-text suffix, marker without its leading space, doubled marker, whitespace after the marker and text before the canonical title. Exercise `[skip ci]` on a valid maintenance PR as well. Assert a refusal and zero provider writes for each case.
- [ ] For the merge-policy test, adopt the unmarked numbered PR and discover the existing-PR job for `GH-5` and PR 314. Then set the PR title to `docs(wiki): reconcile PR #139 [skip release]` and assign the fixture’s wiki-aware runner with `f.delivery.execute = execute`. Assert that `automationMergePolicy(f.delivery, { ...job, head: pr.head.sha }, pr)` resolves to `'wiki-sync'` using the real `wikiSync.refusal`.
- [ ] For retry, start with the marked numbered PR in the eligible In review lane. Seed its historical `refused` wiki-sync adoption with that same title and emit the refusal event through the store. Assert that `dependabot:314` is open. Call `adopt()` once with the title, head and PR card as they were. Assert that the original adoption ID is now `adopted` with its tracking issue and that the stored `dependabot:314` item is `resolved`.

## Mutation checks

Apply each one-line mutation individually, run the focused wiki-sync test file, record the failure and restore the line.

- [ ] Drop the marked branch of `titled`. The marked positive cases must fail.
- [ ] Use `String(title).startsWith(canonical)`. The foreign-suffix and doubled-marker refusals must fail.
- [ ] Drop the marker’s leading space. The valid marked cases and the no-space refusal must fail.
- [ ] Restore the original numbered comparison at line 27. The merge-policy assertion must fail at the policy call with `Automation merge is blocked: the wiki PR does not match its source merge`.
- [ ] Allow any parent number in the marked numbered title. The `#138 [skip release]` refusal on branch `/139` must fail.
- [ ] Restore `.includes(p.title)` at line 30. Both marked maintenance cases must fail.

## Verification and wiki record

- [ ] With the mutations restored, run `pnpm exec tsc --noEmit`, then `pnpm exec vitest run tests/unit/delivery/intake/dependency-bots tests/unit/delivery/readiness/automation-merge.test.ts tests/unit/conversations`. Use hosted `quality` for the full `pnpm build` and `pnpm test` gate before merge.
- [ ] After implementation, archive the executed plan per `wiki/MECHANICS.md` with its executed status, actual execution evidence and `--topic delivery-and-recovery`. Add `wiki/journal/2026-11-25-wiki-sync-skip-release-titles.md` and one sentence to `wiki/topics/delivery-and-recovery.md`. Run `node scripts/wiki/build-graph.cjs`, include its changed outputs in the same delivery and run `node scripts/wiki/check.cjs`.

## Expected rollout

The next automatic poll can retry an open, otherwise qualifying PR when the opted-in hands-off project is active, pickup is enabled, the PR is unheld and its card is eligible or absent. Successful adoption resolves its refusal item. Issue #589 reported a conflict on PR #12. If it still conflicts, `observeAutomationMerge` waits for GitHub to report `mergeable === true`; current-head checks and repository merge rules govern the merge. Issue #591 covers conflict handling.
