import { afterEach, expect, test } from 'vitest';
import { slackDeliveries } from '../../../../server/incidents/sources/slack-deliveries';
import type { Store } from '../../../../server/store/store';
import { observe, projectStore } from '../incident-fixture';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function store(id?: string) { const s = projectStore(id); stores.push(s); return s; }

test('an uncertain delivery with no confirmed replacement, named by its request', () => {
    const s = store();
    const delivery = (over: Record<string, unknown>) => ({ id: 'd-1', requestId: 'msg-1', targetType: 'person', targetId: 'U1', targetName: 'Joe', workspaceId: 'W', status: 'uncertain', error: 'Slack read-back did not match', createdAt: 'c1', updatedAt: 'u1', ...over });
    s.state.slackDeliveries = [delivery({}), delivery({ id: 'd-2', requestId: 'msg-2', status: 'confirmed' }), delivery({ id: 'd-3', requestId: 'msg-3', status: 'sending' })] as any;
    expect(slackDeliveries(observe(s))).toEqual([expect.objectContaining({ subject: expect.objectContaining({ kind: 'slack-delivery', id: 'msg-1', episode: 'c1', unsettledEffect: true }), cause: expect.objectContaining({ provider: 'slack', kind: 'uncertain' }), expected: 'uncertain-effect' })]);
});
