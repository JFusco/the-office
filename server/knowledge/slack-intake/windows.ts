import { IntakeLedger } from './ledger';
import type { CollectionPolicy } from '../sources/collection-policy';
import type { KnowledgeSource } from '../sources/source-record';
import type { ChannelProgress, ReadTask } from './contracts';
import { newTask } from './collect';
import { nowTs, overlapTs,micros } from './timestamps';
import { lastFriday } from '../weekly-rollup';
import { easternDay, easternInstant } from '../../office/clock';

export function initialize(ledger: IntakeLedger, config: CollectionPolicy, now: Date): void {
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
export function refresh(ledger: IntakeLedger, config: CollectionPolicy, now: Date, cadence: KnowledgeSource['cadence'], requested?: string): void {
    ledger.transaction(() => {
        const tasks = ledger.all<ReadTask>('task'), week = lastFriday(now);
        const cycle = cadence === 'daily' ? easternDay(now) : week;
        const manual = requested && ledger.get<string>('meta', 'refresh-consumed') !== requested;
        for (const channel of config.channels) {
            const progress = ledger.get<ChannelProgress>('channel', channel.id); if (!progress) continue;
            micros(progress.through);micros(progress.seedUpperTs);
            const seed = tasks.find(t => t.channel === channel.id && t.kind === 'channel' && t.createdAt && t.week === progress.week);
            if (!progress.enumerated && seed?.status === 'complete') { progress.enumerated = true; progress.week = ''; }
            if (progress.enumerated && !tasks.some(t => t.channel === channel.id && t.status !== 'complete') && (manual || cadence !== 'manual' && (!progress.caughtUp || progress.week !== cycle && now >= easternInstant(cycle, 17)))) {
                const latest = nowTs(now), oldest = overlapTs(progress.through, 48n * 3600n * 1000000n);
                for (const kind of ['channel', 'search', 'inventory'] as const) {
                    const task = newTask(config, channel.id, kind, '', oldest, latest, week, now.toISOString()); ledger.put('task', task.id, task);
                }
                // Resource inventories remain explicit gaps. Known living documents are re-read.
                const resources = new Map(tasks.filter(t => t.channel === channel.id && t.kind === 'canvas').map(t => [t.resource, t]));
                for (const prior of resources.values()) { const task = newTask(config, channel.id, 'canvas', prior.resource, oldest, latest, week, now.toISOString()); task.sourceUrl = prior.sourceUrl; ledger.put('task', task.id, task); }
                progress.through = latest; progress.week = cycle; progress.caughtUp = true;
                if (manual) ledger.put('meta', 'refresh-consumed', requested);
            }
            ledger.put('channel', channel.id, progress);
        }
        for (const task of tasks) if (task.status === 'running' && !ledger.store.activeClaims().some(c => c.id === task.ownerClaim && ['running', 'stopping'].includes(c.status)) && Date.parse(task.nextAt) <= now.getTime()) {
            task.status = ++task.failures >= 5 ? 'needs-attention' : 'pending'; task.attempt = ''; task.ownerClaim = ''; task.error = 'interrupted-read'; ledger.put('task', task.id, task);
        }
    });
}
