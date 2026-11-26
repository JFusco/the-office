---
topics: [planning-and-learning]
plans: [2026-11-26-one-harper-diagnosis-per-stopped-maintenance-run-572e1bc09c.md]
issue: 'https://github.com/jfusco/the-office/issues/588'
issues: ['https://github.com/jfusco/the-office/issues/588']
---

# One Harper diagnosis per stopped maintenance run

Harper hands a blocker follow-up to Morgan as one read-only diagnosis at a time, and sends another only when what is due changes (JFusco/the-office#535). For a maintenance follow-up, "what is due" was the hash of `run.error`. Each unsuccessful read-back rewrites that field in the read-back model's own words. On 2026-11-24/25, Brain run `fc5437de` was stopped on `ownership-coverage-unavailable`, and its follow-up saw four wordings of the same block. Harper sent three paid diagnoses, and all three gave the same answer.

A maintenance follow-up is now keyed on its run's own stop: `maintenance-stop:` plus a digest of the run's status, stage and end time (`server/knowledge/maintenance-handoff-key.ts`). Both maintenance pumps take only queued runs, and start-up recovery only stamps a run left working. A stopped run therefore never stops again. A read-back adds a step and new wording, and the run's only later status is reconciled, which ends hand-offs.

**Maintenance AC2, approved by Joe Fusco on 2026-11-25.** Harper admits one read-only diagnosis per eligible stopped maintenance run. Morgan's read-back diagnoses a different unverified or uncertain write discovered during the same stop. A different prerequisite reaches Harper when an eligible replacement run itself stops, under its own `maintenance:<replacement.id>` follow-up.

A key saved before this change came from that run's only stop. It is read as the stop key by its shape (no prefix), not by re-hashing text the store may hold redacted. It is converted on the follow-up's first reconciliation, so the upgrade sends nothing. An older build reads a stop key as new: it can send once for each converted follow-up, and again for each later rewording.

Evidence: `tests/unit/knowledge/blocker-followups.test.ts` covers the following:
- `issue 588 admits only send-1` replays the four texts.
- `a stopped replacement gets its own diagnosis` covers Joe's AC2 rule.
- `saved legacy maintenance keys survive reopen` and `a different prefixed stop admits one new diagnosis` cover the upgrade.

`tests/unit/knowledge/maintenance-handoff-key.test.ts` covers the key itself. Ten one-line mutations of the new guards each fail a named test.

Not changed here, each its own concern:
- History and learning churn on each rewording.
- The first diagnosis being sent before the Office's own read-back.
- IT recoveries diagnosed again after a rate-limit return.
- Investigation and CEC follow-ups.
- Harper replies that fail the read-only check.

[Archived plan](../plans/2026-11-26-one-harper-diagnosis-per-stopped-maintenance-run-572e1bc09c.md) · [Issue JFusco/the-office#588](https://github.com/JFusco/the-office/issues/588)
