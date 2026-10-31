import { approvedText } from './approved-text';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

export const RELEASE_SOURCE_IDS = ['optimizely-saas.release-notes-index', 'optimizely-paas.release-notes-index', 'optimizely-paas.cms13-release-notes-index'] as const;
const boundProfiles = ['optimizely-paas.cms13-admin', 'optimizely-paas.cms13-model'];
export const RELEASE_AMENDMENT_PATHS = [
    'sources.lock.json', 'sources/official-sources.json', 'sources/evidence-locators.json',
    'scripts/source-scan.mjs', 'tests/source-scan.test.mjs',
    ...boundProfiles.flatMap(id => [`sources/profiles/${id}.json`, `catalog/profiles/${id}.json`]),
    'catalog/catalog.json', 'catalog/manifest.json', 'scripts/wiki/graph/data/graph.json', 'wiki/connections.md',
    'wiki/topics/official-source-freshness.md', 'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md',
];
type Document = Record<string, any>;
type Revision = 'base' | 'originalBase' | 'proposal' | 'candidate';
export type ReadSourceFile = (path: string, revision: Revision) => string;
function assert(condition: unknown, detail: string): asserts condition { if (!condition) throw new Error(detail); }
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, canonical(child)])) : value;
export const sourceJson = (value: any) => `${JSON.stringify(canonical(value), null, 2)}\n`;
export const sourceHash = (value: string) => createHash('sha256').update(value).digest('hex');
const without = (object: Document, keys: string[]) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
function rows(value: any, key: string): Map<string, Document> {
    assert(Array.isArray(value), 'Source collection is not an array');
    const result = new Map<string, Document>();
    for (const row of value) {
        assert(row && typeof row[key] === 'string' && !result.has(row[key]), 'Source collection identity is missing or duplicated');
        result.set(row[key], row);
    }
    return result;
}
function unchangedExcept(base: Document, candidate: Document, keys: string[], detail: string) {
    assert(isDeepStrictEqual(without(base, keys), without(candidate, keys)), detail);
}
function scopedRows(base: any[], candidate: any[], key: string, allowed: readonly string[], verify: (id: string, row: Document) => void) {
    const before = rows(base, key), after = rows(candidate, key);
    for (const id of new Set([...before.keys(), ...after.keys()])) {
        if (allowed.includes(id)) {
            assert(after.has(id), `Approved source/binding ${id} is missing`);
            verify(id, after.get(id)!);
        } else assert(isDeepStrictEqual(before.get(id), after.get(id)), `Unapproved source/binding changed: ${id}`);
    }
    for (const id of allowed) assert(after.has(id), `Approved source/binding ${id} is missing`);
}

/** Applicability comes from the frozen approved registrations, never model-selected dispositions. */
export function releaseAmendmentProfileIds(read: ReadSourceFile): string[] {
    const registrations = rows(JSON.parse(read('sources/official-sources.json', 'proposal')).sources, 'id');
    const ids = new Set<string>();
    for (const sourceId of RELEASE_SOURCE_IDS) {
        const source = registrations.get(sourceId);
        assert(source && Array.isArray(source.profiles) && source.profiles.length &&
            source.profiles.every((id: unknown) => typeof id === 'string' && id.length > 0) && new Set(source.profiles).size === source.profiles.length,
        `Frozen approved applicability is missing or duplicated: ${sourceId}`);
        source.profiles.forEach((id: string) => ids.add(id));
    }
    const profiles = [...ids].sort();
    assert(profiles.length === 7, 'Frozen amendment must cover exactly seven affected profiles');
    const base = rows(JSON.parse(read('catalog/catalog.json', 'base')).profiles, 'id');
    const candidate = rows(JSON.parse(read('catalog/catalog.json', 'candidate')).profiles, 'id');
    assert(isDeepStrictEqual([...base.keys()].sort(), [...candidate.keys()].sort()), 'Amendment catalog profile identity changed');
    assert(profiles.every(id => base.has(id) && candidate.has(id)), 'Approved affected profile is missing from the catalog');
    return profiles;
}

/** A mechanically derived evidence ledger, not an authority or claim-impact decision. */
export function releaseAmendmentJournal(read: ReadSourceFile): string {
    const path = 'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md';
    let preserved = approvedText(read(path, 'originalBase'), read(path, 'proposal'), read(path, 'base'));
    const original = rows(JSON.parse(read('sources.lock.json', 'proposal')).sources, 'sourceId');
    const current = rows(JSON.parse(read('sources.lock.json', 'candidate')).sources, 'sourceId');
    const dates = RELEASE_SOURCE_IDS.map(id => original.get(id)?.observedAt?.slice(0, 10));
    if (dates.every(date => date === dates[0]) && /^\d{4}-\d{2}-\d{2}$/.test(dates[0] || '')) {
        const date = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${dates[0]}T00:00:00Z`));
        const caption = `On ${date} the reviewed observations were:`;
        preserved = preserved.replace(caption, `The ${date} observations below are retained as historical proposals. Their metadata alone does not establish retained same-response body evidence; the amendment ledger records the current response binding.`);
    }
    const lines = [
        '<!-- office-source-amendment-evidence:v1 -->', '## Source amendment evidence', '',
        'These three proposed response bindings require independent source review and QA. This ledger does not accept a baseline or declare any new claim to have no impact.', '',
        '| Source | Observed at (UTC) | Identities | Raw SHA-256 | Normalized SHA-256 | Fragment SHA-256 |',
        '| --- | --- | --- | --- | --- | --- |',
    ];
    const changes: string[] = [];
    for (const id of RELEASE_SOURCE_IDS) {
        const previous = original.get(id), record = current.get(id);
        assert(previous && record && Array.isArray(previous.identities) && Array.isArray(record.identities) &&
            [...previous.identities, ...record.identities].every(identity => typeof identity === 'string' && /^[a-zA-Z0-9_.-]{1,160}$/.test(identity)) &&
            ['rawSha256', 'normalizedSha256', 'fragmentSha256'].every(key => /^[a-f0-9]{64}$/.test(record[key])) &&
            typeof record.observedAt === 'string' && /^\d{4}-\d{2}-\d{2}T[0-9:.]+Z$/.test(record.observedAt) && Number.isFinite(Date.parse(record.observedAt)),
        `Amendment journal response identity is invalid: ${id}`);
        lines.push(`| \`${id}\` | ${record.observedAt} | ${record.identities.length} | \`${record.rawSha256}\` | \`${record.normalizedSha256}\` | \`${record.fragmentSha256}\` |`);
        const before = new Set(previous.identities), after = new Set(record.identities);
        const display = (values: string[]) => values.length ? values.sort().map(value => `\`${value}\``).join(', ') : 'none';
        changes.push(`| \`${id}\` | ${display(record.identities.filter((identity: string) => !before.has(identity)))} | ${display(previous.identities.filter((identity: string) => !after.has(identity)))} |`);
    }
    lines.push('', 'Identity changes relative to the original proposal are inventory evidence; their claim applicability remains an independent review obligation.', '',
        '| Source | Added identities | Removed identities |', '| --- | --- | --- |', ...changes, '<!-- /office-source-amendment-evidence:v1 -->', '');
    return `${preserved.trimEnd()}\n\n${lines.join('\n')}`;
}

/** Checks the entire net diff. A proposed native "reviewed" field is not acceptance. */
export function verifyReleaseAmendmentScope(read: ReadSourceFile, changedPaths: string[], generated: Record<string, string> = {}): { scopeSha256: string; sourceLockDigest: string } {
    const paths = RELEASE_AMENDMENT_PATHS;
    assert(changedPaths.length && new Set(changedPaths).size === changedPaths.length && changedPaths.every(path => paths.includes(path)), 'Changed path exceeds the bounded source amendment');
    const json = (path: string, revision: Revision): Document => JSON.parse(read(path, revision));
    const lock = json('sources.lock.json', 'candidate'), baseLock = json('sources.lock.json', 'base'), proposalLock = rows(json('sources.lock.json', 'proposal').sources, 'sourceId');
    unchangedExcept(baseLock, lock, ['reviewedAt', 'sources'], 'Lock schema or unapproved top-level metadata changed');
    assert(Number.isFinite(Date.parse(lock.reviewedAt)), 'Lock review date is missing');
    scopedRows(baseLock.sources, lock.sources, 'sourceId', RELEASE_SOURCE_IDS, (id, record) => {
        const frozen = proposalLock.get(id);
        assert(frozen, `Original approved proposal is missing ${id}`);
        unchangedExcept(frozen, record, ['rawSha256', 'normalizedSha256', 'fragmentSha256', 'identities', 'observedAt', 'reviewedAt'], `Approved source metadata changed beyond the proposal: ${id}`);
    });
    for (const [path, key] of [['sources/official-sources.json', 'id'], ['sources/evidence-locators.json', 'sourceId']]) {
        const base = json(path, 'base'), current = json(path, 'candidate'), proposed = rows(json(path, 'proposal').sources, key);
        unchangedExcept(base, current, ['sources'], `Unapproved registration metadata changed: ${path}`);
        scopedRows(base.sources, current.sources, key, RELEASE_SOURCE_IDS, (id, row) => {
            assert(isDeepStrictEqual(row, proposed.get(id)), `Registration differs from the exact approved proposal: ${id}`);
        });
    }
    for (const id of boundProfiles) for (const directory of ['sources/profiles', 'catalog/profiles']) {
        const path = `${directory}/${id}.json`, current = json(path, 'candidate');
        unchangedExcept(json(path, 'base'), current, ['sourceIds'], `Profile claims changed outside the amendment: ${id}`);
        const baseIds = json(path, 'base').sourceIds, proposedIds = json(path, 'proposal').sourceIds;
        const selected = (ids: string[], allowed: boolean) => ids.filter(value => RELEASE_SOURCE_IDS.includes(value as any) === allowed);
        assert(Array.isArray(current.sourceIds) && new Set(current.sourceIds).size === current.sourceIds.length &&
            isDeepStrictEqual(selected(current.sourceIds, false), selected(baseIds, false)) &&
            isDeepStrictEqual(selected(current.sourceIds, true), selected(proposedIds, true)), `Approved source binding changed: ${id}`);
    }
    for (const path of ['scripts/source-scan.mjs', 'tests/source-scan.test.mjs', 'wiki/topics/official-source-freshness.md'])
        assert(read(path, 'candidate') === approvedText(read(path, 'originalBase'), read(path, 'proposal'), read(path, 'base'), path), `Scanner, rejection tests or documentation differ from the approved delta: ${path}`);
    const journal = 'wiki/journal/2026-10-29-restore-optimizely-release-note-indexes.md';
    const approvedJournal = approvedText(read(journal, 'originalBase'), read(journal, 'proposal'), read(journal, 'base'));
    assert(read(journal, 'candidate') === approvedJournal || read(journal, 'candidate') === releaseAmendmentJournal(read),
        'Amendment journal differs from the preserved history and capture-derived evidence ledger');
    for (const path of ['scripts/wiki/graph/data/graph.json', 'wiki/connections.md']) {
        if (!changedPaths.includes(path)) continue;
        assert(typeof generated[path] === 'string' && generated[path] === read(path, 'candidate'), `Native generated output is missing or differs: ${path}`);
        if (path.endsWith('.json')) {
            const graph = JSON.parse(generated[path]);
            assert(graph && typeof graph === 'object' && !Array.isArray(graph), 'Native graph output is invalid');
        }
    }
    const catalog = json('catalog/catalog.json', 'candidate'), baseCatalog = json('catalog/catalog.json', 'base');
    unchangedExcept(baseCatalog, catalog, ['sourceLockDigest', 'profiles'], 'Unapproved catalog metadata changed');
    scopedRows(baseCatalog.profiles, catalog.profiles, 'id', boundProfiles, (id, row) => {
        assert(isDeepStrictEqual(row, json(`catalog/profiles/${id}.json`, 'candidate')), `Generated catalog/profile differs: ${id}`);
    });
    const sourceLockDigest = `sha256:${sourceHash(sourceJson(lock))}`;
    assert(catalog.sourceLockDigest === sourceLockDigest, 'Generated source-lock digest is stale');
    const manifest = json('catalog/manifest.json', 'candidate'), baseManifest = json('catalog/manifest.json', 'base');
    unchangedExcept(baseManifest, manifest, ['catalogDigest', 'sourceManifestDigest', 'sourceLockDigest', 'profiles'], 'Unapproved generated manifest metadata changed');
    assert(manifest.catalogDigest === `sha256:${sourceHash(sourceJson(catalog))}` && manifest.sourceLockDigest === sourceLockDigest &&
        manifest.sourceManifestDigest === `sha256:${sourceHash(sourceJson(json('sources/official-sources.json', 'candidate')))}`, 'Generated catalog or source manifest digest is stale');
    const baseManifestProfiles = rows(baseManifest.profiles, 'id');
    scopedRows(baseManifest.profiles, manifest.profiles, 'id', boundProfiles, (id, row) => {
        unchangedExcept(baseManifestProfiles.get(id)!, row, ['digest'], `Generated profile count/identity changed: ${id}`);
        assert(row.digest === `sha256:${sourceHash(sourceJson(json(`catalog/profiles/${id}.json`, 'candidate')))}`, `Generated profile digest is stale: ${id}`);
    });
    return { scopeSha256: sourceHash(sourceJson(Object.fromEntries(paths.filter(path => changedPaths.includes(path)).map(path => [path, sourceHash(read(path, 'candidate'))])))), sourceLockDigest };
}
