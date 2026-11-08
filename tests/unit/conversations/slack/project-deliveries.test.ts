import { expect, test } from 'vitest';
import { projectSlackDeliveries } from '../../../../server/conversations/slack/project-deliveries';
import { supersedeSlackDelivery } from '../../../../server/conversations/slack/supersede-delivery';
import { slackHealth } from '../../../../server/office/slack-health';
import { supersessionFixture } from './fixture';

test('UI projection is live and pure, and health ignores only valid supersession', () => {
    const f = supersessionFixture(); try {
        supersedeSlackDelivery(f.store, f.input); f.delivery.updatedAt = '2026-11-08T02:30:00Z';
        const state = structuredClone(f.store.state), projected = projectSlackDeliveries(f.store.state);
        expect(projected[0].supersession?.permalink).toBe(f.replacement.permalink); expect(f.store.state).toEqual(state);
        expect(slackHealth([f.store.state], f.store.clock.now().getTime()).status).toBe('connected');
        f.replacement.status = 'uncertain'; f.delivery.supersession = projected[0].supersession;
        expect(projectSlackDeliveries(f.store.state)[0].supersession).toBeUndefined(); expect(slackHealth([f.store.state], f.store.clock.now().getTime()).status).toBe('warning');
    } finally { f.close(); }
});
