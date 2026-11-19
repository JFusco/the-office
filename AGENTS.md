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
  office/          service identity: config, projects, project policy, security, clock, health, revision,
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
    attempts/      restart of a dead writer run from the accepted head, worktree salvage, backoff
    publication/   PR body, publish, promote, draft/prepare stages
    board/         project board lanes
    readiness/     merge readiness, checks, merge approval
    repairs/       repair budgets and dispatch, conflict repair
    findings/      advisory findings, repair scope
    parking/       Block-lane decisions and resume
    closeout/      harness closeout
    recovery/      reconciliation of legacy records (closeout, implementation, preparation,
                   scope repair, validation)
  comments/        what the Office writes on tickets, issues and PRs: one readable shape, plain wording,
                   the words a provider stored
  cec/             Jira/Azure (CEC) pipeline: workflow, mailbox, pilot delivery, stage runner,
                   Jira Blocked parking
  github/          GitHub provider adapters
  maintenance/     project maintenance and Brain native runs
  leadership/      CTO daily review and goals
  conversations/   team conversations, outbox, notifications, Slack
  time/            time accounting and publication
  telemetry/       model routes, usage capture and estimated cost (price table, rollout and
                   result parsing, run accounting, Claude backfill)
  operations/      harness operation retention
  it/              IT specialist: per-project check context, recovery attempts, delivery
                   recoveries, recovery ledger, reports
  release/         release builds and identity: exact-commit build, release.json manifest,
                   the release launchd runs (deploy controller to follow)
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
  people/          employee directory, org chart and reporting lines (registry: contracts/people.ts)
```

## Harness and agent boundaries

- Keep the shared [Office process](docs/office-process.md) in sync when changing
  stage order, ownership, recovery or publication boundaries. Reuse the existing
  runtime, claims and Effects; role-specific payloads do not create another
  orchestrator. Ship changed contracts, compatible historical readers and their
  behavioral checks together.

- Models decide: research, implementation, review verdicts, repair content.
- The deterministic harness acts: worktrees, pushes, PR creation and promotion, board
  lanes, merges, issue closure, comments, time publication.
- Every external mutation goes through `server/store/effects.ts` (durable intent, preflight,
  single dispatch, read-back). An uncertain effect is reconciled by read-back, never
  resent. One exception: GitHub board hours are an absolute total, so a write read back as
  never landed after it settled is written once more (`server/time/time-readback.ts`); a
  second miss in a row for the same ticket, with no verified write between them, goes to Joe.
  A GitHub hours sync that stops before it writes anything sent nothing and is tried
  again with growing pauses (`server/time/unsent-time.ts`); that is not a resend.
  Board estimated cost (`Est. Cost (USD)`) follows the ordinary rule: one dispatch through
  Effects, settled only by read-back, never resent (`server/telemetry/cost-ledger.ts`).
- A hands-off GitHub writer stage whose run died restarts from the accepted head
  (`server/delivery/attempts/`): the abandoned work is kept under a local ref, the worktree is
  reset, and nothing is pushed. This re-runs a model stage; it never resends an Effect.
- Only `holds` in the local office config and structured `prerequisites` gate work.
  Model-written findings are advisory unless the model returns a blocking `outcome`.

## Verification

- `pnpm test` (unit, isolated stores) and `pnpm build` must pass, locally or on hosted
  CI, before a change is merged.
- Browser tests (`pnpm test:browser`) use the synthetic fixture server by default.
- Office harness workers (delivery stages) commit on their owned branch only and never
  push, open a PR, merge or release; the harness publishes after review.
- Interactive sessions Joe drives in this repository hold a standing grant (2026-10-31)
  to commit, push, open and merge PRs through the Git delivery flow below: keep
  `pnpm test` and `pnpm build` green, put a review on record, merge once checks pass,
  then delete the branch and any worktree (Joe extended this to automatic merge and
  cleanup, 2026-11-18). Deploy to the launchd service only when `/api/health` reports
  `busy: false`. Other repositories and releases outside the Office's guarded merge
  still need Joe.

## GitHub issue area labels

Every new issue created with `github-issue-creator`, including delivery-tracking
issues, must include at least one applicable `area:` label in addition to its
issue-kind labels (such as `bug`, `enhancement` or `documentation`). Select areas
from the actual requested work and affected behavior, not incidental mentions.
Use multiple areas only when each is a substantive part of the issue scope.

Before filing, list the repository's labels and resolve the selected names exactly.
Use this taxonomy for `JFusco/the-office`; the areas follow the server and UI domains
above:

| Area label | Use for |
| --- | --- |
| `area:office` | Service identity: config, projects, project policy, security, health, HTTP routes |
| `area:store` | Persistence, schema, migrations, Effects, evidence artifacts and recovery |
| `area:scheduling` | Scheduler, scheduled work, coordinator poll/tick/pump and requests |
| `area:workers` | Model workers: runtime, process, Claude/Codex adapters, profiles, lanes |
| `area:delivery` | GitHub ticket delivery harness: intake, publication, readiness, repairs, closeout |
| `area:cec` | Jira/Azure (CEC) pipeline: workflow, mailbox, stage runner, Jira parking |
| `area:comments` | What the Office writes on tickets, issues and PRs |
| `area:github` | GitHub provider adapters |
| `area:qa` | Office QA protocol and browser QA guidance |
| `area:maintenance` | Project maintenance and Brain native runs |
| `area:leadership` | CTO daily review and goals |
| `area:conversations` | Team conversations, outbox, notifications and Slack |
| `area:time` | Time accounting and publication |
| `area:telemetry` | Model routes, usage capture and estimated cost |
| `area:operations` | Harness operation retention |
| `area:it` | IT specialist: checks, recoveries, recovery ledger and reports |
| `area:knowledge` | Lessons, retrospectives and improvement proposals |
| `area:features` | Feature planning, handoff and release |
| `area:ui` | The browser app under `src/`: scene, panels, settings and work views |
| `area:tooling` | Build, CI, dependencies, scripts, hooks and test infrastructure |
| `area:docs` | README, `docs/`, `AGENTS.md` and repository skills |

Add other areas only for independently affected subsystems; a change that calls
shared code is not also in that code's area. If no existing area fits, ask for a
label decision before filing. Never create, rename or substitute labels without
authorization, and do not silently omit the required area. Read the saved issue back
and verify its exact labels, including at least one area, before continuing.

## Git delivery flow

For repository changes that include delivery, complete this sequence:

1. Confirm the worktree is safe to switch, then switch to `main` and run
   `git pull --ff-only` so the branch point is the current remote main, then run
   `pnpm install` so the Husky hooks and commitlint are present. If
   another session owns the checkout or local work must remain in place, fetch
   current `origin/main` and use an isolated worktree. Preserve unrelated edits;
   never reset or discard work.
2. Create one actionable GitHub issue with the repository's labels, including an
   `area:` label, using the `github-issue-creator` workflow (or reuse the issue the
   request names), and read the saved issue back before creating downstream
   artifacts.
3. Create `codex/<issue-number>-<short-slug>` from that updated `main`.
4. Implement only the issue scope. Before pushing, run the type-check and the
   test suites the change touches. Run the full `pnpm run verify:ci` (`pnpm build`
   and `pnpm test`) locally when the machine can finish it in reasonable time;
   otherwise hosted CI is the full gate, and the pull request says so. Never run
   two gates at once on this machine. Update `docs/office-process.md` in the same
   delivery when stage order, ownership, recovery or publication boundaries
   change.
5. Commit with a valid conventional message (`type(scope): subject`, lower-case
   scope, subject at most 50 characters, body lines at most 72), then push the
   issue branch with ordinary Git commands. Never push directly to `main`.
6. Open a pull request with a conventional title and the canonical
   `.github/pull_request_template.md` body. Keep its level-two headings exactly
   once and in order; replace every placeholder with meaningful content,
   include `Closes #<issue-number>`, record verification and risk/rollback,
   and complete every required checkbox. Run `pnpm run lint:pr < body.md`
   before opening the PR and read the saved PR back afterward. CI validates the
   body again.
7. Put a review on record, watch CI and fix failures. Once every check passes,
   merge the PR with `gh pr merge --merge` and synchronize local `main`. Leave
   failed PRs open; never merge failed checks or bypass branch protections.
8. Once a PR merges, by the Office, an agent or Joe, clean up what the
   delivery created: delete the remote branch if GitHub kept it, the local
   branch and any worktree used for it, and remove scratch or temporary files
   the delivery left outside the repository. Delete only when the PR merged
   and the branch tip is the merged head; ask before removing a worktree with
   uncommitted changes. Never delete an unmerged branch.

Keep the Husky hooks enabled. `commit-msg` runs `pnpm run lint:commit` against the
shared `commitlint.config.cjs`; `pre-push` rejects any update targeting `main`,
including explicit refspecs and multi-ref pushes. CI repeats the PR body, PR title
and commit-range checks (`.github/workflows/commitlint.yml`) and runs
`pnpm run verify:ci` (`.github/workflows/quality.yml`). `--no-verify` is not a routine
delivery workaround.

## Graphify repository workflow

Use the repository-local [Graphify skill](.agents/skills/graphify/SKILL.md) for the
shared code map of `server/`, `src/` and `scripts/`. Exact behavior comes from source;
rationale comes from `docs/` and this file. Use Graphify 0.9.105. After cloning, run
`pnpm install` (activates Husky) and `graphify hook install` for the native Git refresh
hooks and the local `graph.json` merge driver. Hooks skip linked worktrees, including
the harness's delivery worktrees; refresh the canonical map from the primary checkout.
Commit only `graph.json`, `graph.html`, `GRAPH_REPORT.md`, `.graphify_analysis.json`,
`.graphify_labels.json` and its `.sig`; `manifest.json`, caches and backups stay local.
Keep `graphify-out/memory/` empty and review background graph changes before staging.
Do not install Graphify agent tool hooks.
