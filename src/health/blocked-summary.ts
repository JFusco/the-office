import type { ProjectReadiness } from '../contracts/health';
import type { BlockedCause } from '../contracts/work';

const LABELS: Record<BlockedCause, (n: number) => string> = {
    'needs-decision': n => `${n} need${n === 1 ? 's' : ''} a decision`,
    interrupted: n => `${n} interrupted`,
    unconfirmed: n => `${n} unconfirmed`,
    dependency: n => `${n} waiting on prerequisites`,
    paused: n => `${n} paused`,
    failed: n => `${n} failed (history)`,
};

/** "29 stopped: 17 need a decision · 1 unconfirmed · 11 failed (history)", or "0 stopped". */
export function blockedSummary(item: Pick<ProjectReadiness, 'blocked' | 'blockedCauses'>): string {
    if (!item.blocked) return '0 stopped';
    const parts = item.blockedCauses ? (Object.keys(LABELS) as BlockedCause[]).filter(cause => item.blockedCauses![cause]).map(cause => LABELS[cause](item.blockedCauses![cause])) : [];
    return parts.length ? `${item.blocked} stopped: ${parts.join(' · ')}` : `${item.blocked} stopped`;
}
