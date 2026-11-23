import type { LearningSubject } from '../../src/contracts/knowledge';
import type { Store } from '../store/store';

/**
 * Removes the lesson batch queued for a subject there turned out to be nothing to learn from, so Harper does not
 * spend a retrospective on it. A batch whose retrospective is already under way (frozen) is left to finish.
 * Returns how many were removed.
 */
export function dropPendingLessons(store: Store, subject: LearningSubject): number {
    const knowledge = store.state.knowledge;
    if (!knowledge?.pending?.length) return 0;
    const kept = knowledge.pending.filter(batch => batch.trigger !== 'learning' || batch.frozen || batch.source?.kind !== subject.kind || batch.source.id !== subject.id);
    const dropped = knowledge.pending.length - kept.length;
    if (dropped) knowledge.pending = kept;
    return dropped;
}
