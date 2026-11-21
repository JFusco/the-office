import type { FreezeReads } from '../../../../server/incidents/repair/freeze-reads';
import { standingStop } from '../../../../server/incidents/repair/repair-wait';
import type { RepairWait, WorkRef } from '../../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../../src/shared';

export const MARKED_AT = '2026-11-20T12:00:00.000Z';
/**
 * Puts a repair-wait marker on a record exactly as the admission pass would for its stop as it
 * stands now. Throws when the record does not stand stopped: a test that marks running work is
 * testing nothing.
 */
export function markAwaitingRepair(state: OfficeSnapshot, projectId: string, work: Pick<WorkRef, 'kind' | 'id'>, stage: string, over: Partial<RepairWait> = {}): RepairWait {
    const stands = standingStop(state, { projectId, ...work }, stage);
    if (!stands) throw new Error(`${work.kind}/${work.id} does not stand stopped at ${stage}`);
    const wait: RepairWait = { incident: 'inc-0000000000000001', repair: 'cli-start-1', issue: { repository: 'JFusco/the-office', number: 389, url: 'https://github.com/JFusco/the-office/issues/389' }, subject: `${projectId}/${work.kind}/${work.id}`, digest: 'd'.repeat(64), stands, since: MARKED_AT, progressAt: MARKED_AT, ...over };
    (state.coordination!.repairWaits ??= {})[`${work.kind}/${work.id}`] = wait;
    return wait;
}
export const unmark = (state: OfficeSnapshot) => { delete state.coordination!.repairWaits; };

/** Reads that find nothing stronger: no unsettled write and no gating prerequisite. A test that needs one supplies its own. */
export const NOTHING_STRONGER: FreezeReads = { unsettled: () => ({ workKeys: new Set(), attempts: new Set() }), gated: () => false };
