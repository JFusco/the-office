---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-7c-triage-verdicts-and-blind-corroboration-jfusco-the-off-f827d6b90f.md]
issue: 'https://github.com/jfusco/the-office/issues/702'
issues:
  [
    'https://github.com/jfusco/the-office/issues/702',
    'https://github.com/jfusco/the-office/issues/690',
  ]
---

# Overseer phase 7c: triage verdicts and blind corroboration

Phase 7c ([issue #702](https://github.com/JFusco/the-office/issues/702)) defines what a model reader returns about one incident, and how two opinions from opposite providers become one proposal. It runs against an injected model invocation and fixtures only. Every outcome is a proposal; nothing here changes the Office.

What it adds:

- **The contract.** Five strict, bounded verdicts: harness defect, real block, false positive, stale state, a question for Joe. Each cites source by path, file hash, lines, decisive line and excerpt digest.
- **The two calls.** Triage, and the blind second opinion from the other provider. Both are built from one frozen input whose identity covers the packet, the original bytes of every cited file and the requirement examples. Each call is its own budgeted admission, and a verdict is published only once the ledger has settled it against the session bound at launch.
- **Agreement.** Compared on substance, never on wording.
- **The decision, by six ordered rules.** Either valid real block keeps the block. A repair is admitted only for two current, high-confidence, agreeing defects supported by a frozen example and the covered stops' actual refusal.

The first plan review ([plan](../plans/2026-11-26-overseer-phase-7c-triage-verdicts-and-blind-corroboration-jfusco-the-off-f827d6b90f.md), run `ef2cdb8e`) accepted 21 findings, all of which passed recheck. It ended unresolved on FIND-022, a late suggestion: a subject's per-source detail must be bound to its stop by recomputing the Office's own `repairSubject`, never by trusting a digest supplied with it. Joe's coordinator accepted it, and a focused review (`456f9221`) passed it. That review added one more refinement: the detail must come from the selected incident at the packet's own revision.

A worktree hook refused writing the implementation into a separate planning checkout. Joe's coordinator asked that implementation happen in the session's own checkout, after the focused review passed.

[Issue #702](https://github.com/JFusco/the-office/issues/702) · [Overseer, Triage and corroboration](../../docs/overseer.md#triage-and-corroboration)
