import { intakeLaunchLimit } from './seed-status';
import { queueReconsideration } from './reconsider';
import { runSlackLinks, type LinkRecord } from './read-links';
import type { Store } from '../../store/store';
import type { ScheduledWork } from '../../scheduling/scheduler';
import type { KnowledgeRunner } from '../run-retrospective';
import { lastFriday } from '../weekly-rollup';
import { easternDay, easternInstant, addDays } from '../../office/clock';
import { IntakeLedger } from './ledger';
import { configDigest, readConfig, type Config } from './config';
import { newTask } from './collect';
import { nowTs, overlapTs } from './timestamps';
import { runIntakeTask } from './run';
import { readMethod } from './observations';
import { captureProposal } from './capture-effect';
import { LIMITS, type ChannelProgress, type Proposal, type ReadTask } from './contracts';

function initialize(ledger: IntakeLedger, config: Config, now: Date): void {
    ledger.transaction(() => {
        const week = lastFriday(now);
        for (const channel of config.channels) if (!ledger.get('channel', channel.id)) {
            const progress: ChannelProgress = { id: channel.id, seedUpperTs: nowTs(now), enumerated: false, through: nowTs(now), week };
            ledger.put('channel', channel.id, progress);
            const identity = newTask(config, channel.id, 'lookup', channel.name, '0.000000', progress.seedUpperTs, week, now.toISOString()); ledger.put('task', identity.id, identity);
            const task = newTask(config, channel.id, 'channel', '', '0.000000', progress.seedUpperTs, week, now.toISOString()); ledger.put('task', task.id, task);
            const canvases = newTask(config, channel.id, 'inventory', '', '0.000000', progress.seedUpperTs, week, now.toISOString()); ledger.put('task', canvases.id, canvases);
            ledger.put('gap', channel.id, { channel: channel.id, week, reasons: ['bookmark-inventory-unavailable', 'pin-inventory-unavailable', 'canvas-inventory-search-dependent', 'reply-discovery-search-dependent'] });
        }
    });
}
function refresh(ledger: IntakeLedger, config: Config, now: Date): void {
    ledger.transaction(() => {
        const tasks = ledger.all<ReadTask>('task'), week = lastFriday(now);
        for (const channel of config.channels) {
            const progress = ledger.get<ChannelProgress>('channel', channel.id); if (!progress) continue;
            const seed = tasks.find(t => t.channel === channel.id && t.kind === 'channel' && t.createdAt && t.week === progress.week);
            if (!progress.enumerated && seed?.status === 'complete') { progress.enumerated = true; progress.week = ''; }
            if (progress.enumerated && (!progress.caughtUp || progress.week !== week && now >= easternInstant(week, 17))) {
                const latest = nowTs(now), oldest = overlapTs(progress.through, 48n * 3600n * 1000000n);
                for (const kind of ['channel', 'search', 'inventory'] as const) {
                    const task = newTask(config, channel.id, kind, '', oldest, latest, week, now.toISOString()); ledger.put('task', task.id, task);
                }
                // Resource inventories remain explicit gaps. Known living documents are re-read.
                const resources = new Map(tasks.filter(t => t.channel === channel.id && t.kind === 'canvas').map(t => [t.resource, t]));
                for (const prior of resources.values()) { const task = newTask(config, channel.id, 'canvas', prior.resource, oldest, latest, week, now.toISOString()); task.sourceUrl = prior.sourceUrl; ledger.put('task', task.id, task); }
                progress.through = latest; progress.week = week; progress.caughtUp = true;
            }
            ledger.put('channel', channel.id, progress);
        }
        for (const task of tasks) if (task.status === 'running' && !ledger.store.activeClaims().some(c => c.id === task.ownerClaim && ['running', 'stopping'].includes(c.status)) && Date.parse(task.nextAt) <= now.getTime()) {
            task.status = ++task.failures >= 5 ? 'needs-attention' : 'pending'; task.attempt = ''; task.ownerClaim = ''; task.error = 'interrupted-read'; ledger.put('task', task.id, task);
        }
    });
}
export function retrySlackIntake(store: Store, id: string): { accepted: true } {
    const ledger = new IntakeLedger(store), task = ledger.get<ReadTask>('task', id);
    if (!task) {
        const link = ledger.get<LinkRecord>('link', id);
        if (!link || link.state !== 'needs-attention' || store.activeClaims().some(c => c.work.id === 'intake-public-links')) throw Error('Intake batch is not available for reset');
        ledger.put('retry-history', ledger.id(), { link: id, failures: link.failures || 0, reason: link.reason || '', at: store.clock.now().toISOString() });
        ledger.put('link', id, { ...link, state: 'pending', failures: 0, nextAt: '', reason: '' }); return { accepted: true };
    }
    if (task.status !== 'needs-attention' || task.ownerClaim || store.activeClaims().some(c => c.work.id === id)) throw Error('Intake batch is not available for reset');
    if (ledger.all<Proposal>('proposal').some(p => p.task === id && p.status === 'unresolved')) throw Error('Uncertain capture requires receipt reconciliation');
    ledger.put('retry-history', ledger.id(), { task: id, failures: task.failures, error: task.error, at: store.clock.now().toISOString() });
    task.failures = 0; task.nextAt = ''; task.status = 'pending'; task.error = ''; ledger.put('task', id, task); return { accepted: true };
}
function projectSlackIntake(store: Store, run: KnowledgeRunner, now: Date): ScheduledWork[] {
    const config = readConfig(store); if (!config) return [];
    const ledger = new IntakeLedger(store);
    const allowed = () => !!readConfig(store)?.enabled && !!store.state.knowledge?.enabled && !store.state.paused && !store.state.draining;
    const item = (id: string, at: string, execute: () => Promise<unknown>, ready = true, reason = 'Private learning intake is due'): ScheduledWork => ({
        store, work: { projectId: 'brain', kind: 'knowledge-slack-intake', id }, stage: 'knowledge-slack-intake', rank: 5, enqueuedAt: at,
        eligibility: { state: allowed() ? ready ? 'runnable' : 'waiting' : 'blocked', reason: allowed() ? reason : 'Learning intake is disabled, paused or draining', owner: 'Harper', nextCheckAt: null },
        identity: () => JSON.stringify([allowed(), readConfig(store) ? configDigest(readConfig(store)!) : null, ledger.get('task', id), ledger.get('proposal', id)]),
        claimEligible: () => allowed() && ready && configDigest(readConfig(store)!) === configDigest(config), execute,
    });
    if (!config.enabled) return [];
    const digestNow = configDigest(config);
    // Retained work frozen under other authority never runs or silently stalls; it is surfaced for operator reconciliation.
    const stale = ledger.all<ReadTask>('task').some(t => t.status !== 'complete' && t.configHash !== digestNow)
        || ledger.all<Proposal>('proposal').some(p => (p.status === 'pending' || p.status === 'unresolved') && p.configHash !== digestNow)
        || ledger.all<{ configHash: string }>('identity').some(identity => identity.configHash !== digestNow);
    if (stale) return [{ store, work: { projectId: 'brain', kind: 'knowledge-slack-intake', id: 'intake-config-reconcile' }, stage: 'knowledge-slack-intake', rank: 5, enqueuedAt: now.toISOString(),
        eligibility: { state: 'blocked', reason: 'Private learning intake needs configuration reconciliation: retained records were frozen under a different configuration', owner: 'Harper', nextCheckAt: null },
        identity: () => `intake-config-reconcile:${digestNow}`, claimEligible: () => false, execute: async () => undefined }];
    if (config.channels.some(c => !ledger.get('channel', c.id))) return [item('intake-initialize', now.toISOString(), async () => { if (allowed()) initialize(ledger, config, now); })];
    refresh(ledger, config, now);
    const captures = ledger.all<Proposal>('proposal').filter(p => (p.status === 'pending' || p.status === 'unresolved') && p.configHash === digestNow && (!p.nextAt || Date.parse(p.nextAt) <= now.getTime()));
    if (captures.length) return [item(captures[0].id, now.toISOString(), () => captureProposal(store, config, captures[0].id))];
    queueReconsideration(ledger, config, lastFriday(now), now.toISOString());
    const dailyLimit = intakeLaunchLimit(ledger, config);
    const links = ledger.all<LinkRecord>('link').filter(link => link.state === 'pending' && (!link.nextAt || Date.parse(link.nextAt) <= now.getTime()));
    if (links.length && (ledger.get<number>('launches', easternDay(now)) || 0) < dailyLimit) return [item('intake-public-links', now.toISOString(), () => runSlackLinks(store, config, run, links.slice(0, LIMITS.links), 'intake-public-links'))];
    const backedOff = (t: ReadTask) => { const until = !t.processing && ledger.get<string>('backoff', readMethod(config, t.kind)); return !!until && Date.parse(until) > now.getTime(); };
    const tasks = ledger.all<ReadTask>('task').filter(t => (t.kind === 'lookup' || ledger.get<{ configHash: string }>('identity', t.channel)?.configHash === digestNow) && !backedOff(t) && t.status === 'pending' && t.configHash === digestNow && (!t.nextAt || Date.parse(t.nextAt) <= now.getTime()));
    const previous = ledger.get<string>('rotation', 'channel'), position = config.channels.findIndex(channel => channel.id === previous);
    const order = new Map(config.channels.map((channel, index) => [channel.id, (index - position - 1 + config.channels.length) % config.channels.length]));
    tasks.sort((a, b) => order.get(a.channel)! - order.get(b.channel)! || a.createdAt.localeCompare(b.createdAt));
    const task = tasks[0]; if (!task) return [];
    const daily = ledger.get<number>('launches', easternDay(now)) || 0;
    const result = item(task.id, task.createdAt, async () => { ledger.put('rotation', 'channel', task.channel); await runIntakeTask(store, run, task.id); }, daily < dailyLimit, daily >= dailyLimit ? 'Learning intake daily launch budget reached' : undefined);
    if (daily >= dailyLimit) result.eligibility.nextCheckAt = easternInstant(addDays(easternDay(now), 1)).toISOString();
    return [result];
}

export function scheduledSlackIntake(store: Store, run: KnowledgeRunner, now: Date): ScheduledWork[] {
    try { return projectSlackIntake(store, run, now); }
    catch { return [{ store, work: { projectId: store.project.id, kind: 'knowledge-slack-intake', id: 'intake-configuration' }, stage: 'knowledge-slack-intake', rank: 5, enqueuedAt: '', eligibility: { state: 'blocked', reason: 'Private learning intake configuration needs attention', owner: 'Harper', nextCheckAt: null }, identity: () => 'invalid-config', execute: async () => undefined }]; }
}
