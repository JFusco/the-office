import { afterEach, expect, test } from 'vitest';
import { BASE, cleanupFakes } from '../support/fake-github';
import { fakeBotPR, H1, H2 } from '../support/fake-bot-pr';
import { GENERATOR, proveContainment } from '../../../../server/delivery/closeout/wiki-containment';

afterEach(cleanupFakes);

const blob = (path: string, sha: string, mode = '100644', type = 'blob') => ({ path, type, mode, sha });
const generator = blob(GENERATOR.path, GENERATOR.blob);
const GEN_A = 'a'.repeat(40), GEN_B = 'b'.repeat(40), PAGE = 'c'.repeat(40), OTHER = 'e'.repeat(40);

function fixture(files: any[], head: any[], tip: any[]) {
    const f = fakeBotPR('wiki-sync');
    f.state.prFiles[200] = files; f.pr.changed_files = files.length;
    f.state.trees[H1] = { tree: head }; f.state.trees[BASE] = { tree: tip };
    return { ...f, prove: (target?: string) => proveContainment(f.store, f.execute, 200, H1, target) };
}

test('a modified page with the same type, mode and object at both commits is contained', async () => {
    const f = fixture([{ filename: 'wiki/a.md', status: 'modified' }], [blob('wiki/a.md', PAGE)], [blob('wiki/a.md', PAGE)]);
    expect(await f.prove()).toEqual({ proof: { head: H1, target: BASE, generator: '', paths: [{ path: 'wiki/a.md', status: 'modified', result: 'same' }] } });
});

test.each([
    ['the same object with another mode', blob('wiki/a.md', PAGE, '100755')],
    ['the same object as another type', blob('wiki/a.md', PAGE, '100644', 'commit')],
    ['another object', blob('wiki/a.md', OTHER)],
])('%s on the target is not contained', async (_kind, onTip) => {
    const f = fixture([{ filename: 'wiki/a.md', status: 'added' }], [blob('wiki/a.md', PAGE)], [onTip]);
    expect(await f.prove()).toEqual({ refusal: `main at ${BASE.slice(0, 7)} does not contain wiki/a.md (added)` });
});

test('a removal is contained only when the path is absent at both commits', async () => {
    const files = [{ filename: 'wiki/gone.md', status: 'removed' }];
    expect(await fixture(files, [], []).prove()).toMatchObject({ proof: { paths: [{ path: 'wiki/gone.md', result: 'absent' }] } });
    cleanupFakes();
    expect(await fixture(files, [], [blob('wiki/gone.md', PAGE)]).prove()).toMatchObject({ refusal: expect.stringContaining('wiki/gone.md (removed, still present)') });
});

test.each([
    ['into a generated path', { filename: 'wiki/connections.md', previous_filename: 'wiki/old.md', status: 'renamed' }, [blob('wiki/connections.md', GEN_A), generator], [blob('wiki/connections.md', GEN_B), generator], 'wiki/old.md'],
    ['out of a generated path', { filename: 'wiki/new.md', previous_filename: 'wiki/connections.md', status: 'renamed' }, [blob('wiki/new.md', PAGE), generator], [blob('wiki/new.md', PAGE), blob('wiki/connections.md', GEN_B), generator], 'wiki/new.md'],
])('a rename %s checks its other endpoint on its own', async (_kind, file, head, tip, checked) => {
    const ok = await fixture([file], head, tip).prove();
    expect(ok).toMatchObject({ proof: { generator: GENERATOR.blob } });
    expect((ok as any).proof.paths).toEqual(expect.arrayContaining([expect.objectContaining({ result: 'exempt' }), expect.objectContaining({ path: checked, result: checked === 'wiki/old.md' ? 'absent' : 'same' })]));
    cleanupFakes();
    // The checked endpoint fails on its own when the target disagrees.
    const broken = checked === 'wiki/old.md' ? [...tip, blob('wiki/old.md', PAGE)] : tip.map(e => e.path === 'wiki/new.md' ? blob('wiki/new.md', OTHER) : e);
    expect(await fixture([file], head, broken).prove()).toMatchObject({ refusal: expect.stringContaining(checked) });
});

test('an inventory of generated files only is contained under the inspected generator, and compared under another', async () => {
    const files = [{ filename: 'wiki/connections.md', status: 'modified' }, { filename: 'scripts/wiki/graph/data/graph.json', status: 'modified' }];
    const head = [blob('wiki/connections.md', GEN_A), blob('scripts/wiki/graph/data/graph.json', GEN_A), generator];
    const tip = [blob('wiki/connections.md', GEN_B), blob('scripts/wiki/graph/data/graph.json', GEN_B), generator];
    expect(await fixture(files, head, tip).prove()).toMatchObject({ proof: { generator: GENERATOR.blob, paths: [{ result: 'exempt' }, { result: 'exempt' }] } });
    cleanupFakes();
    const otherGenerator = tip.map(e => e.path === GENERATOR.path ? blob(GENERATOR.path, OTHER) : e);
    expect(await fixture(files, head, otherGenerator).prove()).toMatchObject({ refusal: expect.stringContaining('wiki/connections.md (modified), scripts/wiki/graph/data/graph.json (modified)') });
});

test('an unreadable tree propagates the provider failure', async () => {
    const f = fixture([{ filename: 'wiki/a.md', status: 'modified' }], [blob('wiki/a.md', PAGE)], [blob('wiki/a.md', PAGE)]);
    delete f.state.trees[H1];
    await expect(f.prove()).rejects.toThrow('HTTP 404: Not Found');
});

test.each<[string, (f: ReturnType<typeof fixture>) => void, string]>([
    ['a truncated tree', f => { f.state.trees[BASE].truncated = true; }, 'a commit tree is truncated or malformed'],
    ['missing object IDs', f => { for (const head of [H1, BASE]) Reflect.deleteProperty(f.state.trees[head].tree[0], 'sha'); }, 'a commit tree is truncated or malformed'],
    ['missing modes', f => { for (const head of [H1, BASE]) Reflect.deleteProperty(f.state.trees[head].tree[0], 'mode'); }, 'a commit tree is truncated or malformed'],
    ['conflicting tree entries', f => { f.state.trees[H1].tree.unshift(blob('wiki/a.md', OTHER)); }, 'a commit tree is truncated or malformed'],
    ['an unusable tree path', f => { f.state.trees[H1].tree.push(blob('wiki//a.md', PAGE)); }, 'a commit tree is truncated or malformed'],
    ['a short inventory', f => { f.pr.changed_files = 2; }, 'its file inventory is incomplete (1 listed, 2 changed)'],
    ['an empty inventory', f => { f.state.prFiles[200] = []; f.pr.changed_files = 0; }, 'its file inventory is incomplete (0 listed, 0 changed)'],
    ['an inventory at the ceiling', f => { f.state.prFiles[200] = Array.from({ length: 3000 }, (_, i) => ({ filename: `wiki/${i}.md`, status: 'added' })); f.pr.changed_files = 3000; }, 'its file inventory is incomplete (3000 listed, 3000 changed)'],
    ['an unknown file status', f => { f.state.prFiles[200] = [{ filename: 'wiki/a.md', status: 'copied' }]; }, 'an unsupported status'],
    ['a rename without its old path', f => { f.state.prFiles[200] = [{ filename: 'wiki/a.md', status: 'renamed' }]; }, 'an inconsistent rename'],
    ['a duplicate path', f => { f.state.prFiles[200] = [{ filename: 'wiki/a.md', status: 'modified' }, { filename: 'wiki/a.md', status: 'modified' }]; f.pr.changed_files = 2; }, 'a duplicate'],
    ['a head that moves during the inventory', f => { f.state.fail = (_p, args) => { if (args.some(a => a.includes('/pulls/200/files'))) f.pr.head.sha = H2; return false; }; }, 'moved during its file inventory'],
])('%s is never a proof', async (_kind, change, reason) => {
    const f = fixture([{ filename: 'wiki/a.md', status: 'modified' }], [blob('wiki/a.md', PAGE)], [blob('wiki/a.md', PAGE)]);
    change(f);
    expect(await f.prove()).toEqual({ refusal: expect.stringContaining(reason) });
});
