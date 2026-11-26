---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-6b-runner-budgets-and-admission-ceiling-5c0268687d.md]
issue: 'https://github.com/jfusco/the-office/issues/625'
issues: ['https://github.com/jfusco/the-office/issues/625']
---

# Overseer phase 6b: runner budgets and admission ceiling

The Overseer runner gained the admission every future model call must pass, ahead of phase 7, which is the first to make one. Nothing calls a model yet.

The ledger is `state/budget.sqlite`, its own rollback-journal SQLite file, written in short `BEGIN IMMEDIATE` transactions. It holds every reservation, and a reservation stays held until a receipt for the session the call bound at launch settles it. A missing or incomplete receipt keeps at least the reservation, across restarts and Eastern days. A charge only rises. An overrun stops every admission until a person acknowledges it at the amount shown.

A closed stage table prices each call at 150% of a $2, $3 or $15 allocation. It assigns each stage to a per-incident round counter, so an optional plan or plan review runs inside the fix attempt it belongs to. Every call also counts against 24 runs a day, and timeouts are required. `runBudgeted` admits a call, returns control at its total or quiet deadline whatever the call does, and settles a late receipt against the same reservation.

The private runner Store follows the controller's pattern and opens only in the dedicated runner directory. It does so only after `OFFICE_DATA_ROOT`, the runner's office-config file and the data root captured by Office configuration all check out. Nothing opens it yet.

Joe settled three questions:

- **Spend limit.** Proceed without an account-side spend limit, recorded as `not-configured`.
- **Receipts.** Qualify settlement with real receipts. One Claude completion and one Codex 0.171.0 rollout from Office worker runs were trimmed to their accounting fields and committed as `tests/unit/overseer/fixtures/captured-receipts.json`. Each still prices exactly as its original.
- **Cost framing.** On personal subscriptions every dollar figure is a list-price estimate, so the ceiling is a runaway brake and run counts and timeouts are the main control.

The plan review (`9dc5e84c`) accepted 21 findings. They included:

- the largest supported amount from incomplete receipts, components included;
- holds that carry across days;
- a deadline race that does not trust the call to stop;
- path checks before the Store writes;
- acknowledgement bound to the exact charge.

[Issue #625](https://github.com/JFusco/the-office/issues/625) · [Overseer, Budgets](../../docs/overseer.md)
