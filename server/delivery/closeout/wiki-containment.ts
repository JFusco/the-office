import { readRepo } from '../intake/dependabot/qualify';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { WikiContainmentProof } from '../../../src/shared';

/** Generated from the wiki pages; exempt only when both snapshots carry the inspected generator. */
const GENERATED = ['wiki/connections.md', 'scripts/wiki/graph/data/graph.json'];
export const GENERATOR = { path: 'scripts/wiki/build-graph.cjs', blob: '0d866356f7b1677161e5f8a1232c5d806b6ee7d8' };
const STATUSES = new Set(['added', 'modified', 'changed', 'removed', 'renamed']);
/** GitHub lists at most 3,000 files for a PR; an inventory at the ceiling may be cut short. */
const CEILING = 3000;

type Entry = { type: string; mode: string; sha: string };
export type Containment = { proof: WikiContainmentProof } | { refusal: string; retry?: true };
const usablePath = (path: unknown): path is string => typeof path === 'string' && !path.includes('\0') &&
    !path.split('/').some(part => ['', '.', '..'].includes(part));

/** An incomplete tree is a refusal. Failed provider reads can be retried on the next claim. */
async function tree(store: Store, execute: Execute, commit: string): Promise<Map<string, Entry> | null> {
    const read = await readRepo(store, execute, `git/trees/${commit}?recursive=1`);
    if (!read || read.truncated !== false || !Array.isArray(read.tree)) return null;
    const entries = new Map<string, Entry>();
    for (const e of read.tree) {
        if (!usablePath(e?.path) || entries.has(e.path) || !['blob', 'tree', 'commit'].includes(e.type) ||
            typeof e.mode !== 'string' || !/^[0-7]{6}$/.test(e.mode) || typeof e.sha !== 'string' || !/^[a-f0-9]{40}$/.test(e.sha)) return null;
        entries.set(e.path, { type: e.type, mode: e.mode, sha: e.sha });
    }
    return entries;
}

export async function targetTip(store: Store, execute: Execute): Promise<string> {
    const sha = (await readRepo(store, execute, `git/ref/heads/${store.project.target}`)).object?.sha;
    if (!/^[a-f0-9]{40}$/.test(sha || '')) throw new Error(`${store.project.target} tip is unavailable`);
    return sha;
}

/**
 * Whether the target tree at `target` (default: its live tip) already holds every substantive change the PR makes at
 * `head`: each added or modified path with the same type, mode and object, each removed path absent at both commits,
 * and both ends of a rename checked on their own. Live PR reads bind the file inventory to the head and target commit.
 */
export async function proveContainment(store: Store, execute: Execute, pr: number, head: string, target?: string): Promise<Containment> {
    const bound = (p: any) => p.head?.sha === head && p.base?.ref === store.project.target && p.base?.repo?.full_name === store.project.repository;
    const before = await readRepo(store, execute, `pulls/${pr}`);
    if (!bound(before)) return { refusal: 'the PR head or base moved before its file inventory' };
    const base = before.base.sha;
    if (!/^[a-f0-9]{40}$/.test(base || '')) return { refusal: 'the PR base commit is unavailable', retry: true };
    const files = await readRepo(store, execute, `pulls/${pr}/files?per_page=100`, true), after = await readRepo(store, execute, `pulls/${pr}`);
    if (!bound(after)) return { refusal: 'the PR head or base moved during its file inventory' };
    if (after.base.sha !== base) return { refusal: 'the PR base commit changed during its file inventory', retry: true };
    const tip = target ?? await targetTip(store, execute);
    // An open PR's inventory follows its base, so it must be the target it is compared with. A closed PR's inventory is frozen.
    if (after.state === 'open' && tip !== base) return { refusal: 'the PR file inventory base differs from the selected target tip', retry: true };
    if (!files.length || files.length !== after.changed_files || files.length >= CEILING) return { refusal: `its file inventory is incomplete (${files.length} listed, ${after.changed_files} changed)` };
    if (files.some((f: any) => !usablePath(f?.filename) || !STATUSES.has(f.status) ||
        (f.status === 'renamed' ? !usablePath(f.previous_filename) || f.previous_filename === f.filename : f.previous_filename != null)) ||
        new Set(files.map((f: any) => f.filename)).size !== files.length)
        return { refusal: 'its file inventory has a duplicate, an unsupported status or an inconsistent rename' };
    const [atHead, atTip] = await Promise.all([tree(store, execute, head), tree(store, execute, tip)]);
    if (!atHead || !atTip) return { refusal: 'a commit tree is truncated or malformed' };
    const generator = [atHead, atTip].every(t => t.get(GENERATOR.path)?.type === 'blob' && t.get(GENERATOR.path)?.sha === GENERATOR.blob);
    const paths: WikiContainmentProof['paths'] = [], missing: string[] = [];
    const check = (path: string, status: string, present: boolean, previous?: string) => {
        if (generator && GENERATED.includes(path)) { paths.push({ path, status, ...(previous ? { previous } : {}), result: 'exempt' }); return; }
        const a = atHead.get(path), b = atTip.get(path);
        const ok = present ? !!a && !!b && a.type === b.type && a.mode === b.mode && a.sha === b.sha : !a && !b;
        if (ok) paths.push({ path, status, ...(previous ? { previous } : {}), result: present ? 'same' : 'absent' });
        else missing.push(`${path} (${present ? status : `${status}, still present`})`);
    };
    for (const f of files) {
        if (f.status === 'removed') check(f.filename, f.status, false);
        else check(f.filename, f.status, true, f.previous_filename);
        if (f.status === 'renamed') check(f.previous_filename, 'renamed-from', false);
    }
    if (missing.length) return { refusal: `${store.project.target} at ${tip.slice(0, 7)} does not contain ${missing.join(', ')}` };
    return { proof: { head, target: tip, generator: generator ? GENERATOR.blob : '', paths } };
}
