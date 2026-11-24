import { subjectKey, type Incident } from '../../src/contracts/incidents';
import type { ProjectObservation } from './observation';
import { outboxCoverage } from './sources/outbox-coverage';

/**
 * Saved ticket, review and capability items whose records are held by stopped work. When the
 * outbox is unreadable, the caller supplies only fresh reports as coverage. Covered items leave
 * the ledger in this change and give up the runs they held.
 */
export function releasedFallbacks(open: readonly Incident[], { projectId, state }: Pick<ProjectObservation, 'projectId' | 'state'>, covered: ReadonlySet<string>): Set<string> {
    const released = new Set<string>();
    for (const incident of open) if (incident.cause.source === 'outbox') for (const subject of incident.subjects) {
        if (subject.status !== 'open' || subject.projectId !== projectId || subject.kind !== 'outbox') continue;
        try { if (outboxCoverage(state, projectId, subject.id, covered)) released.add(subjectKey(subject)); }
        catch { /* Its records cannot be read: the ordinary freeze holds. */ }
    }
    return released;
}
