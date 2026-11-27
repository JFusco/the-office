---
topics: [releases-and-incidents]
plans: [2026-11-27-overseer-phase-7e-runner-owned-sign-ins-and-reader-calls-726-4fad5187ec.md]
issue: 'https://github.com/jfusco/the-office/issues/726'
issues:
  [
    'https://github.com/jfusco/the-office/issues/726',
    'https://github.com/jfusco/the-office/issues/690',
  ]
---

# Overseer phase 7e: runner-owned sign-ins and reader calls

Phase 7e ([issue #726](https://github.com/JFusco/the-office/issues/726)) builds the path from a frozen triage input to a provider answer, with synthetic sign-ins, fake provider programs and a synthetic provider endpoint only. The shipped dispatch gate is closed, so every live call is refused before anything starts.

What it adds:

- **Separate runner sign-ins.** Joe enrolls them himself on his existing subscriptions, under the runner's own `providers/` folder, which no worker policy opens.
  - The Claude token goes into one executor call's environment. The pinned sandbox runtime passes only standard streams, so a descriptor from outside cannot reach the CLI.
  - The Codex login is copied into each run's own `CODEX_HOME`. A refresh is published back only with trusted evidence, for the same login, user and workspace.
- **Stops by generation.** A rejected or unverified sign-in stops its generation. A rotation within a login keeps the stop, and a new enrollment starts clear.
- **The reader profiles.** Each restriction is built from its own arguments. Eligibility now derives the rules from the policy file and hashes the selected program. It also requires inner evidence of the restrictions and the sign-in method in effect.
- **One gated call.** Every gate runs before admission, so a refusal spends nothing, and a proven non-dispatch releases its reservation. A timed-out call's completion goes to the pass that holds the lock, which retires the run's credential copy before releasing it.

The plan review ([plan](../plans/2026-11-27-overseer-phase-7e-runner-owned-sign-ins-and-reader-calls-726-4fad5187ec.md), run `fbe8926d`) accepted 22 findings, and all passed recheck. They reshaped the design:

- preparing each call per allocation;
- zero-cost refusal before launch;
- caller-held pass ownership;
- a closed Codex envelope with evidence-bound rotation;
- stops keyed to generations;
- trusted authentication evidence;
- the late-completion hand-off.

Both readers stay unqualified pending host qualification, which needs Joe's go-ahead.

[Issue #726](https://github.com/JFusco/the-office/issues/726) · [Overseer, Provider sign-ins and reader runs](../../docs/overseer.md#provider-sign-ins-and-reader-runs)
