---
topics: [delivery-and-recovery]
plans: [2026-11-26-590-refresh-a-pr-conflict-after-its-readiness-review-stops-74a1cbf3a7.md]
issue: 'https://github.com/jfusco/the-office/issues/590'
issues: ['https://github.com/jfusco/the-office/issues/590']
---

# A conflict after a stopped readiness review is refreshed

A hands-off job can stop at its readiness review for a reason that has nothing to do with a conflict. CMS GH-189 stopped on an unadmitted `pr-metadata` finding while its PR was clean. If main moves afterwards and the PR starts to conflict, no route picked it up:
- observation only visited watching jobs and merge-stage stops;
- the harness refresh only accepted a watching or claimed readiness review;
- the classified repair only accepted a conflict-only verdict.

Joe's requirement is that the Office resolves every PR conflict itself, so a person no longer has to.

Observation now sweeps jobs stopped at `lead-pr` (`refresh-stopped-conflicts.ts`). Only a cached row that shows the job's exact head conflicting with the target costs a provider read. A live strict read must confirm the conflict, and the job must be the same, unchanged and still admissible afterwards. The sweep then uses the existing refresh, with its eligible heads (team-reviewed or an accepted refresh head), its three-base-update budget and its settlement checks. It skips anything that has to be reconciled first: a park, a hold, a metadata repair bound to the head, an unfinished CI repair, a stop that needs its own reconciliation, a repair wait, an active owner or an unsettled write.

The refresh clears the stale stop and keeps the stopped verdict in the saved steps. Preparation and a fresh readiness review then decide again on the repaired head. Preparation also refreshes the cached mergeability, so a stale conflict in the cache costs no read. GH-195 follows the same rules; its spent metadata repair stays with issue #614.

Evidence: `tests/unit/delivery/repairs/refresh-stopped-conflicts.test.ts`, with each new guard mutation-checked.

[Archived plan](../plans/2026-11-26-590-refresh-a-pr-conflict-after-its-readiness-review-stops-74a1cbf3a7.md) · [Issue JFusco/the-office#590](https://github.com/JFusco/the-office/issues/590)
