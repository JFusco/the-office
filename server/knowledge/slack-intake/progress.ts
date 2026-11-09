import type { ReadTask, SourceUnit, Proposal } from './contracts';
import type { LinkRecord } from './read-links';
import type { IntakeLedger } from './ledger';
import { digest } from './config';
import { readyReferences, referenceIndex } from './reconsider';
export function verifiedCapture<T extends Pick<Proposal, 'status' | 'receipt' | 'id' | 'hash' | 'domain'>>(p: T): p is T & { receipt: NonNullable<Proposal['receipt']> } {
    return p.status === 'captured' && p.receipt?.found === true && p.receipt.requestId === p.id && p.receipt.inputSha256 === p.hash && p.receipt.domain === p.domain && typeof p.receipt.id === 'string';
}
const unitKey = (u: SourceUnit) => `${u.id}:${u.version}`;
/** Deferred versions with a terminal reference gap whose current reference evidence already finished reconsideration. Uses loaded rows only. */
export function terminalDeferred(ledger: IntakeLedger, units: SourceUnit[], tasks: ReadTask[]): Set<string> {
    const index = referenceIndex(ledger, units, tasks), terminal = new Set<string>();
    const reconsidered = new Set(tasks.filter(t => t.status === 'complete' && t.processing?.length).map(t => t.resource));
    for (const unit of units) {
        if (unit.state !== 'deferred' || unit.requests.length || !unit.references.length) continue;
        const references = readyReferences(ledger, unit, index);
        if (!references?.some(r => typeof r === 'object' && r !== null && 'unavailable' in r)) continue;
        // Same identity as queueReconsideration: changed evidence needs its own completed reconsideration.
        if (reconsidered.has(digest(JSON.stringify([unit.id, unit.version, references])))) terminal.add(unitKey(unit));
    }
    return terminal;
}
/** Actionable work is separate from terminal coverage limits. Counts may overlap; they are not an ETA. */
export function intakeProgress(tasks: ReadTask[], units: SourceUnit[], links: LinkRecord[], proposals: Proposal[], terminal: Set<string>) {
    const verifiedRequests = new Set(proposals.filter(verifiedCapture).map(p => p.id));
    const pendingCaptures = proposals.filter(p => p.status !== 'rejected' && !verifiedRequests.has(p.id)).length;
    const pendingReads = tasks.filter(t => t.status !== 'complete').length + links.filter(l => l.state === 'pending' || l.state === 'needs-attention').length;
    const terminalDeferrals = units.filter(u => u.state === 'deferred' && terminal.has(unitKey(u))).length;
    const unresolvedSources = units.filter(u => u.state === 'deferred' && !terminal.has(unitKey(u)) || u.state === 'error' || u.state === 'pending' && (!u.requests.length || u.requests.some(id => !verifiedRequests.has(id)))).length;
    const needsAttention = tasks.some(t => t.status === 'needs-attention') || links.some(l => l.state === 'needs-attention') || proposals.some(p => p.status === 'unresolved' || p.status === 'captured' && !verifiedCapture(p)) || units.some(u => u.state === 'error') || unresolvedSources > 0 && pendingReads === 0 && pendingCaptures === 0;
    const gaps = units.filter(u => u.state === 'inaccessible').length + terminalDeferrals + links.filter(l => l.state === 'deferred').length + units.reduce((n, u) => n + u.references.filter(r => r.kind === 'internal').length, 0);
    return { pendingReads, pendingCaptures, unresolvedSources, needsAttention, gaps, outstanding: pendingReads + pendingCaptures + unresolvedSources };
}
