---
topics: [delivery-and-recovery]
plans: [2026-11-27-issue-617-refuse-marked-commits-that-change-the-npm-package-f1580887e5.md]
---

# Refuse a `[skip release]` commit that changes the npm package

CMS GH-189 (PR 192) merged `d3ae220f`, a commit whose message carried `[skip release]` while it changed the
shipped `OPERATING.md` and `README.md`. CMS's release analyzer drops every marked commit, so that change would
never have shipped. A hands-off push could do the same again.

## Decision

- **Opt-in policy.** `policy.releaseMarkerCheck` is on by default for `cms-field-vocabulary` only. An explicit
  `false` turns it off. accessibility-standards has the same wiring but needs its own decision.
- **Where it runs.** Both ordinary `pushOnce` routes run the check: initial create and existing-PR descendant
  publication. The force-with-lease CI commit-message repair push is outside it. That gap is recorded in the
  [Office process](../../docs/office-process.md).
- **Unmarked pushes stay free.** A local superset walk and a local narrowing run before any extra provider
  request. An unmarked push runs no `npm pack` and makes no extra provider call.
- **Proof, or refuse.** Each marked commit is judged against its first parent. The release wiring is read at the
  verified target, the snapshots are exported through their own Git index, and the Office's npm 11.9.0 packs them
  with lifecycle scripts off. Anything undecidable is a typed indeterminate stop. CMS's `wiki/` and `scripts/wiki/`
  are the reviewed non-package prefixes; `src/`, `sources/profiles/` and `scripts/build-catalog.mjs` are build inputs.
- **Typed stops.** A refusal is a `release-marker` stop with typed evidence. Every owner writes it `blocked`, it
  counts as `needs-decision`, and incidents attribute it to the harness.
- **Developer return (FIND-019 option b).** An ordinary, unpublished implement result is returned at most twice
  across reloads. The developer only proposes messages. The harness rewords with the existing helper, verifies
  every object independently, reclassifies and moves the branch once by compare-and-swap. Review, QA and
  publication then run on the new SHA.
- **Interruption.** An interrupted correction blocks with its checkout read after startup and is never
  redispatched.
- **Accepted false stop: a stale PR base (implementation review FIND-002, option b).** A descendant push compares the live
  target with the PR's `base.sha`, which GitHub does not keep current. CMS PR 181 opened on base `8426cf93`
  at 22:38:09Z, `main` moved to `7b067ed` at 22:38:32Z, and the PR still showed `8426cf93` when it merged at
  22:49:13Z (merge `f0253a9`'s first parent is `7b067ed`). A descendant push that introduces a marker,
  including an update-base merge carrying `main`'s wiki-sync or Renovate `[skip release]` commits, therefore
  stops as indeterminate whenever `main` moved since the PR last synced, even with both objects local. This
  fail-closed stop is kept. It differs from a stale target whose object is missing locally.
- **Rejected: squash detection (plan review FIND-005).** A push-time refusal over a possible later squash would refuse a
  marked wiki commit beside an unmarked README edit, and CMS allows merge commits.

## Evidence

- Genuine npm 11.9.0 inventories of CMS `2c78305d` and its child `d3ae220f` are kept under
  `tests/fixtures/release-marker/`, with the capture and lifecycle-sentinel record.
- `tests/unit/delivery/publication/release-marker-check.test.ts` refuses `d3ae220f` for both shipped documents.
- `tests/unit/delivery/publication/publish-pr.test.ts` holds the unmarked baselines, zero push intents on refusal
  and preflight movement.
- `tests/unit/delivery/publication/marker-correction.test.ts` covers the return and correction path through
  `GitHubDelivery.step`, on a real repository.
