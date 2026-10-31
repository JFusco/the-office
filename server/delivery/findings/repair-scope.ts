import type { StageResult } from '../../../src/shared';

/**
 * Hands-off repair scope: the reviewer names which unresolved findings Alex must repair.
 * Other unresolved findings (already fixed, or explicitly out of scope) carry forward to
 * the next independent review instead of turning a valid repair request into a dead end.
 */
export function namedRepairIds(result: StageResult): string[] | null {
    const resolution = result.resolution;
    if (!resolution || resolution.kind !== 'source-repair' || !['failed', 'blocked'].includes(result.outcome) || result.prerequisites?.length || result.receipts.some(r => r.uncertain || !r.verified)) return null;
    const ids = resolution.findingIds;
    if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !result.findings.some(f => f.id === id && f.status !== 'verified'))) return null;
    if (!resolution.evidenceIds.length || resolution.evidenceIds.some(id => !result.evidence.some(e => e.id === id && !!e.path && e.commit === result.commit))) return null;
    return [...ids];
}
