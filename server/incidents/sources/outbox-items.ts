import type { ExpectedWait } from '../../../src/contracts/incidents';
import { projectOutbox } from '../../conversations/outbox';
import { boundedEvidence } from '../bounded-evidence';
import { normalizeCause } from '../normalize-cause';
import type { IncidentCollector } from '../observation';

/** Outbox items another collector already reads from their source record. */
const COVERED = ['ticket-job', 'checkpoint', 'maintenance', 'maintenance-blocker', 'assignment-listener', 'intake', 'azure', 'github', 'message', 'merge-notice', 'merge-approval'];
/** Outbox items that are a person's own step, by the kind of item. */
const EXPECTED: Record<string, ExpectedWait> = { question: 'question', merge: 'merge-approval', time: 'uncertain-effect', 'lesson-digest': 'decision', 'lesson-issue': 'decision', 'office-lesson': 'decision' };

/**
 * Whatever else the Office is asking a person about: open outbox items no other collector reads
 * from their own record, so nothing put in front of Joe is missing from the ledger. Only the
 * item's title is kept. The title is the Office's own wording; the detail can quote a conversation.
 * An item has no stop marker of its own: it is one episode until it is resolved and comes back.
 */
export const outboxItems: IncidentCollector = ({ projectId, provider, state, progression, now }) => projectOutbox(state, now)
    .filter(item => {
        const [kind, key] = item.id.split(':');
        // A ticket or intake review the scheduler does not project, such as a blocked mailbox epic or a review whose job took over, has no other reader.
        if (kind === 'ticket') return item.status === 'open' && !progression.some(({ work }) => work.id === `ticket:${key}`);
        if (kind === 'assignment') return item.status === 'open' && !progression.some(({ work }) => work.kind === 'intake' && work.id === key);
        return item.status === 'open' && !COVERED.includes(kind);
    })
    .map(item => {
        const kind = item.id.split(':')[0];
        return {
            // An hours item is in the outbox only while its write is unconfirmed.
            subject: { projectId, kind: 'outbox', id: item.id, episode: '', stage: kind, stop: null, lastWorker: '', head: '', unsettledEffect: kind === 'time' },
            // A ticket's or review's title is the same template for every one of them; what stopped it is in a detail of unrecorded origin.
            cause: { source: 'outbox' as const, provider, stage: kind, kind, ...(['ticket', 'assignment'].includes(kind) ? { text: '', author: 'unknown' as const } : { text: normalizeCause(item.title), author: 'harness' as const }) },
            expected: EXPECTED[kind] ?? null,
            evidence: boundedEvidence(item.title),
        };
    });
