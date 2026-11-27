---
topics: [delivery-and-recovery]
plans: [2026-11-26-issue-618-adopt-dependabot-pin-courier-and-wiki-sync-prs-by-default-2aa225cb28.md]
issue: 'https://github.com/jfusco/the-office/issues/618'
issues: ['https://github.com/jfusco/the-office/issues/618']
---

# Adopt all three dependency bots by default on hands-off projects

Joe asked for every bot PR — Dependabot, pin-courier and wiki-sync — to be handled automatically in every project.
Before this change, automatic adoption covered only pin-courier and wiki-sync, and only when a project listed them in an
explicit `autoAdopt`. Dependabot PRs waited for a person to move each card to the pickup lane, and a hands-off project
without a list adopted nothing.

## The resolver

`server/delivery/intake/dependency-bots/effective-auto-adopt.ts` owns the bot list. It has no runtime imports, which
avoids a startup import cycle through the local config. `effectiveAutoAdopt` works like this:

- **Explicit list wins.** An explicit list applies as written, and an empty list adopts none.
- **Default.** A hands-off GitHub project with a configured project board and no list adopts all three bots.
- **Everything else** adopts none.

## Adoption

- **Who triggers it.** Dependabot uses the same lanes as pin-courier: no card, Backlog or the pickup lane. Only the
  trigger changes.
- **What stays the same.** Qualification, tracking issues, the guarded merge, and issue 591's bot-redo conflict handling.
- **A board is required.** By Joe's coordinator's decision, a configured board stays a prerequisite. A qualifying PR
  can be adopted without its own card on that board. A failed board read still stops adoption. Closeout still needs the
  verified Done card.
- **Where the setting shows.** `/api/office-config` and Settings show each project's effective setting.

## Rollout

The live projects listed `['pin-courier', 'wiki-sync']` explicitly, so their local config has to change before the
default turns Dependabot on.

Evidence: `tests/unit/delivery/intake/dependency-bots/effective-auto-adopt.test.ts`,
`tests/unit/delivery/intake/dependabot/adopt.test.ts` and `tests/unit/scheduling/assignment-poll-inventory.test.ts`.

[Archived plan](../plans/2026-11-26-issue-618-adopt-dependabot-pin-courier-and-wiki-sync-prs-by-default-2aa225cb28.md) · [Issue JFusco/the-office#618](https://github.com/JFusco/the-office/issues/618)
