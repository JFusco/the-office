---
topics: [delivery-and-recovery]
plans: [2026-11-26-issue-629-give-office-writes-a-github-app-identity-18a0eac3a0.md]
issue: 'https://github.com/jfusco/the-office/issues/751'
issues: ['https://github.com/jfusco/the-office/issues/751', 'https://github.com/jfusco/the-office/issues/629']
---

# Prove the author of a GitHub App issue comment

An Office App comment trial now needs evidence that GitHub returned the comment ID for the saved dispatch. An independent
read of that ID must match the issue, complete body and exact bot account. A complete conversation listing must agree
on the body and show exactly one matching marker. A stale or incomplete listing keeps the Effect eligible for read-back
without another POST.

Both fresh verification and the superseded-wiki recovery path use this rule. If a POST response is lost, a unique
matching comment can settle delivery by read-back. Qualification still requires the original POST receipt, because
a marker match alone cannot identify which request created the comment.

Independent review de8304f0 rechecked five repairs. The commit aa009d77 passed TypeScript and all 87 focused tests.

The proposed live comment on #629 needs an approved Office project binding and a supported invocation on that open issue
through the exact Effects trial gate. The current proof-comment caller belongs to superseded-wiki closeout. Brain Board 8
keeps the operator identity, and comment promotion remains gated on the later worker-publication delivery.

[Credential and board receipt](https://github.com/JFusco/the-office/issues/629#issuecomment-7233009275)
