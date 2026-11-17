import type { Store } from '../../store/store';
import type { Ticket, WorkTime } from '../../../src/shared';

/** A provider turning the worker away for capacity, as the provider itself words it at the start of its error. */
const CAPACITY = /usage limit|rate limit|exceeded your (?:current )?quota|quota exceeded/i;
/** A provider's own error is a short message; a crash's output tail that merely mentions a limit is not one. */
const providerSaid = (detail: string) => CAPACITY.test(detail.replace(/^\S+ exited \d+: /, '').slice(0, 200));

/**
 * The QA or retest run of this ticket's current stage that a provider capacity limit cut off before it
 * returned a result, when it is the stage's latest finished run. Undefined for any other stage or cause.
 */
export function capacityInterruptedRun(store: Store, ticket: Pick<Ticket, 'key' | 'stage'>): WorkTime | undefined {
    if (!['qa', 'retest'].includes(ticket.stage)) return;
    const latest = (store.state.workLog || []).filter(work => work.ticket === ticket.key && work.stage === ticket.stage && !['running', 'stopping'].includes(work.status)).at(-1);
    return latest && latest.status === 'failed' && latest.executionStatus !== 'completed' && !latest.completionAccepted && providerSaid(latest.failure?.detail || '') ? latest : undefined;
}

/**
 * True when that interrupted run has nothing to reconstruct, so the stage is run again: no worker on the
 * ticket has since failed with an unknown write, and nothing the harness wrote for the ticket is unsettled.
 * The harness treats the run's own work as confined to its test environment and report; it posts the Jira
 * comment itself and posted none. The interrupted run and its unknown provider usage stay in history.
 */
export function rerunsInterruptedQA(store: Store, ticket: Ticket): boolean {
    const interrupted = capacityInterruptedRun(store, ticket), log = store.state.workLog || [];
    if (!interrupted || log.slice(log.indexOf(interrupted) + 1).some(work => work.ticket === ticket.key && work.failure?.category === 'uncertain-effect'))
        return false;
    const open = store.db.prepare("SELECT id FROM effects WHERE status IN ('prepared', 'dispatching', 'uncertain')").all() as { id: string }[];
    return !open.some(({ id }) => store.getEffect(id)?.target === ticket.key);
}
