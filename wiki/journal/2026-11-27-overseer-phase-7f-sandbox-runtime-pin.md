---
topics: [releases-and-incidents]
plans: [2026-11-27-overseer-phase-7f-pin-the-sandbox-runtime-and-record-the-qualification-r-4a096017d6.md]
issue: 'https://github.com/jfusco/the-office/issues/737'
issues:
  [
    'https://github.com/jfusco/the-office/issues/737',
    'https://github.com/jfusco/the-office/issues/690',
  ]
---

# Overseer phase 7f: the sandbox runtime pin and the phase 7 exit

Phase 7f ([issue #737](https://github.com/JFusco/the-office/issues/737), part of [#690](https://github.com/JFusco/the-office/issues/690)) pins the outer sandbox runtime and records the host result it was measured against. It also states how phase 7 ends. Nothing new runs. The dispatch gate is closed, and both reader profiles are unqualified.

What it adds:

- **The pin.** `@anthropic-ai/sandbox-runtime` is pinned exactly at 0.0.83 in `package.json` and `pnpm-lock.yaml`, carried forward unchanged from the 7b-2 experiment. `SANDBOX_RUNTIME` records its lockfile integrity, and a unit test keeps the manifest, the lockfile and that constant in step. The installation test now requires the frozen install, which only hosted CI performs: nothing was installed locally, by the operator's choice ("Hosted CI only").
- **The recorded result as a regression.** A synthetic battery reproduces the four recorded outer gaps. It shows the outer sandbox unqualified and both readers refused with `outer-unqualified`, and each gap accounts for exactly its own failure.
- **An honest gate.** The closed gate now gives its real reason: "The recorded host failed outer sandbox qualification and qualifying runner-owned receipts are missing". Its known blockers name the launchd, credential-store and shared-temp gaps.

**The phase 7 exit.** Each of the three requirements is either resolved or a gap that fails closed ([Phase 7 exit](../../docs/overseer.md#phase-7-exit)):

- **Authentication isolation:** separate runner-owned sign-ins, with synthetic coverage only. There is no live authentication evidence.
- **Nested process isolation:** a gap. Seatbelt does not nest on Darwin 24.3, so the command-capable Codex reader is refused.
- **Selected provider profiles:** `claude-reader` (Claude Code 2.1.328) and `codex-reader` (Codex CLI 0.167.0-alpha.4.1) are both unqualified. The outer sandbox let launchd be reached, left credential-item access untested, and left the shared-temp write inconclusive.

The plan review ([plan](../plans/2026-11-27-overseer-phase-7f-pin-the-sandbox-runtime-and-record-the-qualification-r-4a096017d6.md), run `7f53e453`) accepted 9 findings, and all of them passed recheck. The most material:

- the recorded launchd, credential and shared-temp claims kept to what the evidence shows;
- the gate's reason and known blockers corrected;
- the host evidence kept here instead of in scratch space;
- plan discovery kept away from session stores by an empty `WIKI_HOME`;
- the threshold a later qualification must meet.

[Issue #737](https://github.com/JFusco/the-office/issues/737) · [Overseer, Phase 7 exit](../../docs/overseer.md#phase-7-exit) · [Knowledge loop](../../docs/knowledge-loop.md)

## Host battery run 3

Recorded at `2026-11-26T20:48:30.831Z` on the 7b-2 branch, with runtime 0.0.83 and synthetic sentinels, listeners and sockets only. No provider program, login or inference was involved.

- Host: macOS 15.3.1 build `24D70`, arm64. Node v24.14.0 at `/usr/local/bin/node`.
- Runtime reads needed: `/usr/lib`, `/System/Library`.

| Identity | SHA-256 |
|---|---|
| Node | `9e831e9b13aa47c5e5eaa3904d232aa527124e8abba7ca5d72b67b46cfb10ae8` |
| Runtime contents | `867288aa2ba08d52201f05aae370ff7995fe090d0aa0abbfcc21535da4a7809d` |
| `dist/cli.js` | `36232b1591e34c6826e7f5526692b780352dc0ea05f325a80e7618347c378fad` |
| Java-agent JAR | `6d3f71201e5f061eb59e00c90a68176b0438244f441970e7eff05926b241da2a` |
| Run policy | `f2b2515c41a884f6a3fc628c986b85fb8a0bed781fe0d1d245d5802c3b5e57f9` |

The observations, as recorded. A dash marks a field the row does not have.

| # | Probe | Started | Outcome | Control | Sentinel intact |
|---|---|---|---|---|---|
| 1 | `startup` | true | allowed | — | — |
| 2 | `snapshot-read` | true | allowed | — | — |
| 3 | `tmp-write` | true | allowed | — | — |
| 4 | `provider-write` | true | allowed | — | — |
| 5 | `tmpdir-api` | true | allowed | — | — |
| 6 | `read-sibling` | true | denied | succeeded | — |
| 7 | `read-runner-state` | true | denied | succeeded | — |
| 8 | `read-office-data` | true | denied | succeeded | — |
| 9 | `read-claude-config` | true | denied | succeeded | — |
| 10 | `read-codex-config` | true | denied | succeeded | — |
| 11 | `write-snapshot` | true | denied | succeeded | true |
| 12 | `write-run-root` | true | denied | succeeded | true |
| 13 | `write-sibling` | true | denied | succeeded | true |
| 14 | `write-policy` | true | denied | succeeded | true |
| 15 | `write-shared-tmp` | true | denied | unavailable | true |
| 16 | `write-private-shared-tmp` | true | inconclusive | unavailable | true |
| 17 | `replace-policy` | true | denied | succeeded | true |
| 18 | `replace-snapshot` | true | denied | succeeded | true |
| 19 | `credential-store` | false | inconclusive | unavailable | — |
| 20 | `network-direct` | true | denied | succeeded | — |
| 21 | `network-proxied` | true | denied | succeeded | — |
| 22 | `loopback` | true | denied | succeeded | — |
| 23 | `unix-socket` | true | denied | succeeded | — |
| 24 | `launchd-ipc` | true | denied | failed | — |
| 25 | `nested-seatbelt` | true | refused | succeeded | — |
| 26 | `cleanup` | false | ended | — | — |

The recorded evaluation was `unqualified`, with `innerSeatbelt: unsupported`. Its four failures:

- "write-shared-tmp: its positive control unavailable"
- "write-private-shared-tmp: its positive control unavailable"
- "credential-store: payload start not confirmed"
- "launchd-ipc: its positive control failed"

The `cleanup` row above is the run's single aggregate cleanup. Today's evaluator judges a row's outcome before its control. So it words the private shared-temp failure as "expected denied, saw inconclusive", and the regression asserts that wording.

**The launchd row, corrected.** The `launchd-ipc` row was measured with a copied `launchctl`. macOS kills such a copy wherever it runs, and the details below record SIGKILL both inside and outside the sandbox. The same run also ran the real `/bin/launchctl`, inside and outside the sandbox, under its recorded policy `f2b2515c41a884f6a3fc628c986b85fb8a0bed781fe0d1d245d5802c3b5e57f9`. Both reached launchd and exited 113 ("Could not find service"), as row 24 below records. So launchd was reachable, as the [phase 7b journal](2026-11-26-overseer-phase-7b-worker-sandbox.md) also records. The regression in `tests/unit/overseer/sandbox-qualification.test.ts` models that corrected outcome.

### Recorded details, normalized

The report also keeps a separate `details` object for each probe, with what the payload and its control actually returned. These are its material outcomes, normalized, all from the same 2026-11-26 run under its recorded policy. The report keeps the raw command lines, local paths, the environment listing and the endpoints, and it stays private and read-only outside the repository, with SHA-256 `ccbf36d58e167855164cfb26b14874523c65deebf594161cb48a4731ec9d5a6b`. A local comparison checks the report's digest, all 26 rows above and each entry below against the original.

| # | Probe | Recorded outcome |
|---|---|---|
| 1 | `startup` | argv round-trip true; cwd is the run home true; TMPDIR is the run tmp true; failure none; 38 environment names (kept in the report) |
| 2 | `snapshot-read` | outcome allowed; failure none |
| 3 | `tmp-write` | outcome allowed; failure none |
| 4 | `provider-write` | outcome allowed; failure none |
| 5 | `tmpdir-api` | outcome allowed; failure none |
| 6 | `read-sibling` | inside: denied, EPERM; failure none; control: allowed |
| 7 | `read-runner-state` | inside: denied, EPERM; failure none; control: allowed |
| 8 | `read-office-data` | inside: denied, EPERM; failure none; control: allowed |
| 9 | `read-claude-config` | inside: denied, EPERM; failure none; control: allowed |
| 10 | `read-codex-config` | inside: denied, EPERM; failure none; control: allowed |
| 11 | `write-snapshot` | inside: denied, EPERM; failure none; control: allowed |
| 12 | `write-run-root` | inside: denied, EPERM; failure none; control: allowed |
| 13 | `write-sibling` | inside: denied, EPERM; failure none; control: allowed |
| 14 | `write-policy` | inside: denied, EPERM; failure none; control: allowed |
| 15 | `write-shared-tmp` | inside: denied, EPERM; failure none; control: none |
| 16 | `write-private-shared-tmp` | inside: error, ENOENT; failure none; control: none |
| 17 | `replace-policy` | inside: denied, EPERM; failure none; control: allowed |
| 18 | `replace-snapshot` | inside: denied, EPERM; failure none; control: allowed |
| 19 | `credential-store` | not run: creating a keychain would change the interactive Keychain search list |
| 20 | `network-direct` | inside: denied, EPERM; failure none; control: allowed |
| 21 | `network-proxied` | test listener: denied, 403, blocked-by-allowlist; .invalid name: denied, 403, blocked-by-allowlist |
| 22 | `loopback` | inside: denied, EPERM; failure none; control: allowed |
| 23 | `unix-socket` | inside: denied, EPERM; failure none; control: allowed |
| 24 | `launchd-ipc` | copied launchctl inside: ran, signal SIGKILL; copied launchctl control: ran, signal SIGKILL; real launchctl inside: ran, exit 113 (Could not find service); real launchctl control: ran, exit 113 (Could not find service) |
| 25 | `nested-seatbelt` | inside: ran, exit 71 (sandbox_apply: Operation not permitted); control: ran, exit 0 |
| 26 | `cleanup` | leftover pids null |
