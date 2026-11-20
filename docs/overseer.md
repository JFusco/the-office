# Overseer

The Overseer is the repair engine for the harness and the Office. It is being delivered in phases;
this guide covers what exists. Today that is deterministic deployment and the incident ledger.
Repair waits, resume after a fix and the autonomous runner are later phases and are not described
here until they ship. The process rules are in the Office process, under
[Deployment](office-process.md#deployment) and [Incident ledger](office-process.md#incident-ledger).

## Deployment

### What runs a deployment

`pnpm office deploy` does not deploy from the checkout it is typed in. It starts the **controller**
from a pinned release: `.local/controller-pin.json` names a release under `.local/releases/`, and
that tree's `server/release/controller-entry.ts` runs the whole operation. The target release's own
code never drives its own activation.

Files, all under the data root (`.local/`):

| Path | Holds |
|---|---|
| `controller-pin.json` | The release that runs deployments |
| `deploy.lock` | The one deployment in progress |
| `deployments/<operation>.jsonl` | The operation's journal: its facts and every step |
| `deployments/<operation>.token` | The fence token, owner-only, removed once the fence is released |
| `deployments/<operation>.prior.plist`, `.target.plist` | The plist before, and the one prepared for the target |
| `deployments/<operation>.launch.json`, `.outcome.json` | That the controller was launched, and how it ended |
| `deployments/controller.sqlite` | The controller's Effects: one record per mutation |
| `deployments/STOP.json` | Present when a deployment needs a person |
| `backups/<operation>/` | Store copies and `inventory.json`, for recovery by hand |
| `active-release.json` | The receipt of the last verified activation |

### Commands

```text
pnpm office release build [COMMIT]   build .local/releases/<sha> (never activates)
pnpm office release current          the release launchd runs, verified against its manifest
pnpm office deploy COMMIT [--idle-minutes N]
pnpm office deploy status            pin, lock, STOP record, last operations (reads files only)
pnpm office deploy resume OPERATION  continue an operation whose controller died
pnpm office deploy end OPERATION     release the fence that operation holds, nothing else
pnpm office deploy pin COMMIT        name the release that runs deployments
```

`deploy COMMIT` takes a full 40-character SHA of a release already built. It exits 0 only when the
target serves and was verified. The service may be busy when it starts: the fence stops new work
being admitted, and `--idle-minutes` (default 5, at most 240) bounds how long the work already in
flight may take to drain. No new work starts in any project while the fence is held, so a long wait
is a long pause. If the service is not idle in time, the fence is released and nothing else changed.

### Outcomes

| Outcome | Meaning | Service | Fence |
|---|---|---|---|
| `deployed` | The target serves; `/api/health` confirmed its hash and a new instance | Target | Released |
| `refused` | A precondition failed before anything changed | Unchanged | Untouched |
| `aborted` | The service did not become idle in time; it was left running | Unchanged | Released |
| `rolled-back` | Activation failed and the previous release serves again | Previous | Released |
| `stopped` | A person is needed; `deployments/STOP.json` says where | See the record | Usually held |
| `ended` | A person had that operation's fence released with `deploy end` | Unchanged | Released |

### A normal deploy

1. `pnpm office release build <sha>` and confirm it reports the manifest.
2. `pnpm office deploy <sha>`, with `--idle-minutes N` when work in flight needs longer than five
   minutes to drain. A deployment is refused while an earlier one is unfinished.
3. Read the outcome. `pnpm office release current` and `/api/health` should agree with it.

### Bootstrap: the first deployment and the first pin

The controller needs a service that reports the deployment fence in `/api/health` and a pinned
release that contains the controller. Neither exists until this is done once, by hand:

1. Build the release that contains the controller: `pnpm office release build <sha>`.
2. If the running service does not yet report `fence` in `/api/health`, replace it by hand one last
   time, the way releases were activated before: stop the service at `busy: false`, back up the
   stores, point the plist at the new release, start it, and check `loadedHash`.
3. Pin the controller: `pnpm office deploy pin <sha>`. The release must verify and contain
   `server/release/controller-entry.ts`.
4. The first `pnpm office deploy <next sha>` is run by a person who is watching it.

The launchd commands the controller issues (`launchctl bootout` and `bootstrap` in the `gui/<uid>`
domain) are covered by tests with an injected runner only. Their behaviour on this machine is
confirmed by that first watched deployment, not before.

Changing the pin later is also a person's decision. A release that changes `server/release/` is
still activated by the pin that was in place when its deployment began.

### When a deployment stops

A STOP record refuses every further deployment until a person removes it. Start with:

```text
pnpm office deploy status
pnpm office release current
curl -s http://127.0.0.1:4318/api/deployment-fence
```

The record names the operation and the last journaled step. Then, by case:

- **The controller failed before journaling.** Read the saved `<operation>.launch.json` and
  `deploy status`. Resolve the start-up failure and confirm the controller is gone before clearing
  STOP and retrying the deployment.
- **The controller died with a journal and no outcome.** Check the lock and confirm the controller
  is gone. Follow the STOP instruction for the deployment ID, including when a rollback was
  interrupted or the last step already completed. Clear STOP before running
  `pnpm office deploy resume <operation>`. A pending mutation is settled by read-back.
- **The controller timed out or exited non-zero after saving an outcome.** Read that outcome in
  `deploy status` and check the service and fence before clearing STOP.
- **An `end` launch failed.** Read its launch record and check the fence for the owning deployment
  named in STOP. After confirming the service state, use `deploy end <operation>` for that
  deployment if its fence is still held or its outcome is unfinished.
- **A step could not be confirmed** (`fence`, `stop`, `backup`, `snapshot`, `record` or `release`,
  or a rollback's `halt`, `plist`, `start`, `verify` or `release`, shown as
  `rollback-…:<step>`). Look at what launchd runs
  and what the fence says, put the service in the state you want by hand, then
  `pnpm office deploy end <operation>` and remove the STOP record. `<operation>` is always the
  deployment's ID, also when the step named is a rollback's.
- **The journal ends in a cut-short line**: its last step is unknown, so nothing is undone on its
  word. Treat it as the case above.
- **A rollback could not prove the stores were unchanged.** A missing baseline, an unreadable
  store, an admission, or a changed store blocks restoration. Check the STOP reason, confirm the
  service is down and the fence is held, then decide between fixing forward and restoring a
  complete backup from `backups/<operation>/` by hand. When the service runs what you want, run
  `pnpm office deploy end <operation>` and remove the record.

`deploy end` releases only the fence that operation's token holds. It does not resume a project,
change a pause or clear a drain, and it leaves the STOP record for you to remove. An operation that
had recorded no outcome is recorded `ended`. After that it cannot be resumed, and it no longer
refuses later deployments.

`deploy resume` answers "already ended" for an operation that recorded an outcome. There is nothing
to continue: read the outcome in `deploy status` and act on the service by hand if it is not what
you want.

Ctrl-C or a closed terminal can end the launcher while the detached controller continues. The
launcher owns the overall deadline and writes STOP for a controller crash or hang. If the launcher
exits first, a later crash or hang can leave only an unfinished journal. Use
`pnpm office deploy status` to check the lock and saved outcome. After confirming the controller is
gone, use `deploy resume <operation>` or `deploy end <operation>` to settle an unfinished journaled
deployment.

### What a deployment never does

- Restore a store from a backup.
- Resend a step whose outcome is unknown.
- Pause, drain or resume a project.
- Switch controller code in the middle of an operation.
- Release a fence another deployment holds.

## Incidents

The Office records every stop it can see in one ledger, grouped by cause across projects. It only
observes: nothing in it retries, resumes or repairs anything, and it never writes to a project.

### Reading the ledger

```bash
curl -s 'http://127.0.0.1:4318/api/incidents?open=1'
```

```bash
curl -s 'http://127.0.0.1:4318/api/incidents?research=1'
```

```bash
curl -s http://127.0.0.1:4318/api/incidents/inc-0123456789abcdef
```

The first lists incidents with a subject still stopped, the second those eligible for
investigation, the third one incident with its event history.

### What an incident says

| Field | Meaning |
|---|---|
| `cause` | Where the signal was read, the provider, the stage, the typed cause and, for a cause the harness wrote, its normalized text. `author: model` means the stop repeats what a model's saved result said; `author: unknown` means the record does not say who wrote it. In both cases the words are in `evidence` only and the incident belongs to that one subject. |
| `expected` | The kind of wait when the stop is one the Office already understands (`hold`, `decision`, `merge-approval`, `prerequisite`, `pause`, `authentication`, `provider-wait`, `retry`, `uncertain-effect`, `question`). Each subject has its own; the incident's is the one every open subject shares, or `null`. |
| `research` | Whether the incident may be investigated now, and why: no explanation, or an expected wait that came back after two resumes, holds three subjects or two projects, or stood 24 hours. Withdrawn as soon as none of those holds. |
| `subjects` | Each affected piece of work: project, kind, ID, stage, saved stop, the run that last worked it, candidate head, whether a write is unsettled, `open` or `cleared`, and its episodes. Every return after a clear is one episode. |
| `state` | `observed` today. The later states are set by later phases. |

### What to expect

- The ledger is updated once a minute and not at all while a deployment holds the fence. Until the
  first stop is recorded its tables do not exist and both routes return nothing.
- A paused or draining project shows as one subject. Its stopped work stays open until the project
  runs again and the ledger can see whether it cleared.
- A failed run is counted for 24 hours, then clears by itself. One that belongs to a stopped job,
  ticket, review or maintenance run is part of that subject instead.
- If a collector cannot read a project, the service log says which one each minute, and what that
  collector had reported for the project is left open until it can.
- With three GitHub projects, ordinary provider waits will meet the two-project threshold often.
  That is the plan's threshold; it makes them eligible for research, nothing more.
- The repair runner's own failures are not recorded yet; the runner does not exist.
