import type { Role } from '../../src/shared';
import type { OfficeCapacity } from '../office/projects';

/** Scheduling metadata for a delivery stage that may overlap other projects' stages. */
export interface WorkSlot { role?: Role }

/**
 * Work the scheduler does not own: a project engine marked busy outside a slot, or a model
 * role running without a slot reservation. Either behaves like today's held lane.
 */
export function foreignWork(capacity: OfficeCapacity): boolean {
    const reserved = new Set([...capacity.slots.values()].map(slot => slot.role).filter(Boolean));
    return [...capacity.busy].some(project => !capacity.slots.has(project)) || [...capacity.active.keys()].some(role => !reserved.has(role));
}

/** Whether any new claim may start: room left, nothing exclusive running, nothing foreign held. */
export function admitsWork(capacity: OfficeCapacity): boolean {
    return capacity.slots.size < capacity.limit && ![...capacity.slots.values()].some(slot => slot.exclusive) && !foreignWork(capacity);
}

/**
 * Cross-project delivery concurrency. One running stage per project (a store's transaction
 * rollback replaces its state), one running stage per model role (worker capacity is keyed by
 * role across projects), and work without a slot runs alone. While exclusive work waits,
 * running slots drain and no new slotted work starts, so the exclusive item is never starved.
 */
export function canDispatch(candidate: { projectId: string; slot?: WorkSlot }, capacity: OfficeCapacity, exclusivePending: boolean): boolean {
    if (!admitsWork(capacity) || capacity.slots.has(candidate.projectId) || capacity.busy.has(candidate.projectId))
        return false;
    if (!candidate.slot)
        return capacity.slots.size === 0;
    if (exclusivePending)
        return false;
    const role = candidate.slot.role;
    return !role || !capacity.active.has(role) && ![...capacity.slots.values()].some(slot => slot.role === role);
}

/** Observe whether an unslotted assessment could enter delivery, without reserving capacity. */
export function deliveryOccupied(capacity: OfficeCapacity, projectId: string, stoppingDelivery: boolean): boolean {
    if (stoppingDelivery) return true;
    return capacity.limit <= 1 ? Boolean(capacity.lane) || capacity.active.size > 0 : !canDispatch({ projectId }, capacity, false);
}
