import { capacityInterruptedRun } from './interrupted-qa-rerun';
import type { Store } from '../../store/store';
import type { Stage, Ticket } from '../../../src/shared';

/** The stage result the runner writes for a worker that returned nothing. */
const placeholder = (ticket: Ticket, stage: Stage) => !!ticket.results[stage]?.receipts.some(receipt => receipt.uncertain && receipt.action === stage && receipt.detail === 'Worker did not return a verified final result');
const applies = (store: Store, ticket: Ticket, stage: Stage) => ticket.stage === stage && !!capacityInterruptedRun(store, ticket) && placeholder(ticket, stage);

/** Said to the worker that runs the stage again, because the ticket and the IT diagnostics still describe the interruption. */
export function interruptedRunNote(store: Store, ticket: Ticket, stage: Stage): string {
    return applies(store, ticket, stage) ? `RERUN AFTER A PROVIDER LIMIT: an earlier ${stage} run on this ticket was cut off by a provider usage limit before it returned a result, and the harness is running the stage again. That run's interruption, its uncertain receipt, its unknown provider usage and its IT diagnosis are history, not open items: do not block on them, wait for their reconciliation or restate that receipt. Test fixtures it left behind may be reused or replaced. Report the provider runs you make yourself.` : '';
}

/** The ticket as that worker should read it: without the interrupted run's placeholder result. */
export function withoutInterruptedResult<T extends Ticket>(store: Store, ticket: T, stage: Stage): T {
    if (!applies(store, ticket, stage)) return ticket;
    const { [stage]: _interrupted, ...results } = ticket.results;
    return { ...ticket, results: results as T['results'] };
}
