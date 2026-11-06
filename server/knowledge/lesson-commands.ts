import type { Store } from '../store/store';
import { visibleTicketTriggerIds, visibleTriggerIds } from './retrospective-triggers';

/** Retiring removes a lesson from future prompts. Idempotent; retired lessons are kept for history. */
export function retireLesson(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson) throw new Error('Lesson not found in this project');
    if (lesson.status === 'retired') return;
    store.transition('lesson-retired', `Lesson retired: ${lesson.statement}`, () => {
        const now = store.clock.now().toISOString();
        Object.assign(lesson, { status: 'retired', retiredAt: now, retiredBy: 'human', updatedAt: now });
    }, 'knowledge');
}

/** Turning retrospectives off stops new runs; turning them back on does not replay what finished meanwhile. */
export function configureKnowledge(store: Store, input: unknown): void {
    const enabled = (input as { enabled?: unknown } | null)?.enabled;
    if (typeof enabled !== 'boolean') throw new Error('Invalid knowledge setting');
    const knowledge = store.state.knowledge;
    if (!knowledge) throw new Error('Knowledge is unavailable for this project');
    if (knowledge.enabled === enabled) return;
    store.transition('knowledge-configured', enabled ? 'Harper retrospectives turned on.' : 'Harper retrospectives turned off; queued retrospectives wait.', () => {
        if (enabled) {
            const pending = new Set(knowledge.pending.map(entry => entry.id));
            knowledge.consumed = [...new Set([...knowledge.consumed, ...[...visibleTriggerIds(store.state.coordination?.jobs || []), ...visibleTicketTriggerIds(store.state.tickets)].filter(id => !pending.has(id))])];
        }
        knowledge.enabled = enabled;
    }, 'knowledge');
}

/** Puts a "not working" lesson back into prompts; its recurrence count starts over. */
export function reactivateLesson(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson) throw new Error('Lesson not found in this project');
    if (lesson.status === 'active') return;
    store.transition('lesson-reactivated', `Lesson reactivated: ${lesson.statement}`, () => {
        const now = store.clock.now().toISOString();
        Object.assign(lesson, { status: 'active', recurrences: [], reactivatedAt: now, updatedAt: now, retiredAt: undefined, retiredBy: undefined });
    }, 'knowledge');
}

/** Joe declines Harper's AGENTS.md suggestion; the lesson itself stays active. */
export function declineLessonIssue(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson?.repositoryInstruction) throw new Error('No AGENTS.md suggestion for this lesson');
    if (lesson.repositoryInstruction.status !== 'proposed') return;
    store.transition('lesson-issue-declined', `AGENTS.md suggestion declined: ${lesson.statement}`, () => { lesson.repositoryInstruction = { status: 'declined' }; }, 'knowledge');
}
