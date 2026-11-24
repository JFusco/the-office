import type { LearningSubject } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';

/**
 * Removes the lesson batch queued for a subject there turned out to be nothing to learn from, so Harper does not
 * spend a retrospective on it. A batch whose retrospective holds its claim now is left to finish; one only waiting
 * to retry a failed attempt (frozen, with no claim) is removed. Returns how many were removed.
 */
export function dropPendingLessons(store: Store, subject: LearningSubject): number {
    const knowledge = store.state.knowledge;
    const matches = (batch: NonNullable<typeof knowledge>['pending'][number]) => batch.trigger === 'learning' && batch.source?.kind === subject.kind && batch.source.id === subject.id;
    if (!knowledge?.pending?.some(matches)) return 0;
    const running = new Set(store.activeClaims().filter(claim => claim.work.kind === 'retrospective').map(claim => claim.work.id));
    const kept = knowledge.pending.filter(batch => !matches(batch) || running.has(batch.id));
    const dropped = knowledge.pending.length - kept.length;
    if (dropped) knowledge.pending = kept;
    return dropped;
}
