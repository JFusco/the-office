import type { StageResult, Ticket } from '../../../src/shared';

/** Setup stops in a row, on one candidate, that a resume runs through without asking. */
export const SETUP_STOP_CAP = 3;

const setupStop = (result: StageResult | undefined, commit: string) => result?.outcome === 'blocked' && result.qa?.setup?.status === 'blocked' && result.commit === commit;

/** A QA run that stopped while setting up: no paid run was made and no case was exercised. */
export const isSetupStop = (result: StageResult | undefined): boolean => result?.outcome === 'blocked' && result.qa?.setup?.status === 'blocked' && result.paidRuns === 0 &&
    result.qa.cases.every(item => ['not-tested', 'blocked'].includes(item.status));

/** How many times in a row this QA stage has stopped in setup on the ticket's current candidate. */
export function consecutiveSetupStops(ticket: Pick<Ticket, 'stage' | 'commit' | 'results' | 'qaHistory'>): number {
    const current = ticket.results[ticket.stage];
    if (!['qa', 'retest', 'staging-qa'].includes(ticket.stage) || !setupStop(current, ticket.commit)) return 0;
    // The current result is archived into the history when the next attempt is prepared; count it once.
    const earlier = (ticket.qaHistory || []).filter(entry => entry.stage === ticket.stage && JSON.stringify(entry.result) !== JSON.stringify(current)).map(entry => entry.result);
    let count = 1;
    for (const result of earlier.reverse()) { if (!setupStop(result, ticket.commit)) break; count++; }
    return count;
}

/**
 * Once the cap is reached, the first resume does not run another attempt: it records that the
 * count was shown and returns the reason to show. Resuming again at the same count runs one
 * more attempt, so every attempt past the cap is a deliberate second request.
 */
export function confirmSetupStopCap(ticket: Ticket): string | null {
    const stops = consecutiveSetupStops(ticket);
    if (stops < SETUP_STOP_CAP || ticket.qaSetupStopsConfirmed === stops) return null;
    ticket.qaSetupStopsConfirmed = stops;
    const reason = ticket.results[ticket.stage]?.qa?.setup?.summary || ticket.results[ticket.stage]?.blocker || 'no reason recorded';
    return `QA setup has stopped ${stops} times in a row on this candidate without testing anything. Latest reason: ${String(reason).slice(0, 400)} Fix the setup first; resume once more to spend another attempt anyway.`;
}
