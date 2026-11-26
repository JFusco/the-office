---
topics: [office-ui-and-telemetry]
plans: [2026-11-26-issue-533-delivery-2-batched-github-pr-observation-revision-d-94a83733cb.md]
issue: 'https://github.com/jfusco/the-office/issues/657'
issues: ['https://github.com/jfusco/the-office/issues/657']
---

# Read open pull requests in one GraphQL inventory per project

The monitor used to read four REST resources for every open pull request on every refresh: the detail, its reviews,
check runs and statuses. After the first delivery for JFusco/the-office#533, those reads were about 930 of the
account's roughly 2,320 core requests an hour, and they grew with every open PR and every project. The monitor now
reads each project's open PRs as one paginated GraphQL inventory. Readiness, merge, closeout and every Effect read-back
still read live REST, so no decision rests on the inventory.

## How the design was settled

A read-only gate ran on live data before merge. It compared the new rows with the pre-change REST projection.

**What the first design got wrong.** It took checks from the head commit's `statusCheckRollup`, which failed the gate
three ways:
- on a head with reruns, the rollup omitted a run that REST `filter=latest` lists;
- it orders runs differently from REST;
- its `CheckRun.url` is not REST's `html_url`.

**How check runs are read now.**
- LATEST runs are read per check suite.
- They are sorted by `databaseId` descending.
- Each run links to its `permalink`.
- This matched REST exactly on every compared head, including reruns, third-party checks and continued suite and run
  pages.

**How statuses are read now.**
- Statuses come from `Commit.status`, newest first.
- Two statuses created in the same second are ordered by context name. REST orders such ties by a status ID that
  GraphQL does not expose. The tie only changes display order in the GitHub panel and in goal facts.

**Page sizes.**
- The sizes are 10 PRs, 10 reviews, 10 suites and 50 runs, with continuations of 50, or 10 for suites.
- Every page cost one point.
- The slowest page took about 4 seconds, on python/cpython.

**The GraphQL reserve.** The gate also found that the account's GraphQL quota answers from two concurrent reset
windows, and that `GET /rate_limit` shows only one of them. The governor from JFusco/the-office#635 read only the window
with the latest reset, which is the less-used one. It now holds GraphQL-dependent background work while any live window
is at or below its 10% reserve, until the latest such window resets.

## Evidence

- The gate report on JFusco/the-office#533.
- The archived plan (plan reviews `b27f0949` and `4203312a`).
- `tests/unit/github/pr-observation-graphql.test.ts`, `pr-observation-shape.test.ts` and `quota-governor.test.ts`.

The post-deploy comparison hour that closes #533 is still to come.

[Archived plan](../plans/2026-11-26-issue-533-delivery-2-batched-github-pr-observation-revision-d-94a83733cb.md) · [Issue JFusco/the-office#657](https://github.com/JFusco/the-office/issues/657)
