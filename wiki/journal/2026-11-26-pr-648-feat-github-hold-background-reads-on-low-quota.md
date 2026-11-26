---
pr: 'https://github.com/jfusco/the-office/pull/648'
issue: 'https://github.com/jfusco/the-office/issues/635'
issues:
  [
    'https://github.com/jfusco/the-office/issues/635',
    'https://github.com/jfusco/the-office/issues/533',
  ]
topics: []
plans: []
draft: github-reconciliation
---

# PR #648: feat(github): hold background reads on low quota

## Why

- Auto-drafted from the merged pull request; add durable rationale when the PR does not carry it.

## What changed

- feat(github): hold background reads on low quota
- Merge remote-tracking branch 'origin/main' into codex/635-quota-governor
- Merge remote-tracking branch 'origin/main' into codex/635-quota-governor

## Files

- `docs/office-process.md`
- `server/cec/mailbox.ts`
- `server/delivery/intake/dependabot/adopt.ts`
- `server/delivery/intake/dependabot/track-alerts.ts`
- `server/delivery/intake/dependency-bots/adopt.ts`
- `server/delivery/intake/dependency-bots/refusal-memo.ts`
- `server/delivery/intake/dependency-bots/wiki-sync.ts`
- `server/delivery/intake/intake-under-way.ts`
- `server/github/call-outcome.ts`
- `server/github/github-calls.ts`
- `server/github/github.ts`
- `server/github/metered-runner.ts`
- `server/github/quota-governor.ts`
- `server/github/quota-refusal.ts`
- `server/github/rate-limit-samples.ts`
- `server/it/delivery-recoveries.ts`
- `server/it/quota-deferral.ts`
- `server/office/listener-health.ts`
- `server/office/service-ticks.ts`
- `server/scheduling/assignment-poll.ts`
