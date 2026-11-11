import type { Lesson } from '../../src/shared';
import type { Store } from '../store/store';
import type { command } from '../workers/process';
import { easternDay } from '../office/clock';
import { enqueueRequest } from '../scheduling/requests';

function retire(store: Store, lesson: Lesson, retiredBy: 'expired' | 'graduated', reason: string): void {
    store.transition('lesson-retired', `Lesson ${reason}: ${lesson.statement}`, () => {
        const now = store.clock.now().toISOString();
        Object.assign(lesson, { revision: (lesson.revision || 1) + 1, status: 'retired', retiredAt: now, retiredBy, updatedAt: now });
    }, 'knowledge');
}

/** A lesson tied to a ticket, version or temporary condition leaves prompts the day after its end date. Reversible by reactivating. */
export function expireLessons(store: Store): void {
    const today = easternDay(store.clock.now());
    for (const lesson of store.state.knowledge?.lessons || [])
        if (lesson.status === 'active' && lesson.validUntil && lesson.validUntil < today) retire(store, lesson, 'expired', `expired on ${lesson.validUntil}`);
}

/** Once a day, asks the harness to read back the issues filed for lessons. Nothing is queued when no lesson has one. */
export function queueLessonIssueCheck(store: Store): void {
    const knowledge = store.state.knowledge, today = easternDay(store.clock.now());
    if (!knowledge?.enabled || store.state.paused || store.state.draining || knowledge.issueCheckDay === today) return;
    if (!knowledge.lessons.some(lesson => lesson.status === 'active' && lesson.repositoryInstruction?.status === 'filed')) return;
    knowledge.issueCheckDay = today;
    enqueueRequest(store, 'check-lesson-issues');
}

/**
 * A lesson whose repository issue closed as completed now lives in the repository (a rule, a test or a harness
 * check), so it stops being supplied. A read-only provider read; an unreadable issue leaves the lesson active.
 */
export async function graduateLessons(store: Store, execute: typeof command): Promise<void> {
    for (const lesson of [...(store.state.knowledge?.lessons || [])]) {
        const url = lesson.repositoryInstruction?.issueUrl;
        if (lesson.status !== 'active' || lesson.repositoryInstruction?.status !== 'filed' || !url) continue;
        let issue: { state?: string; stateReason?: string };
        try { issue = JSON.parse(await execute('gh', ['issue', 'view', url, '--json', 'state,stateReason'], { cwd: store.project.repo, timeout: 60000, readOnly: true })); }
        catch { continue; }
        if (issue.state === 'CLOSED' && issue.stateReason === 'COMPLETED') retire(store, lesson, 'graduated', `graduated into the repository (${url})`);
    }
}
