import type { IncidentState } from '../../src/contracts/incidents';

/**
 * Every state change an event written through the Office may make. Closed: an event from a state
 * not listed here is refused. Observation is not in this table, because it never changes a state.
 */
const TRANSITIONS = {
    'repair-started': { from: ['observed', 'triaged', 'recurred'], to: () => 'fixing' },
    'fix-bound': { from: ['fixing'], to: (onMain: boolean) => onMain ? 'shipped' : 'fixing' },
} as const satisfies Record<string, { from: readonly IncidentState[]; to: (onMain: boolean) => IncidentState }>;

export type WrittenEvent = keyof typeof TRANSITIONS;

/** The state an event leaves the incident in, or a refusal that names the states it is allowed from. */
export function nextState(state: IncidentState, event: WrittenEvent, onMain = false): IncidentState {
    const rule = TRANSITIONS[event];
    if (!(rule.from as readonly IncidentState[]).includes(state)) throw new Error(`An incident that is ${state} cannot record ${event}; it must be ${rule.from.join(' or ')}`);
    return rule.to(onMain);
}
