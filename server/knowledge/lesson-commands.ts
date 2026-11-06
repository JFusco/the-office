import type { Store } from '../store/store';
import { visibleTriggerIds } from './retrospective-triggers';

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
            knowledge.consumed = [...new Set([...knowledge.consumed, ...visibleTriggerIds(store.state.coordination?.jobs || []).filter(id => !pending.has(id))])];
        }
        knowledge.enabled = enabled;
    }, 'knowledge');
}
