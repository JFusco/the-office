import type { KnowledgeContext } from './context';
import { lessonVisible } from './sources/lesson-visibility';
import type { RetrospectivePacket } from './retrospective-facts';

const LIMIT = 30;
/** Newest active guidance from the other projects that this project may see. Read-only; Harper may only ask to share one. */
export function otherProjectLessons(context: KnowledgeContext, project: string): NonNullable<RetrospectivePacket['elsewhere']> {
    return [...context.stores].filter(([id]) => id !== project).flatMap(([id, store]) => (store.state.knowledge?.lessons || [])
        .filter(lesson => lesson.status === 'active' && lesson.tier !== 'hypothesis' && lessonVisible(context.registry, project, lesson))
        .map(lesson => ({ project: id, id: lesson.id, when: lesson.when, statement: lesson.statement, at: lesson.createdAt })))
        .sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id)).slice(0, LIMIT).map(({ at: _at, ...lesson }) => lesson);
}
