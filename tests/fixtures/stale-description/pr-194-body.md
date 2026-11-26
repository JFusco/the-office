## Summary

The CMS SaaS API v1 profile described `string` editing only as "Text editor refined by format and constraints." and omitted the documented nesting limits for `json`, `content`, `component`, arrays of components and `composition`. This draft adds those official claims, with exact citations, to six `editorBehavior` values.

## Linked issue

Closes #193

## Changes

Official evidence, re-read 2026-11-23:

- `optimizely-saas.release-notes-index`, https://docs.optimizely.com/cms-saas/release-notes, **November 18 > Bug fixes > CMS-58191**: the editor capped a string with a minimum but no maximum length at 255 characters; such properties now accept text of any length, property settings have a Min Length field, and an admin-UI save no longer removes a minimum set through the REST API.
- `optimizely-saas.content-types`, registered locator https://docs.developers.optimizely.com/content-management-system/v1.0.0-CMS-SaaS/docs/content-types-saas (HTTP 301 to the allowed host https://docs.optimizely.com/cms-saas/docs/content-types-saas):
  - **Properties > Validation fields**: `maxLength` (string, array), `minLength` (string), `pattern` (string).
  - **Properties > Data types**: `json` values nest up to eight levels.
  - **Nesting limits** (Updated 20 Nov 2026): eight levels for inline blocks in content areas, component and content properties, arrays of components and Visual Builder sections; four levels for Visual Builder layout nodes; eight for `json`. A shared block or section counts as one level and is checked when it is saved. The whole item is checked on every save; an over-limit REST request returns 400 Bad Request with the field path.

Applicability: the release notes are continuous SaaS notes without an explicit "API v1" qualifier; applying them to the pinned `optimizely-saas.cms-api-v1` profile follows the existing registered source routing. SDK contracts are not expanded.

Edits:

- `sources/evidence-locators.json`: registers `Nesting limits` (`optimizely-saas.content-types`) and `November 18 > Bug fixes` (`optimizely-saas.release-notes-index`).
- `sources/profiles/optimizely-saas.cms-api-v1.json`: changes only `editorBehavior` and its `claimEvidence` for `string`, `json`, `content`, `component`, `array` (arrays of components only) and `composition` (four-level layout limit, worded without section types). Existing evidence is kept. The 64-level request-body limit is a transport limit and is excluded.
- Generated from canonical inputs with `catalog:build`: `catalog/catalog.json`, `catalog/manifest.json` (digest/profile entries only; `fieldCount` unchanged), `catalog/profiles/optimizely-saas.cms-api-v1.json`, `docs/platforms/optimizely-saas.cms-api-v1.md`.
- `tests/optimizely-saas-api.test.mjs`: two evidence assertions updated, two focused tests added.
- Wiki: journal and topic entries, archived plan, rebuilt graph and connections.

Preserved: all 14 native tokens; every `valueShape`, `typicalUse`, `storageShape`, `deliveryShape` and `renderingOperations` value; the SDK 2/3/3.1 profiles; consumer routing; `sources/official-sources.json`; `sources.lock.json`.

## Verification

Local, at head `8cab9165f1c7c7d400a7fa103e14814b9b0fccd4`:

- Official passages, API-v1 applicability and duplicate dispositions rechecked before implementation (#176 left CMS-58191 out of scope; no other matching issue or PR).
- Canonical-ID comparison of catalog records: only `editorBehavior` changed for the six fields; composition claims contain no section wording; no 64-level claim.
- `pnpm run release:preflight`: passed.
- `pnpm run verify:ci`: passed (125/125 tests, wiki integrity passed).
- `pnpm run test:packed` (after `verify:ci`): passed.
- `npm pack --dry-run --ignore-scripts`: passed.
- `node scripts/wiki/discover-plans.cjs`: passed before implementation and at the head.
- `node scripts/wiki/build-graph.cjs --check` (91 nodes, 162 edges, fresh) and `node scripts/wiki/check.cjs`: passed.
- `pnpm run lint:pr` on this body: passed.
- Focused source review of this head: passed with no blocking findings.

Omitted: browser QA, because no user-facing interaction or runtime behavior changes. Hosted checks are pending on this pull request.

## Risk and rollback

- Risk: Low. Descriptive claim enrichment for one pinned profile; no token, shape, operation or routing change. Expected release impact is a nonbreaking minor (`feat`). Source-lock requirement: the release-notes observation `d0d9182f99b21cf0d1b9aa1bd83a5d9a433671177908b7a02eec58646647166b` is a proposal requiring explicit maintainer acceptance and is not applied; the `optimizely-saas.content-types` fingerprint `53233f57da97689579e6bce58190cdc98b885cdc4cf97645c8e16b8a12c5adca` is unchanged. Passing checks are not acceptance.
- Rollback: Revert this pull request.

## Checklist

- [x] Scope matches the linked issue.
- [x] Tests and documentation are updated.
- [x] Wiki records are updated for substantive work.
- [x] No secrets, generated local artifacts, or unrelated changes are included.
- [x] `pnpm run verify:ci` passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
