import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Store } from '../../../server/store/store';
import { Engine } from '../../../server/scheduling/engine';
import { coordination } from '../../../server/scheduling/coordination';
import { configureGoalNotices } from '../../../server/leadership/goal-notice-settings';
import { queueGoalNotice } from '../../../server/leadership/queue-goal-notice';
import { goalNoticeAuthorized } from '../../../server/leadership/goal-notice-authorization';
import { saveGoal } from '../../../server/leadership/goals';
import { applyGoalReview } from '../../../server/leadership/goal-reviews';
import { configureNotices, MergeNotifications } from '../../../server/conversations/notifications';
import { Conversations } from '../../../server/conversations/conversations';
import { SlackMessages } from '../../../server/conversations/slack';
import { projectOutbox } from '../../../server/conversations/outbox';

const stores: Store[] = [], roots: string[] = [];
afterEach(() => { stores.splice(0).forEach(store => store.close()); roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })); });
const settings = { enabled: true, targetId: 'UFIXTURE', targetName: 'Fixture owner', workspaceId: 'TFIXTURE' };
function setup() {
    const root = mkdtempSync(join(tmpdir(), 'office-goal-notices-')); roots.push(root);
    const store = new Store(':memory:', undefined, root); stores.push(store); store.state.coordination = coordination();
    const engine = new Engine(store), goal = saveGoal(store, { id: crypto.randomUUID(), expectedUpdatedAt: '', project: 'CEC', title: 'Deliver the integration', detail: 'The agreed scenario works.', priority: 2, status: 'active' });
    const finish = () => saveGoal(store, { id: goal.id, expectedUpdatedAt: goal.updatedAt, project: goal.project, title: goal.title, detail: goal.detail, priority: goal.priority, status: 'done' });
    return { store, engine, goal, finish, notices: new MergeNotifications(store, engine) };
}
test('goal notices default off, never backfill, and stay independent of merge notification settings', () => {
    const { store, goal, finish } = setup(); finish();
    expect(store.state.coordination!.notices?.entries || []).toHaveLength(0);
    configureGoalNotices(store, settings); finish();
    expect(store.state.coordination!.notices!.entries).toHaveLength(0);
    configureNotices(store, { enabled: false, recipients: 'both', workspace: 'Fixture', mappings: '' });
    expect(store.state.coordination!.notices!.policy.goals?.enabled).toBe(true);
    goal.status = 'active'; finish(); finish();
    expect(store.state.coordination!.notices!.entries).toHaveLength(1);
    expect(store.state.coordination!.notices!.entries[0].text).toContain('Accepted by Joe.');
});
test('automatic accepted review and conversational goal completion queue exactly once with the saved goal change', () => {
    const { store, goal, engine } = setup(); configureGoalNotices(store, settings);
    store.state.tickets = [{ key: 'CEC-999', updated: 'version', commit: 'head', stage: 'complete', pilot: true, results: { 'staging-qa': { outcome: 'passed' } } } as any];
    const proposal = { projectId: 'cec', goalId: goal.id, expectedUpdatedAt: goal.updatedAt, status: 'done' as const, progress: 'Agreed scope verified.', rationale: 'Verified fixture acceptance.', blockers: [], linkedWork: [], evidence: [{ projectId: 'cec', kind: 'ticket' as const, id: 'CEC-999', version: 'version', head: 'head' }] };
    applyGoalReview(store, 'review', proposal); applyGoalReview(store, 'review', proposal);
    expect(store.state.coordination!.notices!.entries).toHaveLength(1);
    expect(store.state.coordination!.notices!.entries[0].text).toContain('Verified by Avery');
    const chat = new Conversations(store, engine, store.dataRoot);
    chat.saveGoals([{ id: goal.id, expectedUpdatedAt: goal.updatedAt, project: goal.project, title: goal.title, detail: goal.detail, priority: goal.priority, status: 'done' }], 'cto', 'conversation');
    expect(store.state.coordination!.notices!.entries).toHaveLength(1);
});
test('a failed goal review rolls back both completion and its queued notification', () => {
    const { store, goal } = setup(); configureGoalNotices(store, settings);
    expect(() => store.transaction(() => { const previous = goal.status; goal.status = 'done'; queueGoalNotice(store, previous, goal, 'Avery'); throw new Error('rollback'); })).toThrow('rollback');
    expect(store.state.goals![0].status).toBe('active'); expect(store.state.coordination!.notices!.entries).toHaveLength(0);
});
test('reopening a goal or changing its recipient cancels only unsent messages', () => {
    const { store, goal, finish } = setup(); configureGoalNotices(store, settings); finish();
    const first = store.state.coordination!.notices!.entries[0];
    goal.status = 'active'; queueGoalNotice(store, 'done', goal, 'Joe');
    expect(first.status).toBe('cancelled'); expect(goalNoticeAuthorized(store, first)).toBe(false);
    finish(); const next = store.state.coordination!.notices!.entries[1];
    configureGoalNotices(store, { ...settings, targetId: 'UOTHER' });
    expect(next.status).toBe('cancelled'); expect(goalNoticeAuthorized(store, next)).toBe(false);
});
test('restart requeues only a goal notice with no durable send intent or Slack attempt', () => {
    const { store, finish } = setup(); configureGoalNotices(store, settings); finish();
    const notice = store.state.coordination!.notices!.entries[0]; notice.status = 'working'; store.recover();
    expect(notice.status).toBe('queued');
    notice.status = 'working'; store.state.slackDeliveries!.push({ requestId: notice.id, status: 'uncertain' } as any); store.recover();
    expect(notice.status).toBe('uncertain');
});
test('one durable goal notification uses independent Slack readback and never repeats on a later review', async () => {
    const { store, engine, notices, finish } = setup(); configureGoalNotices(store, settings); finish();
    const notice = store.state.coordination!.notices!.entries[0]; let sends = 0;
    const ts = (Date.now() / 1000).toFixed(6), receipt = { channelId: 'DFIXTURE', messageTs: ts, permalink: `https://fixture.slack.com/archives/DFIXTURE/p${ts.replace('.', '')}`, detail: 'Fixture only' };
    engine.agents.sendSlack = async () => { sends++; expect(store.getEffect(`slack:${notice.id}`)?.status).toBe('dispatching'); return receipt; };
    engine.agents.verifySlack = async () => ({ ...receipt, found: true, targetId: settings.targetId, workspaceId: settings.workspaceId, text: notice.text });
    await notices.pump(); await notices.pump(); finish(); await notices.pump();
    expect(sends).toBe(1); expect(notice.status).toBe('sent'); expect(store.getEffect(`slack:${notice.id}`)?.status).toBe('verified');
    expect(store.state.slackDeliveries![0].status).toBe('confirmed');
});
test('paused and unauthorized goal sends do not dispatch; uncertain delivery reconciles without another send or duplicate outbox alert', async () => {
    const { store, engine, notices, finish } = setup(); configureGoalNotices(store, settings); finish();
    const notice = store.state.coordination!.notices!.entries[0]; let sends = 0;
    engine.agents.sendSlack = async () => { sends++; throw new Error('Transport ended without receipt'); };
    engine.agents.verifySlack = async () => { throw new Error('Readback unavailable'); };
    store.state.paused = true; await notices.pump(); expect(sends).toBe(0); expect(notice.status).toBe('queued'); store.state.paused = false;
    await expect(new SlackMessages(store, engine.agents).sendGoalNotification(notice.id, { targetType: 'person', ...notice.resolved!, text: notice.text })).rejects.toThrow('authorization');
    await notices.pump(); await notices.pump(); expect(sends).toBe(1); expect(notice.status).toBe('uncertain');
    expect(projectOutbox(store.state).filter(item => item.status === 'open' && (item.id === `merge-notice:${notice.id}` || item.id === `message:${notice.id}`))).toHaveLength(1);
    const ts = (Date.now() / 1000).toFixed(6);
    engine.agents.verifySlack = async () => ({ found: true, targetId: settings.targetId, workspaceId: settings.workspaceId, text: notice.text, channelId: 'DFIXTURE', messageTs: ts, permalink: `https://fixture.slack.com/archives/DFIXTURE/p${ts.replace('.', '')}`, detail: 'Exact saved message found' });
    await new SlackMessages(store, engine.agents).verify(store.state.slackDeliveries![0]);
    expect(notice.status).toBe('sent'); expect(store.getEffect(`slack:${notice.id}`)?.status).toBe('verified'); await notices.pump(); expect(sends).toBe(1);
    expect(projectOutbox(store.state).filter(item => item.status === 'open' && item.id.includes(notice.id))).toHaveLength(0);
});
