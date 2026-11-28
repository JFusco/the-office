---
topics: [delivery-and-recovery]
plans: [2026-11-28-issue-612-harness-owned-maintenance-publication-revision-7-find-023-refi-6171959a5e.md]
---

# Harness-owned maintenance publication (#612)

CMS maintenance run `df64b208` opened PRs 194 and 196 from its `draft-pr` worker and left no Effects, and
its issue https://github.com/JFusco/cms-field-vocabulary/issues/193 was created with no assignee. The
models were told to push, open draft PRs and file issues themselves, and the harness only checked
afterwards. Issue 531 then could not prove those descriptions were the Office's own for a head.

## Decision

- **Models write content; the harness publishes.** The weekly CMS chain and Brain's repair follow-up
  keep their stages, but every push, draft PR, issue, link comment, assignment and card move is one
  harness Effect with read-back, under work kind `maintenance` and the run's own claim
  (`server/maintenance/publication/`, `server/maintenance/brain/brain-repair-issue.ts`).
- **Positions stay; contract is marked.** New steps carry `publicationVersion: 1`, and publication
  progress lives in `run.publication`, outside every worker result. Older steps replay under their
  original contract. The issue decision is a read-only phase of `proposal` that takes no step slot.
- **Stable issue identity.** A key from the evidenced change (CMS) or the defect (Brain), every page of
  every state searched separately for the marker and the exact title, one assigned REST create read back
  field by field, and no second create after a lost response.
- **Authorship proof for 531.** An original create records `{number, url, head, contentSha256}` only
  from its own printed URL; `own-description.ts` accepts a maintenance create bound to its run and
  refuses competing creators in either order.
- **Confined workers, qualified on the host.** Each affected launch has an explicit policy and runs only
  when a host record matches the exact invocation, pinned to Claude 2.1.332 and the ChatGPT.app Codex
  0.171.0-alpha.13.2. A mismatch is an `authority` stop before any worker or fresh Effect. Under Vitest
  the pinned paths and the `claude`/`codex` names are refused before any child starts (FIND-023).
- **Recovery reaches the follow-up.** A PM recheck of `maintenance-blocker:<run>` or IT queues one
  `reconcile-maintenance` read-back that settles the follow-up's writes and sends nothing.

## Hold and the CMS hook blocker

- **Coordinator decision (2026-11-28).** CMS maintenance publication stays held until it qualifies. The
  fail-closed `authority` stop and the push-hook refusal stay exactly as they are, the required repository
  hooks and the current push policy stay in force, and there is no `--no-verify`, hook bypass, new push route,
  live push, trial or partial cutover. Hook or script text that matches the target is not grounds to trust a
  chain. Credential-free hook execution is planned separately.
- **The blocker.** The CMS `.husky/pre-push` runs `pnpm run verify:ci` and `pnpm run test:packed`, candidate
  code a push would run with publication authority. `pushHookChain` cannot establish those delegates, so the
  maintenance push is refused before any push intent.
- **Explicit CMS push hold (B-A).** A fresh worktree has no `.husky/_`, so an empty or absent chain compared
  equal at baseline and at push and would have let the operator route push with no pre-push hook. A fresh or
  prepared CMS push is now refused before marker admission, intent and dispatch (`push-hold.ts`), whatever the
  baseline, policy surface or receipts show; a verified push is honored and an attempted one is read back.
- **Draft lint refused (B-B).** The draft lint runs candidate scripts before the push under a profile no
  worker record covers, so installing worker records would have opened it. Every route that would run it now
  stops with a typed `draft-lint-isolation` stop (`lint-isolation.ts`) before any candidate script: at chain
  admission before the issue, before an unstarted draft worker, and on a resume from saved draft content. It
  needs its own reviewed isolation qualification.

## Compatibility and continuation

- Saved steps and receipts stay exactly as they were: every proposal group works on a copy of its saved
  candidate, and a run interrupted at any phase reloads unchanged and never resumes by itself.
- A legacy group at an unstarted `draft-pr`, and a later run that finds an earlier run's or a legacy model's
  candidate, stop with `authority` and their evidence. The deliberate continuation is the run's read-back,
  then removal of the unpublished checkout and branch by a person; the next run reuses the keyed issue.

## Repair pass after implementation review 8c5a12f5

The review accepted 18 findings and the coordinator added three blockers; all were repaired in place:

- **Ordering and authority.** The proposal position checks for an ambiguous earlier editor or decision
  worker before any decision, issue or worktree (FIND-004). Publication admission and `status` compare the
  record's template as well as the host (`chain-qualification.ts`, FIND-005). A saved Brain diagnosis routes
  only while its `codex-reader` record is still qualified (FIND-006). Versioned read-back needs a running claim
  bound to the run and rechecks it before each settlement (`reconcile-authority.ts`, FIND-007). A record may
  bind only a registered canonical executable (FIND-019).
- **Identity and read-back.** Every part of a CMS key, and Brain's source and defect, must be named by the
  selected evidence, including for an unmarked issue (FIND-009). A create whose response named an issue
  settles only on that issue (FIND-010); a draft create only against its saved bytes, base and issue
  (FIND-013); a Brain card status only against its saved IDs, with the lane reread in preflight (FIND-014).
  A checks worker's read-back validates its candidate and its scratch separately (FIND-008).
- **Evidence and records.** Retained evidence is accepted all or none per step (FIND-011). Promotion and
  cleanup need a complete completion record, and promotion the job's recorded PR (FIND-012). A reused
  candidate must still be clean at its recorded base (FIND-015). Draft titles are published byte for byte
  (FIND-016). A saved blocked Brain decision stays stopped on read-back (FIND-017). The vendor packet finds the
  latest full scan past the daily bound and states coverage gaps (FIND-018). An intent-only earlier run is
  named as holding the checkout (FIND-002), and the confined-lint rejection has its own test (FIND-003).
- **Editor template (FIND-001).** The `{gitCommonDir}/worktrees` denial covered the editor's own `{gitDir}`, so
  every editor commit would have failed; it is removed (writes are allow-only, so other worktrees stay
  unwritable) and unit tests show no denial contains an allowed path. `claude-editor` stays unqualified: the
  observed pinned-Claude result cannot be produced without running `claude` under the signed-in identity,
  which the coordinator forbids.
- **Procedure (B-C).** The qualification procedure now uses synthetic Git transport and API fixtures only,
  marks Apple events, LaunchServices, launchd, the pasteboard and the real keychain as unverified, and states
  the evidence rules: synthetic controls are scratch-report evidence only, never production `controlCoverage`;
  no real credential paths, keychain or signed-in CLI runs; the production binding to the real home and Office
  data root stays unverified; the one registry GET exception; and an unrepresentable control keeps its role
  and the CMS cutover unqualified.

## Second repair pass after implementation review 41b0c1cd

- **Identity across runs.** A verified create's receipt keeps naming the key's issue for later runs after its
  title or marker changes (`knownIdentities`); a Brain adoption with no named issue is never routed as a create.
- **Authority and order.** The Brain follow-up read-back rechecks its persisted claim before each settlement
  and before updating the follow-up. An existing push intent is handled before fresh admission: a verified
  receipt is honored without new hook checks, an attempted one is looked up only inside its read-back.
- **Continuation.** A diagnosis refused before any worker started is queued once by the recheck. Another
  candidate's saved decision worker is not an ambiguous attempt, and a pre-editor skip holds on replay.
- **Verification before completion.** Finalization rereads the recorded link comment, and Brain routing checks
  that its recorded issue is still open before assigning or moving the card.
- **Interruption.** A crash at each of the four sends, before and after the provider applied it, reopens a
  working run whose Effect is dispatching; startup sends nothing and only an observed write settles.

## Not done here

- Host qualification on the Office Mac and the write-inventory cutover are pending
  ([procedure](../../docs/maintenance-launch-qualification.md)). The CMS `.husky/pre-push` runs
  candidate-defined commands, so the maintenance push is expected to hold until a qualified hook
  chain or #629 D4 credential separation.
- The daily CMS follow-up, Brain's native nightly publisher, #614, #629 D4 and the Phase 7
  `sandbox-runtime` pin are unchanged.

## Evidence

- [Office process](../../docs/office-process.md), Maintenance publication (#612).
- `tests/unit/maintenance/versioned-weekly-pump.test.ts` drives a weekly run through the scheduler entry
  to one issue, one push, one draft and one link, and an unqualified chain to an `authority` stop with no
  write.
- `tests/unit/maintenance/brain/brain-followup-readback.test.ts` goes from the served outbox action to a
  settled original create and a continuation that sends only the unsent phase.
- `tests/unit/workers/spawn-command.test.ts` refuses both exact pins by path alone and both names alone,
  and a `./git` symlink to a registered pin, with zero `spawn` and `execFileSync` calls.
- `tests/unit/maintenance/publication/push-candidate.test.ts` shows a fresh CMS push with an empty or absent
  `.husky/_`, an equal policy surface or passing receipts leaves zero Effects, push intents and `recordedPush`
  calls, and a prepared intent stays unsent; `versioned-weekly-pump.test.ts` shows installed worker records
  alone stop at the typed lint refusal with zero lint spawns, on CMS and on another weekly project, and on a
  resume from saved draft content.
