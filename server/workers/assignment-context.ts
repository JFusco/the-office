import { AsyncLocalStorage } from 'node:async_hooks';
import type { ExecutionLane, WorkClaim } from '../../src/shared';
const assignments = new AsyncLocalStorage<{
    claim: WorkClaim;
    lane: ExecutionLane;
}>();
export const currentAssignment = () => assignments.getStore();
/** Carry the scheduler's exact claim across awaits without a shared mutable slot. */
export function withAssignment<T>(claim: WorkClaim, lane: ExecutionLane, execute: () => T): T {
    return assignments.run({ claim, lane }, execute);
}
