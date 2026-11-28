import { afterEach, expect, test } from 'vitest';
import { cleanupFakes } from './support/fake-maintenance-github';
import { publicationRun } from './support/publication-run';
import { linkBody, linkMaintenanceIssue, linkMarker, readLinkComment } from '../../../../server/maintenance/publication/link-issue';
afterEach(cleanupFakes);

async function linked(native = true) {
    const f = await publicationRun(), input = { issue: f.issue.number, issueUrl: f.issue.html_url, pr: 300, prUrl: `https://github.com/${f.repository}/pull/300` };
    const link = () => f.claimed(f.run, 'maintenance', () => linkMaintenanceIssue(f.store, f.execute as any, f.owner(), input, async () => native));
    return { ...f, input, link, marker: linkMarker(f.repository, input.issue, input.pr) };
}

test('one exact link comment is posted and verified; a replay posts nothing', async () => {
    const f = await linked();
    const receipt = await f.link();
    expect(f.state.writes).toEqual(['comment']);
    expect(f.state.comments[f.issue.number][0].body).toBe(linkBody(f.input, f.marker));
    expect(receipt).toMatchObject({ id: f.state.comments[f.issue.number][0].id });
    await f.link();
    expect(f.state.writes).toHaveLength(1);
});

test('no native closing link, a quoting or edited comment, a duplicate or a vanished verified comment stop another post', async () => {
    const native = await linked(false);
    await expect(native.link()).rejects.toThrow(/native issue-to-PR link/);
    const quoted = await linked(); quoted.state.comments[quoted.issue.number] = [{ id: 1, html_url: `${quoted.issue.html_url}#issuecomment-1`, body: `quoting ${quoted.marker}`, user: { login: 'JFusco' } }];
    await expect(quoted.link()).rejects.toThrow(/edited, quoted/);
    const duplicate = await linked(), body = linkBody(duplicate.input, duplicate.marker);
    duplicate.state.comments[duplicate.issue.number] = [1, 2].map(id => ({ id, html_url: `${duplicate.issue.html_url}#issuecomment-${id}`, body, user: { login: 'JFusco' } }));
    await expect(duplicate.link()).rejects.toThrow(/Duplicate/);
    const vanished = await linked(); await vanished.link(); vanished.state.comments[vanished.issue.number] = [];
    await expect(vanished.link()).rejects.toThrow(/no longer observable/);
    for (const f of [native, quoted, duplicate]) expect(f.state.writes).toEqual([]);
    expect(vanished.state.writes).toEqual(['comment']);
});

test('a duplicate link comment on a later comment page stops another post', async () => {
    const f = await linked(), body = linkBody(f.input, f.marker);
    f.state.pageSize = 1;
    f.state.comments[f.issue.number] = [
        { id: 1, html_url: `${f.issue.html_url}#issuecomment-1`, body: 'An unrelated CMS follow-up comment', user: { login: 'JFusco' } },
        { id: 2, html_url: `${f.issue.html_url}#issuecomment-2`, body, user: { login: 'JFusco' } },
        { id: 3, html_url: `${f.issue.html_url}#issuecomment-3`, body, user: { login: 'JFusco' } },
    ];
    await expect(f.link()).rejects.toThrow(/Duplicate/);
    expect(f.state.calls.filter(call => call.includes('/comments?per_page=100'))).toHaveLength(1);
    expect(f.state.writes).toEqual([]);
    // One exact comment on the last page is found and needs no post.
    f.state.comments[f.issue.number] = f.state.comments[f.issue.number].slice(0, 2);
    expect(await f.link()).toMatchObject({ effectId: '', id: 2 });
    expect(f.state.writes).toEqual([]);
});

test('the read-only lookup finds the one exact link comment, nothing when it is gone, and throws on an edited one; it never posts', async () => {
    const f = await linked();
    const read = () => readLinkComment(f.store, f.execute as any, f.owner(), f.input);
    expect(await read()).toBeNull();
    const receipt = await f.link();
    expect(await read()).toEqual({ id: receipt.id, url: receipt.url });
    f.state.comments[f.issue.number][0].body += '\nEdited.';
    await expect(read()).rejects.toThrow(/edited, quoted/);
    f.state.comments[f.issue.number] = [];
    expect(await read()).toBeNull();
    expect(f.state.writes).toEqual(['comment']);
});
