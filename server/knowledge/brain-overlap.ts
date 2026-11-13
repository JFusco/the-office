import type { KnowledgeContext } from './context';
import type { PendingRetrospective } from '../../src/contracts/knowledge';
import type { RetrospectiveSubject } from './retrospective-subject';
import { PACKET_LIMIT, type RetrospectivePacket } from './retrospective-facts';
import { retrieve } from './retrieval';

export type BrainOverlap = NonNullable<RetrospectivePacket['brain']>;

const QUERY = 2000, NOTES = 5, SUMMARY = 200, SECTION = 1500;
const clip = (text: string, limit: number) => text.length <= limit ? text : `${text.slice(0, limit)}…`;

/** What this retrospective is about, in words Brain search can match. Pure. */
export function brainOverlapQuery(subject: Pick<RetrospectiveSubject, 'stage' | 'detail'>, pending: Pick<PendingRetrospective, 'event' | 'opportunities'>): string {
    const opportunities = (pending.opportunities || []).slice(-3).map(event => `${event.stage} ${event.summary}`);
    return [subject.stage, subject.detail, pending.event?.reason || '', ...opportunities].map(part => part.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ').slice(0, QUERY);
}

/** Brain notes related to this work, so Harper does not restate general guidance as an Office lesson.
 * Brain being unavailable is not an error: the retrospective runs without the section. */
export async function brainOverlap(context: KnowledgeContext, project: string, query: string): Promise<BrainOverlap | undefined> {
    if (!query.trim()) return;
    const found = await retrieve(context, project, query, { technicalOnly: true });
    if (found.technicalStatus !== 'available' || !found.snapshot || !found.technical.length) return;
    const notes: BrainOverlap['notes'] = [];
    for (const hit of found.technical.slice(0, NOTES)) {
        const note = { path: hit.reference.path || hit.citation, title: clip(hit.title, SUMMARY), summary: clip(hit.excerpt.replace(/\s+/g, ' ').trim(), SUMMARY) };
        if (JSON.stringify([...notes, note]).length > SECTION) break;
        notes.push(note);
    }
    return notes.length ? { snapshot: found.snapshot, notes } : undefined;
}

/** Adds the section within the packet budget. Brain notes are never catalog evidence, so no lesson can cite one. */
export function withBrainOverlap(packet: RetrospectivePacket, overlap: BrainOverlap | undefined): RetrospectivePacket {
    if (!overlap?.notes.length) return packet;
    for (let kept = overlap.notes.length; kept > 0; kept--) {
        const next = structuredClone(packet);
        next.brain = { snapshot: overlap.snapshot, notes: overlap.notes.slice(0, kept) };
        if (kept < overlap.notes.length) next.omitted.brain = overlap.notes.length - kept;
        if (fits(next)) return next;
    }
    // Optional metadata never invalidates accepted evidence: the marker is recorded only when it still fits.
    const omitted = { ...packet, omitted: { ...packet.omitted, brain: overlap.notes.length } };
    return fits(omitted) ? omitted : packet;
}

const fits = (packet: RetrospectivePacket) => { const text = JSON.stringify(packet); return text.length <= PACKET_LIMIT && Buffer.byteLength(text) <= 65536; };
