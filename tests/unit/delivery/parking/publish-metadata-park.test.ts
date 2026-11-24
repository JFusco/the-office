import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { publishMetadataPark } from '../../../../server/delivery/parking/publish-metadata-park';

test('publication saves published, the blocked status and the decision detail together, with one parked event, and leaves the cards where they are', () => {
    const f = metadataParkFixture();
    const parked = f.job.parked = { stage: 'lead-pr', reason: 'PR #200 needs an edit.', at: '', published: false, instruction: 'Edit it.', marker: `Office decision ${f.job.id}:1`,
        unconfirmed: [{ write: 'the decision comment on issue #5', error: 'Error: 502' }], stopped: 'Restore it.', readBackQueued: '[]' };
    f.job.detail = 'Error: something earlier';
    publishMetadataPark(f.store, f.job, parked);
    expect(f.job).toMatchObject({ status: 'blocked', detail: 'Decision needed: PR #200 needs an edit.', parked: { published: true } });
    expect(f.job.parked).not.toHaveProperty('unconfirmed'); expect(f.job.parked).not.toHaveProperty('stopped'); expect(f.job.parked).not.toHaveProperty('readBackQueued');
    expect(f.store.state.events.filter(event => event.kind === 'delivery-parked')).toHaveLength(1);
    expect(f.writes.moves).toEqual([]); expect(f.writes.posts).toEqual([]);
    expect(() => publishMetadataPark(f.store, f.job, parked)).toThrow('changed before it was published');
});
