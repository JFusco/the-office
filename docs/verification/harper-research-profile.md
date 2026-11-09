# Harper research capability evidence

Native fixture run: 2026-11-08. Installed CLI: `codex-cli 0.163.0`.

A disposable directory outside the repositories contained an AGENTS sentinel. The
public prompt requested only a hosted read of SQLite's official transaction page.
No private incident text, repository context, credentials or real issue writes were
part of this fixture. Invocation used `--ignore-user-config`, `--ignore-rules`,
read-only sandboxing, approval policy never, `project_doc_max_bytes=0`,
`agents.enabled=false`, hosted `web_search="live"`, host skill discovery disabled,
and the disabled features recorded in `server/workers/research-profile.ts`.

The native stream reported:

> Code Mode is unavailable because code-mode host is disabled. Code mode will fail closed; enable `features.code_mode_host` and install `codex-code-mode-host`.

The final response was “Hosted web retrieval is unavailable in this session.”
No native page-open event was emitted. Exit code was 0; that does **not** establish
research success. The sentinel was absent from the returned stream, which alone
also does not establish the complete model-visible tool surface.

Consequently automatic research remains unavailable for this profile. Weekly
reports retain that reason without blocking local learning, metrics or delivery.
Enabling research requires a new native capability fixture demonstrating hosted
retrieval, source-read receipts and the restricted tool surface; version and flag
presence alone are insufficient. Do not relax local access or delegation controls
to make research run. Unit fixtures test the scheduler, budgets and acceptance
logic but are not provider capability proof.

Original receipt location for this run:
`/var/folders/j6/ns8v4yrn5kq61phl2ffhrt1m0000gs/T/harper-public-profile-3dshlxv5/events.jsonl`.
