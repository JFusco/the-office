import { expect, test } from 'vitest';
import { supersedingDelivery } from '../../../../server/conversations/slack/supersession-proof';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { supersessionFixture } from './fixture';

test('a newer verified message alone cannot hide the original warning; explicit proof can', () => {
    const f = supersessionFixture(); try {
        expect(supersedingDelivery(f.store.state, f.delivery)).toBeUndefined();
        supersedeSlackDelivery(f.store, f.input); expect(supersedingDelivery(f.store.state, f.delivery)?.id).toBe('replacement');
        expect(f.delivery.status).toBe('uncertain');
    } finally { f.close(); }
});
test.each(['recipient', 'workspace', 'type', 'status', 'text', 'receipt', 'context', 'project', 'source', 'missing', 'missing-reason', 'invalid-time'])('live proof rejects changed %s evidence', change => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input);
        if (change === 'recipient') f.replacement.targetId = 'UOTHER';
        if (change === 'workspace') f.replacement.workspaceId = 'TOTHER';
        if (change === 'type') f.replacement.targetType = 'channel';
        if (change === 'status') f.replacement.status = 'uncertain';
        if (change === 'text') f.replacement.text = 'Edited after verification';
        if (change === 'receipt') f.replacement.permalink = 'https://fixture.slack.com/archives/D123/p0';
        if (change === 'context') f.human.ticket = 'GH-999';
        if (change === 'project') f.store.state.project!.id = 'other';
        if (change === 'source') f.delivery.text = 'Changed source';
        if (change === 'missing') f.store.state.slackDeliveries = [f.delivery];
        if (change === 'missing-reason') delete (f.delivery.supersededBy as any).reason;
        if (change === 'invalid-time') f.delivery.supersededBy!.at = 'not-a-date';
        expect(supersedingDelivery(f.store.state, f.delivery)).toBeUndefined();
    } finally { f.close(); }
});
