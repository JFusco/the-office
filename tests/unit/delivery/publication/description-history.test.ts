import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, descriptionNode, editDescription, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { DescriptionHistoryUnavailable, optionalDescriptionHistory, readDescriptionHistory, uneditedDescription } from '../../../../server/delivery/publication/description-history';
afterEach(cleanupFakes);

/** PR 194 as GitHub returned it on 2026-11-24: open at the merged head, never edited. */
function setup() {
    const f = fakeGitHub(193);
    const pr = { number: 194, html_url: `https://github.com/${REPOSITORY}/pull/194`, state: 'open', merged_at: null, created_at: '2026-11-23T20:56:27Z',
        title: 'feat(optimizely): document SaaS field limits', body: '## Summary\n\nCloses #193\n', head: { sha: HEAD, ref: 'codex/193-document-saas-string-and-nesting-limits' }, base: { sha: BASE, ref: 'main' } };
    f.state.prs.push(pr);
    return { ...f, pr };
}
const answering = (f: ReturnType<typeof setup>, change: (node: any) => void) => (async (program: string, args: string[], options: any) => {
    if (program === 'gh' && args[1] === 'graphql' && JSON.parse(options.input).query.includes('userContentEdits')) {
        const node = descriptionNode(f.pr); change(node);
        return JSON.stringify({ data: { repository: { nameWithOwner: REPOSITORY, pullRequest: node } } });
    }
    return f.execute(program, args, options);
}) as any;

test('a complete empty history binds the pull request and reads as never edited', async () => {
    const f = setup(), h = await readDescriptionHistory(f.store, f.execute as any, 194);
    expect(h).toMatchObject({ repository: REPOSITORY, number: 194, url: f.pr.html_url, state: 'OPEN', base: 'main', branch: f.pr.head.ref, head: HEAD,
        title: f.pr.title, body: f.pr.body, createdAt: '2026-11-23T20:56:27Z', lastEditedAt: null, includesCreatedEdit: false, edits: [] });
    expect(h.revision).toMatchObject({ edits: 0, lastEditId: null, lastEditedAt: null });
    expect(uneditedDescription(h)).toBe(true);
    // The query is read-only and asks for one bounded page.
    expect(f.state.calls.filter(c => c.startsWith('gh api graphql'))).toHaveLength(1);
});

test('an edit is a complete negative answer, and the fingerprint follows the history alone', async () => {
    const f = setup(), first = await readDescriptionHistory(f.store, f.execute as any, 194);
    f.pr.head.sha = 'c'.repeat(40);
    expect((await readDescriptionHistory(f.store, f.execute as any, 194)).revision).toEqual(first.revision);
    editDescription(f.pr, 'Closes #193\nEdited by a person\n');
    const edited = await readDescriptionHistory(f.store, f.execute as any, 194);
    expect(uneditedDescription(edited)).toBe(false);
    expect(edited.edits).toHaveLength(2); expect(edited.includesCreatedEdit).toBe(true);
    expect(edited.revision.lastEditId).toBe(edited.edits.find(e => e.editedAt === edited.lastEditedAt)!.id);
    expect(edited.revision.sha256).not.toBe(first.revision.sha256);
    // Restoring the text is still a new revision.
    editDescription(f.pr, '## Summary\n\nCloses #193\n');
    const restored = await readDescriptionHistory(f.store, f.execute as any, 194);
    expect(restored.body).toBe(first.body); expect(restored.revision.sha256).not.toBe(first.revision.sha256);
});

test.each([
    ['a null connection', (n: any) => { n.userContentEdits = null; }],
    ['a partial page', (n: any) => { n.userContentEdits.pageInfo.hasNextPage = true; }],
    ['a count that disagrees with the nodes', (n: any) => { n.userContentEdits.totalCount = 1; }],
    ['an edit without an id', (n: any) => { n.userContentEdits = { totalCount: 1, nodes: [{ createdAt: '2026-11-24T00:00:00Z', editedAt: '2026-11-24T00:00:00Z', deletedAt: null }], pageInfo: { hasNextPage: false } }; }],
    ['a short head', (n: any) => { n.headRefOid = '074eedf'; }],
    ['another pull request', (n: any) => { n.number = 196; }],
    ['another repository', (n: any) => { n.url = 'https://github.com/other/repo/pull/194'; }],
])('%s is a read error, never a negative answer', async (_name, change) => {
    const f = setup();
    await expect(readDescriptionHistory(f.store, answering(f, change), 194)).rejects.toThrow(DescriptionHistoryUnavailable);
    expect(await optionalDescriptionHistory(f.store, answering(f, change), 194)).toBeUndefined();
});

test('a provider failure propagates; only the optional read swallows it', async () => {
    const f = setup(), failing = (async () => { throw new Error('gh: HTTP 502'); }) as any;
    await expect(readDescriptionHistory(f.store, failing, 194)).rejects.toThrow('HTTP 502');
    expect(await optionalDescriptionHistory(f.store, failing, 194)).toBeUndefined();
    const errors = (async () => JSON.stringify({ errors: [{ message: 'Could not resolve to a PullRequest' }] })) as any;
    await expect(readDescriptionHistory(f.store, errors, 194)).rejects.toThrow('Could not resolve');
});
