---
topics: [delivery-and-recovery]
plans: [2026-11-25-589-accept-the-optional-skip-release-suffix-on-wiki-pr-titles-fbe538826b.md]
issue: 'https://github.com/jfusco/the-office/issues/589'
issues: ['https://github.com/jfusco/the-office/issues/589']
---

# Accept the [skip release] marker on wiki PR titles

Wiki-sync qualification now accepts the canonical wiki PR title followed by exactly one ` [skip release]`, for numbered, missed-merges and weekly titles. Before this change, the title had to match exactly. `JFusco/accessibility-standards` appends the marker on purpose: its release configuration releases `docs` commits as patches, and its tests require that a wiki PR title used as a squash subject suppresses the release. Every one of its wiki PRs was refused with "the wiki PR does not match its source merge" and sent to Joe, although every provenance check passed.

The title proves nothing on its own. The parent number comes from the branch and is checked against the merged source PR, and the account, branch, repository, base, body, Actions-only commits and wiki-only files are all still checked. So the change widens qualification by that one exact suffix and nothing else: a different parent number, another marker such as `[skip ci]`, free text, a missing space, a doubled marker, trailing whitespace or a prefix are still refused.

One predicate in `wikiSync.refusal` covers every place qualification is read: adoption, reverification, each adoption write and the automation merge check. A refused record is checked again on the next eligible poll, so the existing refusals clear without anyone moving a card, and their outbox items resolve once the PR is adopted. A conflicted wiki PR still waits for GitHub to report it mergeable; conflict handling for adopted bot PRs is separate work.

Evidence: `tests/unit/delivery/intake/dependency-bots/wiki-sync.test.ts`, with each one-line mutation of the predicate failing at least one test.

[Archived plan](../plans/2026-11-25-589-accept-the-optional-skip-release-suffix-on-wiki-pr-titles-fbe538826b.md) · [Issue JFusco/the-office#589](https://github.com/JFusco/the-office/issues/589)
