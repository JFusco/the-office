## Summary

The CMS 13 admin profile described `XHTML string (>255)` editing only as "XHTML rich-text editor." EPiServer.CMS.Core 13.7.0 adds CMS/DAM image and video buttons to rich-text editors and uploads dragged or pasted images to CMS instead of storing them as embedded data. This draft records that behavior, qualified to 13.7.0 onward, with exact official citations.

## Linked issue

Closes #195

## Changes

Official evidence, re-read 2026-11-23:

- `optimizely-paas.cms13-release-notes-index`, https://docs.optimizely.com/cms-13/release-notes, **CMS Core—EPiServer.CMS.Core > November 18—13.7.0 > Enhancements**: "Added image and video buttons to rich-text editors, so you can insert media from CMS or Optimizely Digital Asset Management (DAM) without leaving the editor. Images that you drag or paste into the editor now upload to CMS before they are inserted, so rich text no longer stores them as embedded data."
- `optimizely-paas.cms13-text-property`, registered locator https://docs.developers.optimizely.com/content-management-system/v13.0.0-CMS/docs/text-property (HTTP 301 to the allowed host https://docs.optimizely.com/cms-13/docs/text-property), **Text Type > XHTML string (>255)**: maps the admin label to the WYSIWYG (TinyMCE) editor.

Applicability: the release note says "rich-text editors" generically. Applying it to the `XHTML string (>255)` admin label is an inference from the text-property mapping of that label to the TinyMCE rich-text editor. The claim is explicitly qualified "From EPiServer.CMS.Core 13.7.0" and does not apply to earlier CMS 13 releases.

Edits:

- `sources/evidence-locators.json`: registers `CMS Core > November 18—13.7.0 > Enhancements` for `optimizely-paas.cms13-release-notes-index`.
- `sources/profiles/optimizely-paas.cms13-admin.json`: changes only `XHTML string (>255)` `editorBehavior` and appends the release-notes citation to its `claimEvidence.editorBehavior`; the text-property citation is kept.
- Generated from canonical inputs with `catalog:build`: `catalog/catalog.json`, `catalog/manifest.json` (digest entries only; `fieldCount` unchanged), `catalog/profiles/optimizely-paas.cms13-admin.json`, `docs/platforms/optimizely-paas.cms13-admin.md`.
- `tests/optimizely-paas-cms13.test.mjs`: one focused test for the qualified claim and its citations, which also asserts the model profile's `XhtmlString` claim does not mention 13.7.0.
- Wiki: journal and topic entries, archived plan, rebuilt graph and connections.

Preserved: labels and the 22-field count; the nullable rich-text `valueShape`, `typicalUse`, null `storageShape` and `deliveryShape`, and `renderingOperations`; all other admin fields; the `optimizely-paas.cms13-model` profile; SaaS profiles; consumer routing; `sources/official-sources.json`; `sources.lock.json`. No REST, CLR or delivery-transport claims are added, and the other 13.7.0 bug-fix items (CMS-58191, CMS-58884, CMS-59042) are not imported.

## Verification

Local, at head `bc8800c4ff93376bc7c7776209ec331e08bc64b7` (base `main` `7b68dec9aa9026a69d53f825f0b396bbcae5d8d7`):

- Official passages, the label mapping and the 13.7.0 qualification were rechecked at the registered locators before implementation; no duplicate issue or pull request exists.
- Canonical-ID comparison of catalog records: one changed claim, `optimizely-paas.cms13-admin.XhtmlStringGt255` `editorBehavior`; 22 field IDs unchanged; other profiles, platforms and `sourceLockDigest` unchanged.
- `pnpm run release:preflight`: passed.
- `pnpm run verify:ci`: passed (124/124 tests, wiki integrity passed).
- `pnpm run test:packed` (after `verify:ci`): passed.
- `npm pack --dry-run --ignore-scripts`: passed.
- `node scripts/wiki/discover-plans.cjs`: passed before implementation and at the head.
- `node scripts/wiki/build-graph.cjs --check` (91 nodes, 161 edges, fresh) and `node scripts/wiki/check.cjs`: passed.
- `pnpm run lint:pr` on this body: passed.
- Focused source review of this head: passed with no blocking findings.

Omitted: browser QA, because no user-facing interaction or runtime behavior changes. Hosted checks are pending on this pull request.

## Risk and rollback

- Risk: Low. Descriptive, version-qualified editor-claim enrichment for one admin field; no label, shape, operation or routing change. Expected release impact is a nonbreaking minor (`feat`). Source-lock requirement: the release-notes observation `3041b3ee83f2e42dfb29dd5b9d9ea2a61f8d6fbf4b1965162f81faf1dfa73c48` is a proposal requiring explicit maintainer acceptance and is not applied; `sources.lock.json` is unchanged. Passing checks are not acceptance. Open draft #194 also regenerates `catalog/catalog.json`, `catalog/manifest.json` and the wiki graph; whichever merges second needs those outputs regenerated and checks rerun.
- Rollback: Revert this pull request.

## Checklist

- [x] Scope matches the linked issue.
- [x] Tests and documentation are updated.
- [x] Wiki records are updated for substantive work.
- [x] No secrets, generated local artifacts, or unrelated changes are included.
- [x] `pnpm run verify:ci` passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
