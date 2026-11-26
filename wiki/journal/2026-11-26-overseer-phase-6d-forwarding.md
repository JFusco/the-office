---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-6d-forward-runner-failures-and-serve-incident-notices-05300d2ed4.md]
issue: 'https://github.com/jfusco/the-office/issues/664'
issues: ['https://github.com/jfusco/the-office/issues/664']
---

# Overseer phase 6d: forwarding and incident notices

Phase 6d ([issue #664](https://github.com/JFusco/the-office/issues/664)) lets the Overseer runner tell the Office what it saw: the outages it journaled and whether it is running, paused or stopped. It completes phase 6.

The plan review ([plan](../plans/2026-11-26-overseer-phase-6d-forward-runner-failures-and-serve-incident-notices-05300d2ed4.md), run `bf230929`) changed the draft substantially:

- **Ledger write:** the Office records each forwarded failure under its journal ID in the same transaction as the change to the one `runner` incident. It does not keep a separate inbox. Otherwise an outage that opened and closed between observation ticks would leave no trace.
- **Halt reports:** they carry a sequence, frozen before sending, so a clear always overtakes a STOP that was delayed.
- **Store:** it opens only under the pass lock, and status reads a summary file, never the runner's SQLite Store.
- **Time:** each pass's reporting is bounded by the deadline the launcher registered.
- **Origins:** the runner and the installed launcher now accept exactly the origins the Office answers, so `[::1]` is refused.

One decision went to Joe's coordinator. If a deployment takes the fence after a send's preflight, the Office refuses a send already dispatched. The coordinator chose option A, applying Joe's rule in `AGENTS.md`: "An uncertain effect is reconciled by read-back, never resent." The event is kept, read back on later passes and shown in status for a person.

Notices are served, never saved: `overseer-incident:<id>` while the runner's outage is open, and `overseer-stopped` while it reports itself stopped. They appear in every project's outbox, and the outbox collector cannot turn them into incidents of their own.

Testing found that `AbortSignal.timeout` rejects the fractional milliseconds the phase clock gives. Without the fix every budgeted request would have failed, so timeouts are now whole milliseconds.

The implementation review (`23965293`) accepted 21 more findings. All were repaired and each passed an independent recheck. Two were blockers:

- a send left unconfirmed at one Office origin could have been repeated through another;
- an owed journal write could have forwarded a different ID from the one owed.

Joe allowed the wiki graph to be regenerated for one of the repairs. The recheck raised one more suggestion: a send whose preflight passed with a millisecond left could be claimed and never sent. A send now needs a one-second window before it is claimed.

[Issue #664](https://github.com/JFusco/the-office/issues/664) · [Overseer, Forwarding and reports](../../docs/overseer.md#forwarding-and-reports)
