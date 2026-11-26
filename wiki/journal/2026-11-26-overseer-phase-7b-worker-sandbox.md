---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-7b-fixture-only-worker-sandbox-contract-91873a31d0.md]
issue: 'https://github.com/jfusco/the-office/issues/697'
issues: ['https://github.com/jfusco/the-office/issues/697', 'https://github.com/jfusco/the-office/issues/690']
---

# Overseer phase 7b: the worker sandbox, fail-closed

Phase 7b ([issue #697](https://github.com/JFusco/the-office/issues/697)) defines the outer sandbox every model worker must run in, and ships it closed. The candidate runtime, `@anthropic-ai/sandbox-runtime` 0.0.83, is not installed. Claude Code's automatic permission review refused installing and running it, and Joe's coordinator asked that the install go through the normal permission review, which Joe approves himself. Everything here is tested against fixtures only.

What it adds:

- **The policy.** Content reads are denied from `/` down. Only the run's frozen snapshot, its working folders and reviewed executables are opened again. Writes are allowed only in the run's folders, and there is no network.
- **The runtime.** It is located as files inside the runner's own installation and never run.
- **The wrapper.** It writes each run's policy exactly once and hands one wrapped command to an executor its caller supplies. No path runs the program unwrapped.
- **The qualification contract.** It names the probe battery, how its observations are read, and which reader profile may run nested.

The plan review ([plan](../plans/2026-11-26-overseer-phase-7b-fixture-only-worker-sandbox-contract-91873a31d0.md), run `f67675fd`) accepted 16 of its 17 findings, five of them blockers, and rejected FIND-017 on upstream evidence that the runtime takes `javaAgentJarPath` as a top-level setting, where the plan already put it. The blockers:

- **Credential and configuration probes.** The runtime's base macOS profile still allows lookups of `securityd` and `SecurityServer`, so the battery must show a Keychain item and protected configuration denied, each beside a working control.
- **Inner receipts.** The outer battery passing says nothing about a provider's own restrictions, so each reader profile needs a receipt of its own for its exact binary and invocation.
- **No real executor.** The command contract takes an executor its caller supplies, so a matching installation alone cannot dispatch anything.
- **The policy file.** It is created once, exclusively and without following a link, then rechecked before every command.
- **The snapshot.** It has its own runner-owned place, apart from everything writable, so a reader cannot edit what it was given.

A Seatbelt profile cannot be applied inside another on this Mac: `sandbox-exec` inside `sandbox-exec` gives `sandbox_apply: Operation not permitted`. Codex's read-only sandbox for model commands is Seatbelt, so a Codex reader that can run commands is recorded as unqualified rather than run with a weaker mode, as Joe's coordinator asked: "If a provider cannot meet them, record it as unqualified."

With Joe approving each prompt himself ("Prompt Joe in session"), the pinned runtime was then installed on a separate branch and the battery run on this Mac against synthetic sentinels. The battery confirmed most of the policy and changed four things in this delivery:

- **Short wrapper folder.** The runtime binds its own socket in its process's temporary folder, and the run's `tmp` made that path too long for macOS. The wrapper now gets a short private folder of its own, and the payload keeps the run's `tmp`.
- **Shells.** The payload always needs `/bin/bash` and `/bin/sh`, because the runtime runs it through `bash -c`.
- **System libraries.** It also always needs `/usr/lib` and `/System/Library` to start.
- **Correction.** Denying a read does not stop a payload running `launchctl`, which reached launchd under this policy. The docs no longer claim otherwise.

The first implementation review (`b398b15e`) stopped waiting on a decision about a test that depended on the umask. Joe's coordinator approved the one-line fix with the test run twice, under umasks 022 and 077. A run's checks are fixed when it starts, so a fresh review declares both runs.

[Issue #697](https://github.com/JFusco/the-office/issues/697) · [Overseer, Worker sandbox](../../docs/overseer.md#worker-sandbox)
