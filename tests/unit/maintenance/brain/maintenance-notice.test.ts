import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../../server/store/store';
import { Engine } from '../../../../server/scheduling/engine';
import { coordination } from '../../../../server/scheduling/coordination';
import { configureGoalNotices } from '../../../../server/leadership/goal-notice-settings';
import { MergeNotifications } from '../../../../server/conversations/notifications';
import { SlackMessages } from '../../../../server/conversations/slack';
import { queueMaintenanceNotice } from '../../../../server/maintenance/brain/queue-maintenance-notice';
import { maintenanceNoticeAuthorized } from '../../../../server/maintenance/brain/maintenance-notice-authorization';
import type { MaintenanceRun } from '../../../../src/shared';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const settings = { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' };
const summary = 'Merged PRs #1 and #2; accepted 3 captures.';
function setup(stage = 'brain-completed') {
    const root = mkdtempSync(join(tmpdir(), 'office-maintenance-notices-')); roots.push(root);
    const store = new Store(':memory:', undefined, root); stores.push(store); store.state.coordination = coordination();
    const run: MaintenanceRun = { id: crypto.randomUUID(), requestedAt: '', startedAt: '', endedAt: '', status: 'completed', weekly: false, stage, error: '', steps: [] };
    store.state.maintenance = { runs: [run], lastDaily: '', lastWeekly: '', ledger: '' };
    const engine = new Engine(store);
    return { store, engine, run, notices: new MergeNotifications(store, engine) };
}
const entries = (store: Store) => store.state.coordination!.notices?.entries || [];

test('only verified completed work queues one DM, and only while the goal DM recipient is enabled', () => {
    const off = setup(); queueMaintenanceNotice(off.store, off.run, summary);
    expect(entries(off.store)).toHaveLength(0);
    const skipped = setup('skipped: completed'); configureGoalNotices(skipped.store, settings); queueMaintenanceNotice(skipped.store, skipped.run, summary);
    expect(entries(skipped.store)).toHaveLength(0);
    const { store, run } = setup(); configureGoalNotices(store, settings);
    queueMaintenanceNotice(store, run, summary); queueMaintenanceNotice(store, run, summary);
    expect(entries(store)).toHaveLength(1);
    expect(entries(store)[0]).toMatchObject({ kind: 'maintenance', runId: run.id, status: 'queued', resolved: { targetId: 'UFIXTURE', workspaceId: 'TFIXTURE' } });
    expect(entries(store)[0].text).toContain(summary);
    const long = setup(); configureGoalNotices(long.store, settings); queueMaintenanceNotice(long.store, long.run, 'x'.repeat(9000));
    expect(entries(long.store)[0].text.length).toBeLessThan(5000);
    const lines = setup(); configureGoalNotices(lines.store, settings); queueMaintenanceNotice(lines.store, lines.run, 'Nightly complete.\n- Merged https://github.com/JFusco/brain/pull/340');
    expect(entries(lines.store)[0].text).toContain('- Merged https://github.com/JFusco/brain/pull/340');
});
test('a changed recipient or a reconciled run withdraws authorization before any send', async () => {
    const { store, run, engine, notices } = setup(); configureGoalNotices(store, settings); queueMaintenanceNotice(store, run, summary);
    const notice = entries(store)[0]; let sends = 0;
    engine.agents.sendSlack = async () => { sends++; throw new Error('unexpected'); };
    expect(maintenanceNoticeAuthorized(store, notice)).toBe(true);
    configureGoalNotices(store, { ...settings, targetId: 'UOTHER' });
    expect(maintenanceNoticeAuthorized(store, notice)).toBe(false);
    await notices.pump(); expect(notice.status).toBe('cancelled'); expect(sends).toBe(0);
    const other = setup(); configureGoalNotices(other.store, settings); queueMaintenanceNotice(other.store, other.run, summary);
    other.run.status = 'blocked'; expect(maintenanceNoticeAuthorized(other.store, entries(other.store)[0])).toBe(false);
});
test('one durable send with independent read-back; merge-notice delivery refuses it', async () => {
    const { store, run, engine, notices } = setup(); configureGoalNotices(store, settings); queueMaintenanceNotice(store, run, summary);
    const notice = entries(store)[0]; let sends = 0;
    await expect(new SlackMessages(store, engine.agents).sendNotification(notice.id, { targetType: 'person', ...notice.resolved!, text: notice.text })).rejects.toThrow('authorization');
    const ts = (Date.now() / 1000).toFixed(6), receipt = { channelId: 'DFIXTURE', messageTs: ts, permalink: `https://fixture.slack.com/archives/DFIXTURE/p${ts.replace('.', '')}`, detail: 'Fixture only' };
    engine.agents.sendSlack = async () => { sends++; expect(store.getEffect(`slack:${notice.id}`)?.status).toBe('dispatching'); return receipt; };
    engine.agents.verifySlack = async () => ({ ...receipt, found: true, targetId: settings.targetId, workspaceId: settings.workspaceId, text: notice.text });
    await notices.pump(); await notices.pump();
    expect(sends).toBe(1); expect(notice.status).toBe('sent'); expect(store.getEffect(`slack:${notice.id}`)?.status).toBe('verified');
});
test('restart requeues only a maintenance notice with no durable send intent or Slack attempt', () => {
    const { store, run } = setup(); configureGoalNotices(store, settings); queueMaintenanceNotice(store, run, summary);
    const notice = entries(store)[0]; notice.status = 'working'; store.recover();
    expect(notice.status).toBe('queued');
    notice.status = 'working'; store.state.slackDeliveries = [{ requestId: notice.id, status: 'uncertain' } as any]; store.recover();
    expect(notice.status).toBe('uncertain');
});
