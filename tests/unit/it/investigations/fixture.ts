import { mkdtempSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { Store } from '../../../../server/store/store';
import { coordination } from '../../../../server/scheduling/coordination';
import { projectById } from '../../../../server/office/projects';
import type { SlackDelivery, WorkTime } from '../../../../src/shared';

export function investigationFixture() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-investigation-'));
    let now = new Date('2026-11-08T03:00:00Z');
    const store = new Store(':memory:', structuredClone(projectById('brain')), root, { now: () => now, monotonic: () => 0 });
    store.state.coordination = coordination();
    store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], recoveries: {}, services: [] };
    const worker = { id: 'sender', requestId: 'notice', stage: 'slack-send', role: 'pm', status: 'failed', processId: 2147483600, ticket: 'GH-350', startedAt: '2026-11-08T02:00:00Z', endedAt: '2026-11-08T02:01:00Z', failure: { category: 'uncertain-effect', dispatched: true, detail: 'Surviving subprocesses' } } as WorkTime;
    const delivery: SlackDelivery = { id: 'delivery', requestId: 'notice', status: 'uncertain', error: 'Worker exited with surviving subprocesses', targetId: 'U123', workspaceId: 'T123', targetType: 'person', targetName: 'Fixture', text: 'Synthetic only', channelId: '', messageTs: '', permalink: '', sessionId: '', createdAt: '2026-11-08T02:00:00Z', updatedAt: '2026-11-08T02:01:00Z' };
    store.state.workLog = [worker]; store.state.slackDeliveries = [delivery];
    return { store, worker, delivery, root, advance: (ms: number) => { now = new Date(now.getTime() + ms); }, close: () => { store.close(); rmSync(root, { recursive: true, force: true }); } };
}
