---
topics: [session-evidence]
plans: [2026-11-26-hold-ownership-reading-harness-requests-during-startup-fc0b03865d.md]
issue: 'https://github.com/jfusco/the-office/issues/636'
issues: ['https://github.com/jfusco/the-office/issues/636']
---

# Harness requests wait for the first complete session inventory after start

The shared session bridge keeps its transcript cache in memory, so after a restart its first reads fold every Claude transcript from the start. A read-only replica's cold read took 34.5 s and hit the 5 s per-transcript deadline on a 50 MB transcript, while the seven warm reads after it completed. accessibility-standards GH-3's `reconcile-implementation` was claimed 47 s after a deploy restart and ended blocked on an incomplete ownership read. The exact trigger at that moment is inferred, because those reads were not recorded.

Joe chose to leave ownership-gated work queued until the first complete inventory, using the existing scheduler admission point and refresh cadence. Each execution-time ownership check is unchanged.

The bridge now marks its first complete read when it publishes that read. Until then, the scheduler projects a queued request whose handler reads the shared inventory as `waiting`, so a cold read cannot spend it. These requests wait:

- the six kinds that always read the inventory;
- headed preparation and closeout requests;
- a base update whose head is the board-preflight head its job admits.

Other work keeps running, and a later incomplete read is the handler's to refuse, as before.

Out of scope, kept as evidence on the issue: steady-state deadlines, logs changing during a read, helper processes at launch, private bridge instances, and intake or feature startup.

[Issue #636](https://github.com/JFusco/the-office/issues/636)
