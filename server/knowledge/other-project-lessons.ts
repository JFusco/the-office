import type { KnowledgeSourceBinding } from '../../src/contracts/knowledge';
import type { KnowledgeContext } from './context';
import { lessonVisible } from './sources/lesson-visibility';
import { proofBindings } from './sources/proof-scope';
import { PACKET_LIMIT, type RetrospectivePacket } from './retrospective-facts';

const LIMIT = 30;
const unique = (bindings: KnowledgeSourceBinding[]) => [...new Map(bindings.map(binding => [JSON.stringify(binding), binding])).values()];

/** Newest active guidance from the other projects that this project may see. Read-only; Harper may only ask to share one. */
export function otherProjectLessons(context: KnowledgeContext, project: string): NonNullable<RetrospectivePacket['elsewhere']> {
    return [...context.stores].filter(([id]) => id !== project).flatMap(([id, store]) => (store.state.knowledge?.lessons || [])
        .filter(lesson => lesson.status === 'active' && lesson.tier !== 'hypothesis' && lessonVisible(context.registry, project, lesson))
        .map(lesson => { const sourceBindings = unique(lesson.evidence.flatMap(proofBindings)); return { project: id, id: lesson.id, when: lesson.when, statement: lesson.statement, ...(sourceBindings.length ? { sourceBindings } : {}), at: lesson.createdAt }; }))
        .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0, LIMIT).map(({ at: _at, ...lesson }) => lesson);
}

/**
 * Adds the newest entries that still fit the packet budget once `finish` has run. Their source dependencies join
 * every catalog proof, so scans, revocation checks and derived lessons carry them as they do for activeLessons.
 */
export function withElsewhere(packet: RetrospectivePacket, elsewhere: NonNullable<RetrospectivePacket['elsewhere']>, finish: (packet: RetrospectivePacket) => RetrospectivePacket): RetrospectivePacket {
    for (let kept = elsewhere.length; ; kept--) {
        const next = structuredClone(packet), entries = elsewhere.slice(0, kept), bindings = unique(entries.flatMap(entry => entry.sourceBindings || []));
        next.elsewhere = entries;
        if (kept < elsewhere.length) next.omitted.elsewhere = elsewhere.length - kept;
        if (bindings.length) for (const proof of Object.values(next.catalog)) proof.sourceBindings = unique([...(proof.sourceBindings || []), ...bindings]);
        const built = finish(next), text = JSON.stringify(built);
        if (!kept || text.length <= PACKET_LIMIT && Buffer.byteLength(text) <= 65536) return built;
    }
}
