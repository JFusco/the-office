import { LEVELS } from '../delivery/repairs/held-approach-levels';
import { MAX_CHECKS, owedUnderScope } from './change-scope';
import type { StageResult, Ticket } from '../../src/shared';

/**
 * A route change made while a scope is in force keeps what the scope owes: the result's approach with
 * every owed check added, including a required check the latest QA run on this candidate did not pass,
 * and validation at least at the ticket's own level when anything is owed. A route change replaces the
 * checks wholesale, so without this a failed or untested required check could be rerouted away. One that
 * would leave no room for the owed checks is refused.
 */
export function rerouteUnderScope(ticket: Pick<Ticket, 'commit' | 'results' | 'changeScope'>, result: StageResult): StageResult {
    const scope = ticket.changeScope, stated = result.approach, owed = scope ? owedUnderScope(ticket) : [];
    if (!scope || !stated || !owed.length) return result;
    const checks = [...new Set([...stated.checks, ...owed])];
    if (checks.length > MAX_CHECKS) throw new Error('A route change under a scope must leave room for the required checks QA still owes');
    const lighter = LEVELS.validation.indexOf(stated.validation) < LEVELS.validation.indexOf(scope.approach.validation);
    return { ...result, approach: { ...stated, checks, validation: lighter ? scope.approach.validation : stated.validation } };
}
