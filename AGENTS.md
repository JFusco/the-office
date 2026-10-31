# The Office — agent working agreement

## File standards

- **Split by responsibility.** One file owns one job: a single harness operation, a
  single policy check, a single projection. If a file needs a second "and" to describe
  it, split it.
- **No monolithic files.** Do not grow existing large modules (for example
  `server/github-delivery.ts`, `server/coordination.ts`). Add new behavior in a new
  small module and keep the change in the large file to a call site.
- **Small and testable.** Prefer pure functions and explicit inputs (`store`, `job`,
  injected `execute`) over hidden state. Every new module has a focused unit test that
  runs against an isolated store and an injected command runner, never live providers.
- **Organized in folders by domain.** Group modules by what they are about, not by
  layer. Server domains live under `server/<domain>/` (for example
  `server/delivery/` for ticket delivery harness operations). Tests mirror the source
  tree under `tests/unit/<domain>/`.
- **Name files for what they do.** `publish-pr.ts`, `move-lane.ts`, `admission.ts`,
  not `utils.ts` or `helpers.ts`. Never create layer folders such as `utils/`,
  `services/`, `helpers/` or `types/`.

Server domains (entry points `server/index.ts`, `server/dev.ts`, `server/cli.ts` stay at the root):

```text
server/
  office/          service identity: config, projects, security, clock, health, revision,
                   service lock and timers
    http/          API routes, office commands, static UI, responses
  store/           persistence: store, schema, migrations, effects, evidence artifacts, recovery
  scheduling/      dispatch: scheduler, scheduled work, coordinator (poll, tick, pump), requests
  workers/         model workers: runtime, process, Claude/Codex adapters, profiles, lanes
  delivery/        GitHub ticket delivery
    pipeline/      GitHubDelivery, stage prompts, task assembly, result acceptance, PR observation
    harness/       hands-off scope, write guards, effects wrapper, harness stages
    intake/        deterministic admission, PR discovery, pickup policy
    candidate/     worktree creation
    publication/   PR body, publish, promote, draft/prepare stages
    board/         project board lanes
    readiness/     merge readiness, checks, merge approval
    repairs/       repair budgets and dispatch, conflict repair
    findings/      advisory findings, repair scope
    parking/       Block-lane decisions and resume
    closeout/      harness closeout
    recovery/      reconciliation of legacy records (closeout, implementation, preparation,
                   scope repair, source amendment, validation)
  cec/             Jira/Azure (CEC) pipeline: workflow, mailbox, pilot delivery, stage runner
  github/          GitHub provider adapters
  maintenance/     project maintenance and Brain native runs
  leadership/      CTO daily review and goals
  conversations/   team conversations, outbox, notifications, Slack
  time/            time accounting and publication
  operations/      harness operation retention
  it/              IT specialist: per-project check context, recovery attempts, delivery
                   recoveries, recovery ledger, reports
tests/unit/        mirrors server/ (plus ui/ for src/ logic)
```

UI domains (`src/main.tsx`, `src/shared.ts`, `src/style.css`, `tokens/`, `ui/`, `contracts/` stay put):

```text
src/
  office/          app shell, live snapshot hook, inspector, settings
  scene/           3D office scene, avatar motion, agent activity
  timing/          live clocks and time book
  work/            delivery queues, summaries, approvals, GitHub panel
  leadership/      CTO review and goals
  conversations/   team conversation panel
  health/          service health and IT agent
```

## Harness and agent boundaries

- Models decide: research, implementation, review verdicts, repair content.
- The deterministic harness acts: worktrees, pushes, PR creation and promotion, board
  lanes, merges, issue closure, comments, time publication.
- Every external mutation goes through `server/effects.ts` (durable intent, preflight,
  single dispatch, read-back). An uncertain effect is reconciled by read-back, never
  resent.
- Only `holds` in the local office config and structured `prerequisites` gate work.
  Model-written findings are advisory unless the model returns a blocking `outcome`.

## Verification

- `pnpm test` (unit, isolated stores) and `pnpm build` must pass before handing back.
- Browser tests (`pnpm test:browser`) use the synthetic fixture server by default.
- Version-control and release actions in this repository belong to Joe; deliver an
  uncommitted working tree.
