import type { Ticket } from '../../../src/shared';
import type { Store } from '../../store/store';

/** How long a ticket verified on staging is followed. A change that never reaches production by ancestry is not followed forever. */
export const FOLLOW_DAYS = 30;

/** Tickets the Office verified on staging that it has not yet seen deployed to production, first seen within the last 30 days. */
export function awaitingProduction(store: Store): Ticket[] {
    const cutoff = store.clock.now().getTime() - FOLLOW_DAYS * 86400000;
    return store.state.tickets.filter(t => t.pilot && t.stage === 'complete' && t.results['staging-qa']?.outcome === 'passed'
        && /^[a-f0-9]{40}$/i.test(t.commit) && !t.production?.deployedAt && (!t.production?.since || Date.parse(t.production.since) > cutoff));
}
