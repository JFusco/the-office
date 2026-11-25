import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { recordMetadataPark } from '../../../../server/delivery/parking/record-metadata-park';
import type { MetadataParkBinding } from '../../../../src/contracts/metadata-park';

const binding = { step: 0, resultSha256: 'r', inputSha256: 'i', pr: { number: 200, url: '', head: '', branch: '', contentSha256: 'c' },
    route: { project: 'project', field: 'status', pickup: { name: 'Ready', option: 'ready' }, block: { id: 'block', name: 'Block' }, review: { id: 'review', name: 'In review' }, issue: 'issue-card', prs: [], assignee: 'JFusco' },
    boardStart: 0, observed: [] } satisfies MetadataParkBinding;

test('a park is recorded once before any write; entering it again keeps the original time, words and binding', async () => {
    const f = metadataParkFixture();
    const first = await f.run(async () => recordMetadataPark(f.delivery, f.job, { reason: ' PR #200 needs an edit. ', instruction: 'Edit it.', metadata: binding }));
    expect(first).toEqual({ stage: 'lead-pr', reason: 'PR #200 needs an edit.', at: expect.any(String), published: false, instruction: 'Edit it.', marker: `Office decision ${f.job.id}:1`, metadata: binding });
    expect(f.job.detail).toBe('Decision needed: PR #200 needs an edit.');
    const saved = structuredClone(first);
    const again = await f.run(async () => recordMetadataPark(f.delivery, f.job, { reason: 'Other words', instruction: 'Other', metadata: { ...binding, boardStart: 9 } }));
    expect(again).toBe(first); expect(again).toEqual(saved);
    expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
});

test('another park already on the job refuses and writes nothing', async () => {
    for (const parked of [{ stage: 'lead-pr', reason: 'model', at: '', published: false }, { stage: 'lead-pr', reason: 'r', at: '', published: true, instruction: 'i', marker: 'Office decision x:1', metadata: binding }]) {
        const f = metadataParkFixture();
        f.job.parked = structuredClone(parked);
        await expect(f.run(async () => recordMetadataPark(f.delivery, f.job, { reason: 'r', instruction: 'i', metadata: binding }))).rejects.toThrow('Another park is already recorded');
        expect(f.job.parked).toEqual(parked);
    }
});
