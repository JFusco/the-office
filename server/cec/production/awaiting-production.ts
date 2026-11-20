import type { Ticket } from '../../../src/shared';
import type { Store } from '../../store/store';

/** How long a ticket verified on staging is followed. A change that never reaches production by ancestry is not followed forever. */
export const FOLLOW_DAYS = 30;

/** Tickets the Office verified on staging and is still following, first seen within the last 30 days. */
function followed(store: Store): Ticket[] {
    const cutoff = store.clock.now().getTime() - FOLLOW_DAYS * 86400000;
    return store.state.tickets.filter(t => t.pilot && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed'
        && /^[a-f0-9]{40}$/i.test(t.commit) && !t.production?.doneAt && (!t.production?.since || Date.parse(t.production.since) > cutoff));
}

/** Those not yet seen deployed to production. */
export const awaitingProduction = (store: Store): Ticket[] => followed(store).filter(t => !t.production?.deployedAt);

/** Those whose Jira status may still need to follow: every followed ticket that has a production record. */
export const awaitingJiraStatus = (store: Store): Ticket[] => followed(store).filter(t => !!t.production);
