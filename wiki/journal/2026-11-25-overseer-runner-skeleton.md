---
topics: [releases-and-incidents]
plans: [2026-11-25-overseer-phase-6a-one-observe-only-pass-for-jfusco-the-office-613-695a79af52.md]
issue: 'https://github.com/jfusco/the-office/issues/613'
issues: ['https://github.com/jfusco/the-office/issues/613']
---

# Overseer phase 6a: the observe-only runner

The Overseer gained its own process, `server/overseer.ts`. It runs outside the Office service so that it can work while that service is broken. Phase 6 is split into four deliveries: this skeleton, budgets, the launcher, and failure forwarding with notices. Joe approved that split on 2026-11-25.

One pass:

1. takes a lock on the runner's root and checks STOP and pause;
2. reads `/api/health`, and stands down while a deployment holds the fence;
3. reads the research list and keeps at most one incident in flight;
4. records what it saw.

It sends the Office only those two `GET`s, calls no model and takes no scheduler claim. When the Office stays silent for five minutes over two passes, the pass journals one `service-down` event in the runner's own folder, and one `service-restored` event when the Office answers again. Each event is saved as an intent before it is appended, so a pass that dies mid-write leaves the exact line for the next one. Forwarding those events to the ledger is later work.

The runner's root is checked before anything is written. The pass refuses a root that overlaps the Office's data root or sits beneath an Office marker, on the path as written and after links are resolved. It sets `OFFICE_DATA_ROOT` to its own folder before any Office module loads. A static import walk, built on the repository's TypeScript resolution, shows the runner reaches neither the Office service, the control store, the scheduler nor the worker runtime.

The pass is the one authorized exception to the shared-runtime rule, recorded in `AGENTS.md` and the Office process. It is an independently supervised repair orchestrator, and it gives ordinary employees and project delivery no other dispatch path.

The plan review (`8d3ae85c`) accepted 17 findings: journal crash recovery, halt rechecks after awaited reads, separately dated caches, physical-path checks and redirect refusal. One design point moved in implementation. The root validator lives in `server/overseer/runner-root.ts`, a module that uses Node built-ins only, rather than inside the entry. The CLI then reuses it without importing an executable entry, and the entry still loads no Office module before its checks.

[Issue #613](https://github.com/JFusco/the-office/issues/613) · [Overseer, Runner](../../docs/overseer.md)
