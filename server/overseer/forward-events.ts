import { failureDigest, type FailureEvent, type FailureReceipt } from '../incidents/runner-report';
import type { ForwardingState, ForwardRecord } from './forwarding-state';
import { OfficeWriteError, type OfficeWriter } from './office-writer';
import { freeAttempt, readBackReport, sendReport, type RunnerEffects } from './settle-report';

/** What forwarding found for the journal as it stands: every entry counted once. */
export interface ForwardSummary {
    forwarded: number;
    pending: number;
    uncertain: { id: string; reason: string }[];
    conflicts: { id: string; reason: string }[];
    /** IDs examined this pass, sends and read-backs together. */
    examined: number;
    /** Why the pass stopped forwarding early, if it did. */
    stopped: string | null;
}

export const forwardIntent = (eventId: string, attempt: number) => `forward:${eventId}:${attempt}`;

type Standing = 'forwarded' | 'conflict' | 'outstanding' | 'unsent';

/**
 * Forwards the journal's failure events to the Office, oldest first, under each event's own ID.
 * Each pass examines at most `limit` IDs and stops when its phase time runs out. Turns alternate
 * between events never sent and sends still being read back, from where the last pass left off,
 * so an event that stays unconfirmed never holds back the ones after it.
 *
 * - An event is read first: one the Office already holds with the same digest is forwarded, with
 *   no send; one it holds otherwise is a conflict, left for a person.
 * - Only an answer that the route itself says the event is absent leads to a send, through
 *   settle-report.ts. A send refused before dispatch is tried again, under the next attempt, by a
 *   later pass; one dispatched and not yet shown is read back on later passes, never sent again.
 * - A held fence defers sends; read-backs go on. An Office that cannot be reached, or answers as
 *   these routes never do, ends the batch.
 */
export async function forwardFailures(input: {
    entries: readonly { event: FailureEvent }[]; origin: string; state: ForwardingState; effects: RunnerEffects; writer: OfficeWriter;
    limit: number; remaining: () => number;
}): Promise<ForwardSummary> {
    const { entries, origin, state, effects, writer } = input;
    state.prepareFailures();
    const digests = new Map(entries.map(({ event }) => [event.id, failureDigest(event)]));
    const standing = new Map<string, { standing: Standing; reason: string }>();
    const sentElsewhere = new Map<string, string>();
    const classify = ({ event }: { event: FailureEvent }) => {
        const digest = digests.get(event.id)!, record = state.record(origin, event.id);
        if (record && record.digest !== digest) return { standing: 'conflict' as const, reason: 'the journal holds other content under this ID than the runner forwarded' };
        if (record?.conflict) return { standing: 'conflict' as const, reason: record.conflict };
        if (record?.receipt) return { standing: 'forwarded' as const, reason: '' };
        const intent = record ? effects.readIntent(forwardIntent(event.id, record.attempt)) : undefined;
        if (record && intent?.target === origin && intent.dispatchedAt) return { standing: 'outstanding' as const, reason: record.reason || 'sent; not yet read back' };
        const earlier = state.otherRecords(origin, event.id).find(other => {
            const dispatch = effects.readIntent(forwardIntent(event.id, other.record.attempt));
            return !other.record.receipt && dispatch?.target === other.origin && !!dispatch.dispatchedAt;
        });
        if (earlier) {
            const reason = `sent to ${earlier.origin}; confirmation at that origin is still pending`;
            sentElsewhere.set(event.id, reason);
            return { standing: 'outstanding' as const, reason };
        }
        return { standing: 'unsent' as const, reason: record?.reason || 'not yet sent' };
    };
    for (const entry of entries) standing.set(entry.event.id, classify(entry));

    const queue = (kind: Standing, after: string | null) => {
        const ids = entries.map(entry => entry.event.id).filter(id => standing.get(id)!.standing === kind);
        const start = after === null ? 0 : ids.findIndex(id => entries.findIndex(entry => entry.event.id === id) > entries.findIndex(entry => entry.event.id === after));
        return start <= 0 ? ids : [...ids.slice(start), ...ids.slice(0, start)];
    };
    const cursor = state.cursor(origin), sends = queue('unsent', cursor.sendAfter), reads = queue('outstanding', cursor.readAfter);
    const events = new Map(entries.map(({ event }) => [event.id, event]));
    let examined = 0, stopped: string | null = null, sendsDeferred = false, turn = cursor.turn;

    const save = (record: ForwardRecord) => state.save(origin, record);
    const accept = (record: ForwardRecord, receipt: FailureReceipt) => {
        if (receipt.digest !== record.digest) {
            save({ ...record, conflict: 'the Office holds this ID with other content' });
            standing.set(record.eventId, { standing: 'conflict', reason: 'the Office holds this ID with other content' });
        } else {
            save({ ...record, receipt, reason: '' });
            standing.set(record.eventId, { standing: 'forwarded', reason: '' });
        }
    };
    const occupied = (record: ForwardRecord, error: string) => {
        save({ ...record, conflict: error });
        standing.set(record.eventId, { standing: 'conflict', reason: error });
    };

    const send = async (id: string) => {
        const event = events.get(id)!, digest = digests.get(id)!;
        const saved = state.record(origin, id), record: ForwardRecord = saved ?? { eventId: id, digest, attempt: freeAttempt(effects, `forward:${id}`), receipt: null, conflict: null, reason: '' };
        const answer = await writer.readFailure(id);
        if (answer.result === 'present') return accept(record, answer.receipt);
        if (answer.result === 'occupied') return occupied(record, answer.error);
        if (sendsDeferred) return;
        // A send its preflight refused left a rejected intent with no dispatch: the next one is a new attempt.
        const previous = effects.readIntent(forwardIntent(id, record.attempt));
        if (previous && (previous.target !== origin || (previous.status === 'rejected' && !previous.dispatchedAt)))
            record.attempt = freeAttempt(effects, `forward:${id}`, record.attempt + 1);
        save(record);
        let seen: Awaited<ReturnType<OfficeWriter['readFailure']>> | null = null;
        const sent = await sendReport<FailureReceipt>({
            effects, writer, origin, id: forwardIntent(id, record.attempt), workId: `forward:${id}`, operation: 'overseer-forward',
            payload: { eventId: id, digest },
            dispatch: () => writer.sendFailure(event),
            verify: async () => { seen = await writer.readFailure(id); return seen.result === 'present' && seen.receipt.digest === digest ? seen.receipt : null; },
        });
        if (sent.status === 'verified') return accept(record, sent.receipt);
        const last = seen as Awaited<ReturnType<OfficeWriter['readFailure']>> | null;
        if (last?.result === 'occupied') return occupied(record, last.error);
        if (last?.result === 'present') return accept(record, last.receipt);
        save({ ...record, reason: sent.reason });
        // Dispatched and not shown: read back once at once, so a lost reply is settled without waiting a pass. Never sent again.
        if (sent.status === 'uncertain') { standing.set(id, { standing: 'outstanding', reason: sent.reason }); return readBack(id); }
        standing.set(id, { standing: 'unsent', reason: sent.reason });
        if (sent.cause === 'fenced') sendsDeferred = true;
        else if (sent.cause === 'unreachable') stopped = sent.reason;
    };

    const readBack = async (id: string) => {
        const elsewhere = sentElsewhere.get(id);
        if (elsewhere) {
            const answer = await writer.readFailure(id);
            const record = state.record(origin, id) ?? { eventId: id, digest: digests.get(id)!, attempt: freeAttempt(effects, `forward:${id}`), receipt: null, conflict: null, reason: elsewhere };
            if (answer.result === 'present') accept(record, answer.receipt);
            if (answer.result === 'occupied') occupied(record, answer.error);
            return;
        }
        const record = state.record(origin, id)!, digest = record.digest;
        let seen: Awaited<ReturnType<OfficeWriter['readFailure']>> | null = null;
        const shown = await readBackReport(effects, forwardIntent(id, record.attempt), async () => {
            seen = await writer.readFailure(id);
            return seen.result === 'present' && seen.receipt.digest === digest;
        });
        const last = seen as Awaited<ReturnType<OfficeWriter['readFailure']>> | null;
        if (shown && last?.result === 'present') return accept(record, last.receipt);
        if (last?.result === 'occupied') return occupied(record, last.error);
        if (last?.result === 'present') return accept(record, last.receipt);
        const reason = 'sent; the Office does not show it yet, so it is only read back';
        save({ ...record, reason });
        standing.set(id, { standing: 'outstanding', reason });
    };

    const at = { send: 0, read: 0 };
    while (examined < input.limit && stopped === null && input.remaining() > 0) {
        const canSend = !sendsDeferred && at.send < sends.length, canRead = at.read < reads.length;
        if (!canSend && !canRead) break;
        const kind = turn === 'send' ? (canSend ? 'send' : 'read') : (canRead ? 'read' : 'send');
        const id = kind === 'send' ? sends[at.send++] : reads[at.read++];
        examined += 1;
        try { await (kind === 'send' ? send(id) : readBack(id)); }
        catch (error) {
            // One answer that cannot be used ends the batch: the Office is down, or not one with these routes.
            if (!(error instanceof OfficeWriteError)) throw error;
            stopped = error.message;
        }
        if (kind === 'send') cursor.sendAfter = id; else cursor.readAfter = id;
        turn = kind === 'send' ? 'read' : 'send';
    }
    state.saveCursor(origin, { ...cursor, turn });

    const list = (kind: Standing) => entries.map(entry => entry.event.id).filter(id => standing.get(id)!.standing === kind).map(id => ({ id, reason: standing.get(id)!.reason }));
    const forwarded = list('forwarded').length;
    return { forwarded, pending: entries.length - forwarded, uncertain: list('outstanding'), conflicts: list('conflict'), examined, stopped };
}
