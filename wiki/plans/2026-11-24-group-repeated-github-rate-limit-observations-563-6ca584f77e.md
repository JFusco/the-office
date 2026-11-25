---
status: "implemented"
executed: true
evidence: ["https://github.com/JFusco/the-office/issues/563 and tests/unit/incidents/normalize-cause.test.ts"]
source_tool: "claude"
source: "review-plan run fdc93e83 refined plan"
topics: ["releases-and-incidents"]
digest: "6ca584f77ef076419230f17e03f4d6b971de01adcaaaeeb5d34df4177e1a4f10"
---

# Group repeated GitHub rate-limit observations (#563)

- [ ] In `server/incidents/normalize-cause.ts`, insert one replacement immediately after `STATUS` protection at line 23 and before the bare-hex rule at line 24. Replace each match of `/\b[0-9a-f]{2,}(?::[0-9a-f]{2,}){2,}\b/gi` with `<id>`. Decimal-only groups qualify. A bare `12:30:05` therefore becomes `<id>`. The earlier date rule consumes a dated timestamp as `<time>`.
- [ ] In `tests/unit/incidents/normalize-cause.test.ts`, use the raw message `HTTP 403: API rate limit exceeded for user ID {user}. If you reach out to GitHub Support for help, please include the request ID {id} and timestamp {stamp} UTC.` Use `486049`, `D321:3A1B2C:47A892:E3DF94:6B05154C`, and `2026-11-24 13:36:36` for the first message. Use `712883`, `D192:33B27B:48AB921:F4DE951:6B06153A`, and `2026-11-23 08:12:09` for the second. Assert that each complete result equals `http 403: api rate limit exceeded for user id <n>. if you reach out to github support for help, please include the request id <id> and timestamp <time> utc.` Repeat the first row with the decimal-only ID `1234:5678:9012:3456:7890` and the same expectation. The request ID and final period both fit within the 200-character result.
- [ ] In that regression, pass each independently normalized result as `cause.text` to `fingerprint(cause, subject)`. Use author `harness`, source `provider-error`, provider and stage `github`, and kind `read-failed`. Use the same subject with project ID `p`, kind `provider`, and ID `github`. Require equal digests. The existing fingerprint suite covers changes to the individual cause fields.
- [ ] Add exact boundary cases in the same suite. `peer fe80:12ab:34cd:56ef` yields `peer <id>`, `mac 3c:22:fb:12:ab:cd` yields `mac <id>`, and `12:30:05` yields `<id>`. `HTTP 403:ab:cd` yields `http 403:ab:cd` because status protection runs first. Keep every existing assertion, including `12:30` yielding `<n>`. A one-character group or `::` breaks a run. With `fe80:0:1:ab`, the ordinary number rule yields `fe80:<n>:ab`.
- [ ] Update the `cause` row in `docs/overseer.md:216` with one sentence explaining the group threshold, `<id>`, and why varying a request ID permits otherwise identical harness causes to group. `docs/office-process.md:1141` describes fingerprint fields and contains no placeholder list.
- [ ] Run the focused normalization and fingerprint suites and the repository type-check during implementation. Require `pnpm run verify:ci` locally or the corresponding hosted build and full unit checks before merge. Run local gates sequentially. After execution, confirm the plan archive, journal and topic updates and their checks under `wiki/MECHANICS.md` in the same delivery.

`providerErrors` already passes harness text through `normalizeCause`, and `groupCandidates` groups subjects by the resulting fingerprint. The rule applies wherever matching text reaches the normalizer. In `failedIntakeRun`, it can make two Jira error prefixes agree when their IDs differ, subject to the existing typed-failure and timing checks. On a changed fingerprint, ordinary reconciliation moves an open subject on its next observation and retains its earlier incident, as covered by `tests/unit/incidents/plan-sync.test.ts:150`. The 890 incidents reported on 2026-11-24 stay in history. Quota consumption is tracked separately in #533.
