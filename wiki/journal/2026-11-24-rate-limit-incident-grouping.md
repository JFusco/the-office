---
topics: [releases-and-incidents]
plans: [2026-11-24-group-repeated-github-rate-limit-observations-563-6ca584f77e.md]
---

# Group repeated GitHub rate-limit stops as one incident

On 2026-11-24, 890 of the ledger's 964 incidents were GitHub rate-limit errors, and each opened its own incident. GitHub writes a request ID of colon-separated hex groups into every rate-limit message, such as `D321:3A1B2C:47A892:E3DF94:6B05154C`. The cause normalizer replaced hex runs of 7 to 64 characters and decimal numbers, but kept the short groups, so every message normalized to different text and got its own fingerprint.

The normalizer now reads a run of three or more colon-separated groups of two or more hex digits as `<id>`. The rule runs after status codes are protected, so `HTTP 403:ab:cd` keeps its status, and before the bare-hex and number rules. Two groups (`12:30`) still read as a number, and a one-character group breaks the run. Decimal-only runs qualify, so a bare `12:30:05` also reads `<id>`.

Rate-limit errors that differ only in request ID, user ID and timestamp now share one normalized text and one fingerprint. Incidents already opened stay in history. An open subject moves to the new incident on its next observation, as for any changed fingerprint. The Office's REST quota is tracked separately in JFusco/the-office#533.

Evidence: `tests/unit/incidents/normalize-cause.test.ts` covers two live message shapes, a decimal-only ID, equal fingerprints and the boundary cases.

[Archived plan](../plans/2026-11-24-group-repeated-github-rate-limit-observations-563-6ca584f77e.md) · [Issue JFusco/the-office#563](https://github.com/JFusco/the-office/issues/563)
