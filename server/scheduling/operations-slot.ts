import type { WorkSlot } from './slot-policy';

/**
 * Operations that read and write one project only: its provider observation, its assignment poll,
 * and the publication and read-back of its own hours and cost. Each project may run one of these
 * while other projects run theirs. Every other operation still runs alone: it may read or change
 * more than one project (dependency observation, lesson issues, history retirement).
 */
const PROJECT_LOCAL = new Set(['refresh', 'poll', 'time-publication', 'time-readback', 'time-unsent', 'cost-publication', 'cost-readback']);

/** The slot of a project-local operation; undefined for one that runs alone. It names no role: no model runs. */
export function operationsSlot(stage: string): WorkSlot | undefined {
    return PROJECT_LOCAL.has(stage) ? {} : undefined;
}
