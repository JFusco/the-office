import { createHash } from 'node:crypto';
import { subjectKey, type EvidencePacket, type Incident, type IncidentEvent, type IncidentSubjectRecord } from '../../src/contracts/incidents';
import type { ReleaseIdentity } from '../office/release-identity';
import { canonical } from './canonical-json';
import { redactEvidence } from './redact-evidence';
import { repairSubject } from './subject-digest';

export const PACKET_SUBJECTS = 50, PACKET_EVENTS = 30, PACKET_RECORDS = 5;
/** The whole packet as JSON, digest included, never exceeds this. */
export const PACKET_BYTES = 256 * 1024;
/** Kept for the packet's own framing and digest, outside the subjects. */
const RESERVED_BYTES = 1024;
const TEXT = 500;

export interface PacketInput {
    incident: Incident;
    /** How many events the incident has, and its most recent ones, oldest first. */
    history: { total: number; recent: Pick<IncidentEvent, 'id' | 'at' | 'kind'>[] };
    loadedHash: string;
    release: ReleaseIdentity;
}

const clip = (text: string, limit = TEXT) => text.length > limit ? `${text.slice(0, limit - 1)}…` : text;
/** Lapse reasons can start with a long subject key. Keep the explanation at the end. */
const clipLapse = (reason: string) => reason.length > TEXT ? `${reason.slice(0, TEXT / 2 - 1)}…${reason.slice(-TEXT / 2)}` : reason;
const bytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value));
/** Credentials removed from every string, before anything is measured or hashed: what is hashed is what is handed out. */
const redacted = <T>(value: T): T => JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'string' ? redactEvidence(item) : item));

/** Open subjects first, then the most recently cleared; ties and open subjects by key, so the order never depends on how they were stored. */
function ordered(subjects: IncidentSubjectRecord[]): IncidentSubjectRecord[] {
    const key = (subject: IncidentSubjectRecord) => subjectKey(subject), byKey = (a: IncidentSubjectRecord, b: IncidentSubjectRecord) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
    const open = subjects.filter(subject => subject.status === 'open').sort(byKey);
    const cleared = subjects.filter(subject => subject.status !== 'open').sort((a, b) => (b.clearedAt ?? '').localeCompare(a.clearedAt ?? '') || byKey(a, b));
    return [...open, ...cleared];
}

/**
 * What the Office knows about one incident, bounded and hashed, for a later verdict to be tied to.
 * Built from the ledger and the running release only; no project store is read. Every list that
 * is cut states its total, and the packet as JSON never exceeds PACKET_BYTES: subjects are taken
 * whole, in order, for as long as they fit. The packet has no time of its own: the same ledger
 * state and release always give the same bytes and the same digest. Credentials are removed from
 * every string before the digest is taken, so the digest is of exactly what is handed out.
 * Wording a provider or a model wrote appears only as bounded evidence; nothing in a packet is an
 * instruction.
 */
export function evidencePacket({ incident, history, loadedHash, release }: PacketInput): EvidencePacket {
    const subjects = ordered(incident.subjects), fixes = incident.fixes ?? [], dismissals = incident.dismissals ?? [];
    const body: Omit<EvidencePacket, 'digest'> = redacted({
        version: 1,
        incident: {
            id: incident.id, fingerprint: incident.fingerprint, state: incident.state, revision: incident.revision,
            cause: incident.cause, expected: incident.expected, research: incident.research,
            firstObservedAt: incident.firstObservedAt, lastObservedAt: incident.lastObservedAt,
        },
        release: release.status === 'verified'
            ? { loadedHash, status: 'verified', commit: release.commit, manifestDigest: release.manifestDigest, operation: release.operation, activatedAt: release.activatedAt, reason: null }
            : { loadedHash, status: 'unknown', commit: null, manifestDigest: null, operation: null, activatedAt: null, reason: release.reason },
        subjects: { total: subjects.length, open: subjects.filter(subject => subject.status === 'open').length, included: [] },
        repair: incident.repair ? { event: incident.repair.event, issue: incident.repair.issue, startedAt: incident.repair.startedAt, subjects: incident.repair.subjects.length } : null,
        fixes: {
            total: fixes.length,
            recent: fixes.slice(-PACKET_RECORDS).map(fix => ({ event: fix.event, commit: fix.commit, pullRequest: fix.pullRequest, onMain: fix.onMain, boundAt: fix.boundAt, bindings: fix.bindings.length, deployed: fix.deployed ?? null })),
        },
        dismissals: {
            total: dismissals.length,
            recent: dismissals.slice(-PACKET_RECORDS).map(dismissal => ({ event: dismissal.event, reason: dismissal.reason, packet: dismissal.packet, cited: dismissal.cited, subjects: dismissal.subjects.length, loadedHash: dismissal.loadedHash, dismissedAt: dismissal.dismissedAt, lapsed: dismissal.lapsed ?? null })),
        },
        events: { total: history.total, recent: history.recent.slice(-PACKET_EVENTS).map(({ id, at, kind }) => ({ id, at, kind })) },
    } satisfies Omit<EvidencePacket, 'digest'>);
    // Bound variable-length metadata after redaction, before allocating any bytes to subjects.
    const { cause, research } = body.incident;
    cause.provider = clip(cause.provider);
    cause.stage = clip(cause.stage);
    cause.kind = clip(cause.kind);
    cause.text = clip(cause.text);
    research.reason = clip(research.reason);
    if (body.release.reason !== null) body.release.reason = clip(body.release.reason);
    if (body.release.operation !== null) body.release.operation = clip(body.release.operation);
    if (body.release.activatedAt !== null) body.release.activatedAt = clip(body.release.activatedAt);
    for (const { lapsed } of body.dismissals.recent) {
        if (lapsed) lapsed.reason = clipLapse(lapsed.reason);
    }
    // Subjects are added whole and in order until the next would not fit; a key or a digest is never cut.
    let room = PACKET_BYTES - RESERVED_BYTES - bytes(body);
    for (const subject of subjects.slice(0, PACKET_SUBJECTS)) {
        const entry = redacted({
            ...repairSubject(subject), projectId: subject.projectId, kind: subject.kind, id: subject.id, status: subject.status,
            stage: subject.stage, stop: subject.stop, lastWorker: subject.lastWorker, head: subject.head, unsettledEffect: subject.unsettledEffect,
            expected: subject.expected, sources: subject.sources, episode: subject.episode, episodeCount: subject.episodeCount,
            openedAt: subject.openedAt, clearedAt: subject.clearedAt, evidence: subject.evidence,
        });
        entry.evidence = clip(entry.evidence);
        const size = bytes(entry) + 1;
        if (size > room) break;
        room -= size;
        body.subjects.included.push(entry);
    }
    const content = canonical(body);
    return { ...(JSON.parse(content) as typeof body), digest: createHash('sha256').update(content).digest('hex') };
}
