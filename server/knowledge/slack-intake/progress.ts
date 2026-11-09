import type { ReadTask, SourceUnit, Proposal } from './contracts';
import type { LinkRecord } from './read-links';
/** Actionable work is separate from terminal coverage limits. Counts may overlap; they are not an ETA. */
export function intakeProgress(tasks: ReadTask[], units: SourceUnit[], links: LinkRecord[], proposals: Proposal[]) {
    const verified = (p: Proposal) => p.status === 'captured' && p.receipt?.found === true && p.receipt.requestId === p.id && p.receipt.inputSha256 === p.hash && p.receipt.domain === p.domain && typeof p.receipt.id === 'string';
    const verifiedRequests = new Set(proposals.filter(verified).map(p => p.id));
    const pendingCaptures = proposals.filter(p => p.status !== 'rejected' && !verifiedRequests.has(p.id)).length;
    const pendingReads = tasks.filter(t => t.status !== 'complete').length + links.filter(l => l.state === 'pending' || l.state === 'needs-attention').length;
    const unresolvedSources = units.filter(u => u.state === 'deferred' || u.state === 'error' || u.state === 'pending' && (!u.requests.length || u.requests.some(id => !verifiedRequests.has(id)))).length;
    const needsAttention = tasks.some(t => t.status === 'needs-attention') || links.some(l => l.state === 'needs-attention') || proposals.some(p => p.status === 'unresolved' || p.status === 'captured' && !verified(p)) || units.some(u => u.state === 'error') || unresolvedSources > 0 && pendingReads === 0 && pendingCaptures === 0;
    const gaps = units.filter(u => u.state === 'inaccessible').length + links.filter(l => l.state === 'deferred').length + units.reduce((n, u) => n + u.references.filter(r => r.kind === 'internal').length, 0);
    return { pendingReads, pendingCaptures, unresolvedSources, needsAttention, gaps, outstanding: pendingReads + pendingCaptures + unresolvedSources };
}
