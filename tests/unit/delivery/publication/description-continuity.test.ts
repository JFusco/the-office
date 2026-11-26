import { afterEach, expect, test } from 'vitest';
import { cleanupFakes, fakeGitHub, editDescription, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
import { certifiedEdit, certifyDescriptionWrite, historyBeforeWrite } from '../../../../server/delivery/publication/description-continuity';
afterEach(cleanupFakes);

const NEW = '## Summary\n\nRefreshed for the current head.\n\nCloses #5\n';
function setup() {
    const f = fakeGitHub();
    const pr = { number: 200, html_url: `https://github.com/${REPOSITORY}/pull/200`, state: 'open', merged_at: null, title: 'fix: release scans', body: 'Closes #5',
        head: { sha: HEAD, ref: 'codex/5-restore-release-scans' }, base: { sha: BASE, ref: 'main' } };
    f.state.prs.push(pr);
    const read = () => readDescriptionHistory(f.store, f.execute as any, 200);
    /** The PATCH as GitHub acknowledges it: the pull request after the write. */
    const patch = (body = NEW) => { editDescription(pr, body); return JSON.stringify({ number: 200, html_url: pr.html_url, head: { sha: HEAD }, title: pr.title, body: pr.body }); };
    return { ...f, pr, read, patch, written: { head: HEAD, title: pr.title, body: NEW } };
}

test('the first write of a description adds GitHub\'s creation entry and one edit; later writes add one', async () => {
    const f = setup(), before = await f.read(), response = f.patch(), after = await f.read();
    const revision = certifiedEdit(before, after, f.written, response);
    expect(revision).toEqual(after.revision); expect(revision).toMatchObject({ edits: 2 });
    const next = { ...f.written, body: `${NEW}\nSecond refresh.\n` }, again = f.patch(next.body), later = await f.read();
    expect(certifiedEdit(after, later, next, again)).toEqual(later.revision);
});

test('a human edit inside the write window, or a deleted earlier edit, refuses the revision as authorship evidence', async () => {
    const human = setup(), before = await human.read();
    editDescription(human.pr, 'Closes #5\nHuman\n');
    const response = human.patch(), after = await human.read();
    expect(certifiedEdit(before, after, human.written, response)).toBeNull();
    const deleted = setup(); deleted.patch();
    const prior = await deleted.read(), next = { ...deleted.written, body: `${NEW}\nAgain\n` }, again = deleted.patch(next.body);
    (deleted.pr as any).edits.at(-1).deletedAt = '2026-11-24T00:10:00Z';
    expect(certifiedEdit(prior, await deleted.read(), next, again)).toBeNull();
});

test('the acknowledged response and the read-back must carry the intended head and bytes', async () => {
    const f = setup(), before = await f.read(), response = f.patch(), after = await f.read();
    expect(certifiedEdit(before, after, { ...f.written, head: 'c'.repeat(40) }, response)).toBeNull();
    expect(certifiedEdit(before, after, { ...f.written, body: 'Other bytes' }, response)).toBeNull();
    expect(certifiedEdit(before, after, f.written, 'not json')).toBeNull();
    expect(certifiedEdit(before, after, f.written, JSON.stringify({ number: 201 }))).toBeNull();
    // A write that left the body as it was made no edit of its own.
    expect(certifiedEdit(after, after, f.written, response)).toBeNull();
});

test('collecting provenance never fails the write; the stale route requires its bound revision before dispatch', async () => {
    const f = setup(), before = await f.read(), response = f.patch();
    expect(await certifyDescriptionWrite(f.store, (async () => { throw new Error('gh: HTTP 502'); }) as any, before, f.written, response)).toBeUndefined();
    expect(await certifyDescriptionWrite(f.store, f.execute as any, undefined, f.written, response)).toBeUndefined();
    expect(await certifyDescriptionWrite(f.store, f.execute as any, before, f.written, response)).toMatchObject({ edits: 2 });
    const now = await f.read();
    const binding: any = { pr: 200, url: f.pr.html_url, head: HEAD, branch: f.pr.head.ref, before: { title: f.pr.title, body: f.pr.body },
        staleDescription: { revision: now.revision } };
    expect(await historyBeforeWrite(f.store, f.execute as any, binding)).toMatchObject({ revision: now.revision });
    // Edited and restored: same text, new revision, no write.
    const text = f.pr.body; editDescription(f.pr, 'Closes #5\nJoe\n'); editDescription(f.pr, text);
    await expect(historyBeforeWrite(f.store, f.execute as any, binding)).rejects.toThrow('changed after its stale-description proof');
    expect(await historyBeforeWrite(f.store, (async () => { throw new Error('gh: HTTP 502'); }) as any, { ...binding, staleDescription: undefined })).toBeUndefined();
});
