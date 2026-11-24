---
topics: [context-wiki-and-ci, delivery-and-recovery, session-evidence, planning-and-learning, releases-and-incidents, office-ui-and-telemetry]
plans: [2026-11-24-install-the-office-context-wiki-and-split-quality-bfa15636b4.md]
---

# Install the context wiki and parallelize Quality

The Office adopted the shared context-wiki kit. Claude imports `AGENTS.md` through `CLAUDE.md`. Husky runs the wiki's advisory pre-commit hook alongside the existing hooks. GitHub Actions checks wiki integrity and provides separate merge and issue-state reconciliation workflows.

The Graphify code map excludes the wiki viewer's bundled libraries.

The initial plan audit used repository files and history, Claude plan files and desktop-linked transcripts, Codex saved plans and active and archived sessions, and Cursor plan files. The [plan ledger](../plans/INDEX.md) records reviewed summaries with public merge receipts. The original plan bodies and local session details stay in their source stores. Some candidates had overlapping revisions, pointed to another project, or lacked enough evidence to publish.

Quality now classifies the tested revision on Linux, then runs the build on Ubuntu and the unit suite on macOS in parallel when code changes. The aggregate `quality` check records the result. The macOS suite retains coverage for launchd and Keychain behavior.

[Delivery issue #553](https://github.com/JFusco/the-office/issues/553)
