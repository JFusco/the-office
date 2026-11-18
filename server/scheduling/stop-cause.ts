import type { BlockedCause, StopReason } from '../../src/contracts/work';

/**
 * The cause the harness itself recorded for stopped work, or undefined when it recorded none.
 * A park that reached a person is a decision; a park waiting on a release is a prerequisite; a park
 * whose question never went out says nothing. A hold and missing authority wait on a person, a write
 * of unknown outcome is unconfirmed, a pause is a pause. Nothing is read from a blocker's wording.
 */
export function stopCause(record: { parked?: { published?: boolean; release?: unknown }; stop?: Pick<StopReason, 'kind'> }): BlockedCause | undefined {
    if (record.parked?.published) return record.parked.release ? 'dependency' : 'needs-decision';
    switch (record.stop?.kind) {
        case 'hold': case 'authority': return 'needs-decision';
        case 'uncertain-effect': return 'unconfirmed';
        case 'paused': return 'paused';
        default: return undefined;
    }
}
