import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Incident, IncidentDismissal } from '../../src/contracts/incidents';
import { CitationSchema, citationFault, type SourceVersions } from './cited-sources';
import { redactEvidence } from './redact-evidence';
import { repairSubject } from './subject-digest';
import { nextState } from './transitions';

/** The most source files one verdict cites. */
export const DISMISSAL_CITATIONS = 20;
export const DISMISSAL_REASON = 1000;

export const DismissalSchema = z.object({
    /** Already in its stored form: one line, at most DISMISSAL_REASON characters, credentials removed (see storedReason). */
    reason: z.string().min(1).max(DISMISSAL_REASON).regex(/^[^\r\n\u2028\u2029]*$/, 'A stored reason is one line'),
    /** SHA-256 of the reason exactly as it was sent. */
    reasonDigest: z.string().regex(/^[0-9a-f]{64}$/),
    /** The digest of the evidence packet the verdict was formed on. */
    packet: z.string().regex(/^[0-9a-f]{64}$/),
    cited: z.array(CitationSchema).min(1).max(DISMISSAL_CITATIONS),
}).strict();
export type DismissalRequest = z.infer<typeof DismissalSchema>;

/**
 * A verdict's words as they are kept: credentials removed, the first line only, and never longer
 * than DISMISSAL_REASON. Storing a stored reason again changes nothing.
 */
export function storedReason(sent: string): string {
    const first = sent.split(/[\r\n\u2028\u2029]/).map(part => part.trim()).find(part => part) ?? '';
    const line = redactEvidence(first);
    if (line.length <= DISMISSAL_REASON) return line;
    let cut = line.slice(0, DISMISSAL_REASON - 1);
    // A cut can split a redaction marker or part a credential's name from its value; whole words are dropped until redacting the result changes nothing.
    while (cut && redactEvidence(`${cut}…`) !== `${cut}…`) cut = cut.replace(/\s*\S*$/, '');
    return `${cut}…`;
}

/**
 * The request a dismissal is recorded and compared as. The reason is kept as evidence only, in
 * its stored form; the digest of what was actually sent travels with it, so a second send with
 * other words is a different request even when its first line is the same.
 */
export function dismissalRequest(sent: { reason: string; packet: string; cited: DismissalRequest['cited'] }): DismissalRequest {
    return { reason: storedReason(sent.reason), reasonDigest: createHash('sha256').update(sent.reason).digest('hex'), packet: sent.packet, cited: sent.cited };
}

/** What the Office itself established for a dismissal: the code it runs and the packet it would hand out now. */
export interface DismissalFacts { loadedHash: string; versions: SourceVersions; packet: string }

/**
 * A verdict that the stop is correct, remembered against exactly what it judged: the packet it
 * read, the source files it cites as they run now, and the subjects open at this revision. It is
 * refused when it was formed on other evidence than the Office holds now, or cites code the
 * service does not run. The verdict's words are kept as evidence and decide nothing.
 */
export function dismiss(incident: Incident, eventId: string, request: DismissalRequest, facts: DismissalFacts, at: string): { next: Incident; body: Record<string, unknown> } {
    const state = nextState(incident.state, 'dismissed'), { reason, reasonDigest, packet, cited } = DismissalSchema.parse(request);
    if (reason !== storedReason(reason)) throw new Error('A dismissal reason is recorded in its stored form: one line with credentials removed');
    if (packet !== facts.packet) throw new Error(`Packet ${packet.slice(0, 12)} is not the evidence of incident ${incident.id} as it stands; read the evidence again`);
    for (const citation of cited) {
        const fault = citationFault(citation, facts.versions);
        if (fault) throw new Error(`A dismissal cites code the service does not run: ${fault}`);
    }
    const dismissal: IncidentDismissal = { event: eventId, reason, reasonDigest, packet, cited, subjects: incident.subjects.filter(subject => subject.status === 'open').map(repairSubject), loadedHash: facts.loadedHash, dismissedAt: at };
    return { next: { ...incident, state, dismissals: [...incident.dismissals ?? [], dismissal] }, body: { dismissal, from: incident.state, to: state } };
}
