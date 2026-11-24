import type { WorkRef } from '../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../src/shared';
import type { StoppedRecord } from './stopped-record';

/**
 * Harper's weekly roll-up while the retry the Office saved for it is still ahead: a wait it planned
 * itself. The record only carries the deadline; the scheduler's own reason describes it, and the saved
 * error of the earlier attempt is never read. Null when learning is off, the retry is for another week,
 * or its time has come.
 */
export function rollupRecord(state: OfficeSnapshot, work: WorkRef, now: Date): StoppedRecord | null {
    const knowledge = state.knowledge, retry = knowledge?.rollupRetry;
    if (!knowledge?.enabled || retry?.id !== work.id || !retry.nextAt || !(Date.parse(retry.nextAt) > now.getTime())) return null;
    return { standing: 'gated', key: '', text: '', author: 'harness', kind: '', stop: null, head: '', lastWorker: '', episode: '', facts: {}, covers: [], effects: [work], retryAt: retry.nextAt };
}
