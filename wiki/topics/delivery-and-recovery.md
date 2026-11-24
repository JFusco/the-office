# GitHub delivery and recovery

The Office gives models implementation and review decisions. The harness owns candidate worktrees, GitHub and board mutations, merge readiness, and closeout. Durable Effects preserve mutation intent and reconcile uncertain outcomes through provider read-back.

The initial hands-off rollout introduced this division for Brain. Later changes extended retry and recovery without giving abandoned model runs authority to publish. The simplification in PR #212 and deterministic intake in PR #335 consolidated work around the ordinary delivery path. Approved prerequisites are evaluated as structured gates.

The Office can adopt eligible Context Wiki reconciliation PRs when a project opts in. It validates the bot account, commit history, and Markdown and graph-data scope before the ordinary review process.

## Evidence

- [Office process](../../docs/office-process.md)
- [Wiki sync adoption](../../docs/wiki-sync-adoption.md)
- [Initial hands-off delivery](https://github.com/JFusco/the-office/pull/1), [Brain hands-off rollout](https://github.com/JFusco/the-office/pull/19), [harness simplification](https://github.com/JFusco/the-office/pull/212), and [harness-owned intake](https://github.com/JFusco/the-office/pull/335)
