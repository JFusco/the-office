import type { KnowledgeState } from '../../../src/shared';
import type { LessonSelection } from '../lesson-selection';
import { proofBindings } from '../sources/proof-scope';

const SHOWN = 4, LENGTH = 90;
/** One line naming knowledge that exists but was not supplied, so a worker knows what a lookup can return. */
export function catalogLine(knowledge: KnowledgeState | undefined, supplied: Pick<LessonSelection, 'selected'>): string {
    const given = new Set(supplied.selected.map(ref => `${ref.scope}:${ref.id}`));
    // Source-derived lessons are never named here; the lookup still returns them where they are visible.
    const others = [...(knowledge?.lessons || []), ...(knowledge?.officeLessons || [])]
        .filter(lesson => lesson.status === 'active' && lesson.tier !== 'hypothesis' && !given.has(`${lesson.scope}:${lesson.id}`) && !lesson.evidence.some(proof => proofBindings(proof).length));
    const topics = others.slice(-SHOWN).map(lesson => (lesson.when || lesson.statement).slice(0, LENGTH));
    return `ALSO AVAILABLE BY LOOKUP: Brain technology notes (frameworks and CMS platforms)${others.length ? `, and ${others.length} more ${others.length === 1 ? 'lesson' : 'lessons'} for other stages, for example: ${topics.join(' | ')}` : ''}.`;
}
