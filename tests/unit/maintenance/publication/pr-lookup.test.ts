import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, HEAD } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { branchPulls, matchingDraft } from '../../../../server/maintenance/publication/pr-lookup';
afterEach(cleanupFakes);

const expected = (f: Awaited<ReturnType<typeof publicationRun>>) => ({ branch: f.branch, head: HEAD, issueUrl: f.issue.html_url, title: f.content.title, body: f.content.body });
const pull = (f: Awaited<ReturnType<typeof publicationRun>>, extra: Record<string, unknown> = {}) =>
    f.addPull({ branch: f.branch, head: HEAD, title: f.content.title, body: f.content.body, closes: [f.issue.html_url], ...extra });

test('branch pulls come from every page and state, filtered to the branch; no pull request at all is no draft', async () => {
    const f = await publicationRun();
    f.state.pageSize = 1;
    f.addPull({ branch: 'codex/other', head: HEAD, title: 't', body: 'b' });
    expect(await branchPulls(f.store, f.execute as any, f.branch)).toEqual([]);
    expect(await matchingDraft(f.store, f.execute as any, expected(f))).toBeNull();
    pull(f, { state: 'closed' });
    expect((await branchPulls(f.store, f.execute as any, f.branch)).map(item => item.state)).toEqual(['closed']);
});

test('the one open draft of the reviewed head, closing the issue with the approved bytes, is verified with its author', async () => {
    const f = await publicationRun(), created = pull(f);
    expect(await matchingDraft(f.store, f.execute as any, expected(f))).toEqual({ number: created.number, url: created.html_url, head: HEAD, title: f.content.title, body: f.content.body, author: 'JFusco' });
    // An explicit base is the one checked, not the project's current target.
    await expect(matchingDraft(f.store, f.execute as any, { ...expected(f), base: 'release' })).rejects.toThrow(/not the open draft of the reviewed head on release/);
});

test.each([
    ['a second pull request on the branch', (f: any) => { pull(f); pull(f, { state: 'closed' }); }, /2 pull requests/],
    ['a fork\'s branch of the same name', (f: any) => pull(f, { fork: true }), /another repository/],
    ['another base', (f: any) => pull(f, { base: 'release' }), /not the open draft/],
    ['another head', (f: any) => pull(f, { head: 'c'.repeat(40) }), /not the open draft/],
    ['a ready pull request', (f: any) => pull(f, { draft: false }), /not the open draft/],
    ['no native closing reference', (f: any) => pull(f, { closes: [] }), /does not natively close/],
    ['other bytes', (f: any) => pull(f, { body: 'edited' }), /approved title and body/],
])('%s is not "no draft": it stops', async (_name, arrange, message) => {
    const f = await publicationRun();
    arrange(f);
    await expect(matchingDraft(f.store, f.execute as any, expected(f))).rejects.toThrow(message);
});
