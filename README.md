# The Office

**Checkpoint status — October 31, 2026:** This is a stable implementation checkpoint. End-to-end autonomous queue-clearance validation remains incomplete. Further reviewed recovery changes were preserved privately and were not activated.

A local workplace for autonomous engineering agents. Models analyze tasks, change source, and perform independent reviews. A deterministic harness owns scheduling, durable handoffs, provider operations, verification, recovery, telemetry, and time accounting.

The delivery team shares one fair project queue. CTO and IT work use separate capacity. The interface shows current owners, blockers, acceptance evidence, live timers, Goals & Ideas, and project operations in a shared 3D office.

## Requirements and setup

- Node.js 24.14–24.x and pnpm 10.
- Local Codex and Claude CLIs with their existing authenticated connections.
- GitHub CLI, and the relevant native Jira/Azure tools for configured projects.
- Installed Brain, Jira Ticket Creator, and QA Team workflows where those native stages are used.

```sh
pnpm install
mkdir -p .local
cp office-config.example.json .local/office-config.json
```

Edit the private configuration for your repositories, account, project boards, base branches, and existing human holds. Keep credentials in their native authenticated tools. `.local`, environment files, databases, logs, sessions, and artifacts are ignored by Git.

```sh
pnpm dev
```

The service binds to localhost on port 4318. Project, repository, base, and provider bindings stay fixed for each assignment. Switching the visible project changes the view; it does not change a worker's authority.

## Orchestration and recovery

Every asynchronous command saves durable intent before execution. The scheduler claims one stage, rechecks its identity and authority, and releases the delivery lane between stages. Projects rotate fairly, blocked queue heads are skipped, and an eligible background notice is serviced by its fourth project claim opportunity. Verified closeout and repair continuations retain priority.

Sam owns failed PR-check diagnosis for harness-delivered GitHub jobs, including adopted PRs with no Office worktree. Saved exact-head logs drive source repairs through Alex and fresh review/QA, message-only corrections that preserve source trees, PR metadata fixes, or one evidenced transient retry per ordinary PR workflow run. Three repair attempts per delivery bound the loop. The harness owns all publication and read-back; commit rewording uses an exact-head lease and refuses signed or nonlinear history and dependent PRs. Holds, competing ownership, unavailable credentials and uncertain writes remain explicit blockers. Every repaired PR still needs current-head checks and merge readiness. Legacy native recovery and post-merge repair-issue workflows retain their existing gates.

Pausing stops workers and retains conflicting capacity until process termination is confirmed. Draining stops new claims while the claimed stage finishes. Interrupted writers and uncertain provider operations require read-back; they are never blindly replayed. Brain's native runner retains its own claim, identity, date, backoff, independent review, and publication gates.

A pull request Joe merges himself settles its Office handoff: on the next poll the harness retires the read-only handoff with no decision comment, Block move or read-back, provided the job holds no owned or uncertain work (a worktree, an unfinished or unproven worker, an unverified write or board move, a merge in flight, a repair cycle). Merges by anyone else keep the strict external read-back. The CMS vendor review reads official sources through the repository's registered locators with curl inside each source's allowed hosts, not WebFetch, which some vendors bot-block; paths under the retired `dev-team` installation resolve to `the-office`.

Stage capability records distinguish verified reader profiles from retained native Jira, QA, Brain, and provider workflows. Native stages remain in place until their restricted adapter passes capability parity. The command registry validates explicit check definitions and scoped subprocesses. It is available for adapter cutovers; retained native implementation stages still use their native command tools.

## Time and daily leadership

Visible running worker and build timers update every second using a shared browser clock. Ordered snapshots prevent delayed HTTP/SSE responses from restoring obsolete running states. Timers freeze when evidence expires, the page is hidden, or the connection drops, and reanchor only after fresh accepted data. Screen estimates never change recorded or published effort.

Confirmed work segments exclude heartbeat gaps. Queue wait, administrative operations, CI, and ticket elapsed time remain separate. Publication preserves the exact attempted value for reconciliation. Prospective Jira worklogs publish after their Eastern date closes and update the same identified worklog for corrections, preserving estimates.

At **5 PM America/New_York, Monday–Friday**, Avery compares every configured project's progress against Goals & Ideas. No scheduled reviews or catch-up assessments run on weekends. The review includes paused projects, evidence gaps, and Brain's current state plus latest completed result without waiting for simultaneous maintenance. Goal updates preserve human scope, titles, priorities, and unstarted ideas. Version conflicts leave the goal unchanged. Brief recaps lead with changes, blockers, and next actions; supporting evidence and earlier reviews expand on demand. Completed goals stay in a collapsed section with their details and history preserved. Joe can explicitly accept a goal as Done; automatic completion requires verified scope acceptance. Snapshots include eight daily summaries.

Provider observations include open and draft PRs as pending evidence. GitHub preserves bounded, redacted PR descriptions alongside reviews and checks on the observed head. Azure reads active PRs separately from recent history so an older open PR is not displaced by newer completed work. These are provider observations, not whole-goal acceptance. A paused project's normal provider refresh remains paused; Avery reports the age and gaps in its retained evidence.

**Goal completion messages** under Settings → Project enable Avery’s Slack DMs separately from merge notices. A goal moving to Done queues one short message to the configured verified recipient, including owner acceptance and automatic reviews. Enabling the setting never backfills completed goals; unchanged Done goals do not notify again. Reopened goals and changed settings cancel unsent messages. Delivery uses a durable effect and independent Slack readback; uncertain sends are reconciled, never resent. A project pause also pauses these messages.

The gear opens **Settings**: Office preferences (graphics, reduced motion, keyboard shortcuts, delivery toasts, coffee-break coworkers), the read-only effective `office-config.json`, and the current project's pickup, PR closeout, Slack, goal-message and time settings. Display preferences now belong to the local service and apply to every project and browser; choices made earlier in a single browser must be selected again. The operating system's reduced-motion setting still applies. The bell and PM mailbox show status only.

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

## Controlled rollout

Drain workers, confirm safe ownership boundaries, and back up SQLite stores consistently before replacing a running installation. Preserve source, assets, private bindings, uncertain effects, original failures, and goal application history. Reload, verify the expected loaded hash, then restore previous project running states. A rollback must retain any newly attempted effects and applied history.

On macOS, `pnpm service:install` installs the local login service. The checkout is named `the-office`; the service derives its paths from the checkout location. Existing installations retain local historical artifact references during a directory rename. After retiring the old `dev-team` link, `.local/installation-rename.json` records its verified original identity and the physical installation identity. Recovery uses that receipt to locate owned job evidence under `the-office` while preserving the original records; it rejects a changed receipt, replaced installation, or recreated alias during handoff.

CTO writing standard: each review is a short, complete summary (up to 120 words), naming the goals, meaningful changes, important blockers and next actions. A finished **project review** is never labeled as a completed goal. Goal updates are limited to 350 characters and three short blockers; exact technical evidence remains in supporting notes. Historical reviews can receive an editorial briefing through `saveReviewBriefing`, which validates complete goal coverage and preserves the original assessment, state, and evidence. Historical goal cards distinguish the status at that review from a later completion.

Ellis projects current IT follow-ups from the latest local work state on every snapshot. A verified retired native-delivery mirror stops appearing as an active fault while its original report, retry budget and failure history remain. Active work and unsettled effects prevent retirement from resolving a diagnostic. IT findings become unverified after 150 seconds without a completed check; old reports stay in history and cannot claim a current all-clear. Health responses are bound to the selected project.
