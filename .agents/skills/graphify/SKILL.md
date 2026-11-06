---
name: graphify
description: Use the shared Graphify code map to trace current source relationships in the Office server, UI and scripts, assess impact, or refresh the map after code changes. Verify exact behavior in source; rationale lives in AGENTS.md and docs/.
---

# Graphify code map

Use Graphify 0.9.36 from the repository root. The shared map is in
`graphify-out/`; `.graphifyignore` limits it to maintained `server/`, `src/` and
`scripts/` code. The map is orientation, not runtime proof, and it does not
replace the design notes in `docs/` or the boundaries in `AGENTS.md`.

- For broad current-code questions, run `graphify query "<question>"`.
  Use `graphify explain "<symbol>"`, `graphify path "<from>" "<to>"`, or
  `graphify affected "<symbol>"` for focused relationships and impact.
- Follow returned file and line references into source. Confirm `INFERRED`
  and `AMBIGUOUS` relationships there. For an exact file or command question,
  inspect source directly; read `docs/` and `AGENTS.md` for rationale.
- After eligible code changes, pulls, or merges, run
  `PYTHONHASHSEED=0 graphify update .`. Native post-commit and post-checkout
  hooks refresh the map in the background; review output before staging.
- To rebuild without model calls, run
  `PYTHONHASHSEED=0 GRAPHIFY_MAX_WORKERS=1 graphify extract . --code-only --force`
  and then `PYTHONHASHSEED=0 graphify update .`.
- On a fresh clone, run `pnpm install` (activates Husky) and
  `graphify hook install`. Verify with `graphify hook status`. The Git hooks
  and local merge driver are native Graphify integrations; no agent tool hooks
  are installed. Hooks skip linked worktrees, including the Office harness's
  delivery worktrees; refresh the canonical map from the primary checkout.
- Commit only `graph.json`, `graph.html`, `GRAPH_REPORT.md`,
  `.graphify_analysis.json`, `.graphify_labels.json` and its `.sig`.
  `manifest.json`, caches and dated backups stay local.
- Keep `graphify-out/memory/` empty. Optional query outcomes belong in
  ignored `graphify-out/local-memory/` via `--memory-dir`.
