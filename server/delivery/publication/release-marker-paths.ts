/**
 * The Office's reviewed assumptions about one project's package, kept with its policy (#617). `buildInputs` feed the
 * published build output (`dist/` from `src/` through tsup, `catalog/` from `sources/profiles/` through
 * `scripts/build-catalog.mjs`): changing one changes what ships, though npm never lists it. `reviewedPrefixes` hold
 * nothing any CMS producer consumes (the wiki and its graph tooling): a changed path there is allowed only when both npm
 * inventories exclude it. Every other unlisted path is indeterminate. If a CMS producer starts consuming a listed
 * prefix, this list needs an Office policy review before it is relied on again.
 */
export interface PackagePaths { buildInputs: readonly string[]; reviewedPrefixes: readonly string[] }

const PATHS: Readonly<Record<string, PackagePaths>> = Object.freeze({
    'cms-field-vocabulary': Object.freeze({
        buildInputs: Object.freeze(['src/', 'sources/profiles/', 'scripts/build-catalog.mjs']),
        reviewedPrefixes: Object.freeze(['wiki/', 'scripts/wiki/']),
    }),
});

/** A project with no reviewed list has none: every path outside its inventories is indeterminate. */
export function packagePaths(projectId: string): PackagePaths {
    return Object.hasOwn(PATHS, projectId) ? PATHS[projectId] : { buildInputs: [], reviewedPrefixes: [] };
}

/** A prefix ending in `/` covers everything beneath it; any other entry names one exact path. */
export const listed = (path: string, entries: readonly string[]) => entries.some(entry => entry.endsWith('/') ? path.startsWith(entry) : path === entry);
