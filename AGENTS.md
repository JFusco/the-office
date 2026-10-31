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

Example (ticket delivery domain):

```text
server/delivery/
  harness/       scope.ts, guards.ts, effect.ts, stage-result.ts
  intake/        admission.ts, pr-inventory.ts
  candidate/     create-candidate.ts
  publication/   pr-body.ts, publish-pr.ts, ready-pr.ts
  board/         project-graphql.ts, move-lane.ts
  findings/      advisory.ts
  parking/       park.ts, resume.ts
  closeout/      closeout.ts
tests/unit/delivery/   mirrors the tree above, one test file per module
```

Other domains follow the same rule, for example `server/maintenance/`,
`server/leadership/` (CTO and goals), `server/time/` and `server/workers/`.

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
