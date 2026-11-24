---
pr: 'https://github.com/jfusco/the-office/pull/557'
issue: 'https://github.com/jfusco/the-office/issues/532'
issues: ['https://github.com/jfusco/the-office/issues/532']
topics: []
plans: []
draft: github-reconciliation
---

# PR #557: feat(repair): grant one writer restart after a fix

## Why

- Auto-drafted from the merged pull request; add durable rationale when the PR does not carry it.

## What changed

- feat(repair): grant one writer restart after a fix
- Merge remote-tracking branch 'origin/main' into codex/532-repair-release
- fix(delivery): harden salvage retries and restart
- Merge remote-tracking branch 'origin/main' into codex/532-repair-release
- Merge remote-tracking branch 'origin/main' into codex/532-repair-release
- Merge remote-tracking branch 'origin/main' into codex/532-repair-release

## Files

- `AGENTS.md`
- `docs/office-process.md`
- `docs/overseer.md`
- `server/delivery/attempts/restart-stopped-writers.ts`
- `server/delivery/attempts/restart-writer.ts`
- `server/delivery/attempts/salvage-worktree.ts`
- `server/incidents/repair/assess-resumes.ts`
- `server/incidents/repair/dispatch-resume.ts`
- `server/incidents/repair/dispatch-writer-release.ts`
- `server/incidents/repair/repair-freeze.ts`
- `server/incidents/repair/resume-arrivals.ts`
- `server/incidents/repair/resume-routes.ts`
- `server/incidents/repair/writer-process-failure.ts`
- `src/contracts/writer-restart.ts`
- `src/shared.ts`
- `tests/unit/delivery/attempts/restart-stopped-writers.test.ts`
- `tests/unit/delivery/attempts/restart-writer.test.ts`
- `tests/unit/delivery/attempts/salvage-worktree.test.ts`
- `tests/unit/delivery/support/salvage-git.ts`
- `tests/unit/incidents/repair/dispatch-writer-release.test.ts`
