import { expect, test } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { publishMetadata } from '../../../../server/delivery/publication/publish-metadata';
import { readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
import { editDescription } from '../support/fake-github';

test('one metadata PATCH is read back and invalidates old review without accepting a merge', async () => {
    const f = metadataFixture();
    f.job.reviewContext = { head: f.job.head, issueUpdatedAt: '', prUpdatedAt: '', baseSha: '', target: 'main', step: 0 };
    await f.run(() => publishMetadata(f.delivery, f.job));
    expect(f.writes.patches).toBe(1);
    expect(f.pr.body).toBe(f.selected.body);
    expect(f.record.phase).toBe('review');
    expect(f.job.reviewContext).toBeUndefined();
    expect(f.store.getEffect(`harness:${f.job.id}:pr-metadata:${f.record.id}`)?.status).toBe('verified');
    await f.run(() => publishMetadata(f.delivery, f.job));
    expect(f.writes.patches).toBe(1);
    expect(f.job.stage).toBe('prepare-pr');
});

test.each([true, false])('a lost metadata response reconciles landed=%s without another PATCH', async land => {
    const f = metadataFixture(); f.writes.loseResponse = true; f.writes.land = land;
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('499');
    const id = `harness:${f.job.id}:pr-metadata:${f.record.id}`;
    expect(f.store.getEffect(id)?.status).toBe('uncertain');
    if (land) await f.run(() => publishMetadata(f.delivery, f.job));
    else await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('will not be resent');
    expect(f.writes.patches).toBe(1);
    expect(f.store.getEffect(id)?.status).toBe(land ? 'verified' : 'uncertain');
});

test('a current human metadata edit or a missing scheduler claim prevents publication', async () => {
    const f = metadataFixture();
    await expect(publishMetadata(f.delivery, f.job)).rejects.toThrow('scheduler claim');
    f.pr.body = 'Human edit; Closes #5';
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('changed before publication');
    expect(f.writes.patches).toBe(0);
});

test('new issue comments after the assessment retain the human scope gate before any metadata write', async () => {
    const f = metadataFixture();
    f.state.comments.push({ id: 500, user: { login: 'JFusco' }, body: 'Hold this delivery pending scope clarification' });
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('scope, labels or comments changed');
    expect(f.writes.patches).toBe(0); expect(f.record.phase).toBe('publish');
});

test('unapproved or incomplete native closing links keep the original single write unverified', async () => {
    const f = metadataFixture(); f.links.more = true;
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow();
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('will not be resent');
    expect(f.writes.patches).toBe(1);
    expect(f.record.phase).toBe('publish');
});

const effectOf = (f: ReturnType<typeof metadataFixture>) => f.store.getEffect(`harness:${f.job.id}:pr-metadata:${f.record.id}`) as any;

test('the original PATCH verifies the exact selected content without certifying authorship', async () => {
    const f = metadataFixture();
    await f.run(() => publishMetadata(f.delivery, f.job));
    const after = await readDescriptionHistory(f.store, f.delivery.execute, 200), receipt = effectOf(f).receipt;
    expect(receipt).toEqual({ head: f.job.head, title: f.selected.title, body: f.selected.body, issueUrl: f.issueUrl });
    // The first edit of a description: GitHub's original-text entry and this write.
    expect(after.revision.edits).toBe(2); expect(f.writes.inputs).toEqual([f.selected]);
});

test('a lost response reconciled by read-back records no revision and sends nothing again', async () => {
    const f = metadataFixture(); f.writes.loseResponse = true;
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('499');
    await f.run(() => publishMetadata(f.delivery, f.job));
    expect(effectOf(f)).toMatchObject({ status: 'verified', receipt: { head: f.job.head, title: f.selected.title, body: f.selected.body, issueUrl: f.issueUrl } });
    expect(effectOf(f).receipt.revision).toBeUndefined(); expect(f.writes.patches).toBe(1);
});

test('a person supplying the selected body before a no-op PATCH receives no Office authorship', async () => {
    const f = metadataFixture(), execute = f.delivery.execute;
    expect(f.pr.title).toBe(f.selected.title);
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args.includes('PATCH')) editDescription(f.pr, f.selected.body);
        return execute(program, args, options);
    }) as typeof execute;
    await f.run(() => publishMetadata(f.delivery, f.job));
    expect(effectOf(f)).toMatchObject({ status: 'verified', receipt: { head: f.job.head, ...f.selected, issueUrl: f.issueUrl } });
    expect(effectOf(f).receipt.revision).toBeUndefined();
    expect((await readDescriptionHistory(f.store, f.delivery.execute, 200)).revision.edits).toBe(2);
    expect(f.writes.patches).toBe(1);
});
