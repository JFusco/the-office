import type { Store } from '../../store/store';
import type { Progress } from './boundary-crossed';

type Attempts = Pick<Store, 'db'>;

/**
 * How many stage attempts the project has saved for a ticket. Every run of a stage is one row,
 * saved when the run begins (`Store.begin`) and given the result's outcome when it ends. Rows are
 * only ever added, so the count at one moment tells the attempts before it from those after.
 */
export function ticketAttempts(store: Attempts, key: string): number {
    return (store.db.prepare('SELECT COUNT(*) AS n FROM attempts WHERE ticket=?').get(key) as { n: number }).n;
}

/** How many of a ticket's attempts had begun by an instant, by the time each was saved with. */
export function attemptsBegunBy(store: Attempts, key: string, at: string): number {
    return (store.db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE ticket=? AND json_extract(body,'$.startedAt')<=?").get(key, at) as { n: number }).n;
}

/**
 * A CEC pilot ticket as a boundary reads a job (see boundary-crossed.ts), or undefined when the
 * project no longer holds it. Its stage is the ticket's; it is completed once that stage is
 * `complete`, and is never cancelled. Its steps are its stage attempts in the order they were
 * saved, each with the outcome its run ended with: an attempt still running has none that passes.
 * A read-back that accepts an earlier run advances the ticket without an attempt, so it shows as
 * a stage left and never as a passed result.
 */
export function ticketProgress(store: Pick<Store, 'db' | 'state'>, key: string): Progress | undefined {
    const ticket = store.state.tickets.find(held => held.key === key);
    if (!ticket) return undefined;
    const attempts = store.db.prepare('SELECT stage,status FROM attempts WHERE ticket=? ORDER BY rowid').all(key) as { stage: string; status: string }[];
    return { stage: ticket.stage, status: ticket.stage === 'complete' ? 'completed' : ticket.activity, steps: attempts.map(({ stage, status }) => ({ stage, result: { outcome: status } })) };
}
