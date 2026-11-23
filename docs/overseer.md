# Overseer

The Overseer is the repair engine for the harness and the Office. It is being delivered in phases;
this guide covers what exists. Today that is deterministic deployment, the incident ledger and
the mark the Office puts on stopped work a repair covers, which holds recovery back for it. Resume
after a fix works for the seven GitHub read-back routes and for a Jira/Azure pilot ticket: once a
fix you bound is running and you have enabled the switch for automatic resumes, which starts
paused, the Office queues the request that fix named for the work it stopped (see
[Resuming after a fix](#resuming-after-a-fix)). The remaining routes follow.
The autonomous runner is a later phase and is not described here until it
ships. The process rules are in the Office process, under
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
  store, an admission, or a changed store blocks restoration. A target that only started under the
  fence is not a change; one that added a table or index, migrated saved state beyond what a start
  rewrites or wrote any other row is, so a release with a store change is not rolled back once it
  has opened the stores.
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
the fix runs and you have enabled it, the one request the fix named for a marked stop: a recovery
request for a GitHub job, the ticket's own resume for a Jira/Azure ticket (see Resuming after a
fix). Besides what it observes, it holds what you tell it about a repair:
that one started, and which fix it is.

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
| `cause` | Where the signal was read, the provider, the stage, the typed cause and, for a cause the harness wrote, its normalized text. `author: model` means the stop repeats what a model's saved result said; `author: unknown` means the record does not say who wrote it. In both cases the words are in `evidence` only and the incident belongs to that one subject. |
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

One limit to know: the hold does not stretch any other clock. The harness restarts a dead writer
only within six hours of the stop. If a repair takes longer than that and then runs out without a
fix, that job comes back to you as a "read back" request; it is not restarted by itself.

### Resuming after a fix

Once a fix you bound is running, the Office can resume the work it stopped: it queues the
request the fix named for each piece of work, once, and stops holding that work back. It
does this only while the switch below is enabled, and the switch starts paused. The GitHub
read-back routes are resumed this way: `reconcile-implementation`, `reconcile-validation` and
`reconcile-scope-repair`, which always need a `head`, and `reconcile-preparation`,
`reconcile-base-update`, `reconcile-closeout` and `reconcile-review`, with a `head` or without.
A Jira/Azure pilot ticket is resumed through `resume-ticket`, its own resume (see A ticket's
resume, below). The other rows of the table are accepted by `bind-fix` but not resumed yet; their
work is handed back to you when the wait runs out.

**Cost.** `reconcile-review` with no `head` checks a saved independent review against the
unchanged pull request and runs no model. With the `head` of a stopped base handoff it reads the
run that handoff already started and starts no other. Treat every other form as one that may
start a model run when its request runs: the implementation, validation, scope-repair,
preparation, stopped base update and closeout read-backs each can. With the switch enabled the
Office starts those runs by itself, one per piece of work and fix. Nothing caps their cost yet.

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
| `review-candidate`, `review-pr`, `requeue-implement` | a GitHub delivery job | `{ key }` | none |
| `review-assignment` | an assignment review | `{ key }`, the ticket key | none |
| `reconcile-maintenance` | a maintenance run | `{ key }`, the run's own ID | none |
| `retry-checkpoint`, `reconcile-native-checkpoint` | a checkpoint | `{ key }`, the checkpoint's own ID | none |

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

- `admitted`: its resume was queued. This happens once per subject and fix and stays on record,
  whatever the work does next.
- `due`: it can be resumed and the switch is enabled. The Office puts it to admission on its next
  pass, about a minute apart; whether it is queued then depends on the checks below.
- `held`: it can be resumed and the switch is paused. Nothing is queued until you enable it.
- `no-route`: the fix declared none, the route is not valid for that subject, or this release
  does not resume that route yet ("This release cannot dispatch ...").
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
| `request-pending` | Another request for that ticket is queued or working. For a Jira/Azure ticket also: a scheduler claim is active for it, or a QA handoff you approved is still waiting on its ownership check. | Tried again each pass, and queued when that is over if the work still waits for this repair. A Jira/Azure ticket someone else resumed does not: see A ticket's resume. |
| `wait-ended` | The work is not being held for this repair right now. Either that is final: the wait ran out after 48 hours, or the work stopped again or was moved. Or it is temporary: something stronger explains the stop for now, such as a hold, a decision, a merge approval, a prerequisite or an unconfirmed write. | If final, not resumed; the item is yours. If temporary, the Office tries again each pass and queues it once that cause is gone, as long as the 48 hours have not run out. |
| `head-mismatch` | The route's `head` is not the run its handler would read for that job now, the handler has nothing to read for it (a run an earlier request already reconciled included), or another job that is not cancelled has the same ticket key. | The Office tries again each pass and queues it if that changes while the wait holds. Read the detail: it names what the handler reads. |
| `ticket-not-resumable` | For a ticket: its own resume would refuse, or would spend a step that is yours, or the Office could not tell this stop from a later one. QA setup has stopped three or more times in a row on the candidate; the feature gate is closed; the ticket is no resumable pilot (not a pilot, at the mailbox, complete); or its stop carries no date. | Tried again each pass, and queued if that changes while the wait holds. A stop with no date does not change: that ticket is yours. Read the detail. |
| `key-mismatch`, `no-record`, `not-dispatchable`, `already-reconciled` | The route does not fit the work as it stands. | Not resumed; read the detail. |

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

The Office does not yet read what became of a ticket's resume. It shows as queued for the fix,
with no entry under `outcomes`, and the incident is never `verified` on it. The incident can still
become `recurred`, if its cause stops work anew, or return to `shipped` on a rollback, as for any
other (see When an incident is verified or has recurred).

### What became of a resume

Once a job's resume is queued, the Office reads each minute what became of it and records the
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
| `moved-by-hand` | An operator's command for the ticket followed the resume (PR preparation, a candidate base update, a candidate or PR review recheck, a requeued implementation). The boundary is not read after that, and the move is found even if the job is gone since. |
| `gone` | The job is missing or cancelled with the boundary not crossed, or the project no longer holds the request. |
| `untested` | Nothing can show whether the repair worked: the fix declared the boundary undeclared; the boundary cannot be judged for this job; the release that held the fix stopped serving after the resume was queued; or the resume was queued by a release that did not yet record how the job stood. |

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
20 hours.

What each boundary reads, for a delivery job:

- `stage-result-passed`: a result of that stage that passed, saved after the resume was queued.
  A result the job already had does not count.
- `stage-left`: the job is at another stage and is not cancelled. The stage must be the one the
  job was at when it was resumed; otherwise the outcome is `untested`.
- `record-settled`: the job is completed.

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

When in doubt, declare `stage-left` for the stage the job stopped at.

Two limits. An operator who queues a recovery request by command leaves nothing that tells it
from the Office's own, so that move is not seen. And a job cancelled because its pull request was
merged by its owner is `gone`, not `advanced`, unless the boundary was crossed first.

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
  ticket, review or maintenance run is part of that subject instead. Of the runs that failed for
  one cause in a project, only the newest 20 are subjects of their own: an older one clears as
  newer ones arrive, and still counts as part of the stopped work it belongs to. Every run that
  was recorded stays in the incident's event history.
- If a collector cannot read a project, the service log says which one each minute, and what that
  collector had reported for the project is left open until it can.
- With three GitHub projects, ordinary provider waits will meet the two-project threshold often.
  That is the plan's threshold; it makes them eligible for research, nothing more.
- The repair runner's own failures are not recorded yet; the runner does not exist.
