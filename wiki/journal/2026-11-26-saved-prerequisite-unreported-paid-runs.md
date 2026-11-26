---
topics: [delivery-and-recovery]
plans: [2026-11-26-accept-explicit-paidruns-null-in-the-saved-prerequisite-handoff-da14a572b8.md]
issue: 'https://github.com/jfusco/the-office/issues/598'
issues: ['https://github.com/jfusco/the-office/issues/598']
---

# Saved-prerequisite handoff accepts an unreported paid-run count

A passed GitHub `implement` or `scope-repair` writer that declares prerequisites goes to the saved-prerequisite handoff, which adopts the saved candidate without replaying the writer. Its writer check required `paidRuns` to be exactly `0`. Only the implementation-continuation prompt defines that field. The GitHub writer prompts never mention it, the result schema allows `null`, and ordinary acceptance ignores it. A writer that left it `null` was therefore refused with "Saved result candidate or effects are unverified". Every recovery route re-reads the same saved result, so nothing could move the job. accessibility-standards GH-3 stopped this way on 2026-11-24.

The check now reads an unreported count as zero: `(result.paidRuns??0)===0`. A reported positive count is still refused, and every other writer, evidence, Effects, Git and provider gate is unchanged. The continuation and reroute paths keep their own reported-zero checks. `routeHeadFault` reads the same rule, so a `reconcile-implementation` resume for such a writer is now accepted.

The fixture the handoff tests use moved to its own module so the route-head suite can build the same saved artifacts. It gained an option for an `implement` job whose worktree the harness created before the writer ran.

[Issue #598](https://github.com/JFusco/the-office/issues/598)
