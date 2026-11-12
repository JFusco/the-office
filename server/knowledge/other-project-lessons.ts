import type { KnowledgeContext } from './context';
import { PACKET_LIMIT, type RetrospectivePacket } from './retrospective-facts';

const LIMIT = 30;

/** Newest active guidance from the other projects. Read-only; Harper may only ask to share one. */
export function otherProjectLessons(context: KnowledgeContext, project: string): NonNullable<RetrospectivePacket['elsewhere']> {
    return [...context.stores].filter(([id]) => id !== project).flatMap(([id, store]) => (store.state.knowledge?.lessons || [])
        .filter(lesson => lesson.status === 'active' && lesson.tier !== 'hypothesis')
        .map(lesson => ({ project: id, id: lesson.id, when: lesson.when, statement: lesson.statement, at: lesson.createdAt })))
        .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0, LIMIT).map(({ at: _at, ...lesson }) => lesson);
}

/** Adds the newest entries that still fit the packet budget. */
export function withElsewhere(packet: RetrospectivePacket, elsewhere: NonNullable<RetrospectivePacket['elsewhere']>): RetrospectivePacket {
    for (let kept = elsewhere.length; ; kept--) {
        const next = structuredClone(packet);
        next.elsewhere = elsewhere.slice(0, kept);
        if (kept < elsewhere.length) next.omitted.elsewhere = elsewhere.length - kept;
        const text = JSON.stringify(next);
        if (!kept || text.length <= PACKET_LIMIT && Buffer.byteLength(text) <= 65536) return next;
    }
}
