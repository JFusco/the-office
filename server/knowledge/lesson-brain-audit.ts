import type { Lesson } from '../../src/contracts/knowledge';
import type { KnowledgeSearch } from '../../src/contracts/knowledge-retrieval';

export interface LessonBrainOverlap { scope: Lesson['scope']; id: string; statement: string; notes: { path: string; title: string }[] }
export interface LessonBrainAudit { rows: LessonBrainOverlap[]; checked: number; unavailable: number }

const NOTES = 3;

/** Read-only: lists active lessons that have Brain notes on the same topic, for Joe to judge. Changes nothing.
 * `search` is the knowledge search (technical results only are read); a Brain outage is counted, never guessed. */
export async function lessonBrainAudit(lessons: Lesson[], search: (query: string) => Promise<KnowledgeSearch>): Promise<LessonBrainAudit> {
    const audit: LessonBrainAudit = { rows: [], checked: 0, unavailable: 0 };
    for (const lesson of lessons.filter(item => item.status === 'active')) {
        const found = await search(`${lesson.when} ${lesson.statement}`.replace(/\s+/g, ' ').trim().slice(0, 2000));
        audit.checked++;
        if (found.technicalStatus !== 'available') { audit.unavailable++; continue; }
        const notes = found.technical.slice(0, NOTES).map(hit => ({ path: hit.reference.path || hit.citation, title: hit.title }));
        if (notes.length) audit.rows.push({ scope: lesson.scope, id: lesson.id, statement: lesson.statement, notes });
    }
    return audit;
}
