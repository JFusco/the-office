# Context wiki and GitHub verification

The Office records project rationale in the Markdown context wiki and uses Graphify for the code map. The context-wiki installer provides shared agent navigation, a Husky pre-commit hook, a wiki-only viewer, integrity checks, and two GitHub reconciliation workflows. The writers use a dedicated repository Actions secret named `BOT_TOKEN` and open reviewable branches. Commit lint validates the compact writer PR body against the canonical account, branch and changed files.

Quality classifies the tested revision once. For code changes, the Ubuntu build and macOS unit tests run independently and the final `quality` check requires both. The macOS job bundles the UI for the startup test, which exercises the production HTML response. Documentation and generated graph changes can skip those jobs and still receive a Quality result. Markdown used by repository automation counts as code. Local and harness verification use `pnpm run verify:ci`.

## Shared code-map refresh

The shared Graphify map refreshes after mapped source reaches `main`. The
workflow compares the source revision in the checked-in graph with the latest
`main`, runs pinned code-only extraction when needed, and publishes changed
artifacts through `bot/graphify-refresh`. The generated PR merges only after
Quality, commit lint, and Wiki integrity succeed for its exact head. The map
commit does not trigger a second publication. Use **Run workflow** on
`main` to retry after a failed or interrupted refresh.

## Evidence

- [Wiki mechanics](../MECHANICS.md), [Quality workflow](../../.github/workflows/quality.yml), and [installation issue](https://github.com/JFusco/the-office/issues/553)
