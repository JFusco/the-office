import type { Lesson } from '../../src/shared';
import type { Store } from '../store/store';
import type { command } from '../workers/process';
import { easternDay } from '../office/clock';
import { enqueueRequest } from '../scheduling/requests';
import { proofBindings } from './sources/proof-scope';

/** Retires the current record, if it still qualifies; the event keeps the lesson's source dependencies. */
function retire(store: Store, lessonId: string, eligible: (lesson: Lesson) => boolean, retiredBy: 'expired' | 'graduated', reason: string): void {
    const lesson = store.state.knowledge?.lessons.find(item => item.id === lessonId);
    if (!lesson || !eligible(lesson)) return;
    store.transition('lesson-retired', `Lesson ${reason}: ${lesson.statement}`, () => {
        const now = store.clock.now().toISOString();
        Object.assign(lesson, { revision: (lesson.revision || 1) + 1, status: 'retired', retiredAt: now, retiredBy, updatedAt: now });
    }, 'knowledge', undefined, lesson.evidence.flatMap(proofBindings));
}

/** Past its end date and not brought back by Joe after that date. */
const expiring = (today: string) => (lesson: Lesson) => lesson.status === 'active' && !!lesson.validUntil && lesson.validUntil < today
    && !(lesson.reactivatedAt && easternDay(new Date(lesson.reactivatedAt)) > lesson.validUntil);

/** Filed, and not brought back by Joe after its issue closed. A keep-after-source-review before the close does not block graduation. */
const graduating = (url: string, closedAt = '') => (lesson: Lesson) => lesson.status === 'active' && lesson.repositoryInstruction?.status === 'filed' && lesson.repositoryInstruction.issueUrl === url
    && !(closedAt && lesson.reactivatedAt && lesson.reactivatedAt > closedAt);

/** A lesson tied to a ticket, version or temporary condition leaves prompts the day after its end date. Reversible by reactivating. */
export function expireLessons(store: Store): void {
    const eligible = expiring(easternDay(store.clock.now()));
    for (const lesson of [...(store.state.knowledge?.lessons || [])])
        if (eligible(lesson)) retire(store, lesson.id, eligible, 'expired', `expired on ${lesson.validUntil}`);
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
 * Eligibility is checked again against the current record after the read.
 */
export async function graduateLessons(store: Store, execute: typeof command): Promise<void> {
    for (const lesson of [...(store.state.knowledge?.lessons || [])]) {
        const url = lesson.repositoryInstruction?.issueUrl;
        if (!url || !graduating(url)(lesson)) continue;
        let issue: { state?: string; stateReason?: string; closedAt?: string };
        try { issue = JSON.parse(await execute('gh', ['issue', 'view', url, '--json', 'state,stateReason,closedAt'], { cwd: store.project.repo, timeout: 60000, readOnly: true })); }
        catch { continue; }
        if (issue.state === 'CLOSED' && issue.stateReason === 'COMPLETED' && issue.closedAt) retire(store, lesson.id, graduating(url, issue.closedAt), 'graduated', `graduated into the repository (${url})`);
    }
}
