import { expect, test } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { Conversations } from '../../../server/conversations/conversations';
import { investigationFixture } from '../it/investigations/fixture';

test('Ellis may publish a verified observation of an uncertain effect to Morgan without settling or resending it', async () => {
    const f = investigationFixture(); try {
        const engine = new Engine(f.store), chat = new Conversations(f.store, engine, f.root);
        engine.itAgents.followup = async () => ({ handoffProject: '', pickupChange: null, reply: 'The observed delivery remains uncertain.', notifyRoles: ['pm'], question: '', goalChanges: [], slackRequests: [], notes: [], receipts: [{ id: 'observation', action: 'read-state', target: 'delivery', verified: true, uncertain: true, detail: 'Saved delivery status is uncertain; no send authorized.' }] } as any);
        const message = chat.enqueue({ id: crypto.randomUUID(), role: 'it', body: 'Investigate and report to Morgan' });
        await chat.pumpIT(); expect(message.status).toBe('answered');
        expect(f.store.state.messages.some(message => message.id.startsWith('it-report:'))).toBe(true);
        expect(f.delivery.status).toBe('uncertain'); expect(f.store.state.slackDeliveries).toHaveLength(1);
    } finally { f.close(); }
});
