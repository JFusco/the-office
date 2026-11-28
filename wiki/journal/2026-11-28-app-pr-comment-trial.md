---
topics: [delivery-and-recovery]
plans: [2026-11-26-issue-629-give-office-writes-a-github-app-identity-18a0eac3a0.md]
issue: 'https://github.com/jfusco/the-office/issues/629'
issues: ['https://github.com/jfusco/the-office/issues/629']
---

# Prove the App's pull request comments separately

Promoting the `comment` route needs a verified, actor-bearing trial for each of its two mutations. The issue comment
trial on #629 proved `rest-issue-comment`. The only `rest-pr-comment` caller was Dependabot redo. It sends a fixed
`@dependabot rebase` command with no marker or pre-state, and verifies with a plain boolean, so it could never qualify.

The App trial command now also takes a pull request packet. It sends one inert marked comment on the PR conversation
under the real `github-pr-comment` operation and its Pull requests grant. Dependabot redo and the trial now share one
PR conversation comment adapter: the fixed POST argv, the single POST and the exact read-back by ID. Dependabot's saved
argv and its command are unchanged.

The PR's ids, head and base are part of the trial payload, so the approved change digest binds them. A replacement
packet for another head or PR never matches the configured entry, even when GitHub agrees with it. The target is read
before the intent exists and again under the App token just before the claim. A lost response can settle delivery by
read-back without a second POST. Qualification still needs the saved POST ID and the bot's login and id. Issue packets,
payloads and digests are unchanged, so the verified #629 trial still reads back.

The live PR trial needs its own approved target and packet. Promotion of the route also stays gated on the D4 transfer
of the worker publishers that share it.
