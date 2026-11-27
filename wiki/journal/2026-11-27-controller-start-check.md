---
topics: [releases-and-incidents]
plans: [2026-11-27-jfusco-the-office-729-check-the-selected-controller-before-launch-54d34def0a.md]
issue: 'https://github.com/jfusco/the-office/issues/729'
issues: ['https://github.com/jfusco/the-office/issues/729']
---

# Check the pinned controller's start-up before launching it

The deploy controller runs from a pinned release and validates the local `office-config.json` with that release's
rules as its modules load. The pin can lag behind the service release. On 2026-11-27, pin `2a874f0` rejected an
`autoAdopt` list with `dependabot` that release `138d736` accepted. The controller died before journaling, and the
launcher wrote a STOP that held deployments for about 11 hours, until a person moved the pin and cleared it.

## The check

`server/release/controller-start-check.ts` loads the controller's start-up modules
(`server/release/controller-runtime.ts`) from the release it will run. The child process uses the launch's node,
working directory and data root, and runs nothing else. That release's own rules decide; none are copied.

- **Diagnostic.** A small eval wrapper writes only the thrown error's name and message, so a long stack cannot push
  the message out of the runner's stderr tail.
- **Where it runs.** `launchController` runs the check after `pinnedController` verifies the tree and before the
  launch record, for deploy, resume and end alike.
- **On failure.** A failing check returns the existing `refused` outcome. It names the controller release and its
  error, and writes no launch record and no STOP.

## Decisions

- **Launch time, not edit time.** The config is edited by hand, and no Office code writes it. An edit-time check would
  need a new command for operators to run after each edit, so it was left as a decision for Joe.
- **No advice to repin.** A resume or a journaled end keeps the controller its journal recorded, so the refusal tells
  the operator to resolve the error for that controller. `docs/overseer.md` gives the per-verb guidance.
- **Recorded launches keep STOP.** A launch that passed the check and then failed still writes STOP, for example when
  the config was edited in between.

## Evidence

- **Unit tests.** `tests/unit/release/controller-start-check.test.ts` runs real children against fixture releases. It
  shows an older release rejecting a config a newer one accepts, a config both accept passing unchanged, and this
  checkout's own runtime validating as it loads. `tests/unit/release/launch-controller.test.ts` and
  `tests/unit/release/deploy-command.test.ts` cover the refusal with nothing written and the check's place in each
  launch.
- **Real releases.** Before merge, the production check ran against extracted trees of `2a874f0` and `138d736` with
  isolated data roots. Each tree accepted a shared config. `dependabot` was rejected only by `2a874f0`, and a duplicate
  bot was rejected by both. Every data root was left unchanged, and each check took 0.5–2.9 s.

[Archived plan](../plans/2026-11-27-jfusco-the-office-729-check-the-selected-controller-before-launch-54d34def0a.md) · [Issue JFusco/the-office#729](https://github.com/JFusco/the-office/issues/729)
