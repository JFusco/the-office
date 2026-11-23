import { activeEffectId, harnessEffect } from '../harness/effect';
import { cardStatus, setCardStatus, type Execute, type StatusField } from './project-graphql';
import type { Store } from '../../store/store';
import type { BoardUpdate, TicketJob } from '../../../src/shared';

/** A stable identity for one harness lane operation, such as closeout's move to Done bound to its merge commit. */
export interface LaneOperation { id: string }

const effectKey = (operation: LaneOperation, item: string) => `${operation.id}:lane:${item}`;

/** Where this operation's write for one card stands: sent and awaiting read-back, already verified, or never sent. */
export function laneWrite(store: Store, job: Pick<TicketJob, 'id'>, operation: LaneOperation, item: string): 'unread' | 'verified' | undefined {
    const intent = store.getEffect(activeEffectId(store, `harness:${job.id}:${effectKey(operation, item)}`));
    return intent && ['dispatching', 'uncertain'].includes(intent.status) ? 'unread' : intent?.status === 'verified' ? 'verified' : undefined;
}

/**
 * Moves one card as a harness Effect bound to its project, item, field, option and the job's head: one dispatch,
 * settled by reading the card's status back, never resent. A write sent earlier and never read back is
 * reconciled by reading, whatever lane the card shows now. `update` is recorded as pending only once the write
 * is sent, so a refused preflight leaves no board record; afterwards it is verified, or uncertain for read-back.
 */
export async function moveCardOnce(store: Store, execute: Execute, job: TicketJob, item: string, field: StatusField, option: { id: string; name: string }, operation: LaneOperation, guard: () => void, update: BoardUpdate): Promise<void> {
    const readLane = async () => await cardStatus(store, execute, item, field.fieldId) === option.id ? { item, option: option.id } : null;
    // A write sent earlier and still unread is what a failure here may leave open; without one, a refusal is just a refusal.
    const earlier = laneWrite(store, job, operation, item);
    // A write sent earlier is settled only against the card, field and option it was sent to.
    if (earlier === 'unread') {
        const saved = store.getEffect<{ project: string; item: string; field: string; option: string }>(activeEffectId(store, `harness:${job.id}:${effectKey(operation, item)}`))?.payload;
        if (!saved || saved.project !== field.projectId || saved.item !== item || saved.field !== field.fieldId || saved.option !== option.id)
            throw new Error(`Board transition needs read-back: the earlier ${option.name} write was sent to another field or option; it is left unread`);
    }
    let sent = false;
    try {
        await harnessEffect(store, job, { key: effectKey(operation, item), operation: 'github-project-status', target: `${field.projectId}:${item}`,
            payload: { project: field.projectId, item, field: field.fieldId, option: option.id, head: job.head }, guard,
            dispatch: async () => {
                sent = true;
                update.status = 'pending';
                update.detail = 'Harness board transition started; outcome requires read-back.';
                (job.boardUpdates ??= []).push(update);
                store.save();
                await setCardStatus(store, execute, field.projectId, item, field.fieldId, option.id);
                return readLane();
            },
            readBack: readLane });
    }
    catch (error) {
        if (sent) { update.status = 'uncertain'; update.detail = String(error); store.save(); }
        // Nothing was sent now or before: a guard or preflight refused (a hold, a pause, a changed job). Say so as it is.
        if (!sent && earlier !== 'unread') throw error;
        throw new Error(`Board transition needs read-back: ${String(error)}`);
    }
    update.status = 'verified';
    // A reconciled earlier write keeps its own record; this one notes the card read at the lane.
    if (sent) update.detail = `${option.name} verified by read-back.`;
    else (job.boardUpdates ??= []).push(update);
}
