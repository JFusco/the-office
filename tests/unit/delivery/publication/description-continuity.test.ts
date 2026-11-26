import { expect, test } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
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
