import type { SlackSeedProgress } from '../../../src/contracts/knowledge';
import { configDigest, digest, type Config } from './config';
import type { ChannelProgress, ReadTask, SourceUnit, Proposal } from './contracts';
import { LIMITS } from './contracts';
import type { LinkRecord } from './read-links';
import { IntakeLedger } from './ledger';
import { intakeProgress } from './progress';
import { compareTs } from './timestamps';
interface Completion { summary: SlackSeedProgress }
/** Identity uses fixed seed windows and source authority, never the operational launch allowance. */
function seedKey(ledger: IntakeLedger, config: Config): string | undefined {
    const channels = config.channels.map(c => ledger.get<ChannelProgress>('channel', c.id));
    if (channels.some(c => !c)) return;
    return digest(JSON.stringify([configDigest(config), channels.map(c => [c!.id, c!.seedUpperTs])]));
}
export function intakeLaunchLimit(ledger: IntakeLedger, config: Config): number {
    const key = seedKey(ledger, config);
    return key && ledger.get<Completion>('seed-completion', key) ? LIMITS.launches : config.seedLaunchesPerDay ?? LIMITS.launches;
}
/** The first completion is latched: later weekly reads cannot reopen this historical seed. */
export function reconcileSeedStatus(ledger: IntakeLedger, config: Config, tasks: ReadTask[], units: SourceUnit[], links: LinkRecord[], proposals: Proposal[]): SlackSeedProgress {
    const key = seedKey(ledger, config), completed = key && ledger.get<Completion>('seed-completion', key);
    if (completed) return { ...completed.summary, dailyLimit: LIMITS.launches };
    const progress = intakeProgress(tasks, units, links, proposals), hash = configDigest(config);
    const channels = config.channels.map(c => ledger.get<ChannelProgress>('channel', c.id));
    const histories = channels.filter(c => c?.enumerated).length;
    const caughtUp = config.channels.every((c, i) => {
        const channel = channels[i]; if (!channel?.enumerated || !channel.caughtUp) return false;
        const identity = ledger.get<{ configHash: string }>('identity', c.id); if (identity?.configHash !== hash) return false;
        const reads = tasks.filter(t => t.channel === c.id && t.configHash === hash && !t.processing);
        if (!['channel', 'inventory'].every(kind => reads.some(t => t.kind === kind && t.resource === '' && t.oldest === '0.000000' && t.latest === channel.seedUpperTs && t.status === 'complete'))) return false;
        // caughtUp means queued, not read. Require native-window tasks to have actually finished.
        return ['channel', 'search', 'inventory'].every(kind => reads.some(t => t.kind === kind && compareTs(t.latest, channel.seedUpperTs) > 0 && t.status === 'complete'));
    });
    const stale = tasks.some(t => t.configHash !== hash && t.status !== 'complete') || proposals.some(p => p.configHash !== hash && (p.status === 'pending' || p.status === 'unresolved'));
    const done = !!key && caughtUp && !stale && progress.outstanding === 0;
    // Four permanent discovery limits: bookmarks, pins, canvas inventory and reply discovery.
    const summary: SlackSeedProgress = { status: done ? 'complete-with-gaps' : stale || progress.needsAttention ? 'needs-attention' : 'seeding', channelsTotal: config.channels.length, channelsEnumerated: histories,
        pendingReads: progress.pendingReads, pendingCaptures: progress.pendingCaptures, unresolvedSources: progress.unresolvedSources, coverageGaps: progress.gaps + 4, dailyLimit: done ? LIMITS.launches : intakeLaunchLimit(ledger, config) };
    if (done) ledger.transaction(() => {
        summary.completedAt = ledger.store.clock.now().toISOString();
        ledger.put('seed-completion', key!, { summary });
        ledger.store.emit('slack-seed-complete', `Historical Slack seeding completed with coverage gaps. ${summary.channelsTotal} channel histories and their queued follow-ups are settled; weekly intake continues.`, 'knowledge');
    });
    return summary;
}
