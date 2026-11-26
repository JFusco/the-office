---
topics: [releases-and-incidents]
plans: [2026-11-26-overseer-phase-6c-launcher-runner-pin-and-launchagent-for-647-cd16bfae80.md, 2026-11-26-overseer-phase-6c-launcher-packaging-for-jfusco-the-office-647-ab1fd16d77.md]
issue: 'https://github.com/jfusco/the-office/issues/647'
issues: ['https://github.com/jfusco/the-office/issues/647']
---

# Overseer phase 6c: launcher, runner pin and LaunchAgent

The Overseer runner can now run on a schedule, once a person installs it. Nothing installs it, and it still only observes.

A person pins a built release with `pnpm office overseer pin COMMIT`. The pin is refused unless the release folder under the Office data root verifies against its manifest and holds the pass entry as a file of its own runtime inventory. `node scripts/install-overseer.mjs` then installs a LaunchAgent that runs the launcher every 120 seconds. It checks everything first, writes nothing while a job is loaded, and copies the launcher from the operator's checkout.

Each launch:

- takes its own lock;
- settles anything an earlier launch left, before it checks its configuration or its pin;
- verifies the pinned release again, and requires the release's own `tsx`;
- starts a helper that leads a new process group;
- registers the helper's PID, group and start time before the pass may run;
- stops the whole group at the pass's deadline, or when the launcher itself is asked to stop.

An attempt is settled only once ESRCH confirms its group gone. It is counted once, under a closed set of kinds, and a hang is counted before the first signal. Anything the launcher cannot identify stays current and blocks for a person.

The launcher's source is the fourteen modules in `scripts/overseer-launcher/`. `pnpm build:overseer-launcher` bundles them with the repository's Vite into the one committed file of Node built-ins, `scripts/overseer-launch.mjs`, and a unit test requires the two to agree byte for byte. The first implementation was a single hand-written file of 824 lines. Joe's coordinator asked for it to be split by responsibility while keeping one stable, dependency-free installed file, and for a build-time bundle to be weighed. The layout review settled on that bundle, with no install-time bundler, no digest folders and no new plist path.

The plan review (`e0d61cef`) accepted nine findings and six further gaps. The central one: a temporary helper leads the pass's group, so the pass can exit without losing the identity needed to stop its descendants. The layout review (`1734a933`) accepted three findings:

- an explicit Vite configuration, so the build never empties `scripts/`;
- the launcher's own path, passed to every identity check;
- a `launch.mjs` that only coordinates.

During implementation, real-process tests found two races. The launcher is the helper's parent, so `ps` can list a helper that has just exited, not yet reaped, as `(node)`, a leader it cannot name. The launcher now waits for the helper's reaped exit before treating such a leader as a stranger. The helper's own `ps` also showed up in its group; `ps` now runs detached.

The first implementation review (`ec1b1997`) raised 18 findings. It stopped for a decision only because regenerating the bundle was not among its commands; Joe's coordinator approved that step. All 18 were repaired, each with a test that fails without its fix:

- a failed save during dispatch still stops the group and lets the launcher exit;
- nothing is authorized once a stop is asked for or the deadline, which counts startup, has passed;
- a pass that exits before its deadline is not a hang, and a latched hang keeps its own record;
- a helper whose launcher dies during a TERM wait escalates itself;
- `ps` runs in a session of its own (`execFile` silently drops `detached`);
- run directly from source, the launcher protects its own checkout;
- the release's `tsx` must be a package folder;
- the installer checks the plist's folder, executable and launchd's exact absence answer;
- identifiers must be strings, and times real calendar dates, as zod requires;
- the lock records an observed start time;
- status tells an absent guard from one it cannot see;
- publication faults are tested;
- the recovery guide never clears an attempt while its group may run.

A fresh full review of the repaired head (`b249ef79`) followed, with the byte comparison first among its checks and regeneration declared. It confirmed all 18 independently and accepted 10 more, all repaired and passed on recheck:

- the helper stays the group's leader unless `ps` shows it alone, so an empty listing or an expired TERM wait no longer lets it leave a descendant unnamed;
- a stop asked for after the pass has exited keeps the pass's own result;
- cleanup that cannot be confirmed keeps the pass's exit facts, and a spawn error stays `startup`;
- the installer accepts only launchd's exact absence answer for this user, so UID 5010 no longer passes for 501;
- a newly charged `lost` or `orphan` attempt logs one summary, even when the next pass succeeds;
- test teardown signals only fixtures whose identity still matches;
- the pin-to-plist test runs a pnpm-style `tsx` link;
- the recovery guide covers a stale `launcher.lock` and treats the release path as context only.

[Issue #647](https://github.com/JFusco/the-office/issues/647) · [Overseer, Launcher](../../docs/overseer.md)
