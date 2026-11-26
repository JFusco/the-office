---
topics: [delivery-and-recovery]
plans: [2026-11-26-issue-629-give-office-writes-a-github-app-identity-18a0eac3a0.md]
issue: 'https://github.com/jfusco/the-office/issues/698'
issues: ['https://github.com/jfusco/the-office/issues/698']
---

# Lay the foundation for the Office's own GitHub write identity

Every Office write to GitHub ran with Joe's personal `gh` login, so GitHub couldn't tell the Office from Joe. Nothing in
the code chose a credential:
- every `gh` and `git` child inherited the service environment;
- `git push` used Joe's global helper;
- authorship was inferred from the literal `JFusco` or from a live `gh api user` read, which an App installation token
  can't answer.

Issue 629 gives the Office its own GitHub App identity. The plan went through two reviews: `608c77b4`, then `2e4abe95`,
which settled the rollback rule. It is staged so that no live identity changes before each write path is proven.

## Delivery 1 (issue 698)

Delivery 1 builds and proves the foundation with fixtures. Every route stays on the operator.

**Routing**
- Each project and write operation resolves to one of four entry forms:
  - the operator;
  - a pending trial bound to one Effect;
  - an active App route;
  - an explicit rollback.
- Configuration holds public App metadata only. Secret material is refused.

**Activation and rollback**
- A store table remembers each route's current activation, while the proof and the rollback audit live on the
  qualifying Effect.
- Promotion is explicit and needs a trial whose read-back shows the bot as the actor.
- A rollback must name the current activation and is recorded before any operator write can run.
- Writes on a route that was once activated stay held when the marker is stale or missing, the App configuration is
  absent, or the configuration only says `operator`. They are never silently sent as Joe.

**Effects**
- Each intent saves its writer.
- The read-or-create decision happens in the admission transaction.
- Settled rows are updated conditionally.
- The `prepared` claim rechecks the route.

**Credentials**
- An RS256 App JWT, and repository-scoped installation tokens that are validated and cached in memory. They never appear
  in argv, logs, stores or telemetry, and redaction now covers installation tokens, JWTs and PEM keys.
- Only App invocations get a scoped `GH_TOKEN`. An operator rollback strips ambient tokens.
- An App push must have exactly one HTTPS destination for its repository.
- This composes with the worker environment replacement from issue 691.

**Authorship**
- Readers judge a record by its saved writer, or by the historical `JFusco` login for proven legacy records.
- An Office merge is recognized through its merge Effect.

**Related changes**
- Issue 531's history read now selects the editor without changing its digest. Certification stays off until D5.
- The call ledger, rate-limit samples and quota governor track each principal separately.

The live gates still come next:
- **G1:** the credential handoff, which Codex owns.
- **G2:** user-owned board operations.
- **G3:** qualifying each route.

The later deliveries (D2–D5) follow after those.

[Archived plan](../plans/2026-11-26-issue-629-give-office-writes-a-github-app-identity-18a0eac3a0.md) · [Issue JFusco/the-office#629](https://github.com/JFusco/the-office/issues/629) · [Issue JFusco/the-office#698](https://github.com/JFusco/the-office/issues/698)
