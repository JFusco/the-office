import { expect, test } from 'vitest';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { supersedingDelivery } from '../../../../server/conversations/slack/supersession-proof';
import { syncInvestigations } from '../../../../server/it/investigations/ledger';
import { diagnosticSnapshot } from '../../../../server/it/diagnostic-snapshot';
import { projectOutbox } from '../../../../server/conversations/outbox';
import { commandRoute } from '../../../../server/office/http/commands';
import { supersessionFixture } from './fixture';

test('operator closeout removes both Slack alerts and IT attention, retaining uncertainty, history and budget', () => {
    const f = supersessionFixture(); try {
        syncInvestigations(f.store); const entry = f.store.state.it!.investigations![0]; entry.status = 'blocked'; entry.attempts = 1;
        f.store.state.outbox = projectOutbox(f.store.state); expect(f.store.state.outbox.filter(item => item.status === 'open')).toHaveLength(2);
        const original = structuredClone(f.delivery); const first = supersedeSlackDelivery(f.store, f.input);
        expect(supersedeSlackDelivery(f.store, f.input)).toEqual(first);
        expect(f.delivery.status).toBe(original.status); expect(f.delivery.error).toBe(original.error); expect(f.delivery.text).toBe(original.text);
        expect(entry).toMatchObject({ status: 'resolved', attempts: 1, resolution: { kind: 'superseded', sourceId: 'replacement', receipt: f.replacement.permalink } });
        expect(projectOutbox(f.store.state).every(item => item.status === 'resolved')).toBe(true); expect(projectOutbox(f.store.state)).toHaveLength(2);
        expect(diagnosticSnapshot(f.store)).toMatchObject({ status: 'monitoring', followUps: [] });
        f.replacement.status = 'uncertain'; syncInvestigations(f.store);
        expect(entry.status).toBe('blocked'); expect(projectOutbox(f.store.state).some(item => item.id === 'message:notice' && item.status === 'open')).toBe(true);
    } finally { f.close(); }
});
test.each(['unconfirmed', 'recipient', 'workspace', 'old', 'future-receipt', 'topic', 'unrelated', 'nonhuman', 'self', 'absent', 'duplicate'])('operator rejects %s replacement without changing audit state', change => {
    const f = supersessionFixture(); try {
        if (change === 'unconfirmed') f.replacement.status = 'verifying';
        if (change === 'recipient') f.replacement.targetId = 'UOTHER';
        if (change === 'workspace') f.replacement.workspaceId = 'TOTHER';
        if (change === 'old') f.replacement.createdAt = '2026-11-07T00:00:00Z';
        if (change === 'future-receipt') f.replacement.createdAt = '2026-11-08T02:21:00Z';
        if (change === 'topic') f.human.ticket = 'GH-999';
        if (change === 'unrelated') f.replacement.text = 'Different PR';
        if (change === 'nonhuman') f.human.from = 'pm';
        if (change === 'self') f.input.replacementDeliveryId = 'delivery';
        if (change === 'absent') f.input.replacementDeliveryId = 'not-here';
        if (change === 'duplicate') f.store.state.slackDeliveries!.push({ ...f.replacement });
        const before = JSON.stringify(f.store.state.slackDeliveries);
        expect(() => supersedeSlackDelivery(f.store, f.input)).toThrow(); expect(JSON.stringify(f.store.state.slackDeliveries)).toBe(before);
    } finally { f.close(); }
});
test('a failed proof can be explicitly reconciled with renewed receipt evidence, preserving its previous record', () => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input); const previous = structuredClone(f.delivery.supersededBy);
        f.replacement.text += '\nCorrected follow-up'; expect(supersedingDelivery(f.store.state, f.delivery)).toBeUndefined();
        supersedeSlackDelivery(f.store, f.input); expect(f.delivery.supersessionHistory).toEqual([previous]); expect(supersedingDelivery(f.store.state, f.delivery)?.id).toBe('replacement');
    } finally { f.close(); }
});
test('the project-scoped operator route records verified closeout without a provider runner', async () => {
    const f = supersessionFixture(); try {
        const url = new URL('http://127.0.0.1/api/commands?project=brain');
        const response = await commandRoute(new Request(url, { method: 'POST', body: JSON.stringify({ action: 'supersede-slack-delivery', slackSupersession: f.input }) }), url, { store: f.store, project: f.store.project } as any);
        expect(response!.status).toBe(202); expect(f.delivery.supersededBy?.replacementDeliveryId).toBe('replacement');
    } finally { f.close(); }
});

test('a future timestamp cannot produce a valid closeout and a channel receipt must match the channel', () => {
    const f = supersessionFixture(); try {
        const ts = (f.store.clock.now().getTime() / 1000 + 1000).toFixed(6); f.replacement.messageTs = ts; f.replacement.permalink = `https://fixture.slack.com/archives/D123/p${ts.replace('.', '')}`;
        expect(() => supersedeSlackDelivery(f.store, f.input)).toThrow('future');
    } finally { f.close(); }
    const channel = supersessionFixture(); try {
        channel.delivery.targetType = channel.replacement.targetType = 'channel'; channel.delivery.targetId = channel.replacement.targetId = 'C123';
        expect(() => supersedeSlackDelivery(channel.store, channel.input)).toThrow('same recipient');
    } finally { channel.close(); }
});
