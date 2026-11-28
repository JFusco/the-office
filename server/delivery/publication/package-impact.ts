import type { Git } from './original-git';
import { isSha } from './original-git';
import { listed, type PackagePaths } from './release-marker-paths';
import { indeterminate } from './release-marker-stop';

/** One path a commit changes against its first parent; renames are never detected, so each side is its own path. */
export interface Change { status: string; path: string }

/**
 * Every path a commit changes against its first parent: recursive, NUL-delimited raw output with rename detection off,
 * so a rename is a deletion and an addition, each named. An unparseable record is never guessed at.
 */
export async function commitChanges(git: Git, parent: string, commit: string): Promise<Change[]> {
    if (!isSha(parent) || !isSha(commit)) throw indeterminate('an exact parent and commit are required for the diff', commit);
    let out: string;
    try { out = await git(['diff-tree', '-r', '-z', '--raw', '--no-renames', '--no-commit-id', '--no-ext-diff', '--no-textconv', parent, commit]); }
    catch { throw indeterminate(`incomplete coverage: parent ${parent} of ${commit} is unreadable`, commit); }
    const tokens = out.split('\0'), changes: Change[] = [];
    if (tokens.at(-1) === '') tokens.pop();
    for (let i = 0; i < tokens.length; i += 2) {
        const meta = /^:(\d{6}) (\d{6}) ([a-f0-9]{40}) ([a-f0-9]{40}) ([ADMT])$/.exec(tokens[i]), path = tokens[i + 1];
        if (!meta || !path || path.startsWith('/')) throw indeterminate(`incomplete coverage: an ambiguous path record in ${commit}`, commit);
        changes.push({ status: meta[5], path });
    }
    return changes;
}

/** Files npm always ships from the package root when present: the manifest, readme and licence. */
const MANDATORY = /^(?:package\.json|(?:readme|license|licence|copying)(?:\.[^/]*)?)$/i;
/** Files that decide what npm selects, at any depth. */
const PACK_DEFINITION = /(?:^|\/)\.(?:npm|git)ignore$/;

/** The entry points a manifest names, which npm always ships. */
function namedEntries(manifest: Record<string, unknown>): string[] {
    const clean = (value: unknown) => typeof value === 'string' ? [value.replace(/^\.\//, '')] : [];
    const bin = manifest.bin;
    return [...clean(manifest.main), ...(typeof bin === 'string' ? clean(bin) : bin && typeof bin === 'object' ? Object.values(bin).flatMap(clean) : [])];
}

export type Impact =
    | { kind: 'allowed' }
    | { kind: 'package-change'; paths: string[]; inventoryPaths: string[] }
    | { kind: 'unclassified'; paths: string[] };

export interface Inventories { parent: { paths: Set<string>; manifest: Record<string, unknown> }; commit: { paths: Set<string>; manifest: Record<string, unknown> } }

/**
 * Whether one marked commit changes the package (#617). Any path added to or removed from the inventory proves it,
 * even when the ignore file that moved it is in neither. A changed path counts when it ships on either side, is the
 * manifest or another file npm always ships, decides selection, or is a build input. After those checks a path is
 * allowed only if both inventories exclude it and it lies under a reviewed prefix; any other path is indeterminate.
 */
export function packageImpact(changes: Change[], inventories: Inventories, policy: PackagePaths): Impact {
    const { parent, commit } = inventories;
    const inventoryPaths = [...[...commit.paths].filter(path => !parent.paths.has(path)), ...[...parent.paths].filter(path => !commit.paths.has(path))].sort();
    const entries = new Set([...namedEntries(parent.manifest), ...namedEntries(commit.manifest)]);
    const affecting = changes.map(change => change.path).filter(path => parent.paths.has(path) || commit.paths.has(path) || MANDATORY.test(path) ||
        entries.has(path) || PACK_DEFINITION.test(path) || listed(path, policy.buildInputs));
    if (inventoryPaths.length || affecting.length) return { kind: 'package-change', paths: [...new Set(affecting)].sort(), inventoryPaths };
    const unclassified = changes.map(change => change.path).filter(path => !listed(path, policy.reviewedPrefixes));
    return unclassified.length ? { kind: 'unclassified', paths: [...new Set(unclassified)].sort() } : { kind: 'allowed' };
}
