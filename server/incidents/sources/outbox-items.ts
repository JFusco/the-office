import type { ExpectedWait } from '../../../src/contracts/incidents';
import type { OfficeSnapshot } from '../../../src/shared';
import { projectOutbox } from '../../conversations/outbox';
import { touchesUnsettled } from '../../operations/stale-records';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';
import { stoppedCoverage } from '../stopped-coverage';
import { outboxCoverage } from './outbox-coverage';
import { stoppedRecord } from './stopped-record';
import { stoppedWork } from './stopped-work';

/** Outbox items another collector already reads from their source record. */
const COVERED = ['ticket-job', 'checkpoint', 'maintenance', 'maintenance-blocker', 'assignment-listener', 'intake', 'azure', 'github', 'message', 'merge-notice', 'merge-approval'];
/** Outbox items that stand for records stopped work may already hold; they are kept only while it does not. */
const FALLBACK = ['ticket', 'assignment', 'ownership-capability'];
/** Outbox items that are a person's own step, by the kind of item. */
const EXPECTED: Record<string, ExpectedWait> = { question: 'question', merge: 'merge-approval', time: 'uncertain-effect', 'lesson-digest': 'decision', 'lesson-issue': 'decision', 'office-lesson': 'decision' };

/** The record behind a ticket's or intake review's item, which binds its subject. */
function fallbackRecord(state: OfficeSnapshot, projectId: string, itemId: string) {
    const [kind, ...rest] = itemId.split(':');
    if (kind === 'ticket') return stoppedRecord(state, { projectId, kind: 'delivery', id: `ticket:${rest[0]}` }, '');
    return kind === 'assignment' ? stoppedRecord(state, { projectId, kind: 'intake', id: rest.join(':') }, '') : null;
}

/**
 * Whatever else the Office is asking a person about: open outbox items no other collector reads
 * from their own record, so nothing put in front of Joe is missing from the ledger. Only the
 * item's title is kept. The title is the Office's own wording; the detail can quote a conversation.
 * An item has no stop marker of its own: it is one episode until it is resolved and comes back.
 *
 * A ticket's, an intake review's and the capability summary's items are kept only while stopped work
 * holds none of their records (see `outboxCoverage`), and a kept ticket or review item is bound to its
 * record: its saved stop, head and last run, which it takes in, and the record's unsettled writes.
 */
export const outboxItems: IncidentCollector = observation => {
    const { projectId, provider, state, unsettled, now } = observation;
    // Read directly, the collector reads stopped work itself; the sync supplies what stopped work reported this pass.
    const covered = observation.covered ?? stoppedCoverage(observation, stoppedWork(observation), [], new Set());
    return projectOutbox(state, now)
        .filter(item => {
            const kind = item.id.split(':')[0];
            if (item.status !== 'open') return false;
            // A ticket or intake review stopped work does not hold, such as a blocked mailbox epic or a review whose job took over, has no other reader.
            return FALLBACK.includes(kind) ? !outboxCoverage(state, projectId, item.id, covered) : !COVERED.includes(kind);
        })
        .map(item => {
            const kind = item.id.split(':')[0], record = fallbackRecord(state, projectId, item.id);
            return {
                // An hours item is in the outbox only while its write is unconfirmed.
                subject: { projectId, kind: 'outbox', id: item.id, episode: '', stage: kind, stop: record?.stop ?? null, lastWorker: record?.lastWorker ?? '', head: record?.head ?? '', unsettledEffect: kind === 'time' || !!record && touchesUnsettled(unsettled, record.effects) },
                // A ticket's or review's title is the same template for every one of them; what stopped it is in a detail of unrecorded origin.
                cause: { source: 'outbox' as const, provider, stage: kind, kind, ...(['ticket', 'assignment'].includes(kind) ? { text: '', author: 'unknown' as const } : { text: normalizeCause(item.title), author: 'harness' as const }) },
                expected: EXPECTED[kind] ?? null,
                evidence: boundedEvidence(item.title),
                ...(record ? { absorbs: record.covers.filter(([kind]) => kind === 'worker').map(([kind, id]) => `${projectId}/${kind}/${id}`) } : {}),
            };
        });
};
