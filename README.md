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

Pausing stops workers and retains conflicting capacity until process termination is confirmed. Draining stops new claims while the claimed stage finishes. Interrupted writers and uncertain provider operations require read-back; they are never blindly replayed. Brain's native runner retains its own claim, identity, date, backoff, independent review, and publication gates.

Stage capability records distinguish verified reader profiles from retained native Jira, QA, Brain, and provider workflows. Native stages remain in place until their restricted adapter passes capability parity. The command registry validates explicit check definitions and scoped subprocesses. It is available for adapter cutovers; retained native implementation stages still use their native command tools.

## Time and daily leadership

Visible running worker and build timers update every second using a shared browser clock. Ordered snapshots prevent delayed HTTP/SSE responses from restoring obsolete running states. Timers freeze when evidence expires, the page is hidden, or the connection drops, and reanchor only after fresh accepted data. Screen estimates never change recorded or published effort.

Confirmed work segments exclude heartbeat gaps. Queue wait, administrative operations, CI, and ticket elapsed time remain separate. Publication preserves the exact attempted value for reconciliation. Prospective Jira worklogs publish after their Eastern date closes and update the same identified worklog for corrections, preserving estimates.

At **5 PM America/New_York every calendar day**, Avery compares every configured project's progress against Goals & Ideas. The review includes paused projects, evidence gaps, and Brain's current state plus latest completed result without waiting for simultaneous maintenance. Goal updates preserve human scope, titles, priorities, and unstarted ideas. Version conflicts leave the goal unchanged. Full reports and goal history load on demand; snapshots include eight daily summaries.

## Development and verification

```sh
pnpm build
pnpm test
pnpm test:browser
```

Unit tests use isolated stores and injected transports. Browser tests use the synthetic fixture server by default. A live provider result, a local fixture result, and a production deployment are distinct evidence.

Useful read-only endpoints include `/api/health`, `/api/office`, `/api/time`, `/api/goals/history`, and `/api/daily-cto`. Health includes the loaded source/assets hash separately from event revisions.

## Controlled rollout

Drain workers, confirm safe ownership boundaries, and back up SQLite stores consistently before replacing a running installation. Preserve source, assets, private bindings, uncertain effects, original failures, and goal application history. Reload, verify the expected loaded hash, then restore previous project running states. A rollback must retain any newly attempted effects and applied history.

On macOS, `pnpm service:install` installs the local login service. The checkout is named `the-office`; the service derives its paths from the checkout location. Existing installations retain local historical artifact references during a directory rename.
