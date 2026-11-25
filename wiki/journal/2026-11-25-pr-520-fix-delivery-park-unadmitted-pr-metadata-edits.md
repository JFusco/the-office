---
pr: 'https://github.com/jfusco/the-office/pull/520'
issue: 'https://github.com/jfusco/the-office/issues/511'
issues: ['https://github.com/jfusco/the-office/issues/511']
topics: []
plans: []
draft: github-reconciliation
---

# PR #520: fix(delivery): park unadmitted PR metadata edits

## Why

- Auto-drafted from the merged pull request; add durable rationale when the PR does not carry it.

## What changed

- fix(delivery): park unadmitted PR metadata edits
- Merge remote-tracking branch 'origin/main' into codex/511-metadata-park
- Merge remote-tracking branch 'origin/main' into codex/511-metadata-park
- fix(scheduling): refuse a new review of a parked job
- Merge remote-tracking branch 'origin/main' into codex/511-metadata-park
- fix(delivery): post metadata park comment last
- fix(delivery): apply metadata park review repairs
- fix(delivery): queue a lane-only continuation once
- Merge remote-tracking branch 'origin/main' into codex/511-metadata-park

## Files

- `docs/office-process.md`
- `server/conversations/metadata-park-action.ts`
- `server/conversations/outbox.ts`
- `server/delivery/board/project-graphql.ts`
- `server/delivery/parking/advance-metadata-park.ts`
- `server/delivery/parking/card-resume-route.ts`
- `server/delivery/parking/decision-marker.ts`
- `server/delivery/parking/finish-metadata-park.ts`
- `server/delivery/parking/historical-metadata-park.ts`
- `server/delivery/parking/inspect-metadata-park.ts`
- `server/delivery/parking/metadata-park-freshness.ts`
- `server/delivery/parking/metadata-park-inventory.ts`
- `server/delivery/parking/metadata-park-words.ts`
- `server/delivery/parking/observe-metadata-parks.ts`
- `server/delivery/parking/park-comment.ts`
- `server/delivery/parking/park-unadmitted-metadata.ts`
- `server/delivery/parking/park-writes.ts`
- `server/delivery/parking/park.ts`
- `server/delivery/parking/publish-metadata-park.ts`
- `server/delivery/parking/record-metadata-park.ts`
