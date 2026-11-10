import { expect, test } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { publishMetadata } from '../../../../server/delivery/publication/publish-metadata';

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
