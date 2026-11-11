import type { ReadTask, SourceUnit } from './contracts';
import type { LinkRecord } from './read-links';
import type { IntakeLedger } from './ledger';
import { digest } from './config';
import { readyReferences, referenceIndex } from './reconsider';
const unitKey = (u: SourceUnit) => `${u.id}:${u.version}`;
/** Deferred versions with a terminal reference gap whose current reference evidence already finished reconsideration. Uses loaded rows only. */
export function terminalDeferred(ledger: IntakeLedger, units: SourceUnit[], tasks: ReadTask[]): Set<string> {
    const index = referenceIndex(ledger, units, tasks), terminal = new Set<string>();
    // A scan-withheld classification is a harness fallback, not a model decision; the last record per task wins.
    const classified = new Map(ledger.columns<{ taskId: string; state: string }>('classification-admission', ['taskId', 'state']).map(r => [r.taskId, r.state]));
    const reconsidered = new Set(tasks.filter(t => t.status === 'complete' && t.processing?.length && classified.get(t.id) !== 'blocked').map(t => t.resource));
    for (const unit of units) {
        if (unit.state !== 'deferred') continue;
        const references = readyReferences(ledger, unit, index);
        if (!references?.some(r => typeof r === 'object' && r !== null && 'unavailable' in r)) continue;
        // Same identity as queueReconsideration: changed evidence needs its own completed reconsideration.
        if (reconsidered.has(digest(JSON.stringify([unit.id, unit.version, references])))) terminal.add(unitKey(unit));
    }
    return terminal;
}
/** Actionable work is separate from terminal coverage limits. Counts may overlap; they are not an ETA. */
export function intakeProgress(tasks: ReadTask[], units: SourceUnit[], links: LinkRecord[], terminal: Set<string>) {
    const pendingReads = tasks.filter(t => t.status !== 'complete').length + links.filter(l => l.state === 'pending' || l.state === 'needs-attention').length;
    const terminalDeferrals = units.filter(u => u.state === 'deferred' && terminal.has(unitKey(u))).length;
    const unresolvedSources = units.filter(u => u.state === 'deferred' && !terminal.has(unitKey(u)) || u.state === 'error' || u.state === 'pending').length;
    const needsAttention = tasks.some(t => t.status === 'needs-attention') || links.some(l => l.state === 'needs-attention') || units.some(u => u.state === 'error') || unresolvedSources > 0 && pendingReads === 0;
    const gaps = units.filter(u => u.state === 'inaccessible').length + terminalDeferrals + links.filter(l => l.state === 'deferred').length + units.reduce((n, u) => n + u.references.filter(r => r.kind === 'internal').length, 0);
    return { pendingReads, unresolvedSources, needsAttention, gaps, outstanding: pendingReads + unresolvedSources };
}
