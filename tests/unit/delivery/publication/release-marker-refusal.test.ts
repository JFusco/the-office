import { afterEach, expect, test } from 'vitest';
import { originalGit } from '../../../../server/delivery/publication/original-git';
import { markerRange, type ObservedTips } from '../../../../server/delivery/publication/release-marker-refusal';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { command } from '../../../../server/workers/process';
import { cleanupMarkerRepos, markerRepo } from '../support/marker-repo';

afterEach(cleanupMarkerRepos);

/** A target with one ordinary commit, and a candidate branch off it. */
function history() {
    const r = markerRepo();
    const base = r.commit({ 'README.md': 'a\n' }, 'chore(repo): base');
    r.git(['checkout', '-q', '-b', 'candidate']);
    return { ...r, base };
}
const git = (cwd: string, calls: string[][] = []) => { const run = originalGit(command, cwd); return Object.assign((args: string[], options?: any) => { calls.push(args); return run(args, options); }, { calls }); };
const refusal = async (promise: Promise<unknown>) => { try { await promise; } catch (error) { if (error instanceof ReleaseMarkerRefusal) return error.evidence; throw error; } throw new Error('expected a refusal'); };
const noLive = async (): Promise<ObservedTips> => { throw new Error('the live refs must not be read'); };

test('an unmarked superset ends locally: nothing live is read and no remote boundary is needed', async () => {
    const r = history(), head = r.commit({ 'README.md': 'b\n' }, 'docs(readme): b');
    const calls: string[][] = [];
    expect(await markerRange(git(r.repo, calls), r.repo, { head, candidateBase: r.base, observed: { target: r.base, published: '' }, live: noLive })).toEqual({ kind: 'unmarked' });
    // A missing candidateBase only widens the local walk.
    expect(await markerRange(git(r.repo), r.repo, { head, observed: { target: r.base, published: '' }, live: noLive })).toEqual({ kind: 'unmarked' });
    expect(calls.every(args => !['ls-remote', 'fetch'].includes(args[0]))).toBe(true);
});

test('every parent is walked and the original objects are read: replacement refs and grafts never hide a marker', async () => {
    const r = history();
    const marked = r.commit({ 'README.md': 'b\n' }, 'docs(readme): b [skip release]');
    const clean = r.commit({ 'README.md': 'c\n' }, 'docs(readme): c');
    // A replacement that would hide the marked commit from an ordinary walk.
    r.git(['replace', marked, r.base]);
    const range = await markerRange(git(r.repo), r.repo, { head: clean, candidateBase: r.base, observed: { target: r.base, published: '' }, live: async () => ({ target: r.base, published: '' }) });
    expect(range).toMatchObject({ kind: 'marked', marked: [{ sha: marked }] });
});

test('a recorded base is subtracted only once it is proven reachable from the observed target', async () => {
    const r = history();
    // The target was rewound below the recorded base: commits between them would be introduced.
    r.git(['checkout', '-q', 'main']);
    const rewound = r.base;
    const later = r.commit({ 'README.md': 'later\n' }, 'docs(readme): later [skip release]');
    r.git(['checkout', '-q', '-b', 'work']);
    const head = r.commit({ 'wiki/a.md': 'a\n' }, 'docs(wiki): a');
    // Stale tracking refs claim the marked commit is on the remote; only the observed OID is believed.
    r.git(['update-ref', 'refs/remotes/origin/main', later]);
    const range = await markerRange(git(r.repo), r.repo, { head, candidateBase: later, observed: { target: rewound, published: '' }, live: async () => ({ target: rewound, published: '' }) });
    expect(range).toMatchObject({ kind: 'marked', marked: [{ sha: later }] });
});

test('a missing target object, an absent target or moved live refs stop as incomplete coverage before anything is packed', async () => {
    const r = history(), head = r.commit({ 'README.md': 'b\n' }, 'docs(readme): b [skip release]');
    const missing = 'f'.repeat(40);
    expect(await refusal(markerRange(git(r.repo), r.repo, { head, candidateBase: r.base, observed: { target: missing, published: '' }, live: noLive })))
        .toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining(`remote boundary ${missing} is not in this repository`) });
    expect(await refusal(markerRange(git(r.repo), r.repo, { head, candidateBase: r.base, observed: { target: '', published: '' }, live: noLive })))
        .toMatchObject({ diagnostic: expect.stringContaining('target branch was not observed') });
    const moved = await refusal(markerRange(git(r.repo), r.repo, { head, candidateBase: r.base, observed: { target: r.base, published: '' }, live: async () => ({ target: head, published: '' }) }));
    expect(moved).toMatchObject({ diagnostic: expect.stringContaining('remote refs moved') });
});

test('a stale target stops an unmarked candidate whose older history carries a marker; the same candidate passes once the target is local', async () => {
    const r = markerRepo();
    r.commit({ 'README.md': 'a\n' }, 'chore(repo): base');
    // A wiki-sync commit already on the target, below the candidate's recorded base.
    const base = r.commit({ 'wiki/index.md': 'sync\n' }, 'docs(wiki): reconcile merged PR [skip release]');
    r.git(['checkout', '-q', '-b', 'candidate']);
    const head = r.commit({ 'README.md': 'b\n' }, 'docs(readme): b');
    const calls: string[][] = [];
    // The remote target moved forward to an object this repository has not fetched: the base cannot be proven
    // reachable from it, so the walk widens to the whole history, meets the old marker and fails closed.
    const ahead = 'e'.repeat(40);
    expect(await refusal(markerRange(git(r.repo, calls), r.repo, { head, candidateBase: base, observed: { target: ahead, published: '' }, live: async () => ({ target: ahead, published: '' }) })))
        .toMatchObject({ reason: 'indeterminate', diagnostic: expect.stringContaining(`remote boundary ${ahead} is not in this repository`) });
    // With the observed target present locally the base is proven, the superset is the candidate's own commit and
    // the check ends locally.
    expect(await markerRange(git(r.repo, calls), r.repo, { head, candidateBase: base, observed: { target: base, published: '' }, live: noLive })).toEqual({ kind: 'unmarked' });
    // Neither case fetched anything.
    expect(calls.every(args => args[0] !== 'fetch')).toBe(true);
});

test('a published tip is excluded, and a caller with no observation binds the live refs only after a local marker', async () => {
    const r = history();
    const published = r.commit({ 'README.md': 'b\n' }, 'docs(readme): b [skip release]');
    const head = r.commit({ 'README.md': 'c\n' }, 'docs(readme): c');
    // The marked commit is already on the published candidate branch, so this descendant introduces none.
    expect(await markerRange(git(r.repo), r.repo, { head, candidateBase: r.base, observed: { target: r.base, published }, live: noLive })).toEqual({ kind: 'unmarked' });
    let live = 0;
    const range = await markerRange(git(r.repo), r.repo, { head, live: async () => { live++; return { target: r.base, published: '' }; } });
    expect(live).toBe(1);
    expect(range).toMatchObject({ kind: 'marked', marked: [{ sha: published }], live: { target: r.base, published: '' } });
});
