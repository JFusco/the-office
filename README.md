# The Office

**Checkpoint status — October 31, 2026:** This is a stable implementation checkpoint. End-to-end autonomous queue-clearance validation remains incomplete. Further reviewed recovery changes were preserved privately and were not activated.

A local workplace for autonomous engineering agents. Models analyze tasks, change source, and perform independent reviews. A deterministic harness owns scheduling, durable handoffs, provider operations, verification, recovery, telemetry, and time accounting.

The delivery team shares one fair project queue. CTO and IT work use separate capacity. The interface shows current owners, blockers, acceptance evidence, live timers, Goals & Ideas, and project operations in a shared 3D office.

## Requirements and setup

- Node.js 24.14–24.x and pnpm 10.
- Local Codex and Claude CLIs with their existing authenticated connections.
- GitHub CLI, and the relevant native Jira/Azure tools for configured projects.
- Installed Brain, Jira Ticket Creator, and QA Team workflows where those native stages are used.

On macOS, session context capture can use the system Python 3 and the public
descriptor-based filesystem clone API to obtain a coherent private snapshot while
a chat appends. If that optional primitive is unavailable, the strict portable
capture remains in use; changing or incomplete input never establishes ownership.
For a growing Codex chat, the next capture hashes all previously observed bytes
before reusing its derived parser checkpoint and folding new records. Changed
prefixes are parsed completely again. Checkpoints retain no transcript bytes or
file handles; session/project identity, complete records and the five-second
read deadline still apply.

```sh
pnpm install
mkdir -p .local
cp office-config.example.json .local/office-config.json
```

Edit the private configuration for your repositories, account, project boards, base branches, and existing human holds. `delivery.concurrency` (1 to 3, default 1) lets that many delivery stages from different projects run at once; each project still runs one stage at a time and each worker role one stage at a time. Hands-off `independent-checks` validation runs the repository's `verify:ci` script in the harness unless a project lists its own `checks` (argv commands with optional `timeoutMs`); browser validation, repairs and any check the harness cannot finish stay with Riley. Keep credentials in their native authenticated tools. `.local`, environment files, databases, logs, sessions, and artifacts are ignored by Git.

```sh
pnpm dev
```

The service binds to localhost on port 4318. Project, repository, base, and provider bindings stay fixed for each assignment. Switching the visible project changes the view; it does not change a worker's authority.

CEC can explicitly use an assigned-issue project list after its board is removed. Set
`cec.intakeListUrl` to the same-site `/jira/software/c/projects/CEC/list?jql=…` URL
whose query selects `project = CEC AND assignee = <configured account>` ordered by
`cf[<field ID>] ASC` or `DESC`. Office validates that scope, uses paginated JQL reads,
and shows the list link. Omit this setting to retain board/filter/backlog reads.
There is no automatic fallback after a board access error. Parent-only pickup,
exact status, holds, competing ownership and provider read-back gates still apply.

## Orchestration and recovery

The versioned [whole-Office process and flowcharts](docs/office-process.md) define
the shared handoff, delivery, recovery, operations and learning boundaries. Every
role uses the same runtime with its existing response contract. New QA reports
map cases to saved criterion references; historical reports retain their original
rules. Harmless presentation formatting is normalized locally without another
model turn or replaying actions. Identity, permission, evidence and Effects gates
still decide acceptance.

Every asynchronous command saves durable intent before execution. The scheduler claims one stage, rechecks its identity and authority, and releases the delivery lane between stages. Projects rotate fairly, blocked queue heads are skipped, and an eligible background notice is serviced by its fourth project claim opportunity. Verified closeout and repair continuations retain priority.

Sam owns failed PR-check diagnosis for harness-delivered GitHub jobs, including adopted PRs with no Office worktree. Saved exact-head logs drive source repairs through Alex and fresh review/QA, message-only corrections that preserve source trees, PR metadata fixes, or one evidenced transient retry per ordinary PR workflow run. Three repair attempts per delivery bound the loop. The harness owns all publication and read-back; commit rewording uses an exact-head lease and refuses signed or nonlinear history and dependent PRs. Holds, competing ownership, unavailable credentials and uncertain writes remain explicit blockers. Every repaired PR still needs current-head checks and merge readiness. Legacy native recovery and post-merge repair-issue workflows retain their existing gates.

Pausing stops workers and retains conflicting capacity until process termination is confirmed. Draining stops new claims while the claimed stage finishes. Interrupted writers and uncertain provider operations require read-back; they are never blindly replayed. Brain's native runner retains its own claim, identity, date, backoff, independent review, and publication gates.

CEC resumes distinguish a matching harness-classified read-only timeout from an interrupted action. After fresh ownership and eligibility checks, the former leaves the same stage waiting for ordinary execution; it does not reconstruct or accept missing QA results. Uncertain action receipts and unknown QA provider usage still require reconciliation, and failure history and counters remain intact.

The dispatch read-back checks eligibility and competing ownership. A verified, currently coordinated read-only helper is not a competing executor. Native QA owns its actor/tenant/test-data checks and supported browser claim, lease and intake recovery before feature actions; pending QA setup or acceptance is not evidence that dispatch itself failed. Actual access denials, unresolved approval/ownership and uncertain actions remain blocking.

For a first native CEC implementation that times out before returning a commit,
open its outbox follow-up and choose **Review saved work**. When the original worker,
source and termination can be verified, **Continue saved work (Recommended)** approves
one fresh linked copy to finish implementation, checks and commit; **Keep paused**
saves optional guidance without starting a worker. The original draft, failed checks,
uncertainty and counters stay in history. Ownership, holds, current staging and
independent review/QA still gate delivery. A changed or unverified draft stays blocked;
an interrupted continuation is never automatically repeated.

When Jira is already at the requested workflow status, the PM leaves it unchanged.
Office verifies the same issue and unchanged metadata through two native read-only
reads before accepting that handoff. An uncertain write, changed assignment or
conflicting status stays blocked; an already-satisfied status needs no repeated transition.

Jira Blocked parking sends the decision comment inside the transition request, which workflows
that require a comment on that screen need. This one write uses Jira REST with an API token read
from the login Keychain; store it once with
`security add-generic-password -s the-office-jira -a <jira-email> -w`. A retained commentless transition rejected with
Jira's explicit HTTP 400 comment validation stays blocked until a selected-ticket Resume
independently binds its preceding verified QA comment, complete status history and stable
issue metadata. Only that rejected effect is retired as rejected, with its original error,
dispatch time and counters preserved. It is never marked successful or resent. Missing
evidence and other uncertain writes remain blocked; normal ownership and QA still apply.

Browser-selected QA verifies a real run-owned target and native browser binding, rather
than treating an HTTP login redirect as a completed setup. A human sign-in request must
identify a visible browser window, its title, URL and button, with a live owned preview
and cleanup handoff. Project SSO callback origins and human port guidance take precedence
over choosing a free arbitrary port. Access-blocked same-head QA follows its existing
harness run and supported intake/session recovery; no other profile's state is reused.
Checks-only validation retains its existing path without starting a browser.

A pull request Joe merges himself settles its Office handoff once provider reads verify the merged PR and completed issue. The harness retires read-only handoffs and finished CI repairs, retaining local repair worktrees and history. Unfinished workers, uncertain writes or board moves, merges in flight and recovery work still block retirement. Merges by anyone else keep the strict external read-back. [External session awareness](docs/session-awareness.md) connects loaded Codex and live Claude chats to work across repositories and supplies recent user context without granting harness permission. The CMS vendor review reads official sources through the repository's registered locators with curl inside each source's allowed hosts, not WebFetch, which some vendors bot-block; paths under the retired `dev-team` installation resolve to `the-office`.

Stage capability records distinguish verified reader profiles from retained native Jira, QA, Brain, and provider workflows. Native stages remain in place until their restricted adapter passes capability parity. The command registry validates explicit check definitions and scoped subprocesses. It is available for adapter cutovers; retained native implementation stages still use their native command tools.

## Time and daily leadership

Visible running worker and build timers update every second using a shared browser clock. Ordered snapshots prevent delayed HTTP/SSE responses from restoring obsolete running states. Timers freeze when evidence expires, the page is hidden, or the connection drops, and reanchor only after fresh accepted data. Screen estimates never change recorded or published effort.

Confirmed work segments exclude heartbeat gaps. Queue wait, administrative operations, CI, and ticket elapsed time remain separate. Publication preserves the exact attempted value for reconciliation. Prospective Jira worklogs publish after their Eastern date closes and update the same identified worklog for corrections, preserving estimates.

At **5 PM America/New_York, Monday–Friday**, Avery compares every configured project's progress against Goals & Ideas. No scheduled reviews or catch-up assessments run on weekends. The review includes paused projects, evidence gaps, and Brain's current state plus latest completed result without waiting for simultaneous maintenance. Goal updates preserve human scope, titles, priorities, and unstarted ideas. Version conflicts leave the goal unchanged. Brief recaps lead with changes, blockers, and next actions; supporting evidence and earlier reviews expand on demand. Completed goals stay in a collapsed section with their details and history preserved. Joe can explicitly accept a goal as Done; automatic completion requires verified scope acceptance. Snapshots include eight daily summaries.

Provider observations include open and draft PRs as pending evidence. GitHub preserves bounded, redacted PR descriptions alongside reviews and checks on the observed head. Azure reads active PRs separately from recent history so an older open PR is not displaced by newer completed work. These are provider observations, not whole-goal acceptance. A paused project's normal provider refresh remains paused; Avery reports the age and gaps in its retained evidence.

**Slack merge channel** under Settings → Project posts one message per merged PR to a configured channel and tags up to 20 people by Slack member ID. It runs beside the direct merge notices, uses the same durable send and read-back, never backfills earlier merges, and never uses @here or @channel. Changing the channel or tags cancels unsent posts.

**Goal completion messages** under Settings → Project enable Avery’s Slack DMs separately from merge notices. A goal moving to Done queues one short message to the configured verified recipient, including owner acceptance and automatic reviews. Enabling the setting never backfills completed goals; unchanged Done goals do not notify again. Reopened goals and changed settings cancel unsent messages. Delivery uses a durable effect and independent Slack readback; uncertain sends are reconciled, never resent. A project pause also pauses these messages.

**People** (the header people icon, or `P`) has two views of one persona registry, `src/contracts/people.ts`. The Directory lists each employee by department with their manager, live status and model runtime. The Org chart shows reporting lines from Joe through Avery. Each employee's drawer shows who they report to and who reports to them. To add an employee, add a registry entry. The directory, chart and department counts come from the registry, so they need no other change.

The gear opens **Settings**: Office preferences (graphics, reduced motion, keyboard shortcuts, delivery toasts, coffee-break coworkers), the read-only effective `office-config.json`, and the current project's pickup, PR closeout, Slack, goal-message and time settings. Display preferences now belong to the local service and apply to every project and browser; choices made earlier in a single browser must be selected again. The operating system's reduced-motion setting still applies. The bell and PM mailbox show status only.

A deliberate CEC QA resume can bind one acceptance plan after a retained access-only
probe. This requires a fresh eligible resume, the exact completed native QA worker
and claim, zero known provider usage, verified receipts, no unsettled effects, and
public QA Team validation of the unchanged plan and fully settled read-only calls.
The old run remains incomplete history; its artifacts, counters and results are
preserved. Feature-capable plans keep their existing recovery path. Changed
identities, active bindings, unknown mutations or usage, and finalized runs remain
blocked. The new plan still needs actual feature coverage, actor/tenant verification,
owned fixtures, native browser claims and ordinary acceptance and delivery checks.

CEC-154 also has an explicitly approved corrected-plan continuation after a sealed
read-only browser call fails and the public QA reducer releases its claim. The
operator previews `/api/cec/incomplete-qa-plan` and submits `continue-qa-plan` with
the original worker, unchanged proof fingerprint and incomplete-history acknowledgment.
One scheduler-owned resume rechecks current eligibility, ownership, candidate,
original native result and public QA artifacts, then reserves the next ordinary QA
attempt before execution. The previous pending report, missing final, error and unrun
work remain incomplete history. This never schedules the old queue, accepts missing
coverage, resets usage/repair counters or retries a consumed decision. The corrected
plan must cover actual feature mutations and persistence under normal QA/provider
gates; Ready for Staging still waits for human merge and verified deployment.

## Development and verification

```sh
pnpm build
pnpm test
pnpm test:browser
```

Unit tests use isolated stores and injected transports. Global setup owns a temporary run directory; setup creates a separate data root before each test file imports Office configuration. Fixtures close Stores before deleting state. Browser tests reset the synthetic fixture server before every test and run with one worker. A live provider result, a local fixture result, and a production deployment are distinct evidence.

Retain tests for distinct Office behavior and integration boundaries. Rewrite brittle assertions; consolidate only equivalent inputs, decisions, outcomes, failure timing and trust boundaries. Remove library-only assertions or duplicates with named surviving coverage. Record each changed assertion and its coverage replacement in the implementation handoff. Test count alone is not a target.

Keep browser evidence outside installed Office state. For each invocation, allocate a new temporary directory, choose an unused loopback port and record the Chromium executable/version:

```sh
office_run=$(mktemp -d)
OFFICE_DATA_ROOT="$office_run/state" pnpm test
env -u OFFICE_TEST_BASE_URL OFFICE_DATA_ROOT="$office_run/state" \
  OFFICE_EVIDENCE_DIR="$office_run/evidence" OFFICE_FIXTURE_PORT="$office_port" \
  OFFICE_FIXTURE_DIST="$office_dist" PLAYWRIGHT_EXECUTABLE_PATH="$office_chromium" \
  pnpm test:browser --output="$office_run/playwright" --retries=0
```

Set `office_dist` to the built UI and `office_chromium` to the recorded browser executable. Preserve reports and failure evidence; remove only owned disposable state after processes stop. The historical evidence default remains `.local/evidence`, so use the explicit override above. To verify no installed-state writes, use a matching source copy without `.local`; never diff or delete the running Office's state for this check.

For performance comparisons, record source/tool identities, build separately, and use one warm-up plus three full measured runs with consistent caches. Report median and min/max, retaining failures. Compare serial refactoring before trying `fileParallelism:true,maxWorkers:2` with isolated forks. Adopt two workers only if repeated and shuffled runs pass without leaks or order dependence and the median improvement exceeds the larger timing spread; otherwise keep serial execution. Browser workers remain at one.

Useful read-only endpoints include `/api/health`, `/api/office`, `/api/time`, `/api/goals/history`, and `/api/daily-cto`. Health includes the loaded source/assets hash separately from event revisions.

## Maintainer code map

Graphify 0.9.36 maps `server/`, `src/` and `scripts/`; `.graphifyignore` excludes tests,
documentation, styles, JSON, generated files, dependencies and local state. The
repository-local [Graphify skill](.agents/skills/graphify/SKILL.md) covers queries and
refreshes. After `pnpm install` (which activates Husky) and installing Graphify 0.9.36,
run `graphify hook install` and `graphify hook status` once per clone. Native hooks
refresh the map after commits and branch switches in the primary checkout; linked
worktrees are skipped. Run `PYTHONHASHSEED=0 graphify update .` after pulls or merges.
Commit the graph, HTML, report, analysis and labels; keep `manifest.json`, caches,
backups and query memory local. No agent tool hooks are installed.

## Controlled rollout

Drain workers, confirm safe ownership boundaries, and back up SQLite stores consistently before replacing a running installation. Preserve source, assets, private bindings, uncertain effects, original failures, and goal application history. Reload, verify the expected loaded hash, then restore previous project running states. A rollback must retain any newly attempted effects and applied history.

On macOS, `pnpm service:install` installs the local login service. The checkout is named `the-office`; the service derives its paths from the checkout location. Existing installations retain local historical artifact references during a directory rename. After retiring the old `dev-team` link, `.local/installation-rename.json` records its verified original identity and the physical installation identity. Recovery uses that receipt to locate owned job evidence under `the-office` while preserving the original records; it rejects a changed receipt, replaced installation, or recreated alias during handoff.

CTO writing standard: each review is a short, complete summary (up to 120 words), naming the goals, meaningful changes, important blockers and next actions. A finished **project review** is never labeled as a completed goal. Goal updates are limited to 350 characters and three short blockers; exact technical evidence remains in supporting notes. Historical reviews can receive an editorial briefing through `saveReviewBriefing`, which validates complete goal coverage and preserves the original assessment, state, and evidence. Historical goal cards distinguish the status at that review from a later completion.

Ellis projects current IT follow-ups from the latest local work state on every snapshot. A verified retired native-delivery mirror stops appearing as an active fault while its original report, retry budget and failure history remain. Active work and unsettled effects prevent retirement from resolving a diagnostic. IT findings become unverified after 150 seconds without a completed check; old reports stay in history and cannot claim a current all-clear. Health responses are bound to the selected project.

The IT panel separates an unavailable active-session check from unresolved shutdown investigations of earlier worker runs. Those investigations show their own last-update dates and diagnosis counts, with the original technical reports expandable. A new IT check does not refresh an old diagnosis or settle its cause; delivery status remains a separate check.

Dependabot, Renovate (pin-courier), and canonical wiki automation PRs use the existing bot identity and content qualification, then go directly to required current-head GitHub checks and repository merge rules. Office adds no model review or local QA cycle for these PRs. Holds, competing work, uncertain writes and normal post-merge Actions and queue closeout remain enforced.

An explicit **Start** also authorizes a new issue's first Backlog → In progress transition. That permission is bound to the admitted job and ends after its first board transition or source work. Automatic pickup cannot use it; Block, Done and a later human return to Backlog remain protected.

Native Codex Slack workers disable unused desktop/browser tools per child while retaining connected Slack tools. This does not change saved settings, writer uncertainty, process-group settlement or independent message verification. Original failures remain historical evidence.

## Office QA

Morgan proposes the testing route and focused checks; Alex confirms it after source
inspection. Code/API changes use focused independent checks, while changed user
workflows use browser QA. Riley performs routine QA in one independent worker,
without QA Team, its model policy or automatic specialist delegation. A named
specialist capability needs explicit scope; missing capability blocks with an owner.
Repository requirements and current-head checks still apply.

QA verifies setup first: candidate version, owned application/database/browser,
callback origin, signed-in actor and test-data permissions. A visible sign-in
handoff precedes any request for human login. Setup blocks are not product
failures or passed tests. Every selected acceptance check and adjacent regression
case needs an observed disposition and saved evidence. Unknown effects and usage
stay blocked. The fixer and QA worker remain separate.

Open the ticket to see **QA Results**: setup state, checklist, exact build, findings,
screenshots, next action and owner, and **View full report**. A new result produces
a **View results** notification. Successful QA is not an outbox approval request.
Older QA Team runs retain their original protocol, evidence and recovery gates;
this change neither replaces their artifacts nor declares unfinished QA passed.
The standalone QA Team skill remains available for separately requested audits.

An existing unsealed, zero-provider-usage QA setup block can move to independent
Office QA through an explicit `resume-ticket` decision with `qaHandoff` (original
worker ID, exact commit, incomplete-history acknowledgment and setup handoff).
The scheduler requires fresh ownership and Jira/PR eligibility, a completed native
worker/claim and absent process group, unchanged clean source, settled effects and
no sealed plan, packets or pending calls. It consumes the decision once, retains
the old result/artifact hashes and all counters, and requires a new Office QA
report. Ordinary resumes do not change old protocols. Sealed or uncertain runs
remain blocked for reconciliation.

An operator can name its coordinator session in that handoff. Office still requires
complete, fresh session coverage and Morgan's current ownership read-back. Only one
exact, active, reference-only coordinator outside the project worktree qualifies;
unknown actors, execution evidence and competing writers continue to block. The
handoff records the scoped coordination proof without changing global ownership.

If that explicit, unconsumed handoff stopped at a completed ownership reader,
newer complete native coverage can qualify one internal check of the same request.
The scheduler verifies the original reader's artifacts, closed claim and absent
group, settled effects, unchanged clean candidate and current authority before
queuing one fresh independent PM read. A single reference-only coordinator may
qualify this read; Morgan must still positively verify coordination before QA.
The continuation is saved before checking, never automatically repeated, and
preserves the original request, blocking observation, QA attempt and counters.
Ownership is observed again after candidate verification; an older in-flight
inventory is allowed to settle before one new observation. The normal freshness
window is unchanged. A legacy check that expired before queuing any PM read can
receive one separately linked forward check after its closed claim, original
snapshot, reader and zero subsequent PM work verify. Its failed record remains
unchanged. New failures stay blocked without an automatic retry loop.

Ellis links an earlier CTO input rejection or uncertain implementation warning to
an explicitly bound, completed replacement when its native artifacts and accepted
result verify. The warning is superseded; the original failure, uncertainty and
counters remain. Empty request IDs never group unrelated workers. An inactive
read-only reconciliation with missing output can instead receive an explicit
**retire as incomplete history** decision bound to its exact record and closed
native claim. This preserves missing evidence and does not assert success or a
fixed cause. Live related work and unsettled writes still prevent retirement.


In Office Brain, the **Brain** tab opens the universe directly below a compact
page toolbar. External read-only Brain notes start visible. Filters live in
**View options**, outside the dark canvas. Hover highlights without pausing the
universe; fine pale particles keep moving through navigation. Click empty space
to clear a selection, drag to orbit and use the mouse wheel to zoom. There are
no Overview or Pause controls; the normal reduced-motion preference still applies.
