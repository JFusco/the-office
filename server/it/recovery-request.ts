import type { ITState } from '../../src/shared';

/** True when IT saved this harness request as one of its recoveries. A queued request IT's recovery joined counts once, as IT's. */
export function itRecoveryRequest(state: { it?: ITState }, requestId: string): boolean {
    return Object.values(state.it?.recoveries ?? {}).some(recovery => recovery.requestId === requestId);
}
