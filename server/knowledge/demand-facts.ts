import type { KnowledgeState, LearningSubject, LessonReference } from '../../src/contracts/knowledge';
import type { KnowledgeLookupSummary } from '../../src/contracts/knowledge-lookups';
import type { KnowledgeReference } from '../../src/contracts/knowledge-retrieval';
import type { MissedQuery } from './lookup/missed-queries';
import { PACKET_LIMIT, type RetrospectivePacket } from './retrospective-facts';

/** Initial engineering defaults, not measured optima. */
export const DEMAND_LIMIT = 3000;
const ASSIGNMENTS = 12, LESSONS = 20, OMITTED = 10, NOTES = 10, QUERIES = 5, STATEMENT = 120, PATH = 160;

type LessonKey = Pick<LessonReference, 'scope' | 'id'>;
/**
 * What the harness supplied to one subject's assignments, what accepted results cited and what the
 * workers looked up. History for Harper, never a score: a missing citation does not show a lesson went unused.
 */
export interface DemandSection {
    /** Briefed assignments considered: the newest dispatched ones for this subject. */
    assignments: number;
    /** `statement` is the lesson's current wording, for recognition; the supplied revision is `revision`. */
    supplied: (LessonReference & { statement: string; assignments: number })[];
    /** Eligible lessons left out of a prompt by its count or character limit. */
    omitted: (LessonKey & { reason: 'count-limit' | 'character-limit' })[];
    cited: (LessonReference & { stage: string })[];
    /** Brain note paths. */
    brain: { supplied: string[]; retrieved: string[]; cited: string[] };
    lookups: { made: number; served: number; unanswered: number; unrecorded: number };
    /** Untrusted worker text; never evidence for a lesson. */
    unanswered: (MissedQuery & { stage: string })[];
}

const key = (ref: LessonKey) => `${ref.scope}:${ref.id}`;
const clip = (text: string) => text.length <= STATEMENT ? text : `${text.slice(0, STATEMENT - 1)}…`;
const notes = (references: KnowledgeReference[]) => [...new Set(references.filter(reference => reference.kind === 'brain').map(reference => (reference.path || reference.id).slice(0, PATH)))].slice(0, NOTES);

/** Each list is capped here; `withDemand` enforces the character budget. `missed` reads query text and is injected so this stays free of the filesystem. */
export function demandFacts(knowledge: KnowledgeState | undefined, subject: LearningSubject, missed: (summary: KnowledgeLookupSummary) => MissedQuery[] = () => []): DemandSection | undefined {
    const exposures = (knowledge?.exposures || []).filter(exposure => exposure.dispatchedAt && exposure.subject?.kind === subject.kind && exposure.subject.id === subject.id)
        .sort((a, b) => b.dispatchedAt!.localeCompare(a.dispatchedAt!) || a.id.localeCompare(b.id)).slice(0, ASSIGNMENTS);
    if (!knowledge || !exposures.length) return undefined;
    const ids = new Set(exposures.map(exposure => exposure.id));
    const lessons = [...knowledge.lessons, ...(knowledge.officeLessons || [])];
    const outcomes = (knowledge.outcomes || []).filter(outcome => ids.has(outcome.assignmentId)).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
    const summaries = (knowledge.lookups || []).filter(summary => ids.has(summary.id)).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
    const records = summaries.flatMap(summary => summary.records);

    const supplied = new Map<string, DemandSection['supplied'][number]>();
    for (const exposure of exposures) for (const ref of exposure.selected) {
        const entry = supplied.get(key(ref));
        if (entry) { entry.assignments++; entry.revision = Math.max(entry.revision, ref.revision); }
        else supplied.set(key(ref), { scope: ref.scope, id: ref.id, revision: ref.revision, statement: clip(lessons.find(lesson => key(lesson) === key(ref))?.statement || ''), assignments: 1 });
    }
    const omitted = new Map<string, DemandSection['omitted'][number]>();
    for (const exposure of exposures) for (const ref of exposure.omitted) if (!omitted.has(key(ref))) omitted.set(key(ref), { scope: ref.scope, id: ref.id, reason: ref.reason });
    const cited = new Map<string, DemandSection['cited'][number]>();
    for (const outcome of outcomes) for (const ref of [...outcome.lessons, ...outcome.evidence.flatMap(reference => reference.lesson ? [reference.lesson] : [])])
        cited.set(`${key(ref)}@${ref.revision}:${outcome.stage}`, { scope: ref.scope, id: ref.id, revision: ref.revision, stage: outcome.stage });

    return {
        assignments: exposures.length,
        supplied: [...supplied.values()].sort((a, b) => b.assignments - a.assignments || key(a).localeCompare(key(b))).slice(0, LESSONS),
        omitted: [...omitted.values()].slice(0, OMITTED),
        cited: [...cited.values()].slice(0, LESSONS),
        brain: {
            supplied: notes(exposures.flatMap(exposure => (exposure.evidence || []).map(item => item.reference))),
            retrieved: notes(records.filter(record => record.outcome === 'served').flatMap(record => record.selected.map(item => item.reference))),
            cited: notes(outcomes.flatMap(outcome => outcome.evidence)),
        },
        lookups: { made: records.length, served: records.filter(record => record.outcome === 'served').length, unanswered: records.filter(record => record.outcome === 'unavailable').length, unrecorded: summaries.filter(summary => summary.recordingUnavailable).length },
        unanswered: summaries.flatMap(summary => missed(summary).map(query => ({ stage: summary.stage, ...query }))).slice(0, QUERIES),
    };
}

/** Room `withElsewhere` needs afterwards for an empty list and its omission count; it adds both without a budget check. */
const ELSEWHERE_RESERVE = 64;

/**
 * Adds the section when it fits the packet budget. Unanswered queries go first: they are untrusted text,
 * and supplied and cited history outranks them. The other lists are then cut to a floor, widest first,
 * then emptied. A packet with no room keeps its accepted evidence and records the omission when even that fits.
 */
export function withDemand(packet: RetrospectivePacket, demand: DemandSection | undefined): RetrospectivePacket {
    if (!demand) return packet;
    const fitted = structuredClone(demand);
    const within = (candidate: RetrospectivePacket) => { const text = JSON.stringify(candidate); return text.length <= PACKET_LIMIT - ELSEWHERE_RESERVE && Buffer.byteLength(text) <= 65536 - ELSEWHERE_RESERVE; };
    const build = (dropped: number) => { const next = structuredClone(packet); next.demand = fitted; if (dropped) next.omitted.demand = dropped; return next; };
    const fits = (dropped: number) => JSON.stringify(fitted).length <= DEMAND_LIMIT && within(build(dropped));
    const { brain } = fitted;
    const passes: [unknown[], number][] = [
        [fitted.unanswered, 0], [fitted.supplied, 6], [fitted.cited, 6], [fitted.omitted, 3], [brain.supplied, 3], [brain.retrieved, 3], [brain.cited, 3],
        [brain.supplied, 0], [brain.retrieved, 0], [brain.cited, 0], [fitted.omitted, 0], [fitted.cited, 0], [fitted.supplied, 0],
    ];
    let dropped = 0;
    for (const [list, floor] of passes) while (list.length > floor && !fits(dropped)) { list.pop(); dropped++; }
    if (fits(dropped)) return build(dropped);
    const marked = structuredClone(packet);
    marked.omitted.demand = dropped || 1;
    return within(marked) ? marked : packet;
}
