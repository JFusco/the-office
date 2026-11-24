# Releases and incident recovery

The deploy controller uses exact-commit release artifacts and an idle fence so a release can be installed with a durable record of the active service revision. The incident ledger records why work stopped, connects a repair to a release, and verifies the result from work resumed after that release.

These changes landed as separate increments. The fence and release identity precede the controller. Incident observation and repair binding precede outcome verification. A merged fix and an observed running release provide different evidence.

An incident's identity is its cause's fingerprint. For a cause the harness wrote, that fingerprint includes its normalized text, in which occurrence details (paths, ticket keys, identifiers, times and numbers) become placeholders. A detail left in the text splits one cause into many incidents, as GitHub request IDs did until [rate-limit stops were grouped](../journal/2026-11-24-rate-limit-incident-grouping.md).

## Evidence

- [Overseer and incident recovery](../../docs/overseer.md) and [Office process](../../docs/office-process.md)
- [Exact-commit builds](https://github.com/JFusco/the-office/pull/318), [deployment fence](https://github.com/JFusco/the-office/pull/338), [deploy controller](https://github.com/JFusco/the-office/pull/361), [incident ledger](https://github.com/JFusco/the-office/pull/364), and [resume verification](https://github.com/JFusco/the-office/pull/462)
