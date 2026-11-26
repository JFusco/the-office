---
status: "implemented"
executed: true
evidence: ["tests/unit/github/pr-evidence.test.ts and tests/unit/leadership/goal-evidence.test.ts (JFusco/the-office#673)"]
source_tool: "repository"
source: "/Users/joe.fusco/.codex/review-runs/ad412866-c601-41cd-950e-89cf1444cfca/final.md"
topics: ["office-ui-and-telemetry"]
digest: "795cc2f5677ae13b084b360942a0dc8297caa20ecf568cbdf40474589f68cd54"
---

# Issue 673 — clip bounded evidence at a complete UTF-8 character

## Regression tests and helper edit

- [ ] Complete independent plan review before editing `codex/673-utf8-description-cut`, based on `origin/main` at `ce9e7c68`.
- [ ] In `tests/unit/github/pr-evidence.test.ts:224` and `tests/unit/leadership/goal-evidence.test.ts:86`, use `prefix = 'a'.repeat(8189)` and pass `prefix + '😀'` to `githubPRDescription` and `azurePRDescription` respectively. Assert `description === prefix` and `descriptionTruncated === true` for each. Against the original helper, both equality assertions must fail on the extra U+FFFD because it occupies the same three bytes as the partial emoji. Retain both existing all-emoji regressions.
- [ ] In the GitHub suite, test two literal U+FFFD endings. For `'a'.repeat(8186) + '\uFFFD' + '😀'`, expect exactly `'a'.repeat(8186) + '\uFFFD'`. For `'a'.repeat(8189) + '\uFFFD' + 'x'`, expect exactly `'a'.repeat(8189) + '\uFFFD'`. Assert `descriptionTruncated === true` in both cases. The first cut lands inside the emoji. The second lands immediately after the complete U+FFFD.
- [ ] In the leadership suite, call `boundedEvidence(prefix + '😀', limit)` at limits `8190`, `8191` and `8192`. Assert `text === prefix`, `bytes === 8193` and `truncated === true` in every row.
- [ ] Limit the production edit to `boundedEvidence` in `server/leadership/goal-evidence.ts:8–14`. Build `raw` with `Buffer.from(sanitize(value))` and set `end = Math.min(bytes, raw.length)`. While `end > 0 && end < raw.length && (raw[end] & 0xC0) === 0x80`, decrement `end`. This examines the first excluded byte and backs up to the split character’s lead byte. Replace the decode-and-trim loop with a UTF-8 decode of `raw.subarray(0, end)`. Return that text, `raw.length` as the original sanitized byte count, and `raw.length > bytes` as the truncation flag.

The shared edit reaches `githubPRDescription` at `server/github/pr-evidence.ts:5` and `azurePRDescription` at `server/leadership/goal-evidence.ts:18`. Both project the text and flag at the 8,192-byte limit. Azure document and error callers use the same helper at 32,768 and 500 bytes respectively.

## Verification and delivery

- [ ] Obtain independent `/review-implementation` before opening the PR. On the reviewed revision, run `pnpm exec tsc --noEmit` followed by `pnpm exec vitest run tests/unit/github/ tests/unit/leadership/`. Use hosted Quality for the full build and unit suite.
- [ ] Archive the executed plan with evidence, add the dated journal entry, update the affected existing wiki topic and refresh the wiki graph in this delivery per `wiki/MECHANICS.md`. Verify the hosted Wiki integrity check.
- [ ] Open a separate PR with `Closes #673` and record the review and verification. Merge after issue 672’s PR has merged and hosted Quality and the required checks pass. Synchronize local `main`.
- [ ] Confirm issue 673’s branch tip matches the PR head that merged. Remove its clean worktree, local branch and any surviving remote branch at that head per `AGENTS.md:240–245`.
- [ ] Leave deployment to the Overseer after issue 533’s measurement hold ends at 15:55:42Z.
