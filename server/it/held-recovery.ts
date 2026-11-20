import { heldFor } from '../incidents/repair/repair-freeze';
import type { ITContext } from './context';
import { recoveryRecord } from './recovery-record';

export function recoveryWait({ state, freeze }: Pick<ITContext, 'state' | 'freeze'>, id: string) {
    const about = recoveryRecord(state, id);
    return about && freeze ? freeze(about) : null;
}

/**
 * Whether a recovery must be left exactly as it is because the record it is about is waiting on
 * a harness repair. Decided afresh at every place a recovery could be written, so a wait that
 * ends during a tick stops holding at once and nothing written after it is lost. When it holds,
 * the recovery is kept current, so the tick's ledger pass cannot read its absence as resolution,
 * and one routine follow-up names the repair.
 */
export function recoveryHeld(context: Pick<ITContext, 'state' | 'followUps' | 'current' | 'freeze'>, id: string): boolean {
    const wait = recoveryWait(context, id);
    if (!wait) return false;
    context.current.add(id);
    if (!context.followUps.some(followUp => followUp.id === id && followUp.routine)) context.followUps.push({ id, owner: 'IT', detail: heldFor(wait), routine: true });
    return true;
}
