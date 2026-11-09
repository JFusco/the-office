import type { PendingRetrospective } from '../../src/contracts/knowledge';
import type { RetrospectivePacket } from './retrospective-facts';
/** Accepted evidence is copied at its owner boundary; model paths are never followed. */
export function appendLearningFacts(packet: RetrospectivePacket, pending: PendingRetrospective): RetrospectivePacket {
    const next = structuredClone(packet), retained: string[] = [];
    // Saved steps and filenames do not establish owner acceptance. Keep only harness
    // identity references from the legacy packet; accepted content comes from events below.
    const identities = new Set([`${next.job.kind}:${next.job.id}`, `pr:${next.job.id}:${next.job.pr}`]);
    for (const ref of Object.keys(next.catalog)) if (!identities.has(ref)) delete next.catalog[ref];
    next.omitted.uncataloguedSteps = next.steps.length;
    next.steps = [];
    if (next.maintenance) {
        next.omitted.uncataloguedArtifacts = next.maintenance.artifacts.length;
        next.omitted.uncataloguedLedgers = next.maintenance.steps.length;
        delete next.maintenance;
    }
    next.omitted.learningEvents = pending.omittedEvents || 0;
    let excerpts = 0;
    for (const event of (pending.opportunities || []).slice(-20).reverse()) {
        for (const evidence of event.evidence) {
            if (excerpts >= 8) { next.omitted.learningEvidence = (next.omitted.learningEvidence || 0) + 1; continue; }
            next.catalog[evidence.ref] = { ...evidence, detail: `${event.stage} · ${event.disposition} · ${event.at} · sha256 ${event.digest}\n${evidence.detail}`.slice(0, 1500) };
            retained.push(evidence.ref); excerpts++;
        }
    }
    // Triggering accepted evidence outranks ancillary histories. Every lost citation is removed.
    for (const section of ['conversation', 'notes', 'timing', 'decisions', 'ciRepairs', 'activeLessons', 'steps'] as const) {
        while (JSON.stringify(next).length > 24000 && next[section].length) {
            const removed = next[section].shift() as { ref?: string; findings?: { ref: string }[] };
            if (removed.ref) delete next.catalog[removed.ref];
            for (const finding of removed.findings || []) delete next.catalog[finding.ref];
            next.omitted[section] = (next.omitted[section] || 0) + 1;
        }
    }
    for (const ref of Object.keys(next.catalog).sort((a, b) => Number(retained.includes(a)) - Number(retained.includes(b)))) {
        if (JSON.stringify(next).length <= 24000) break;
        delete next.catalog[ref]; next.omitted.learningEvidence = (next.omitted.learningEvidence || 0) + 1;
    }
    if (JSON.stringify(next).length > 24000) throw new Error('Learning packet exceeds its evidence budget');
    return next;
}
