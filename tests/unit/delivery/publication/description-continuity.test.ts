import { expect, test } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { descriptionRevision, readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
import { historyBeforeWrite } from '../../../../server/delivery/publication/description-continuity';
import { editDescription } from '../support/fake-github';

test.each(['revision', 'state', 'branch', 'base'] as const)('the pre-write history rejects changed %s', async change => {
    const f = metadataFixture(), b = f.record.binding;
    const before = await readDescriptionHistory(f.store, f.delivery.execute, b.pr);
    b.staleDescription = { route: 'stale-own-description', head: 'c'.repeat(40), source: { kind: 'effect', effectId: 'create', operation: 'github-pr-create' },
        contentSha256: b.beforeSha256, revision: before.revision };
    await expect(historyBeforeWrite(f.store, f.delivery.execute, b)).resolves.toBeUndefined();
    if (change === 'revision') {
        editDescription(f.pr, 'Edited'); editDescription(f.pr, before.body);
    } else if (change === 'state') f.pr.state = 'closed';
    else if (change === 'branch') f.pr.head.ref = 'another-branch';
    else f.pr.base.ref = 'another-target';
    await expect(historyBeforeWrite(f.store, f.delivery.execute, b)).rejects.toThrow('changed after its stale-description proof');
});

test('ordinary publication does not read description history', async () => {
    const f = metadataFixture();
    const execute = async () => { throw new Error('unexpected history read'); };
    await expect(historyBeforeWrite(f.store, execute, f.record.binding)).resolves.toBeUndefined();
});

/**
 * #531 reads each edit's editor without changing the revision digest. The hash below was recorded with the digest
 * code before the editor read existed (9f7500b), for this exact history.
 */
const PRE_CHANGE_SHA = 'd90165b3d5bd5e01989ca1be0751b00254bdd2f50d97bc98e9dad61dabbeec0c';
const recordedEdits = [
    { id: 'UCE_b', createdAt: '2026-11-20T10:05:00Z', editedAt: '2026-11-20T10:05:00Z', deletedAt: null, editor: { login: 'the-office-app[bot]', id: 'BOT_kgDO' } },
    { id: 'UCE_a', createdAt: '2026-11-20T10:00:00Z', editedAt: '2026-11-20T10:00:00Z', deletedAt: null, editor: null },
];

test('the revision digest of a history read with editors equals the recorded pre-change hash', () => {
    expect(descriptionRevision({ lastEditedAt: '2026-11-20T10:05:00Z', includesCreatedEdit: true, edits: recordedEdits })).toEqual({
        sha256: PRE_CHANGE_SHA, edits: 2, lastEditId: 'UCE_b', lastEditedAt: '2026-11-20T10:05:00Z' });
});

test('a stale-description proof saved before the editor read still matches through historyBeforeWrite', async () => {
    const f = metadataFixture(), b = f.record.binding;
    Object.assign(f.pr, { edits: structuredClone(recordedEdits), last_edited_at: '2026-11-20T10:05:00Z', includes_created_edit: true });
    const history = await readDescriptionHistory(f.store, f.delivery.execute, b.pr);
    expect(history.edits.map(edit => edit.editor)).toEqual([{ login: 'the-office-app[bot]', id: 'BOT_kgDO' }, null]);
    expect(history.revision.sha256).toBe(PRE_CHANGE_SHA);
    b.staleDescription = { route: 'stale-own-description', head: 'c'.repeat(40), source: { kind: 'effect', effectId: 'create', operation: 'github-pr-create' },
        contentSha256: b.beforeSha256, revision: { sha256: PRE_CHANGE_SHA, edits: 2, lastEditId: 'UCE_b', lastEditedAt: '2026-11-20T10:05:00Z' } };
    await expect(historyBeforeWrite(f.store, f.delivery.execute, b)).resolves.toBeUndefined();
    // The proof keeps its historical shape: no editor evidence enters StaleDescriptionProof.revision.
    expect(Object.keys(b.staleDescription.revision).sort()).toEqual(['edits', 'lastEditId', 'lastEditedAt', 'sha256']);
});

test('a malformed editor is a read error, never a different digest', async () => {
    const f = metadataFixture();
    Object.assign(f.pr, { edits: [{ ...recordedEdits[0], editor: { login: 7 } }], last_edited_at: '2026-11-20T10:05:00Z', includes_created_edit: true });
    await expect(readDescriptionHistory(f.store, f.delivery.execute, f.record.binding.pr)).rejects.toThrow('malformed edit');
});
