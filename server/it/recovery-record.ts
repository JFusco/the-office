import type { WorkRef } from '../../src/contracts/work';
import type { OfficeSnapshot } from '../../src/shared';

/** Recoveries about the Office's surroundings or a conversation, never about a stopped delivery record. */
const NO_RECORD = new Set(['conversation', 'probe', 'login', 'session-visibility', 'assignment-listener', 'project-progress']);

/**
 * The record an IT recovery is about, from the recovery's own ID. The first segment is its
 * family. A checkpoint family names its checkpoint. A conversation, a service probe and the
 * Office-wide watches are about no record, whatever else their ID contains. Every other family
 * reads back one delivery job and carries that job's ID as a whole later segment
 * (`implementation:<job>`, `validation:<job>:<run>`, `scope-repair-resume:<project>:<job>:…`).
 */
export function recoveryRecord(state: OfficeSnapshot, id: string): Pick<WorkRef, 'kind' | 'id'> | null {
    const [family, ...rest] = id.split(':');
    if (NO_RECORD.has(family) || !rest.length) return null;
    if (family === 'checkpoint' || family === 'checkpoint-readback') {
        const checkpoint = rest.join(':');
        return state.coordination?.checkpoints.some(saved => saved.id === checkpoint) ? { kind: 'checkpoint', id: checkpoint } : null;
    }
    const job = state.coordination?.jobs?.find(job => rest.includes(job.id));
    return job ? { kind: 'delivery', id: job.id } : null;
}
