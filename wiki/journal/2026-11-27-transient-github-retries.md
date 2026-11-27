---
topics: [delivery-and-recovery]
plans: [2026-11-27-issue-592-retry-transient-github-delivery-stops-bac276030b.md]
---

# Retry transient GitHub stops automatically, including at draft

Delivery jobs that stopped on a transient GitHub failure waited for a person. Read retries covered only the `review` and
`lead-pr` stages and didn't recognize HTTP 499. Their three short attempts ran out in about seven and a half minutes and
were never reset. Nothing at all retried a blocked hands-off `draft`.

Brain GH-408, a git read timeout before any push, and GH-407, an uncertain card move after HTTP 499, had sat blocked
since 2026-11-24. A read-only check on 2026-11-27 showed GH-408 had pushed nothing. It also showed GH-407's card move had
in fact landed.

## Classification

- GitHub HTTP 408, 429, 499, 500, 502, 503 and 504 are transient.
- Uncertainty is classified before any transient read, so a write that needs read-back or can't be resent never counts
  as a temporary read.

## Retry timing

- **Short attempts:** the existing ones keep their delays, and writer timing is unchanged.
- **Persistent 5xx:** an eligible persistent GitHub 5xx read then gets counted waits of 15, 30 and 60 minutes before the
  job goes to a person.
- **Rate limits:** a rate-limit stop waits for the provider's reset without spending attempts, for up to six hours.
- **Budget:** scoped to the stage and head. Legacy and exhausted records carry forward.

## Draft retries

- **Admission.** A hands-off draft is retried only with no unsettled Effects, no uncertain receipts, no merge attempt
  and no park.
- **Checks.** Its ownership and head are checked when the retry is planned and again when it is claimed.
- **No age limit.** A saved draft is never refused only because of its age.
- **Board moves.** Re-entry is read-back-first. A card move that landed is verified with no mutation. A move proven
  absent is recorded definitively and stays blocked for the operator. It is never resent or retried.
- **Pushes and PRs.** An existing PR is adopted only after its identity, link and head are checked. Only an
  authorized repair of the job's own numbered PR may update it from an ancestor.
- **Lost push responses.** A lost push response is settled by read-back under its original intent, and never pushed
  again.
- **First issue-link comment.** By Joe's decision, normal draft acceptance may post the first issue-link comment that is
  proven unsent, through its Effect, after the board move is verified. Where history can't prove that comment was never
  sent, the existing refusal stays.

## While a retry is pending

- **Outbox:** the stop is kept out of the outbox.
- **Incident ledger:** reads it as an expected retry.
- **Overseer:** told about the resulting relabels.

## Evidence

The tests under `tests/unit/delivery/attempts/`, among them `retry-entry`, `draft-retry`, `transient-schedule`,
`quota-wait` and `legacy-retry`. Also `tests/unit/scheduling/temporary-read.test.ts` and
`tests/unit/incidents/sources/delivery-retry-wait.test.ts`.

Implementation review `cdb52586` accepted twelve findings, and all of them passed the independent recheck. Among
them: a quota episode now survives an uncaptured quota stop, so the six-hour cap holds. A migrated legacy quota timer
no longer aborts reconciliation. The retry decision is repeated after the dependency refresh. And board recovery
requires every bound card.

[Archived plan](../plans/2026-11-27-issue-592-retry-transient-github-delivery-stops-bac276030b.md) · [Issue JFusco/the-office#592](https://github.com/JFusco/the-office/issues/592)
