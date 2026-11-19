import type { Ticket } from '../../src/shared';

/** The carried checks the scope in force does not name: the ones that are really not run again. */
export function carriedNotRepeated(ticket: Pick<Ticket, 'approach' | 'changeScope'>): string[] {
    return (ticket.changeScope?.carried?.checks || []).filter(check => !ticket.approach?.checks.includes(check));
}
