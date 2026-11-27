# Overseer

The Overseer is the repair engine for the harness and the Office. It is being delivered in phases;
this guide covers what exists. Today that is deterministic deployment, the incident ledger and
the mark the Office puts on stopped work a repair covers, which holds recovery back for it. Resume
after a fix works for the seven GitHub read-back routes, `review-pr`, `review-candidate`,
`requeue-implement`, `release-writer` for a dead writer run, `review-assignment` for a stopped
assignment review and `resume-ticket` for a Jira/Azure pilot ticket. For a Brain checkpoint the
Office queues its native read-back (`reconcile-native-checkpoint`). Once a fix you bound is
running and you have enabled automatic resumes, the Office uses the route that fix named. The
switch starts paused. The Office reports `no-route` for `retry-checkpoint` and
`reconcile-maintenance`.
See [Resuming after a fix](#resuming-after-a-fix).
Each repair runner pass observes and reports. You start it by hand, or its launcher, once you
install it, starts one every two minutes. It reads the Office, keeps one incident in flight,
journals outages in its own folder and forwards them to the incident ledger, and reports whether
it is running, paused or stopped. It calls no model; its only writes to the Office are those
reports. See [Runner](#runner), [Forwarding and reports](#forwarding-and-reports) and
[Launcher](#launcher).
The process rules are in the Office process, under
[Deployment](office-process.md#deployment), [Incident ledger](office-process.md#incident-ledger)
and [Overseer runner](office-process.md#overseer-runner).

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
| `backups/<operation>/` | Store copies and `inventory.json`, for recovery by hand. A configured project with no store file yet is listed under `absent`, not copied |
| `active-release.json` | The receipt of the last verified activation |

### Commands

```text
pnpm office release build [COMMIT]   build .local/releases/<sha> (never activates)
pnpm office release current          the release launchd runs, verified against its manifest
pnpm office deploy COMMIT [--idle-minutes N] [--below-floor]
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

`deploy COMMIT` launches nothing unless the target is the **release floor** or descends from it.
The floor (`server/release/release-floor.ts`, now `252f140`) is the oldest commit whose release can
read the stores as they are saved. A store keeps its state in parts and drops the whole state row
at its first saved change beyond what a start writes. An older release reads only that row: on a
store without it, it would start from nothing, and a row it then saved would disagree with the
parts and stop later releases opening that store
([A store whose saved copies disagree](office-process.md#a-store-whose-saved-copies-disagree)).
The command reads the history of the checkout it is typed in, since a release directory carries
none of its own. It reads commits as they were made (no replacement refs or graft file) and fetches
nothing. A shallow clone, a target or a floor that checkout does not have, and a git failure are
refused as well: the floor holds only on proof from a complete history. `--below-floor` skips the check and prints that
it did. It is a person's decision, for stores that still hold the whole state row, such as a backup
from before the row was dropped. `resume`, `end`, `pin` and `status` are not checked, and a release
activated by hand never passes through the command.

### Outcomes

| Outcome | Meaning | Service | Fence |
|---|---|---|---|
| `deployed` | The target serves; `/api/health` confirmed its hash and a new instance | Target | Released |
| `refused` | A precondition failed before anything changed, including a read of the service that failed before the fence was taken | Unchanged | Untouched |
| `aborted` | The service did not become idle in time, or could not be read before the stop was sent; it was left running | Unchanged | Released |
| `rolled-back` | Activation failed, or the store backup or snapshot before it failed, and the previous release serves again | Previous | Released |
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
  deployment's ID, also when the step named is a rollback's. A `backup` or `snapshot` here is
  uncertain: the service was no longer confirmed stopped, or the step's outcome is unknown. A
  backup or snapshot that failed for a known reason is not this case. No target plist was intended,
  so the deployment rolls back once the service is confirmed stopped and ends `rolled-back` with no
  STOP.
- **The journal ends in a cut-short line**: its last step is unknown, so nothing is undone on its
  word. Treat it as the case above.
- **A rollback could not prove the stores were unchanged.** From target plist intent onward the
  rollback needs a complete baseline. A missing baseline, an unreadable store, an admission, or a
  changed store blocks restoration. A target that only started under the fence is not a change; one
  that added a table or index, migrated saved state beyond what a start rewrites or wrote any other
  row is, so a release with a store change is not rolled back once it has opened the stores. A
  project store that was absent at the snapshot and exists now is also a change. The snapshot has
  nothing to compare it with, so nothing shows the previous release can read what it now holds.
  Check the STOP reason, confirm the service is down and the fence is held, then decide between
  fixing forward and restoring a complete backup from `backups/<operation>/` by hand. When the
  service runs what you want, run `pnpm office deploy end <operation>` and remove the record.

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

The Office records every stop it can see in one ledger, grouped by cause across projects. By
itself the ledger retries and repairs nothing. It writes two things to a project: while a repair
is in progress, a mark on the stops that repair covers (see Work awaiting a repair); and, once
the fix runs and you have enabled automatic resumes, one resume for each marked stop. The Office
queues a recovery request for a GitHub read-back, a delivery request for a Jira/Azure ticket,
or the native read-back (`reconcile-native-checkpoint`) for a Brain checkpoint. It directly
requeues GitHub review jobs, jobs the approach guard rejected at `implement` and stopped
assignment reviews, and grants a dead writer run one more harness restart (`release-writer`). See
[Resuming after a fix](#resuming-after-a-fix).
Besides what it observes, the ledger records when you start a repair and which fix you bind.

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
investigation and not dismissed, the third one incident with its event history.

### What an incident says

| Field | Meaning |
|---|---|
| `cause` | Where the signal was read, the provider, the stage, the typed cause and, for a cause the harness wrote, its normalized text. A run of three or more colon-separated groups of two or more hex digits (a GitHub request ID, an address) reads `<id>`, so harness causes that differ only in such an identifier group as one incident. `author: model` means the stop repeats what a model's saved result said; `author: unknown` means the record does not say who wrote it. In both cases the words are in `evidence` only and the incident belongs to that one subject. |
| `expected` | The kind of wait when the stop is one the Office already understands (`hold`, `decision`, `merge-approval`, `prerequisite`, `pause`, `authentication`, `provider-wait`, `retry`, `uncertain-effect`, `question`). Each subject has its own; the incident's is the one every open subject shares, or `null`. |
| `research` | Whether the incident may be investigated now, and why: no explanation, or an expected wait that came back after two resumes, holds three subjects or two projects, or stood 24 hours. Withdrawn as soon as none of those holds. |
| `subjects` | Each affected piece of work: project, kind, ID, stage, saved stop, the run that last worked it, candidate head, whether a write is unsettled, `open` or `cleared`, and its episodes. Every return after a clear is one episode. |
| `state` | `observed` until a repair starts, then `fixing`, then `shipped` once a bound fix is on `main`, then `deployed` once the Office finds that fix in the release it runs. It returns to `shipped` if the running release is confirmed to lack the fix or its identity is unknown. `dismissed` while a false-positive verdict stands; back to `observed` when it lapses. `verified` once its resumes show the fix worked, and `recurred` when the ledger sees the cause stop work again (see When an incident is verified or has recurred). The remaining states are set by later phases. |
| `repair`, `fixes` | The repair issue and the subjects it is for; every fix bound so far, with what it declares per subject. A fix found in the running release carries `deployed`: the release commit, its hash, the deployment that activated it and when. The first recorded judgment adds `outcomes` to the fix, with one entry per subject judged so far. The field is absent while all admitted resumes for the fix are pending. See [What became of a resume](#what-became-of-a-resume). |
| `dismissals` | Every false-positive verdict recorded: its reason, the evidence packet and source files it was tied to, the subjects it covered, and `lapsed` with the reason once it no longer holds. |

### Binding a fix you made by hand

When you fix a harness defect yourself, two commands tie the fix to the incident and to exactly
the work it stopped. Starting the repair marks that work as awaiting it: it is counted that way,
and recovery, restart and requests for it are held back. The binding is what the Office will
resume from after the fix; see Resuming after a fix.

1. Read the incident and note its `revision`:

   ```bash
   pnpm office incident status inc-0123456789abcdef
   ```

2. Say the repair has started, naming the issue that tracks it:

   ```bash
   pnpm office incident start-repair inc-0123456789abcdef --issue 365 --revision 7
   ```

   The Office reads the issue back from GitHub, records a digest of every subject open at that
   revision and moves the incident to `fixing`. The answer shows the new revision.

3. Bind the fix, by pull request or by full commit SHA:

   ```bash
   pnpm office incident bind-fix inc-0123456789abcdef 364 --revision 8 --no-route "fixed by hand; nothing to resume"
   ```

   A merged pull request binds its merge commit. The incident stays `fixing` while that commit
   is outside `main` and moves to `shipped` when a binding confirms the commit is on `main`.
   An open pull request binds its current head and leaves the incident `fixing`. Bind again
   after it merges, and again once the merge commit reaches `main` if it merged elsewhere.
   Use the current revision and a new event ID for each new binding.
   `--no-route REASON` states, for every subject, that there is nothing to resume. To declare
   routes, pass `--bindings FILE`: a JSON array with one entry per subject the repair recorded.

   ```json
   [
     { "subject": "brain/delivery/job-1", "digest": "<from repair.subjects>", "disposition": "route",
       "route": { "action": "reconcile-review", "payload": { "key": "GH-12" }, "expectedStage": "lead-pr" },
       "boundary": { "kind": "stage-left", "stage": "lead-pr" } },
     { "subject": "brain/delivery/job-2", "digest": "<from repair.subjects>", "disposition": "no-route",
       "reason": "merged by hand" }
   ]
   ```

   The dispositions are `route` (with a `boundary` of `stage-result-passed`, `stage-left` or
   `record-settled`), `undeclared-boundary` (a route and a `reason`) and `no-route` (a `reason`).
   A route is checked as you bind it; the Office refuses one that could never resume its subject
   and tells you why (see Resuming after a fix). A boundary is not checked against its route.
   One the route never reaches leaves the resume pending, and `stalled` once 24 quiet hours have
   passed; a `stage-left` for a stage the job was not at when it was resumed is recorded
   `untested` (see What became of a resume).

Each write prints an event ID before it is sent. If no answer comes back, send the same command
again with `--event` and that ID: it is recorded once. If the Office answers that the incident is
at another revision, the ledger moved since you read it; read it again and resend with the new
revision and a new event ID. A write is refused while a deployment holds the fence.

### When a fix counts as deployed

Binding a fix, and merging it, never makes it live. The Office decides that itself, from the
release it runs:

```bash
curl -s http://127.0.0.1:4318/api/health
```

`release` in the answer is either `verified`, with the commit, the hash, the deployment that
activated it and when, or `unknown` with the reason. It is `verified` only for a release that
`pnpm office deploy` activated and recorded: the directory, its `release.json`, the code loaded
at start-up and the deployment's receipt must all agree. A release that no deployment recorded is
`unknown`, however correct its code is; restarting a recorded release keeps it `verified`.

Once a verified release serves, each `shipped` incident whose fix commit is in that release's
history becomes `deployed`, and its fix shows the release under `deployed`. You do nothing for
this. The Office compares at most ten fixes a minute, so many at once take a few minutes. If an
incident stays `shipped`, read `release` in `/api/health` first; that is the current answer.

- `release` is `unknown`: the running release is not one a deployment recorded. The controller
  refuses to deploy the commit that already runs, so the fix is recognised with the next release
  you build and deploy that contains it.
- `release` is `verified` and the incident is still `shipped` after a few minutes: the release
  does not contain the fix commit, or GitHub has not answered. The comparison is made once per
  release; the next deployment is compared again.

A `release-identity-unknown` event in an incident's history is a record of one moment: that fix,
compared with the release that ran then. It is not withdrawn when a later release is verified.

The Office checks each `deployed` incident against the running release every minute:

- **A rollback.** If the release that runs now does not contain the fix commit, the incident
  returns to `shipped` and records `fix-withdrawn`. Its fix shows `withdrawn` in place of
  `deployed`: the release it had been found in, when, and the reason `not-in-release`. Deploy a
  release that contains the fix and it becomes `deployed` again by itself.
- **A release the Office cannot verify.** If the running release is `unknown`, for instance
  after a hand deploy, nothing shows the fix is running. The incident returns to `shipped` with
  the reason `release-identity-unknown`, and stays there until a release that
  `pnpm office deploy` recorded holds the fix.
- **A newer release that still has the fix.** Nothing changes and nothing is recorded.

A withdrawal does not change how long work waits for the repair: the earlier finding still
counts as progress, so the 48 hours run from where they ran before.

### Evidence and dismissing a false positive

```bash
curl -s http://127.0.0.1:4318/api/incidents/inc-0123456789abcdef/evidence
```

The answer is the incident's evidence packet: what the Office knows about it, cut to a fixed size,
with a `digest` of its own content. It is the same until the incident or the running release
changes. Up to 50 subjects and the last 30 events are included, fewer subjects when they would
take the packet past 256 KiB; `total` beside each list says how many there are. Credentials are
removed from every string in it.

When a stop is correct, the harness refused something it should refuse, you can record that so the
incident is no longer offered for research. There is no command for it; post the event:

```bash
curl -s -X POST http://127.0.0.1:4318/api/incidents/inc-0123456789abcdef/events -H 'Content-Type: application/json' -d @dismissal.json
```

```json
{ "kind": "dismissed", "eventId": "joe-dismiss-2026-11-20-a", "expectedRevision": 7,
  "reason": "The write guard is right: the branch is not owned by this job.",
  "packet": "<digest from the evidence packet>",
  "cited": [ { "path": "server/delivery/harness/write-guards.ts", "sha256": "<sha256 of that file in the running release>", "line": 41 } ] }
```

Cite the code that makes the stop correct, one to twenty files, each with the SHA-256 of the file
as the running release holds it (`shasum -a 256` on the file in the release directory). The Office
refuses a dismissal whose packet digest is not the current one, or that cites a file or a version
the service does not run. Read the evidence again and resend with a new event ID. Only the first
line of the reason is kept, up to 1,000 characters, with credentials removed.

A dismissal is not permanent. It lapses by itself, and the incident returns to `observed`, when a
cited file changes or disappears in the running release, when another piece of work stops for the
same cause, or when covered work stops again or stands differently. The incident's `dismissals`
keep the lapsed verdict and say why. A file you did not cite can change freely, so cite every file
the verdict depends on.

### Work awaiting a repair

Once you start a repair on an incident, the Office marks the exact stops that repair covers in
their own projects, within a minute. In the health panel those items move from "failed",
"interrupted" or "with no recorded cause" to "awaiting a harness repair". Anything with a stronger
reason, a decision that is yours, a prerequisite, a pause, an unconfirmed write, keeps that reason.

The mark is for one stop of one piece of work. If the work stops again, or is moved by hand, the
mark no longer applies to it. It also runs out: 48 hours after the repair last moved (you started
it, bound a fix, or the fix was found in the running release) the items are counted under their
original cause again and the incident records `repair-wait-expired`. A fix bound after that does
not revive it, and neither does starting the same repair again; a new repair after the incident
recurs does. Work is marked only when its record still stands as the ledger last saw it, so a
project the Office could not read for a while is not marked on stale information.

While the mark holds, the Office also leaves that stop alone: IT spends no recovery attempt on it,
a dead writer is not restarted into the same defect, the failed run is not investigated again,
Harper does not hand it to Morgan, and the "read back" request for it leaves your outbox. Nothing
is reset: every count is where it was, and when the mark ends or runs out those paths carry on
from there and the request comes back. Anything that is yours to settle is never held back this
way: a decision, a merge approval, a question, a hold, a pause, missing authority, a prerequisite
that is not finished, or a write whose outcome is unconfirmed. That last one is checked against
the project's current writes each time, so a write that turns uncertain shows up at once.

A dead writer is the one exception to how an unconfirmed write is read. When an `implement` or
`update-base` run on a hands-off project times out, goes quiet or exits non-zero, the harness
labels the run and the job's stop `uncertain-effect`, although such a writer only commits on its
own branch. For that run alone the mark ignores the label and asks the project's Effects ledger
and the job's saved results instead: a write of the job or its issue still sending or unconfirmed,
or a saved result that owes a read-back, still keeps the stop from being held. The run must be
the job's latest run of that stage, and must have failed without returning a verdict or saving a
result. The saved stop keeps its label. IT judges an investigation by the run's own failure, so
it can still investigate that failure while the job's recovery and restart are held.

One limit to know: the hold does not stretch any other clock. The harness restarts a dead writer
only within six hours of the stop, at most three times. If a repair takes longer than that and then
runs out without a fix, that job comes back to you as a "read back" request; it is not restarted by
itself. A fix that binds `release-writer` for that run can grant it one more restart (see Resuming
after a fix).

### Resuming after a fix

Once a fix you bound is running, the Office uses its route to resume each piece of work once and
lifts its repair wait. It does this only while the switch below is enabled, and the switch starts
paused. The Office queues recovery requests for the GitHub read-back routes
`reconcile-implementation`, `reconcile-validation` and `reconcile-scope-repair`, which always need
a `head`, and `reconcile-preparation`,
`reconcile-base-update`, `reconcile-closeout` and `reconcile-review`, with a `head` or without.
For a Jira/Azure pilot ticket, the Office queues the ticket's own `resume-ticket` request (see A
ticket's resume, below). Through `review-pr` and `review-candidate` it requeues the GitHub job
directly, as your recheck does. Through `requeue-implement` it requeues an implement the approach
guard rejected, as your `requeue-implement` command does (see A direct requeue, below). Through
`release-writer` it grants a dead writer run one restart beyond the harness's three, which the
harness itself then makes (see A writer release, below). Through `review-assignment` it requeues
a stopped assignment review directly, once per fix, with its recovery counts kept (see An
assignment review's resume, below). For a Brain nightly checkpoint it queues
`reconcile-native-checkpoint` (see A checkpoint's resume, below). `retry-checkpoint` and
`reconcile-maintenance` are not resumed, and each says why (see the table below). Their work
returns to you when the wait runs out.

**Cost.** `reconcile-review` with no `head` checks a saved independent review against the
unchanged pull request and runs no model. With the `head` of a stopped base handoff it reads the
run that handoff already started and starts no other. Treat every other form as one that may
start a model run when its request runs: the implementation, validation, scope-repair,
preparation, stopped base update and closeout read-backs each can. `requeue-implement` starts no
run itself, but the job it queues runs implement again on the same candidate, which is a paid
model run. `release-writer` starts no run when it is admitted, but the harness's next poll can
restart the writer stage, which is a paid model run. `review-assignment` starts no run itself
either: it requeues the review in the Office. On a project that is not hands-off, the scheduler's
ordinary intake then checks the review's assessment, its assignment, holds and pilot ownership,
and may reach a paid read-only PM run with a 15-minute timeout. Hands-off intake keeps its
existing deterministic path. With the switch enabled the Office starts those runs by itself, one
per piece of work and fix. Nothing caps their cost yet.
`reconcile-native-checkpoint` reads Brain's native gate once and runs no model; it completes the
checkpoint only from a native run that already completed that date. Once its wait lifts, though,
IT's own checkpoint recovery can queue `retry-checkpoint` beside it, and that can start a paid
maintenance run (see A checkpoint's resume).

**Routes.** A route names one of the Office's existing recovery handlers. These are the only ones
a fix may name:

| Action | Resumes | Payload | `head` |
| --- | --- | --- | --- |
| `resume-ticket` | a CEC pilot ticket (`cec/delivery/ticket:KEY`), stopped at any stage after the mailbox | `{ key }`, the ticket's own key | none |
| `reconcile-implementation` | a GitHub delivery job | `{ key, head? }`, the ticket key | the original stopped worker's ID; where the job holds a saved prerequisite result, the ID of the latest completed writer of the job's stage (`implement` or `scope-repair`) |
| `reconcile-validation`, `reconcile-scope-repair` | a GitHub delivery job | `{ key, head? }`, the ticket key | the original stopped worker's ID |
| `reconcile-preparation`, `reconcile-closeout` | a GitHub delivery job | `{ key, head? }` | the original stopped worker's ID; empty for the saved-result route |
| `reconcile-review` | a GitHub delivery job | `{ key, head? }` | the stopped base-update handoff worker's ID or the continuation's original worker; empty for the saved-review route |
| `reconcile-base-update` | a GitHub delivery job | `{ key, head? }` | the job's head commit for a board preflight, or the original base-update worker's ID; empty for the saved-result route |
| `review-pr` | a GitHub delivery job stopped at `lead-pr`, at a merge preflight that sent no merge (`merge`), or at post-merge CI recovery (`ci-recovery`) | `{ key }` | none |
| `review-candidate` | a GitHub delivery job stopped at candidate review (`review`) | `{ key }` | none |
| `requeue-implement` | a GitHub delivery job stopped at `implement` by the approach guard, right after a structured wait or decision | `{ key }` | none |
| `release-writer` | a GitHub delivery job on a hands-off project whose `implement` or `update-base` run died | `{ key, head }`, the ticket key | required: the dead writer run's ID, exactly as recorded |
| `review-assignment` | a stopped assignment review (`project/intake/ID`), the last one stored for its ticket | `{ key }`, the ticket key | none |
| `reconcile-maintenance` | a maintenance run; not resumed: it can repeat a paid read-back on replay and can finish with the original run still blocked | `{ key }`, the run's own ID | none |
| `retry-checkpoint` | a checkpoint; not resumed: it can start a paid maintenance run after the repair wait lifts | `{ key }`, the checkpoint's own ID | none |
| `reconcile-native-checkpoint` | a checkpoint; resumed for Brain only | `{ key }`, the checkpoint's own ID | none |

`bind-fix` refuses a binding whose action is not in this table, whose payload has another shape,
whose action is for another kind of subject, whose key should be the subject's own and is not, or
whose `expectedStage` is not the stage the incident shows for that subject. Nothing is saved, the
incident keeps its revision, and you can send the corrected file with a new event ID.

Three details of that check:

- A key is taken exactly as you wrote it, 1 to 200 characters. One with a space before or after
  it is refused, not trimmed.
- A GitHub delivery job and a CEC queue request look alike in the ledger (`project/delivery/ID`).
  The job routes are for GitHub projects only; a stopped CEC queue request has no route, and a
  CEC ticket's route is `resume-ticket` on its `ticket:KEY` subject.
- The stage is compared only while the subject still stands as it did when you started the
  repair. If it has stopped again or moved since, the binding is accepted without that check,
  and the subject reads `gone` once the fix serves; it is never resumed in its later form.

`head` is whatever that handler means by it; it is not a commit unless the table says so.

**The head must be the handler's.** Each handler reads one exact earlier run and refuses any
other, and a request it refuses ends blocked with the resume spent. So before it queues a resume,
the Office asks that handler's own rule which run it would read for the job as it stands. If the
`head` you bound is not that one, nothing is queued and the incident records `head-mismatch`,
naming what the handler reads, or saying it has nothing to read. `bind-fix` does not make this
check; it cannot read the project.

- `reconcile-implementation`, `reconcile-validation` and `reconcile-scope-repair` always need a
  `head`: the stopped run. One case differs. Where the job holds a saved prerequisite result,
  `reconcile-implementation` reads the latest writer of the job's stage, which must have completed
  with its completion on record; an older writer of that stage is refused.
- For `reconcile-preparation`, `reconcile-base-update` and `reconcile-closeout`, leave `head` out
  only for the saved-result form. It is refused while the handler has an original run to read for
  that job, and when the job is not at the stage that form reads. A `head` given where the
  saved-result form would run is refused too.
- `reconcile-base-update` is not resumed, in either form, for a job whose dead writer run
  qualifies for the harness's own restart. That holds for as long as the run qualifies, also after
  the six hours in which the harness would have restarted it, so that work comes back to you when
  the wait runs out.
- `reconcile-review` with a `head` is checked like the rest. With no `head` it is not put to this
  check at all: it is queued whatever stage the job is at, and its handler refuses it then if no
  completed PR review is saved for it. Bind that form only for a job stopped at the PR review.

Stopped work with no row here, such as a stopped harness request or a conversation, has no
route: bind it `no-route`.

**The switch.** One office-wide switch says whether automatic repair resumes are admitted. It
starts paused.

```bash
pnpm office incident resumes
pnpm office incident pause-resumes --reason "looking at CEC-154"
pnpm office incident resume-resumes --revision 3 --reason "fix confirmed by hand"
```

`resumes` prints the switch: `enabled`, `revision`, `reason` and `at`. `/api/health` shows the
same under `repairResumes`. Pausing always works and needs nothing. Enabling needs the revision
you just read, and is refused if anything changed the switch since, a pause included; read it
again and you will see why it was paused. Before anyone has changed it the revision is 0. The
switch pauses no project and cancels nothing. Neither command is accepted while a deployment
holds the fence. If the saved switch cannot be read it shows `invalid` and counts as paused;
pause it once to rewrite it, then enable it at the revision that pause returns.

**What happens.** Once a fix is found in the running release, `incident status` adds `resumes`:
for each subject the fix bound, one of these, with the reason.

- `admitted`: its resume was queued, or for `release-writer` its one more restart was granted.
  This happens once per subject and fix and stays on record, whatever the work does next.
- `due`: it can be resumed and the switch is enabled. The Office puts it to admission on its next
  pass, about a minute apart; whether it is queued then depends on the checks below.
- `held`: it can be resumed and the switch is paused. Nothing is queued until you enable it.
- `no-route`: the fix declared none, the route is not valid for that subject, or this release
  does not resume that route yet ("This release cannot dispatch ..."). For `retry-checkpoint` and
  `reconcile-maintenance` the reason is that route's own, as the table above gives it.
- `gone`: the stop cleared, or the work has since stopped again or been moved. It is never
  resumed in its later form.

When the Office queues a resume it also stops holding that work back, in the same step. It
changes nothing else about the job: no attempt count, no budget. The request then runs like any
other recovery request, and its handler still makes its own checks. For `reconcile-review` that
means the job carries on under the merge authorization and readiness rules it already had. Two
things follow from it being an ordinary request: IT's own recovery for that job finds it, adopts
it and counts one attempt; and a request whose `head` is a run's ID keeps the harness from
restarting that run, whatever becomes of the request.

A subject that is `due` is not always queued at once. The incident's history says why, once per
reason, as `resume-refused`:

| Code | Meaning | What happens next |
| --- | --- | --- |
| `resumes-paused` | The switch is paused. | Queued once you enable it, if the work still waits. |
| `release-unconfirmed` | The Office could not verify the running release or has yet to confirm that it contains the fix. | A rollback to a verified release known to contain the fix can still allow admission. If the running release lacks the fix or cannot be verified, the Office withdraws the deployment mark and returns the incident to `shipped`. |
| `project-paused` | The project is paused or draining. | Queued when it runs again. |
| `request-pending` | Another request for that ticket key is queued or working. An active scheduler claim on a GitHub job the Office requeues directly (a review or an implement) or on a Jira/Azure ticket also blocks the resume, even with no queued or working request. For a Jira/Azure ticket, an approved QA handoff still awaiting its ownership check also blocks the resume. For an assignment review: a request for its ticket queued or working in either queue, a Jira/Azure `start-pilot` included, or a scheduler claim on the review. | Tried again each pass. The Office resumes the work when it clears if the repair wait still holds. See A ticket's resume for what happens when someone else resumes a Jira/Azure ticket. |
| `wait-ended` | The work is not being held for this repair right now. Either that is final: the wait ran out after 48 hours, or the work stopped again or was moved. Or it is temporary: something stronger explains the stop for now, such as a hold, a decision, a merge approval, a prerequisite or an unconfirmed write. An approach-guard stop that an earlier release saved as an unconfirmed write keeps that label, and so reads `wait-ended`; so does a guard stop whose job has a write that was never confirmed. A dead writer bound to `release-writer` reads `wait-ended` while a write of the job or its issue is unconfirmed in the Effects ledger, or a saved result owes a read-back; its own process failure does not count (see Work awaiting a repair). For an assignment review, the wait also ends if a later review supersedes it or an ordinary retry has already requeued it. The Office checks the wait before it tries the transition. | If final, not resumed; the item is yours. If temporary, the Office tries again each pass and queues it once that cause is gone, as long as the 48 hours have not run out. |
| `head-mismatch` | The route's `head` is not the run its handler would read for that job now, the handler has nothing to read for it (a run an earlier request already reconciled included), or another job that is not cancelled has the same ticket key. | The Office tries again each pass and queues it if that changes while the wait holds. Read the detail: it names what the handler reads. |
| `ticket-not-resumable` | For a ticket: its own resume would refuse, or would spend a step that is yours, or the Office could not tell this stop from a later one. QA setup has stopped three or more times in a row on the candidate; the feature gate is closed; the ticket is no resumable pilot (not a pilot, at the mailbox, complete); or its stop carries no date. | Tried again each pass, and queued if that changes while the wait holds. A stop with no date does not change: that ticket is yours. Read the detail. |
| `transition-refused` | Your recheck or requeue would also refuse `review-pr`, `review-candidate` or `requeue-implement`. The job is outside an eligible inactive review state, a merge was already attempted, or the project's merge policy leaves the merge to a person. For `requeue-implement`: the job is not blocked at implement by the approach guard right after a structured wait, for example because a later run replaced that pair; the guard would still reject the result; or the job has a pull request or a hold. For `review-assignment`, a non-cancelled delivery job holds the otherwise eligible review's ticket. A completed job counts. | Tried again each pass, and resumed if that changes while the wait lasts. |
| `key-mismatch`, `no-record`, `not-dispatchable`, `already-reconciled` | The route does not fit the work as it stands. | Not resumed; read the detail. |
| `not-dispatchable`, for a checkpoint, with "Checkpoint repair admission refused" | The checkpoint failed a repair admission check. For example, another checkpoint points to the same original run, so a later retry event that names only the run would be ambiguous (see A checkpoint's resume). | Tried again each pass, and queued once that clears while the wait holds. Only the first such detail is recorded: the history keeps one refusal per code. |

**A direct requeue.** `review-pr`, `review-candidate` and `requeue-implement` are not requests:
your recheck and requeue commands change the job at once. The Office makes the same change, with
the same checks and the same detail on the job, and saves a completed request beside it as the
record of the resume, so its outcome can be judged. Two things differ from your command:

- It does not emit your command's event (`pr-review-recheck`, `candidate-review-recheck`,
  `implement-requeued`). It emits only its own admission event. A recheck or requeue you make
  afterwards emits yours, and so still reads as `moved-by-hand`.
- It also refuses while a scheduler claim is active for the job, since nothing queued stands
  between it and the job.

The record is never run: the scheduler reads a completed request as finished. Nothing in the
browser shows it, nor the Office's admission event, which has no role and so appears in no one's
recent activity. The job's own row shows it queued again, as after your command. A job that left
a write to read back is not resumed this way: that write explains the stop, so the wait does not
stand for it (`wait-ended`).

`requeue-implement` is for one stop. The job's last two implement results are a structured wait
or decision and then a passed result that the approach guard rejected, and the job is blocked at
`implement` with the guard's message. Before it requeues, the handler runs the guard again on a
copy of the job without the rejected result. The job is requeued only if the guard would now
accept it. The scheduler then runs implement again on the same candidate, which is a paid model
run. Both earlier results stay in the job's history. A scheduler claim on the job as delivery work
blocks your command and the Office alike; a claim on other work with the same ID does not.

The Office resumes such a stop once per fix. If the re-run is rejected again, its last two
implement results are no longer that pair, so a resume under a later fix is refused
`transition-refused`. The harness saves a guard stop as `unclassified`. One that an earlier
release saved keeps its saved kind, an unconfirmed write, and is refused `wait-ended`.

**A writer release.** `release-writer` is for a GitHub writer stage (`implement` or
`update-base`) on a hands-off project whose run died and that the harness would restart but for
its allowance: three restarts, within six hours of the stop. Its `head` is required: the ID of the
dead run, exactly as the Office recorded it. The Office checks what it checks for any job's
resume, refuses while a scheduler claim is active for the job, and asks the harness's own restart
rule whether this run is one it would restart if its allowance allowed. A run that returned a
verdict, still has a live process, was already restarted or declined, has its result saved, or
belongs to a job with a hold, a recovery record of its own or an unconfirmed write is refused
(`head-mismatch` or `wait-ended`). Then, in one step, the Office saves the grant on the job (bound to
the fix, the run, its stage and the accepted head), saves a completed request beside it as the
record of the resume, and lifts the wait. It restarts nothing: the job stays stopped.

At its next poll the harness restarts that run as it restarts any dead writer, with every one of
its checks: the branch and pull request have not moved, the worktree can be saved, nothing is
held. The grant allows one attempt once the three are spent or the six hours have passed, five
minutes after the stop; while an ordinary attempt is still due, that one is taken and the grant
is not spent. It is spent in the same write that records the restart. The earlier restarts and
their `refs/office/salvage/<job>/<run>` refs stay as they were; nothing is reset or counted again.
The restarted run is a paid model run. If the job's accepted head, the run or the grant changes
while the harness reads, that pass records nothing and the next one decides. The harness never
moves a salvage ref once made, so a later pass for the same run either finds the worktree still
holding exactly that work, or already reset by it, or declines and names the ref.

**An assignment review's resume.** `review-assignment` is a direct requeue too. The Office
requeues the stopped review the fix was bound to, which must be the last one stored for its
ticket, and saves a completed request beside it as the record of the resume. It changes only the
review's status and its queue time. It is not your `review-assignment` command, which rechecks the
ticket's latest review:

- It keeps the review's IT ownership-recovery count. Your command resets it to 0.
- It keeps the review's read retries as they are. A review whose three read retries are spent,
  marked exhausted or not, or whose IT recoveries are at their cap of three, is still resumed,
  once per fix. No budget is reset or replenished. The record of the resume is what stops a
  second one, and the ordinary read retries and IT's recovery keep their own limits.
- It does not emit your command's event (`assignment-recheck`). Your `review-assignment` or
  `defer-non-ready` afterwards emits `assignment-recheck` or `pickup-deferred`, and reads as
  `moved-by-hand`.
- It refuses while a request for the ticket is queued or working in either queue, while a
  scheduler claim is active for the review, and while a delivery job that is not cancelled holds
  the ticket.

Once requeued, the review runs as any queued review does. On a project that is not hands-off that
can be a paid read-only PM run with a 15-minute timeout, after the ordinary checks of its
assessment, assignment, holds and pilot ownership. Hands-off intake keeps its own deterministic
path.

Declare `stage-left` for `assignment-review`, or `record-settled`. The Office uses the
review's own decision after its scheduler claim ends.

- `stage-left`: the review ended `ready`, or delivery took its ticket: a job that is not cancelled
  holds the key. The job counts even once the review was cancelled or is gone.
- `record-settled`: the review reached its own decision: `ready`, `owned` or `held`. Delivery or a
  later review of the ticket is not that decision.
- `stage-result-passed`: a review saves no stage results, so this reads `untested` at once.

**A ticket's resume.** A Jira/Azure pilot ticket is resumed by queueing its own `resume-ticket`
request, the one the Resume command queues, marked as a repair resume. It differs from a
person's resume in five ways:

- Intake is not touched. Where intake assessment is on and the ticket is not enrolled in a
  feature, a person's resume counts as a manual start and closes the ticket's assessment; the
  Office's never assesses, opens or closes one.
- Only a stop the harness dated is resumed. When the harness itself stops a ticket (a stage that
  threw, a worker that returned nothing it could verify) it saves when; a ticket stopped by its
  stage's own verdict has no such date, and is marked only by its run and attempt. The same run
  can stop that way twice and look the same, so the Office could resume a stop the fix was never
  bound to. It records `ticket-not-resumable` and leaves that ticket to you.
- It never rides on other work for the ticket. If a delivery request for it is queued or working,
  a scheduler claim is active for the ticket or one of its requests (a QA ownership check runs
  that way, with its request still blocked), or a QA handoff you approved is still waiting on
  that check, the Office does not queue beside it or adopt it; it records `request-pending`.
- It runs its read-back once. If it fails while the ticket's feature gate is closed it ends
  blocked; an ordinary request in that case is queued again for when the gate reopens.
- It stays out of the QA setup cap. After three setup stops in a row on one candidate, a first
  resume only shows the count and the next one spends another attempt. Both are yours: the Office
  records `ticket-not-resumable` and leaves the ticket's own record of the cap alone.

Everything else is the ordinary resume, with its ordinary checks when the request runs: the
feature gate, the read-back of the ticket and its pull request, the step it decides to resume at.
That read-back is a paid model run, and where the candidate's head moved the resume can post one
Dev update to Jira, before it can refuse. A ticket parked on the board for a decision or a
release, held, or waiting on a prerequisite is never resumed: the repair wait does not hold for it
(`wait-ended`).

A ticket someone else resumes while it awaits its repair is no longer the Office's to resume for
that fix. While any delivery request for a ticket is queued or working, the ticket has no entry of
its own in the Office's schedule, so the ledger sees its stop clear and the repair's hold on it
ends. If it stands stopped again afterwards, that is a later episode than the one the fix was
bound to, and it reads `gone`. So a queued or working request is recorded as `request-pending`
only when it arrives in the same minute. A scheduler claim or a waiting QA handoff leaves the
ticket in view, and is recorded as `request-pending` once, however long it lasts; the ticket is
resumed when it is over, if it still waits for this repair.

A ticket the Office resumed leaves view the same way. If its resume refuses before any stage runs,
the ticket returns with the stop it had, and the ledger records it as stopping again. That is not
a recurrence: the stop is dated before the fix was deployed (see When an incident is verified or
has recurred). A ticket whose stop has no date and returns to view does count as stopping again,
because nothing tells it from a new stop.

What became of a ticket's resume is read as a job's is (see What became of a resume). A resume
the ticket's own handler refused before any stage ran has no outcome at once: nothing moved, so it
is `stalled` once 24 hours have passed that way.

**A checkpoint's resume.** A Brain nightly checkpoint is resumed through
`reconcile-native-checkpoint`, the native read-back. Only Brain has a native gate, so a
checkpoint of any other project is refused `not-dispatchable`. When the request runs, the
handler reads Brain's gate once, with no model run. It completes the checkpoint only if a native
run already completed that date and the Office holds a completed maintenance run for it.
Otherwise the request ends blocked; it never starts maintenance.

Before it queues the request, the Office checks what the handler would check in Brain's own
store: the checkpoint is blocked or interrupted, its run is reconciled and linked back to it, it
has no blocker follow-up or continuation, its latest maintenance read-back passed with every
receipt verified and certain, and no work under that run is running. It also refuses while
another checkpoint points to the same run, because a later retry event names only the run. Each
of these refuses with `not-dispatchable` and keeps the wait, and the Office tries again each pass.
The resume records the run the checkpoint was linked to. If the checkpoint is linked to another
run by the time the request runs, the request ends blocked and reads nothing.

Lifting the wait gives the checkpoint back to IT's ordinary recovery. While IT has recovery
budget left for it, IT can queue `retry-checkpoint` beside the resume. That handler first tries
the same native completion. If there is none, and the gate allows, it queues the checkpoint again,
and the scheduler then starts a paid maintenance run for it. Queueing IT's request shows nothing
by itself; what its handler does is judged like anything else. Once IT's retry budget is spent,
IT can reuse an identical native read-back request while it is queued or working. If the resume's
request already ended blocked and the checkpoint remains eligible, IT can queue its own read-back.

What became of a checkpoint's resume:

- `advanced`: the checkpoint is completed and its run, after the resume, saved the native
  read-back's own receipt for this checkpoint and run, verified and certain. Whoever's request
  made it, it counts.
- `moved-by-hand`: a retry was queued for that run after the resume. The event does not say who
  queued it: you, IT, the not-started recovery or the refresh continuation read the same.
- `untested`: the checkpoint was completed by the ordinary completion read-back, or completed with
  no native receipt after the resume; its run is gone, shorter, or no longer linked to it; or the
  fix declared a boundary other than `record-settled`. An ordinary completion therefore never
  verifies an incident by itself.
- `gone`: Brain no longer holds the checkpoint.

The incident is still verified only when every subject is accounted for and at least one resume
`advanced`.

### What became of a resume

Once a resume is queued, the Office reads each minute what became of it and records the
outcome once, in the incident's history as `resume-outcome` and on the fix as `outcomes`. It does so only
while the release it runs is verified and known to hold the fix. Judging pauses while a release
comparison is pending. The pass uses the project's records and the ledger without asking a model,
and writes outcomes only to the ledger.
What the outcomes amount to for the incident is decided separately (see When an incident is
verified or has recurred).

| Outcome | Meaning |
| --- | --- |
| `advanced` | The boundary the fix declared was crossed after the resume was queued. It counts whichever automatic path crossed it: the resume's request, a later recovery request or a restart. |
| `recurred` | The ledger recorded the work stopping again for this incident's cause after the resume and after the fix was found in the running release. This replaces any outcome recorded before it, and nothing replaces it. |
| `chained` | Before anything else could be said, the job, or the request the resume queued, stopped for another cause; the detail names that incident. Not final: any other outcome replaces it. |
| `stalled` | Nothing has moved for 24 hours and no wait the Office understands explains it; the detail says since when. Not final: any outcome but `chained` replaces it, and it replaces `chained`. |
| `moved-by-hand` | An operator's command for the ticket followed the resume (PR preparation, a candidate base update, a candidate or PR review recheck, a requeued implementation). For a Jira/Azure ticket: a request your own command queued for it after the resume's (`start-pilot`, `resume-ticket`, a corrected QA plan, a saved-implementation continuation). For a Brain checkpoint: a retry queued for its original run after the resume, whoever queued it. For an assignment review: your `review-assignment` or `defer-non-ready` command for its ticket after the resume; a job's commands do not count for a review, nor a review's for a job. The boundary is not read after that, and the move is found even if the job is gone since. |
| `gone` | The job or assignment review is missing or cancelled, or the ticket or checkpoint is missing, with the boundary not crossed; or the project no longer holds the request. |
| `untested` | Nothing can show whether the repair worked: the fix declared the boundary undeclared; the boundary cannot be judged for this job; the release that held the fix stopped serving after the resume was queued; or the resume was queued by a release that did not yet record how the job stood. For a checkpoint, also an ordinary completion (see A checkpoint's resume). For an assignment review, also `stage-result-passed`. |

A resume with no entry is still pending. `moved-by-hand`, `gone` and `untested` say nothing about
the repair either way. An outcome other than `chained` or `stalled` stays as recorded unless the
work recurs.

The 24 hours of `stalled` run from the latest of: the resume being queued, the last run of the job
or of the request the resume queued (a run in progress counts up to its last heartbeat), and the
last time the ledger saw the work stop, stop anew or clear, in any incident. The Office suppresses
a `stalled` judgment while the project is paused or draining or the work is open in the ledger
under an `expected` wait such as a hold, a decision, a merge approval, a prerequisite or a
provider wait. Time spent waiting still counts toward the 24 hours if nothing moves. A resume
quiet since admission can be `stalled` at hour 24 even if its project was paused for the first
20 hours. For a Jira/Azure ticket the runs that count are its delivery work: a stage run, a
read-back, a reconcile or a Jira transition filed under its key. A conversation, a Slack message,
a retrospective or an investigation about the ticket does not start the 24 hours again. For a
Brain checkpoint the runs that count are those filed under the checkpoint, the resume's request
or the checkpoint's original run; a run of another night does not. For an assignment review they
are the runs filed under that review; a later review of its ticket does not count.

What each boundary reads, for a delivery job:

- `stage-result-passed`: a result of that stage that passed, saved after the resume was queued.
  A result the job already had does not count.
- `stage-left`: the job is at another stage and is not cancelled. The stage must be the one the
  job was at when it was resumed; otherwise the outcome is `untested`.
- `record-settled`: the job is completed.

For a Jira/Azure ticket:

- `stage-result-passed`: a run of that stage that began after the resume was queued, and passed.
  A pass the ticket already had does not count. Nor does a read-back that accepts the earlier
  run: it moves the ticket on without a run of the stage.
- `stage-left`: the ticket is at another stage, whether a stage run or a read-back took it there.
  The stage must be the one the ticket was at when it was resumed; otherwise the outcome is
  `untested`.
- `record-settled`: the ticket's stage is `complete`.

For a ticket, declare `stage-left` unless the fix is only shown by the stage running again.

For a Brain checkpoint, declare `record-settled`: a checkpoint has no stage of its own to leave or
pass, so the other two read `untested`. What counts as settled is under A checkpoint's resume.

For an assignment review, declare `stage-left` for `assignment-review` or `record-settled`. What
each reads is under An assignment review's resume.

Declare a boundary the route can reach. What a read-back saves differs by route: some save the
stage's own step, some a step under a read-back name of their own, some none. Where the read-back
saves no step of the stage, that stage's passed result is saved only later, when the job next
runs the stage in the ordinary way.

| Route | Step the read-back itself saves |
| --- | --- |
| `reconcile-implementation` | `implementation-readback`; none where a saved prerequisite result is handed on, which only moves the job to `review` |
| `reconcile-validation` | `validate`, the stage's own step |
| `reconcile-scope-repair` | none; the job is queued again at the stage it stopped at |
| `reconcile-preparation` | `prepare-pr`, the stage's own step; `conflict-readback` for a published draft's conflict; none for a completed conflict draft |
| `reconcile-base-update` | `base-update-readback` for an unpublished candidate; none otherwise |
| `reconcile-closeout` | `closeout-readback` for the saved closeout, where it reads the closeout's effects back. With a head it saves none itself and queues a separate cleanup request. The job stays at `closeout` either way and ends completed, so declare `record-settled` |
| `reconcile-review` | `lead-pr`, the stage's own step, for the saved review; `review` for a continuation's saved review; none for a stopped base handoff |
| `review-pr`, `review-candidate` | none; the job is queued again at the stage it stopped at, and the stage's own run saves its step. For a merge preflight declare `stage-left` for `merge` or `record-settled` |
| `requeue-implement` | none; the job is queued again at `implement`, and the implement run saves its step. Declare `stage-left` for `implement`. Not `stage-result-passed` for `implement`: a passed result the guard rejects again is still saved as a passed step before the job is blocked, so that boundary can read `advanced` while the job is still blocked at `implement` |
| `release-writer` | none; the job stays stopped until the harness restarts the run, and the restarted stage's run saves its step. Declare `stage-left` for the bound writer stage. For `implement`, not `stage-result-passed`: a passed implement result can be saved just before the approach guard rejects it |
| `review-assignment` | none; the review is queued again and runs as any queued review. Declare `stage-left` for `assignment-review` or `record-settled` |

When in doubt, declare `stage-left` for the stage the job stopped at.

Two limits. An operator who queues a recovery request by command leaves nothing that tells it
from the Office's own, so that move is not seen. And a job cancelled because its pull request was
merged by its owner is `gone`, not `advanced`, unless the boundary was crossed first. For a
ticket, a command of yours that finds a request already queued or working for it queues none, and
is not seen either.

If the request a resume queued stops, that also shows up like any other stopped request.

### When an incident is verified or has recurred

After the outcomes are read, the Office decides each minute whether they amount to something for
the incident. For a `deployed` incident, it requires a verified running release known to hold
the fix. While a release comparison is pending or inconclusive, the incident stays `deployed`
and judging and settlement pause. If the comparison confirms the fix, both resume under the
same deployment mark. The withdrawal pass returns the incident to `shipped` only if the release
identity is unknown or the comparison confirms the fix is absent.

A `deployed` incident becomes:

- `recurred` as soon as the cause stops work again with the fix deployed: a resume's outcome is
  `recurred`, or the ledger records any work of the incident stopping after it recorded the fix
  as found in the running release, whether or not that work was resumed and whether or not the
  fix names it. The first such stop decides; the other work is not waited for. "After" is the
  order the ledger wrote things in, not the times on them. If the projection still holds the
  subject's stop date, a stop the project dated at or before the deployment mark is excluded.
  Once the projection drops the subject, append order alone decides.
- `verified` once every piece of work the fix names is accounted for and at least one resume
  `advanced`. Accounted for means: the fix gave it no route; or its stop cleared or changed
  without a resume; or its resume ended `advanced`, `moved-by-hand`, `gone` or `untested`. Work
  still waiting to be resumed, a resume that is pending, `chained` or `stalled`, and work the fix
  bound to a route this release cannot dispatch (its standing also reads `no-route`, but it is
  still stopped as bound) are not accounted for.

Otherwise it stays `deployed`. In particular a fix none of whose resumes `advanced` is never
verified by the Office, however the others ended, and an incident that is only stalled or chained
stays where it is for you to read.

A `verified` incident becomes `recurred` when the ledger first records another stop for the same
cause after the verification event, whatever release is running. A stop dated at or before
deployment is excluded while the projection still holds the subject's stop date. Once the
projection drops the subject, append order alone decides. The incident stays `verified` through
a rollback and can accept a repair or dismissal once it recurs. The `verified` record keeps
the fix, the verification event and its time after recurrence.

A `recurred` incident keeps its fix, what the fix declared and every outcome. You can start a new
repair for it or dismiss it, as for an observed one.

What follows from leaving `deployed`, on the next pass:

- Work of the incident that was still being held for the repair and had not been resumed is no
  longer held. It goes back to ordinary recovery, restarts and follow-ups, as before the repair.
- No further resume is queued for the fix, and resumes still pending are no longer read.
- `deployed` on the fix is no longer kept true of the running release; read it as the release the
  fix was last found in.

History shows each move once, as `incident-verified` or `incident-recurred`, with the work that
decided it.

`resumes` is `null` in the incident's status whenever the incident is not `deployed`: after the
Office withdraws the deployment mark and returns it to `shipped` (see When a fix counts as
deployed), and after it becomes `verified` or `recurred`.

### What to expect

- Observation updates the ledger once a minute and not at all while a deployment holds the fence.
  A repair start or a fix binding you record is saved at once. Until the
  first stop is recorded its tables do not exist and both routes return nothing.
- The comparison of a `shipped` fix with the running release asks GitHub through the service's own
  `gh` login, once per release and fix commit. It is skipped while a deployment holds the fence and
  when the service runs with polling off.
- A paused or draining project shows as one subject. Its stopped work stays open until the project
  runs again and the ledger can see whether it cleared.
- A failed run is counted for 24 hours, then clears by itself. One that belongs to a stopped job,
  ticket, review or maintenance run, to the outbox item kept for a ticket or review, or to the Jira
  mailbox error its check recorded, is part of that subject instead. Of the runs that failed for
  one cause in a project, only the newest 20 are subjects of their own: an older one clears as
  newer ones arrive, and still counts as part of the stopped work it belongs to. Every run that
  was recorded stays in the incident's event history.
- If a collector cannot read a project, the service log says which one each minute, and what that
  collector had reported for the project is left open until it can. A subject whose cause changes
  meanwhile still moves to its new incident. An unreadable outbox releases an item only when fresh
  stopped-work reports cover it. A Jira mailbox error stays open while a check is queued or running
  unless a successful check has been recorded since the observed failure.
- With three GitHub projects, ordinary provider waits will meet the two-project threshold often.
  That is the plan's threshold; it makes them eligible for research, nothing more.
- A run a provider refused at its usage limit is a `provider-wait` when the harness typed the
  failure as `provider-limit`, which it does for a stage that only reads. The ledger does not read
  the reset time the provider stated: three such runs, or two projects, still cross the research
  threshold before it. A writer stage refused the same way keeps `uncertain-effect`. The repair
  wait for a dead hands-off writer reads past that label to the Effects ledger (see Work awaiting a
  repair); the ledger's own reading of the stop is unchanged.
- The repair runner's own failures, such as an Office that stopped answering, reach the ledger
  when the runner forwards them (see [Forwarding and reports](#forwarding-and-reports)). They form
  one `runner` incident whose subject, `office-overseer/runner/office-service`, stands for the
  newest outage: open from its `service-down` until its `service-restored` arrives, one episode per
  outage. Observation never changes that subject; only the runner's reports do.

## Runner

The runner is the Overseer's own process, separate from the Office service, so it still works
when that service is down. Each pass observes and reports. It reads the Office's health
and its research list, keeps at most one incident in flight and records what it saw. It calls no
model, makes no GitHub call and takes no scheduler claim. Besides those reads it sends the Office
only its own reports: the failures it journaled and its control condition (see
[Forwarding and reports](#forwarding-and-reports)). Nothing starts it on a schedule until you
install its launcher (see [Launcher](#launcher)), and the incident it keeps in flight is only
recorded: nothing is triaged, fixed or resumed because of it.

### Running a pass

```bash
OVERSEER_ROOT="$HOME/Projects/the-office-overseer" node --import tsx server/overseer.ts pass
```

`OVERSEER_ROOT` is required and must be an absolute path. `OVERSEER_OFFICE_URL` is optional and
defaults to `http://127.0.0.1:4318`; it must be a bare `http:` origin on `127.0.0.1` or
`localhost`, the only origins the Office answers. `[::1]` is refused like any other host: the
pass, the installer and the launcher all check the same rule, and an installed launcher takes it
only when you install it again. Whether any installation used `[::1]` was not checked. Before it
loads any Office module, the pass sets `OFFICE_DATA_ROOT` to
`state/office-data` under its root, whatever the shell set it to. Office code it loads can then
never see the Office's own data.

A root is refused, with nothing written, when:

- it is empty or relative;
- it is, contains or lies inside the Office data root: `OFFICE_DATA_ROOT` as the shell sets it,
  or the checkout's `.local`;
- it lies beneath a directory that holds `office-control.sqlite`, `controller-pin.json` or
  `deployments/`, on the path as written or after links are resolved;
- it goes through a link that leads nowhere, or one of its folders exists as a file or a link.

| Exit | Meaning |
|---|---|
| 0 | A pass was recorded; its record is the last line of output |
| 1 | The pass could not save its record; read the error |
| 2 | Malformed invocation, unsafe root or non-loopback Office; nothing was written |
| 3 | Another pass holds the runner; nothing was written |

### What a pass records

| Outcome | Meaning |
|---|---|
| `observing` | One incident is in flight: `selected` names it and says whether it was `kept` from an earlier pass |
| `idle` | No incident is eligible |
| `fenced` | A deployment holds the fence, or the fence reads `invalid`; nothing is selected or released |
| `read-failed` | Health answered, the research list did not |
| `service-down` | The Office did not answer `/api/health`; see below |
| `paused` | A pause holds the runner |
| `stopped` | STOP holds the runner, or the pass just wrote one |

A pass that reports appends to its detail what it forwarded and reported, such as
`Forwarded 2 of 2; halt reported running`, or why it could not.

An incident is eligible when the ledger offers it for research, it is in state `observed`,
`triaged` or `recurred`, and it is not one of the runner's own failures. The incident in flight is
kept while it stays eligible. When it no longer is, `released` names it with the reason
(`not-research-eligible`, `runner-source` or `state:<state>`). The pass then picks at most one
other, the one offered for research longest, then by ID. A repair you start moves the incident to
`fixing`, so the runner lets it go.

Health and the research list are cached separately, each with the time it was read. A pass that
reads health but not the list (`fenced`, `read-failed`) refreshes only health. The list, its time
and the incident in flight stay as they were. A `service-down` record gives `cachedHealthAt` and
`cachedIncidentsAt`, the times of the last readings, which are not current. STOP or a pause that
arrives while a pass reads the Office holds before anything is selected or released.

### Files

All under the root, kept apart: control files, journals and state.

| Path | Holds |
|---|---|
| `control/STOP.json` | Present when the runner needs a person. Only a person removes it |
| `control/pause.json` | Present while the runner is paused |
| `control/pass.lock` | The pass that holds the runner; `pass.lock.reclaim` exists for an instant while a pass takes it |
| `journal/failures.jsonl` | The runner's failure events, one per line, never rewritten |
| `state/runner.json` | The incident in flight, the current outage, both cached readings, any journal write still owed, and the last pass |
| `state/office-data/` | The pass's `OFFICE_DATA_ROOT` |
| `state/budget.sqlite` | The budget ledger: every model reservation and deployment admission (see Budgets) |
| `state/runner.sqlite`, `state/runner-data/` | The runner's private Store: the Effects of its reports and what it knows of each one. Only a pass that holds the lock opens it, and only in the dedicated runner directory |
| `state/forwarding.json` | What the last pass forwarded and reported, for `status` (see Forwarding and reports) |
| `control/budget.json` | Optional: a lower or higher daily ceiling (see Budgets) |
| `code/pin.json` | The release the launcher runs passes from; only `pnpm office overseer pin` writes it |
| `code/launcher/overseer-launch.mjs` | The installed launcher, a read-only copy (see Launcher) |
| `state/launcher.json` | The launcher's attempt in progress, its counters and its last 20 attempts |
| `control/launcher.lock` | The launch that holds the launcher; `launcher.lock.reclaim` exists for an instant while one takes it |
| `logs/launcher.out.log`, `logs/launcher.err.log` | launchd's capture of the launcher's output |
| `runs/<id>/` | One model run's own folders: `home`, `tmp`, `provider` and `office-data` (see Worker environment), its frozen `snapshot` and its `sandbox.json` (see Worker sandbox). Nothing creates one yet |
| `w/<id>/` | The sandbox wrapper's own short temporary folder for one run, never opened to the payload (see Worker sandbox) |

### Controls

```bash
pnpm office overseer status
pnpm office overseer pause --reason "looking at CEC-154"
pnpm office overseer unpause
pnpm office overseer pin COMMIT
```

These read and write the runner's files only and never contact the Office, so they work while
the Office or its configuration is broken. `pin` is the one exception that loads Office
configuration, to find the Office data root its release lives in. With `OVERSEER_ROOT` unset they use
`~/Projects/the-office-overseer`. `status` reads every file above and creates nothing: the budget
ledger through a read-only connection, never the Store. It shows STOP and pause, the lock owner or
a guard left behind, the runner state, the number of journaled events, the billing mode,
today's budget standing, the pin, the launcher's state and who holds its lock, the Office origin it
would report to (`office`), and what the last pass forwarded (`forwarding`), and names any file
it cannot read. `forwarding` comes from `state/forwarding.json` and is shown only when it was
written for that origin and for the journal as it reads now; otherwise its counts are unknown and
it says why. Status never opens the runner's SQLite Store. A pause keeps its first reason; pausing again
changes nothing. `unpause` removes the pause and nothing else. If STOP is present the runner stays
stopped, and the answer says so.

Pausing the runner pauses nothing in the Office. The switch for automatic repair resumes is the
Office's own (`pnpm office incident pause-resumes`, under Resuming after a fix) and works
whatever the runner is doing.

### Budgets

No model runs yet: nothing in the runner calls one before phase 7. What exists is the admission
every future model call must pass, and the ledger that keeps its account. Phase 7's model runs go
through one boundary, `runBudgeted` in `server/overseer/budgeted-run.ts`, which admits a call,
starts it, and settles what it cost.

**The money is an estimate.** The runner's model calls use the existing Claude and Codex
subscription logins the Office workers use, so they share their usage limits with Joe's own
sessions and the Office. Every dollar figure is what the usage would cost at API list prices:
Claude's own estimate (`costBasis: list`) and, for Codex, the Office's price table. It is never a
bill. Run counts and timeouts are the real brake; the daily ceiling stops a runaway. Neither the
margins nor the timeouts guarantee a worst-case dollar amount.

`pnpm office overseer status` shows the billing record:

| Field | Value |
|---|---|
| `mode` | `subscription-logins`, for `claude` and `codex` |
| `dedicatedApiKeys` | `false`: none are provisioned, and switching to API keys is a billing decision for Joe |
| `sharedUsageLimits` | `true` |
| `accountBackstop` | `not-configured`, by Joe's decision of 2026-11-25; whether either account offers one is not verified |
| `claudeMaxBudgetUsd` | `not-applied`: Claude's `--max-budget-usd` is not qualified on the subscription profile |

Before ordinary dispatch, phase 7 must show isolated access to those logins, that each run's
receipt names the session it was started with, real output activity and that the provider
process exits. A missing or mismatched login stops dispatch.

**What a call costs to admit.** Every stage is in one closed table. A stage outside it is
refused. Each call reserves 150% of its stage's allocation:

| Stage | Allocation | Reserved | Timeouts (total / quiet) | Counts in |
|---|---:|---:|---|---|
| `research`, `triage` | $2 | $3 | 15 / 5 min | 2 triage rounds |
| `second-opinion` | $2 | $3 | 15 / 5 min | 1 second opinion |
| `plan`, `plan-review` | $3 | $4.50 | 20 / 5 min | 2 fix attempts |
| `fix` | $15 | $22.50 | 60 / 10 min | 2 fix attempts |
| `review` | $3 | $4.50 | 20 / 5 min | 2 review-repair rounds |
| `repair` | $15 | $22.50 | 60 / 10 min | 2 review-repair rounds |

A call names its incident and its round, from 1 to the limit of the counter its stage counts in.
Each stage runs at most once in a round, and the first call in a round opens it, whichever stage
that is. So a fix attempt can be a plan, a plan review and the fix, and still counts as one
attempt. Every call also counts against the day: 24 model calls and 4 newly opened fix rounds per
Eastern day. A round opened at 23:59 keeps that day when it continues after midnight. Six
deployments a day are admitted the same way, for phase 10.

The diff cap allows up to 15 files and 600 changed lines, and future repairs that exceed either
limit go to `needs-joe`.

Timeouts are required: whole milliseconds, with `1 000 <= quiet <= total <= 7 200 000`. A call
without them is refused. `runBudgeted` returns control to its caller at the first of the two
deadlines, even when the call ignores its abort signal. Output resets only the quiet one.

**The ceiling.** $100 a day, held as 100 000 000 micro-USD. To change it, write
`control/budget.json`:

```json
{ "version": 1, "dailyCeilingMicroUsd": 50000000 }
```

The value is a whole number from 1 to 1 000 000 000. A file that cannot be read or does not
validate refuses every admission (`ceiling-unreadable`) until it is fixed or removed.

A call is admitted only if what it reserves fits in what is left today:

- **Spent:** the settled charges of calls admitted today.
- **Held:** every reservation not yet settled, from any day, at the larger of its reservation and
  its charge so far.
- **Overruns:** while an overrun is unacknowledged, nothing is available.

A reservation that exactly fits is admitted. Two processes admitting at once are serialized, so
they can never together pass the ceiling.

**Settling.** A call's reservation stays held until a receipt settles it:

- **Matching complete receipt.** When the receipt names the session the call bound at launch and
  is complete, its total is charged once, a valid zero included, and the hold is released. The
  charge stays on the day the call was admitted.
- **Missing or incomplete receipt.** The hold stays, at the largest of the reservation, the charge
  so far, and the largest amount the receipt supports. That is its priced subtotal, its reported
  total or its priced components, whichever is largest; they may describe the same spend, so they
  are never added. A crash that reports zero keeps the reservation. So does a receipt for another
  session.
- **A charge only rises.** Later evidence can raise it but never lower it. A late matching receipt
  below the charge already posted still releases the hold, and its exact total is kept beside the
  charge.
- **Abandoned.** A reservation still unsettled a minute past its total timeout, for example
  because its process died, is charged its full reservation and stays held.

**Overruns.** A charge above its reservation is an overrun. It stops every further admission,
whatever the ceiling, until a person acknowledges it at the amount `status` shows:

```bash
pnpm office overseer reconcile-budget RESERVATION --expected-micro-usd 25000000 --reason "looked at the run: a long fix"
```

An acknowledgement at another amount is refused (`stale-amount`); read `status` again. If the
charge rises later, it needs acknowledging again. Acknowledging does not release a hold that is
still waiting for its receipt. To close one by hand, once you have established that the call has
ended and what it cost, add `--finalize` and say how in `--reason`:

```bash
pnpm office overseer reconcile-budget RESERVATION --expected-micro-usd 22500000 --finalize --reason "process gone; charge left at the reservation"
```

A reservation still running cannot be finalized, and a timeout by itself is not evidence that a
call ended.

**When status cannot read the ledger.** `status` never repairs anything. It reports `budget`:
`{ unreadable }` with the reason, and invents no balance, when the ledger:

- is a link or a file with a second name;
- is not an SQLite database, or is not a rollback-journal one;
- is locked;
- has a `-journal` left beside it (`journal-present`).

A journal left by an interrupted write is rolled back by the runner's next write, not by
`status`. If it stays, check that no runner process is alive.

### Worker environment

No model runs yet. When one does, its worker starts with an environment the runner builds from
nothing (`server/overseer/worker-environment.ts`), passed as the child's whole environment
(`replaceEnv` in `server/workers/spawn-command.ts`). None of the runner's own variables reach it:

| Variable | Value |
|---|---|
| `PATH` | `/usr/bin:/bin:/usr/sbin:/sbin`; provider binaries are started by absolute path |
| `LANG`, `LC_ALL` | `en_US.UTF-8` |
| `HOME`, `TMPDIR` | The run's `home` and `tmp` |
| `CLAUDE_CONFIG_DIR` (Claude) or `CODEX_HOME` (Codex) | The run's `provider`, never both |
| `OFFICE_DATA_ROOT` | The run's `office-data`, never the Office's |
| `OFFICE_NO_POLL` | `1` |

Nothing else is passed: no GitHub, Jira, Azure, Slack, SSH-agent, cloud or Office credential or
configuration, and no `USER`, `LOGNAME` or `SHELL`. A provider may later be given a non-secret
setting only from its own list in that file, which is empty until its qualification adds one. A
child that runs with `replaceEnv` also gets no `NODE_V8_COVERAGE` the runner holds, and Node's
permission model refuses it outright. On macOS a CoreFoundation-linked program, Node among them,
sets `__CF_USER_TEXT_ENCODING` for itself when it starts; nothing passes that on.

Each run has its own folders, `runs/<id>/`, named by the ID of the budget reservation that admitted
it (`server/overseer/run-directories.ts`). An ID is used once, whatever is left in its folder.
Before it creates anything the runner checks the root as it was given, component by component, and
refuses a link anywhere in it or a root that no longer resolves where it did. The root must belong
to the runner and be writable only by it. The runner must also own `runs`, with no permissions for
group or others, and each of the five run folders must belong to the runner and have mode `0700`.
At handoff, the runner rechecks the type, physical location, ownership, and permissions of `runs`
and the five run folders. These checks trust the folders above the root. A process of the same
user can still change a folder after it was checked.

What these folders do and do not settle:

- **Fresh local state.** The provider directory relocates the CLI's own user settings, sessions and
  transcripts, so a run never reuses Joe's or an Office worker's. It does not move the scopes the
  CLI reads from elsewhere: Claude's project and managed (policy) settings, and Codex's project
  guidance in the folder it works in.
- **Not a session identity.** The reservation ID names the storage only. A run still has to start a
  new provider session and bind the session the provider reports to its reservation
  (`bindSession` in `server/overseer/budgeted-run.ts`).
- **Not confinement.** Keeping a worker to these folders is the sandbox's job, and proving which
  login it uses is the provider authentication's; both are later parts of phase 7.

### Worker sandbox

The worker sandbox contract targets Anthropic's outer filesystem and network sandbox
(`@anthropic-ai/sandbox-runtime`, `srt`, 0.0.83). This delivery adds no runtime dependency.
Its implementation checks use fixtures, and the observer dispatches no workers.

| Part | File | Does |
|---|---|---|
| Policy | `server/overseer/worker-sandbox-policy.ts` | Builds the runtime's settings for one run |
| Runtime | `server/overseer/worker-sandbox-runtime.ts` | Locates the pinned package inside the runner's own installation, as files; never runs it |
| Run | `server/overseer/worker-sandbox-run.ts` | Writes the run's policy once and hands one wrapped command to an executor its caller supplies |
| Qualification | `server/overseer/sandbox-qualification.ts` | The probe battery, how its observations are read, and which reader profile may then run nested |

**The policy.**

- **Reads:** content reads are denied everywhere (`/`). Homes, `/Volumes`, the shared and temporary
  folders, live Office data, the checkout's data, checkouts and session stores are denied by name
  too, and so are the runner's control, journal, state, code, logs and other runs, the runner's own
  installation, the wrapper's own folders (`w/`), and `launchctl`, `osascript` and `open`. Only
  these are opened again:
  - the run's frozen `snapshot` and its four working folders;
  - `/bin/bash` and `/bin/sh`, because on macOS the runtime runs the payload through `bash -c`;
  - `/usr/lib` and `/System/Library`, without which nothing starts;
  - the executables and runtime inputs a caller names, each reviewed. A narrow file beneath a home, such as a provider binary, may be opened; a home
  itself, or anything that contains or lies in a protected place, is refused.
- **Writes:** only in the four working folders and stage scratch strictly inside the run. The
  snapshot, policy file, both spellings of the runtime's shared temporary folder, and the
  `/dev/tty`, `/dev/dtracehelper`, and `/dev/autofs_nowait` devices are denied.
- **Network:** none; the domain allowlist must be empty, and Unix sockets, Mach lookups beyond the
  runtime's base profile, local binding, Apple Events, a pseudo-terminal and the runtime's weaker
  modes are all off. Every path is a literal, never a pattern.

**What the policy does not settle.** Denying a read does not stop a payload running a sealed system
tool: under this policy `/bin/launchctl` still ran and reached launchd. Denying launchd control is
therefore not something the policy does. The runtime's own HTTP and SOCKS proxy stays reachable on
loopback even with no domains allowed. Its base macOS profile still allows lookups of
`com.apple.securityd.xpc` and `com.apple.SecurityServer`, so whether a Keychain item can be reached
has to be tested, not assumed. The runtime also keeps a few built-in exceptions of its own, such as
stdio and the null device. Each of these is a probe of the battery below, and an unexplained one
leaves the sandbox unqualified.

**The policy file.** `runs/<id>/sandbox.json`: the settings with keys sorted, created once (never
over anything, never through a link) at 0600, then checked as a regular single-link file of the
runner's holding exactly those bytes. The run's folders and the file are checked again just before
each command. Anything else stops the run, and its ID stays used.

**One command.** `node <srt cli> --settings runs/<id>/sandbox.json -- <program> <args…>`:

- **Program:** the absolute regular file assigned to the selected probe or profile in the prepared
  policy's executable inventory.
- **Arguments:** each is passed unchanged after `--`.
- **Folder and environment:** it runs in the run's `home`, with the worker environment, except that
  the wrapper's own `TMPDIR` is a short folder of its own, `w/<first 8 of the run ID>`, at 0700. The
  runtime binds a Unix socket there, and a macOS socket path holds at most 103 bytes, which the run's
  `tmp` exceeds. The payload's `TMPDIR` is the run's `tmp`, passed as `CLAUDE_CODE_TMPDIR`. A root
  that would make that folder longer than 80 bytes is refused before anything is written.
- **Refusals:** an unavailable or unsupported runtime, a cancelled run, missing timeouts or a policy
  that does not check out stops it before anything starts.
- **No fallback:** nothing ever runs the program without the sandbox, and a failure is never
  retried.

The executor is supplied by the caller; these modules ship none, and no runner pass reaches them.

**Qualification.** The runner-owned receipts require a complete battery under the effective policy:

- **Allowed:** startup (with the exact arguments and folder), a snapshot read, writes read back in
  `tmp` and `provider`, and a file created through the ordinary temporary-directory API.
- **Denied, each beside a control that succeeds outside the sandbox:**
  - reads of a sibling folder, runner state, synthetic Office data, and Claude and Codex
    configuration outside the run;
  - writes to the snapshot, the run folder, a sibling, the policy and both spellings of the shared
    temporary folder;
  - replacing the policy or the snapshot, each verified intact afterwards;
  - a synthetic item in a disposable Keychain;
  - direct and proxied network, loopback, a Unix socket and a launchd query.
- **Runtime observations:** the payload's Java agent path matches the resolved JAR, both runtime
  proxies refuse forwarding, the remaining IPC surface is recorded, and parent writes stay in the
  wrapper folder.
- **Cleanup:** the payload, its process group and the proxy have all ended after each of success,
  failure, and interruption.
- **Nested Seatbelt:** whether a profile can be applied inside, recorded apart.

Each observation is bound to its run, probe, policy digest and profile. A payload probe needs a
start marker, exactly one terminal record and a successful command completion. A denial also
needs a matching positive control and an operation-specific refusal. Missing, duplicate or
inconclusive evidence leaves the sandbox unqualified.

A reader profile may run only with two receipts. The first is the outer battery for this OS build,
architecture, Node, runtime contents and policy rules. The second is its own inner receipt for the
exact provider binary, version, arguments and tools, showing each restriction it requires applied and
the battery passed through it. Each receipt keeps the digest of its originating policy. The runner
expands only allocation-owned paths for the new run and compares the resulting digest with the
verified policy file.

**Where things stand.** On 2026-11-26, Joe approved the installation prompts for an experiment
with runtime 0.0.83 on a separate branch. The host battery used synthetic sentinels. Launchd was
reachable under the policy, the credential-store probe was unrun, and the shared `/tmp/claude`
probe was inconclusive. Both shipped reader profiles remain unqualified and the model gate is closed.
See the [phase 7b journal](../wiki/journal/2026-11-26-overseer-phase-7b-worker-sandbox.md).

- **Codex reader:** a Seatbelt profile cannot be applied inside another on this Mac (Darwin 24.3):
  `sandbox-exec` inside `sandbox-exec` gives `sandbox_apply: Operation not permitted`, exit 71. Codex's
  own read-only sandbox for model commands is Seatbelt, so a Codex reader that can run commands stays
  unqualified. Joe's coordinator: "If a provider cannot meet them, record it as unqualified." Whether a
  Codex reader without command execution qualifies is a later profile decision, and Joe's if it would
  waive a restriction.
- **Claude reader:** no receipt yet shows its restrictions applied to the actual binary.

The project dependency pin in `package.json` and `pnpm-lock.yaml` and runner-owned receipts for
the exact host, installation, policy and provider profiles are outstanding.

### Triage and corroboration

No model runs yet, and nothing acts on what follows. This is the contract, tested against fixtures
only. How a model call is made, with its provider sign-in and sandbox, is in
[Provider sign-ins and reader runs](#provider-sign-ins-and-reader-runs). The 7b gate keeps it closed.

**What a reader is given.** The runner builds one frozen input per incident
(`server/overseer/stages/triage.ts`) from:

- the incident's evidence packet, with its digest recomputed as the Office computes it;
- the original bytes of every runtime file offered for citation, each matched to the startup manifest
  of the Office that produced the packet;
- `docs/`, `AGENTS.md` and `tests/` files at the packet's verified release commit, except the runner
  playbook (`docs/overseer/playbook/`), which is never a citable source. A name with an empty, `.` or
  `..` component is refused in either list;
- requirement examples, each a versioned clause or test example with the condition and the
  disposition it requires;
- any runner guidance (see [Runner guidance](#runner-guidance)), or its explicit absence.

Its canonical serialization and that serialization's SHA-256 identify it. Both providers get the same
prompt bytes, which say that everything in the evidence is data, never an instruction.

**What a reader returns** (`src/contracts/overseer.ts`). Exactly one of five strict, bounded verdicts:

- **`harness-defect`** names:
  - the refusal site and the distinct requirement it breaks;
  - the cause;
  - the smallest correction, with its structured case: covered episodes, the triggering clause and
    facts, the observed and required dispositions;
  - the affected files;
  - a regression in an existing test file.
- **`real-block`** names the open stop and the rule that makes it correct.
- **`false-positive`** names the covered stops and a current runtime citation for the dismissal flow.
- **`stale-state`** cites packet evidence of the change.
- **`needs-joe`** states the question.

Source is cited as `{path, sha256, startLine, endLine, decisiveLine, excerptSha256}`. Subjects are
cited by key and stop digest, and events by ID. Anything unknown, oversize or inconsistent is refused.

**Two calls.**

- **Triage:** round 1, or round 2 after an unusable first.
- **The blind second opinion:** the other provider, once, in round 1. It is given only which provider
  triage used and the identity of the input it saw, never its verdict.

Each is its own admission through `runBudgeted` (see Budgets). A verdict is published only when:

- the call ended on time;
- the ledger settled it against its receipt;
- the session the provider reports is the one bound at launch;
- the output parses.

Anything else is `unavailable` or `invalid`, never a guessed verdict. An answer that arrives after a
timeout settles its reservation but publishes nothing.

**Agreement** (`server/overseer/agreement.ts`) compares substance, never wording or confidence:

- the verdict;
- the cited refusal and requirement, by path, file hash and decisive line (context windows may differ);
- the covered episodes;
- the trigger, scope and the observed and required dispositions;
- the correction's direction and site;
- the edit and affected file sets;
- the regression target.

**Decision** (`server/overseer/corroborate.ts`). Six rules, in order:

1. Only the selected incident at its revision, still eligible for research, is decided. A packet, release
   or runtime file that has changed since the input was frozen makes both opinions unusable.
2. Each opinion must be the call the harness launched, with every reference resolving in the frozen
   packet and every citation resolving in the frozen bytes. A forged or stale opinion counts as missing.
   A pair needs distinct reservations from opposite providers.
3. An open subject in a protected wait or with an unsettled effect keeps the block. So does either
   valid `real-block`, even without a peer.
4. An unresolved authority prerequisite vetoes repair. Two `needs-joe` opinions go to Joe. Two agreeing
   `stale-state` or `false-positive` opinions covering every open subject become that proposal, for the
   Office's own settlement or dismissal flow.
5. A multi-source subject showing only a retry may hide a protected wait. Its per-source detail must
   come from the selected incident at the packet's revision. The detail is bound to the stop by
   recomputing `repairSubject(record)`, and both the subject key and the stop digest must match. A
   carried aggregate or a missing source leaves authority unresolved. `admit-repair` needs both
   opinions to be:
   - high-confidence `harness-defect`s that agree;
   - supported by a frozen example's condition and required disposition, against the covered stops'
     actual refusal;
   - an actual change to that refusal;
   - a distinct requirement;
   - covering every open stop.
6. Otherwise, with the slots the ledger shows:
   - a qualifying triage that lacks only its blind opinion asks for it;
   - an inconclusive pair may use one more triage round;
   - otherwise Joe.

Every outcome is a proposal; nothing here changes the Office.

### Runner guidance

The Overseer's playbook (`docs/overseer/playbook/`) is advisory guidance for its readers. It is not an
Office lesson: Harper does not curate it, Joe's digest does not show it, and it grants no authority.
Each entry restates a requirement already recorded in this document, and its `source` names that
heading. Nothing calls it yet but tests; the 7b gate keeps model calls closed.

**Format** (`server/overseer/playbook/entry.ts`, and the folder's README). One entry per `<id>.md` file,
YAML frontmatter only, with no body. The fields are `id`, `revision` (raised by hand), `kind`, `stages`
(today only `triage`, for both opinions), `when`, `statement`, `check`, up to four ranking `paths` and
`source`. Text is one trimmed line of at most 240 characters, and a path at most 120. Both are counted
as JavaScript string length, which keeps a rendered entry under the lesson selector's line limit. A
parser error or warning (an unresolved tag, say), a repeated key, an alias, an unknown field or a bad
value refuses the entry.

**Loading** (`load.ts`). The runner reads the folder from its own installation. A release is a
`git archive` of its commit, so the tracked entries ship with it, but the release's runtime hash does
not cover `docs/`: reading the installed bytes relies on the trusted installation root, as the run
folders do. Any of these refuses the whole playbook, and nothing is applied in part:

- a link at `docs`, `docs/overseer` or the playbook folder, or a folder that resolves outside the
  installation (the refusal names the folder);
- a missing `README.md`, a badly named file, or more than 64 entries;
- an entry or README that is a link, a pipe or not a regular file. Each is opened without following
  links and without waiting;
- an entry over 8 KiB, by its reported size or by the bytes actually read;
- an entry that is not UTF-8, or that does not parse.

A missing playbook, a malformed one and a read failure are refused with distinct codes.

**Selection** (`select.ts`). The entries go through the Office's own lesson selector
(`server/knowledge/lesson-selection.ts`), unchanged. It ranks path matches first, then by ID, and
holds at most 10 entries within 4,000 characters, reporting the rest as omitted by count or by
characters. The adapter changes only labels:

- the heading becomes `RUNNER GUIDANCE (advisory, … Current source and the requirement examples win
  over guidance …)`;
- each line's stage becomes `triage`;
- each reference becomes `playbook:<id>@<revision>`.

It refuses a repeated ID. It fails closed if the selector's output changes shape: another heading, a
missing or clipped line, an unmatched reference, or text longer than the selection. An empty selection
is the explicit absence.

The guidance is selected once per incident and frozen into the one input both opinions share, so
both see the same text. The input's identity covers the selected text. An edit to an entry that
stays omitted leaves it unchanged.

### Provider sign-ins and reader runs

Nothing here has run against a real provider. It is built and tested with synthetic sign-ins, fake
provider programs and a synthetic provider endpoint. The shipped dispatch gate is closed, so every live
call is refused before anything starts (`server/overseer/run-model.ts`).

**Separate runner sign-ins.** The runner uses its own sign-ins, which Joe creates on his existing
Claude and Codex subscriptions. It never uses his interactive ones. They live under the runner root,
which no worker policy opens:

| File | What it is |
| --- | --- |
| `providers/` | 0700. `providers/claude` and `providers/codex` are 0700 too |
| `providers/claude/oauth-token` | 0600. The one-line token from `claude setup-token` |
| `providers/codex/auth.json` | 0600. The `CODEX_HOME` login from `codex login --device-auth` |
| `state/providers.json` | Stopped sign-in generations and the active Codex hand-off |

Each is read without following a link or waiting on a pipe. It must be runner-owned, single-link, of
the exact mode, and within its byte limit by the bytes actually read. A refusal names the file, never
its contents (`provider-auth/sign-in-paths.ts`).

**Claude.** Each run gets an empty `CLAUDE_CONFIG_DIR` of its own. The token is added as
`CLAUDE_CODE_OAUTH_TOKEN` to that one executor call's environment only, never to a prepared policy, a
setting or a receipt (`provider-auth/claude-handoff.ts`, `worker-sandbox-run.ts`). The pinned sandbox
runtime passes the payload only its standard streams, so a token descriptor from outside would never
reach the CLI. The token is never refreshed.

Residual: while a Claude run lives, another process of the same user can read its environment.

**Codex.** The canonical login is copied byte for byte into the run's own `CODEX_HOME`, and the CLI
is told `cli_auth_credentials_store="file"`. The copy is made only after the hand-off is claimed in
`state/providers.json` (`provider-auth/codex-handoff.ts`). The envelope is Codex
0.167.0-alpha.4.1's managed ChatGPT login, with a consistent login owner, user and workspace. Agent
identities, personal access tokens, Bedrock keys and API keys are refused.

After the run's process group has exited, the runner reads the copy back:

- **Unchanged:** nothing is written.
- **Refreshed:** published back only when all of these hold:
  - it is the same login owner, user and workspace;
  - trusted provider-side evidence shows exactly those credentials were issued to this run;
  - the canonical file is still the one copied. If Joe signed in again meanwhile, his newer sign-in
    stands.
- **Anything else:** the generation is stopped.

The copy is retired before the claim is cleared. While the claim is held, no other Codex copy is made.

**Stops by generation.** An authentication rejection, a refresh rejection, another account, an
unreadable copy or an unverified rotation stops that generation (`provider-auth/profile-status.ts`). A
generation is the Claude token's fingerprint, or the Codex login owner with its user and workspace. A
rotation within a login keeps its stop, and a new enrollment starts clear. A stop is recorded only
from trusted evidence bound to the run and generation. Quoted errors, a rate limit or a transport error
leave the profile usable. Nothing falls back to another login, a shared home or an API key.

**Reader profiles** (`server/overseer/reader-profiles.ts`), adapted from the review workflow's
constrained invocations. Each restriction is built from its own arguments:

- **`claude-reader`:** `-p` with streamed JSON and the verdict schema, `--safe-mode`, `--restricted`,
  Read, Glob and Grep only over the snapshot, MCP denied and strict, plan mode with no permission
  prompts, no Chrome, and hooks disabled.
- **`codex-reader`:** a fresh `exec` with its model and effort, approvals never, a read-only sandbox, no
  agents, user configuration ignored, the file sign-in store, and the prompt on stdin. Its schema and
  answer are at fixed paths from the run's `home`.

The run's snapshot holds the frozen evidence, checked against the input's identity, and the schema
(`reader-input.ts`).

**Eligibility** (`sandbox-qualification.ts#profileEligibility`).

- Its inputs:
  - the rules come from the policy file on disk;
  - the provider identity comes from the selection, with its program hashed;
  - the host facts are supplied independently.
- The inner receipt must also show the profile's restrictions and its sign-in method in effect, so an
  older receipt qualifies nothing.
- A command-capable reader needs affirmative inner Seatbelt evidence.

**The gates, in order.** Each refuses before admission, so a refusal spends nothing:

1. the dispatch gate;
2. the pinned runtime;
3. trusted receipts, then:
   - no runner storage overlapping an interactive configuration or session root;
   - the run's own folders, snapshot and policy;
   - full eligibility;
4. the caller's pass lock, read from the lock itself, with any earlier hand-off resolved, then the
   profile's stop;
5. the sign-in.

The admitted call rechecks all of them immediately before dispatch.

**What a call is charged.**

- **Never dispatched:** a refusal there, or a refusal by the executor before spawning, releases the
  reservation, so the same round can be admitted again (`budget-ledger.ts#release`).
- **Dispatched:** the call's completion includes the group's exit, the Codex write-back or stop, and
  the copy's retirement.
- **Session:** it is bound from the first start event, once, and a second different session is a
  fault.
- **Suppressed verdict:** a verdict is suppressed by a foreign terminal, another model, an unexplained
  extra Codex thread or an incomplete rollout inventory. A call that left a valid charge still settles
  it (`reader-result.ts`, `budgeted-run.ts#AttributedFailure`).
- **Timed out:** the call's completion goes to the caller that holds the pass lock, which drains it
  before releasing the lock.
- **Pass ends first:** if the pass ends before that completion, the durable claim fences the next
  Codex copy. The next lock holder retires an orphaned copy only once the recorded group is confirmed
  gone. It stops the generation if the copy had changed. A launch with no recorded group waits for an
  operator.

**Status of each reader.** Both are unqualified. On this tree the runtime is not pinned or installed;
0.0.83 was inspected in a separate checkout. Host qualification still needs:

- the runtime pin;
- outer and inner receipts;
- denial of the canonical provider folders;
- the Claude wrapper and any descendants' exposure;
- managed settings, hooks and MCP;
- restricted snapshot access;
- Keychain isolation;
- Codex's file store in effect;
- trusted rotation and authentication evidence;
- agents and customizations suppressed in effect.

Each of those is a host step that needs Joe's go-ahead. The recorded gaps stand:

- launchd control was reachable;
- the shared temporary folder was inconclusive;
- Seatbelt does not nest on Darwin 24.3.

The current policy allows no provider or refresh endpoint.

**Joe's enrollment, once the setup is declared ready.** Joe makes both sign-ins himself, through the
providers' own flows, on his existing subscriptions.

1. Check that `providers/` and `state/` overlap no interactive configuration or session root.
2. Stop scheduled starts.
3. Take `control/pass.lock.reclaim` create-exclusively, which keeps any pass from starting.
4. Check that no pass holds the lock and that `state/providers.json` names no active hand-off. An
   unresolved owner, hand-off or group defers enrollment.
5. For Claude, run `/Users/joe.fusco/.local/share/claude/versions/2.1.328 setup-token` and save the
   token to `providers/claude/oauth-token` at 0600.
6. For Codex, run
   `CODEX_HOME=<runner root>/providers/codex /Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex -c cli_auth_credentials_store='"file"' login --device-auth`.
   That is the same 0.167.0-alpha.4.1 program the profile runs; the shell's `codex` is another
   version.
7. Check both files' owner, mode and envelope.
8. Release only the guard.

Joe approved one live qualification test per provider, against the existing budget, once that
provider passes its isolation checks. Each of these still needs his own words:

- real credentials used by the runner;
- any inference beyond that test;
- the observe-only pilot;
- a billing-mode change;
- a project exception;
- moving the runner pin.

### When the Office does not answer

A pass that cannot read a valid `/api/health` records `service-down` and counts the outage. An
outage begins with the first such pass and takes that pass's ID. Once it has lasted five minutes
and covered two passes, it is journaled once as `overseer:service-down:<outage>`. The next pass
that reads health journals `overseer:service-restored:<outage>`. A gap shorter than that, such as
a deployment's restart, is noted on the pass that ends it and journaled nowhere. These IDs are the
event IDs the Office records them under: the runner forwards them as described below.

A journal event is saved in `state/runner.json` before it is appended. A pass that dies between
the two leaves the exact line there, and the next pass writes it before it reads the Office. An
event is never written twice, and never with different content under the same ID.

### Forwarding and reports

A pass takes the lock, reads runner state and the journal, and finishes any journal write a
previous pass left half done. Then it forwards the journal's failure events, before it reads STOP
or a pause, so forwarding goes on while the runner is stopped or paused, and also when runner state
cannot be read. Observation follows as described above. However the pass ends, it then reports the
runner's control condition, publishes `state/forwarding.json` and saves its record, all before it
releases the lock. Forwarding needs the runner's Store, which opens only in
`~/Projects/the-office-overseer`; a pass anywhere else observes and says forwarding is unavailable.

The Office takes these reports through four routes, behind its origin check and deployment fence
like every write. They are the only writes from outside besides the incident event route and the
operator's `/api/incidents/resumes`:

| Route | Does |
|---|---|
| `POST /api/incidents/runner/failures` | Records one journaled failure under its journal ID, with the change it makes to the runner's incident, in one transaction |
| `GET /api/incidents/runner/failures/<id>` | The receipt kept for it: event, incident, digest and the revision it produced; or `absent` |
| `POST /api/incidents/runner/halt` | Records the runner's control condition, ordered by sequence |
| `GET /api/incidents/runner/halt` | The latest control condition the Office holds; or `absent` |

Every answer names its resource and result, so an older Office without these routes, whose plain
404 means nothing here, is never sent anything. The same failure sent again returns its original
receipt, even after the incident has moved on. The same ID with other content is refused.

Each send goes through the runner's Effects. Its preflight reads `/api/health` and refuses while
the Office does not answer or a deployment holds the fence; nothing was sent, and a later pass
tries again under a new attempt. Once a send is dispatched, anything short of the Office showing it
kept leaves it for read-back only: it is never sent again. That is Joe's rule in `AGENTS.md`: "An
uncertain effect is reconciled by read-back, never resent." It holds for the one narrow race
too: a deployment that takes the fence after the preflight makes the Office refuse a send that has
already been dispatched. The runner keeps that event, reads it back on later passes, and status
lists it under `uncertain` until it shows. Other events keep going.

Each pass examines at most 20 events, sends and read-backs together, taking turns from where the
last pass stopped, so an event that stays unconfirmed never holds back the ones after it. It
forwards for at most a quarter of its time, and never more than 30 seconds. Its time comes from the
deadline the launcher registered for it (240 seconds for a pass run by hand); the halt report keeps
the last quarter and the final six seconds are for saving. A launched pass whose deadline it cannot
read defers its reports and says so.

What status shows and what to do:

- **`uncertain`**: sent and not yet shown by the Office. Keep the journal entry. Compare its ID
  with the Office's receipt (`GET /api/incidents/runner/failures/<id>`); once the Office shows it, the
  next pass settles it. Nothing is resent automatically.
- **`conflicts`**: the Office holds that ID with other content, or the journal line changed under
  an ID already forwarded. Nothing is sent for it. Keep both and compare the journal line with the
  Office's receipt before deciding anything.
- **The journal still fills up.** Forwarding removes nothing: a forwarded entry occupies the
  journal until a person archives the confirmed evidence. At 1,000 events the runner stops, as
  below.

The control condition is `running`, `paused` or `stopped`, with the control file that holds it
(`STOP.json`, or `pause.json` for a pause or a pause file that cannot be read), its reason, cut to
500 characters, and its time. Each change gets a sequence above every one used or seen, frozen
before it is sent, and the Office keeps the latest by sequence, so a clear always overtakes a STOP
that was delayed.

The Office shows two notices in every project's outbox, never saved in one:
`overseer-incident:<incident>` while the runner's outage is open, and `overseer-stopped` while the
runner's latest report says stopped. Each names its steps: run `pnpm office overseer status`, then
settle what the control or outage names; for a STOP, resolve the cause before removing
`control/STOP.json`. A paused runner has no notice. A reply to a notice is refused; it clears when
its cause does.

Reporting STOP changes nothing about automatic repair resumes. That switch is the Office's own: the
configured Office has it enabled (Joe's handoff, 2026-11-23), while a new store starts it paused.

### When the runner stops

A pass writes STOP, keeping any STOP already there, when:

- **`state/runner.json` cannot be read or does not validate.** The pass saves nothing, so the
  file STOP names is still as it was. Keep a copy, then repair or move it aside. A root without
  it starts empty: no incident in flight, no outage.
- **`journal/failures.jsonl` is damaged**: a cut-short last line, a malformed line, an ID
  recorded twice, a link or a file with a second name. Keep a copy; the journal is evidence for
  the ledger. A journal write still owed is the `intent` in runner state, and stays there.
- **The journal is full** (1,000 events). A new outage needs room for its restoration as well.

A forward or halt report that fails never stops the runner: the pass records why and tries again
later.

To clear it, confirm no pass is running (`pnpm office overseer status` shows no lock), settle the
file named in the reason, then remove `control/STOP.json` by hand. A STOP file that cannot be read
counts as STOP, and so does a pause file that cannot be read.

## Launcher

The launcher is what runs passes on a schedule: a LaunchAgent that starts one pass every two
minutes from a release you pinned, stops it at its deadline and records how it ended. A person
installs it; nothing in the Office or the runner does. The launcher itself never contacts the
Office, and writes only under the runner's root.

### Pinning a release

```bash
pnpm office release build COMMIT
pnpm office overseer pin COMMIT
```

`pin` takes a full 40-character SHA of a release already built under the Office data root
(`<OFFICE_DATA_ROOT>/releases/<sha>`). It refuses, and pins nothing, unless that folder is no link,
its manifest verifies, and `server/overseer.ts` is a file of the release's own runtime inventory.
A refusal leaves an earlier pin as it was. The launcher checks the pin again before every pass.

### Installing it

```bash
node scripts/install-overseer.mjs --print
node scripts/install-overseer.mjs
```

Run these from the operator checkout on macOS. `--print` shows the plist and what would be done,
and writes nothing. The installer checks everything before writing anything. It checks the root
(as for a pass), the pin and its release folder, `OVERSEER_PASS_DEADLINE_MS` and
`OVERSEER_OFFICE_URL`, and any plist already at
`~/Library/LaunchAgents/com.jfusco.office-overseer.plist`. A plist there must be this
installation's: same label, same launcher, same root.

Then it asks launchd whether `gui/<uid>/com.jfusco.office-overseer` is loaded:

| launchd says | The installer |
|---|---|
| Not loaded (`Could not find service`) | Copies the launcher (0400) and writes the plist (0600) and the log files, then bootstraps the job |
| Loaded, with these exact files | Reports `already-installed` and writes nothing |
| Loaded, with other or missing files | Writes nothing; run `launchctl bootout gui/<uid>/com.jfusco.office-overseer` first |
| Anything else | Writes nothing |

If the bootstrap fails, the error names where the files are; installing again repeats every check.

The plist runs `node <root>/code/launcher/overseer-launch.mjs` every 120 seconds from the root.
It sets only `OVERSEER_ROOT`, `OVERSEER_PASS_DEADLINE_MS` (240000 unless you set one from 30000 to
900000), `PATH`, the checkout's `.local` and the Office data root (both protected from the runner
root) and, if you set it, `OVERSEER_OFFICE_URL`. With `StartInterval`, launchd skips a firing
while the previous launch is still running or while the Mac is asleep; it does not make up a
missed firing on waking, and the next pass comes at the following interval. To stop the schedule,
boot the job out; to change anything, boot it out and install again.

### The installed launcher

`scripts/overseer-launch.mjs` is generated: `pnpm build:overseer-launcher` bundles the modules in
`scripts/overseer-launcher/` into that one file of Node built-ins. Never edit it by hand. After
changing a module, regenerate it and commit both. A unit test fails while they disagree, and a
Vite upgrade that changes the output is regenerated in the same change. The installer copies the
committed file byte for byte from your checkout. The pinned release never supplies the launcher:
the launcher verifies that release and runs its pass, and loads none of its code.

A checkout change does not touch the installed copy. A new launcher takes effect only when you
boot out and install again.

### One launch

Each firing takes `control/launcher.lock`, settles anything an earlier launch left, then checks
the deadline, the Office URL, the pin (the release folder, its manifest, its lockfile and its
runtime hash) and that the release has its own `node_modules/tsx`. Only then does it start a
helper, a process of its own group, and record the helper's PID, group and start time in
`state/launcher.json` before the pass may run. The helper runs
`node --import tsx server/overseer.ts pass` in the release folder. The pass gets only the root,
`PATH`, `HOME`, `NODE_ENV=production` and, if set, the Office URL. When the pass ends, its deadline passes
or the launcher is asked to stop, the whole group is stopped: TERM, up to 10 seconds, then KILL.
The attempt is settled only once the group is confirmed gone.

| Kind | The attempt |
|---|---|
| `success` | The pass printed a valid record, whatever its outcome (`service-down`, `paused` and `stopped` included) |
| `locked` | The pass found another pass holding the runner (exit 3) |
| `interrupted` | The launcher was asked to stop, for example by a bootout |
| `config` | The deadline or the Office URL is invalid |
| `pin` | The pin is missing or invalid, or its release does not verify |
| `startup` | The helper could not start or be registered, the release has no `tsx` of its own, or the pass failed while starting (exit 2, or a failure before its bootstrap finished) |
| `exit` | The pass failed after starting, or exited 0 without a valid record |
| `hang` | The pass passed its deadline; counted before the first signal |
| `lost` | An earlier launch ended without settling its pass, whose group is gone |
| `orphan` | An earlier launch left its pass running, stopped now; or a pass that ended but whose group could not be confirmed gone |

Each attempt is counted once. `consecutiveFailures` rises with every kind from `config` to
`orphan`, returns to 0 on `success`, and is kept by `locked` and `interrupted`. The launcher exits
0 when it recorded an outcome or another launch held the lock, 1 when its state could not be read
or saved, and 2 when the root is unsafe or a protected Office root is not set.

STOP and pause still let a pass run: it records `stopped` or `paused`, a `success` for the launcher.
The Office's switch for automatic repair resumes is separate.

### When the launcher stops

`pnpm office overseer status` shows the launcher's attempt in progress (`current`): its attempt ID,
phase, PID and group, the helper's start time, and, when it is blocked, a dated observation of the
group's members and why. A blocked attempt stays current until its group is confirmed gone;
every launch until then starts no pass and updates only that observation. Boot the job out
before you do anything by hand, and install it again when you are done.

Never clear an attempt while its group may still be running: a group with members can hold
the pass's descendants even when its leader is gone or is someone else. Once
`kill -0 -- -<pgid>` reports no such process, the next launch settles a registered attempt by
itself, counting it once (as `lost` unless it was already counted), so there is nothing to edit.

- **The group's leader is not this attempt's helper.** Its PID was reused, or the attempt is
  someone else's. List the group with `ps -o pid,pgid,lstart,command -g <pgid>`. Stop only
  members you can independently tie to this attempt, for example through a matching recorded
  PID, start time and full attempt-specific command or a verified parent chain to its helper.
  The helper's command ends with `code/launcher/overseer-launch.mjs --group <attempt ID>`
  and its start time matches the saved identity. Use the pinned release path only as context,
  and leave any member whose ownership is uncertain to exit by itself.
  The launches that follow keep blocking until the group is gone, then settle it.
- **The group could not be confirmed gone.** List and stop it the same way, identified members
  only. Once the probe reports no such process, the next launch clears `current`; the attempt
  was already counted, so nothing is counted again.
- **An unregistered start** (`phase: starting`) means a launch stopped between saving the attempt
  and registering its helper, so there is no group to probe. Keep the state file as it is until
  `ps -o pid,command -ax` shows neither a launcher nor a helper whose command ends with
  `--group <attempt ID>`. Only then set `"current": null` in `state/launcher.json`, keeping the
  key: a file without it is unreadable.
- **`state/launcher.json` cannot be read.** No pass starts and the file is left as it is. Keep a
  copy, then repair or move it aside; a root without it starts with empty counters.
- **`control/launcher.lock` names a launcher that appears to have stopped.** Keep the job
  booted out. Read `launcherLock.owner.pid`, `launcherLock.owner.start` and
  `launcherLock.guardLeft` from status. Compare the owner with
  `LC_ALL=C ps -o lstart=,command= -p <pid>`. If the PID has no live process and the guard
  is clear, the next launch reclaims the lock automatically. If the PID belongs to an unrelated
  process, confirm the start time or command differs and use `ps -o pid,command -ax` to
  confirm that no launcher or helper is running before removing only `control/launcher.lock`.
  Leave an uncertain owner in place and handle a leftover guard as described below.
- **`control/launcher.lock.reclaim` is left behind.** A launch stopped while taking the lock.
  Keep it until `ps -o pid,command -ax` shows no process running `overseer-launch.mjs`, neither
  a launcher nor a helper; then remove it.
