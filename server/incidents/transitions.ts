import type { IncidentState } from '../../src/contracts/incidents';

/**
 * Every state change an event may make. Closed: an event from a state not listed here is refused.
 * Observation is not in this table, because it never changes a state. `repair-started` and
 * `fix-bound` and `dismissed` are written through the Office by a person or the repair runner;
 * `fix-deployed`, `fix-withdrawn` and `dismissal-invalidated` only by the Office itself, when the
 * release it runs holds the fix (see deployed-fixes.ts), no longer does (see withdrawn-fixes.ts)
 * or a dismissal no longer holds (see dismissal-validity.ts); `incident-verified` and
 * `incident-recurred` only by the Office itself, from what became of the fix's resumes and from
 * the cause stopping work again (see repair/settle-incidents.ts). A verified incident accepts
 * nothing but that recurrence; a recurred one can be repaired again or dismissed.
 */
const TRANSITIONS = {
    'repair-started': { from: ['observed', 'triaged', 'recurred'], to: () => 'fixing' },
    'fix-bound': { from: ['fixing'], to: (onMain: boolean) => onMain ? 'shipped' : 'fixing' },
    'fix-deployed': { from: ['shipped'], to: () => 'deployed' },
    'fix-withdrawn': { from: ['deployed'], to: () => 'shipped' },
    'incident-verified': { from: ['deployed'], to: () => 'verified' },
    'incident-recurred': { from: ['deployed', 'verified'], to: () => 'recurred' },
    'dismissed': { from: ['observed', 'triaged', 'recurred'], to: () => 'dismissed' },
    'dismissal-invalidated': { from: ['dismissed'], to: () => 'observed' },
} as const satisfies Record<string, { from: readonly IncidentState[]; to: (onMain: boolean) => IncidentState }>;

export type WrittenEvent = keyof typeof TRANSITIONS;

/** The state an event leaves the incident in, or a refusal that names the states it is allowed from. */
export function nextState(state: IncidentState, event: WrittenEvent, onMain = false): IncidentState {
    const rule = TRANSITIONS[event];
    if (!(rule.from as readonly IncidentState[]).includes(state)) throw new Error(`An incident that is ${state} cannot record ${event}; it must be ${rule.from.join(' or ')}`);
    return rule.to(onMain);
}
