---
topics: [context-wiki-and-ci]
plans: [2026-11-24-refresh-the-shared-office-code-map-after-merges-708032e283.md]
---

# Refresh the shared Graphify map after source merges

PR #550 merged on GitHub while the tracked map still pointed to an older revision. Local Graphify hooks run inside a checkout, and the Office delivery worktrees skip them. A separate refresh in PR #569 restored the shared map.

GitHub now checks the map's recorded source revision after pushes to main. It runs the pinned, code-only extractor when mapped files changed and stages only the tracked map artifacts. The workflow opens or updates one bot PR and requires Quality, commit lint, and Wiki integrity to pass before merging the exact generated commit. Graph-only updates do not produce another refresh PR. A manual run on main retries a failed refresh.

[Automation issue #573](https://github.com/JFusco/the-office/issues/573) · [Manual recovery PR #569](https://github.com/JFusco/the-office/pull/569)
