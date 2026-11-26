---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-7a-isolated-worker-environment-59e2648ff3.md]
issue: 'https://github.com/jfusco/the-office/issues/691'
issues: ['https://github.com/jfusco/the-office/issues/691', 'https://github.com/jfusco/the-office/issues/690']
---

# Overseer phase 7a: isolated worker environment

Phase 7a ([issue #691](https://github.com/JFusco/the-office/issues/691)) is the first delivery of phase 7, isolated research and triage ([issue #690](https://github.com/JFusco/the-office/issues/690)). It gives the runner's future model workers an environment and folders of their own. Nothing calls a model yet.

The shared command runner gained `replaceEnv`, the child's whole environment, with nothing of the service's. `env` still adds to the service's environment, and every existing caller is unchanged. `worker-environment.ts` builds a worker's environment from fixed values and the run's own folders:

- `PATH`;
- the locale;
- `HOME` and `TMPDIR`;
- the provider's state directory;
- a private `OFFICE_DATA_ROOT`;
- `OFFICE_NO_POLL=1`.

`run-directories.ts` gives each run fresh private folders under `runs/<id>/`, named by its budget reservation.

The plan review ([plan](../plans/2026-11-26-overseer-phase-7a-isolated-worker-environment-59e2648ff3.md), run `31e5853e`) accepted ten findings, which changed the draft:

- **Node behavior:**
  - Node 24 copies a parent's `NODE_V8_COVERAGE` into an explicit child environment, and writes it into the caller's own object. It also enumerates inherited keys.
  - A replaced environment is therefore a fresh null-prototype map that holds that key itself, and Node's permission model, which adds to `NODE_OPTIONS`, refuses replacement outright.
- **Blocker:** a root given through a link could have had folders created through that link before the refusal. Allocation now checks the root as it was supplied, component by component, before it writes anything.
- **Ownership and mode:** the root and `runs` must belong to the runner, and a run is checked again when it is handed to a worker.
- **Tests:** they print whole environments only from a disposable parent whose every value is synthetic.

Testing found that on macOS a Node child sets `__CF_USER_TEXT_ENCODING` for itself at startup, though nothing passed it. Exact comparisons read the child through `/usr/bin/env`, and allow only that one self-set variable in a Node descendant.

[Issue #691](https://github.com/JFusco/the-office/issues/691) · [Overseer, Worker environment](../../docs/overseer.md#worker-environment)
