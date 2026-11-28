---
topics: [delivery-and-recovery]
plans: [2026-11-26-issue-629-give-office-writes-a-github-app-identity-18a0eac3a0.md]
issue: 'https://github.com/jfusco/the-office/issues/756'
issues:
  [
    'https://github.com/jfusco/the-office/issues/756',
    'https://github.com/jfusco/the-office/issues/629',
  ]
---

# Invoke one approved App issue-comment trial

Until now, only superseded-wiki closeout could reach the issue-comment proof adapter. That caller runs inside a
delivery job, so a designated App trial could not be sent on a chosen open issue. `pnpm office app-trial
check|run --project <id> --file <packet.json>` now sends Joe's approved public packet to the running Office's
command route. It reuses the checked proof-comment adapter, the write boundary and Effects. It adds no
orchestrator, model work or delivery job.

The packet repeats every public identifier of the approved trial. Before an intent exists, the command compares it
with the project store, the `githubApp` block, the pending `comment` entry and GitHub's repository and issue
identity. A pending entry gives every undesignated Effect id the operator, so the command refuses unless the route
selects this exact id as the App trial. The id must carry the command's own `office-app-trial:` prefix. A harness id
could get a retry suffix from `activeEffectId` after a rejection and reach the operator. Pause, drain, holds and
network facts are checked first, because a rejection in preflight spends the approval. Policy can change while
the preflight awaits the provider. The preflight's last awaited step therefore re-reads the repository and the
open, unlocked issue under the App token, and the same local admission runs synchronously at the dispatch claim.
GitHub accepts comments on a closed issue, and it has no conditional comment create. The marker is last seen in
the preflight's listing, which finishes before the repository and issue reads, so a competing marker can
appear during either read and until GitHub applies the POST. The issue's state is last seen in the issue read
and can change after it. Writer selection requests the token for the packet's own installation and repository
ids, and admission runs again after its marker listing and after the token wait, so a refusal there spends
nothing. A rejection in the preflight or claim is answered as the rejected, spent trial with its saved reason.
`check` admits the trial again after its own listing and sends nothing. After
an attempt, a second `run` only reads back the saved Effect under its pinned writer; the App block must remain
for that writer's token. A rejected trial is refused for good. A successful `run` needs a verified Effect whose
read-back recorded the approved bot by login and id. A failed read-back is answered with the attempt's status,
its diagnostic and same-packet guidance; a lost response is read back only from a listing of readable bodies.

## Live binding and rehearsal limits

- **Project.** The smallest useful binding is one more `projects` entry, placed last:
  `{ "id": "the-office", "name": "The Office", "provider": "github", "repo": <primary checkout>,
  "repository": "JFusco/the-office", "target": "main", "autoAdopt": [] }`. It has no `githubProject` and no
  `policy`. `projects` replaces the built-in list, so every existing entry stays.
  - A new store starts with coordination off. Pickup, checkpoints, adoption and time or cost publication wait
    for an explicit `activate-checkpoints`. Without a board, pickup could not run anyway.
  - What still runs: the store is created; the periodic read-only GitHub refresh records open issues as
    non-pilot mailbox tickets; the office-wide daily review reads the project; a quiet weekly roll-up is
    recorded locally.
  - Pausing the project would also stop the trial, because Effects refuses a paused project.
- **App block.** `githubApp.repositories["the-office"]` with repository id `1438707274`, the App, installation
  and bot ids, and the pending `writes["the-office"].comment` entry naming the packet's Effect id and digests.
- **Receipt.** The official result is the verified, qualified Effect in the durable `the-office` project store of
  the running Office. An isolated store with injected GitHub and credentials proves only the interface. It is never
  the G3 receipt.
- **Release.** The live config change needs Joe's approval and a release-owned restart. Route promotion stays a
  separate decision.

Each module under `server/github/identity/app-trial/` has a mirrored test under
`tests/unit/github/identity/app-trial/`. The tests use an isolated store, an injected provider and a synthetic
token issuer. They cover:

- a read-only check;
- one App POST;
- exact packet, config, route, pin and target refusals;
- the operator fallback;
- a drain, hold or config change at the claim;
- target drift during the last listing;
- a prepared intent resumed after a restart;
- spent, concurrent and repeated runs;
- read-back that qualifies only the approved bot, with a marker match alone never qualifying.

`tests/unit/github/identity/write-boundary-claim.test.ts` covers forwarding the caller's claim.
`tests/unit/office/http/app-trial-route.test.ts` covers the route.
