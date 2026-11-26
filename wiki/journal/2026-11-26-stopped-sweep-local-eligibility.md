---
topics: [delivery-and-recovery]
plans: [2026-11-26-674-rule-out-a-stopped-job-locally-before-the-sweep-reads-github-b06516029b.md]
issue: 'https://github.com/jfusco/the-office/issues/674'
issues: ['https://github.com/jfusco/the-office/issues/674']
---

# The stopped-review sweep rules jobs out before reading GitHub

The #590 sweep read a stopped job's PR from GitHub whenever the cached row conflicted and the job was admissible. It cost two calls: the REST pull and its closing references. The refresh rules that can refuse a job on local state alone ran only after that read:
- the three-base-update budget;
- head proof;
- merge authority;
- a saved worktree, branch and PR.

A job they would always refuse stayed stopped with its cached conflict, so every observation pass read it again. The Harness session's Delivery 2 review flagged this cost. Joe, through Codex, asked for it as a separately reviewed follow-up.

The sweep now applies the same `refreshEligible` to the conflict the cache already established, before any read. The cache holds no branch, so the job's saved branch stands in until the live read checks the actual one. A job that could qualify is still verified on GitHub, rechecked after the read and queued through `refreshConflicted` exactly as before.

Evidence: `tests/unit/delivery/repairs/refresh-stopped-conflicts.test.ts`. Two consecutive sweeps make zero provider calls for a spent budget, a head without proof, disabled merges without head authorization, and an empty worktree. The passing case reads exactly the two PR calls once and queues once. Removing the new check fails exactly the four zero-read cases.

[Archived plan](../plans/2026-11-26-674-rule-out-a-stopped-job-locally-before-the-sweep-reads-github-b06516029b.md) · [Issue JFusco/the-office#674](https://github.com/JFusco/the-office/issues/674)
