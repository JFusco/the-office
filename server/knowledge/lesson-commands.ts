import { proofBindings } from './sources/proof-scope';
import { baselineLearning } from './learning-maintenance';
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
        Object.assign(lesson, { revision: (lesson.revision || 1) + 1, status: 'retired', retiredAt: now, retiredBy: 'human', updatedAt: now });
    }, 'knowledge',undefined,lesson.evidence.flatMap(proofBindings));
}

/** Turning retrospectives off stops new runs; turning them back on does not replay what finished meanwhile. */
export function configureKnowledge(store: Store, input: unknown): void {
    const improvementsEnabled = (input as { improvementsEnabled?: unknown } | null)?.improvementsEnabled;
    if (improvementsEnabled !== undefined && typeof improvementsEnabled !== 'boolean') throw new Error('Invalid improvement setting');
    const enabled = (input as { enabled?: unknown } | null)?.enabled;
    if (typeof enabled !== 'boolean') throw new Error('Invalid knowledge setting');
    const knowledge = store.state.knowledge;
    if (!knowledge) throw new Error('Knowledge is unavailable for this project');
    if (knowledge.enabled === enabled && (improvementsEnabled === undefined || improvementsEnabled === knowledge.improvementGrant?.enabled)) return;
    store.transition('knowledge-configured', enabled ? 'Harper retrospectives turned on.' : 'Harper retrospectives turned off; queued retrospectives wait.', () => {
        if (enabled) {
            const pending = new Set(knowledge.pending.map(entry => entry.id));
            knowledge.consumed = [...new Set([...knowledge.consumed, ...[...visibleTriggerIds(store.state.coordination?.jobs || []), ...visibleTicketTriggerIds(store.state.tickets)].filter(id => !pending.has(id))])];
        }
        baselineLearning(store);
        knowledge.enabled = enabled;
        if (typeof improvementsEnabled === 'boolean' && knowledge.improvementGrant) knowledge.improvementGrant.enabled = improvementsEnabled;
    }, 'knowledge');
}

/** Puts a "not working" lesson back into prompts; a new review interval starts while recurrence evidence is retained. */
export function reactivateLesson(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson) throw new Error('Lesson not found in this project');
    if (lesson.status === 'active' && !lesson.needsReview) return;
    store.transition('lesson-reactivated', `Lesson reactivated: ${lesson.statement}`, () => {
        const now = store.clock.now().toISOString();
        Object.assign(lesson, { revision: (lesson.revision || 1) + 1, needsReview: false, status: 'active', reactivatedAt: now, updatedAt: now, retiredAt: undefined, retiredBy: undefined });
    }, 'knowledge',undefined,lesson.evidence.flatMap(proofBindings));
}

/** Joe declines Harper's AGENTS.md suggestion; the lesson itself stays active. */
export function declineLessonIssue(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string' || !lessonId) throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson?.repositoryInstruction) throw new Error('No AGENTS.md suggestion for this lesson');
    if (lesson.repositoryInstruction.status !== 'proposed') return;
    store.transition('lesson-issue-declined', `AGENTS.md suggestion declined: ${lesson.statement}`, () => { lesson.repositoryInstruction = { status: 'declined' }; }, 'knowledge');
}

/** Explicit operator demotion keeps the evidence but removes advisory prompt delivery. */
export function demoteLesson(store: Store, lessonId: unknown): void {
    if (typeof lessonId !== 'string') throw new Error('Lesson ID is required');
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson || ['rule', 'procedure'].includes(lesson.tier || '')) throw new Error('Only advisory guidance can be demoted');
    if (lesson.tier === 'hypothesis') return;
    store.transition('lesson-demoted', `Guidance kept as a hypothesis: ${lesson.statement}`, () => { lesson.tier = 'hypothesis'; lesson.needsReview = false; lesson.revision = (lesson.revision || 1) + 1; lesson.updatedAt = store.clock.now().toISOString(); }, 'knowledge',undefined,lesson.evidence.flatMap(proofBindings));
}
