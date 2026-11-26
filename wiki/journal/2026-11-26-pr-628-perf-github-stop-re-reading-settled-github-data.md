---
pr: 'https://github.com/jfusco/the-office/pull/628'
issue: 'https://github.com/jfusco/the-office/issues/615'
issues:
  [
    'https://github.com/jfusco/the-office/issues/615',
    'https://github.com/jfusco/the-office/issues/533',
  ]
topics: []
plans: []
draft: github-reconciliation
---

# PR #628: perf(github): stop re-reading settled GitHub data

## Why

- Auto-drafted from the merged pull request; add durable rationale when the PR does not carry it.

## What changed

- perf(github): stop re-reading settled GitHub data
- Merge remote-tracking branch 'origin/main' into codex/615-settled-github-reads
- fix(github): apply settled-read review repairs
- Merge remote-tracking branch 'origin/main' into codex/615-settled-github-reads

## Files

- `docs/office-process.md`
- `server/conversations/merge-notice-cooldown.ts`
- `server/conversations/no-merge-notice.ts`
- `server/conversations/observe-github-merges.ts`
- `server/delivery/intake/dependabot/adopt.ts`
- `server/delivery/intake/dependabot/link-pr.ts`
- `server/delivery/intake/dependabot/qualify.ts`
- `server/delivery/intake/dependabot/track-alerts.ts`
- `server/delivery/intake/dependency-bots/adopt.ts`
- `server/delivery/intake/dependency-bots/pin-courier.ts`
- `server/delivery/intake/dependency-bots/relink-pin-courier.ts`
- `server/delivery/intake/dependency-bots/wiki-sync.ts`
- `server/delivery/intake/pr-discovery.ts`
- `server/delivery/intake/pr-inventory.ts`
- `server/delivery/intake/shared-pr-inventory.ts`
- `server/delivery/pipeline/github-delivery.ts`
- `server/scheduling/assignment-poll.ts`
- `src/shared.ts`
- `tests/unit/conversations/merge-notice-cooldown.test.ts`
- `tests/unit/conversations/no-merge-notice.test.ts`
