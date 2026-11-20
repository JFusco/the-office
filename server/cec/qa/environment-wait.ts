import { isSetupStop } from './setup-stop-cap';
import type { StageResult, Stage, Ticket } from '../../../src/shared';

/**
 * A QA run that stopped in setup, tested nothing, and is waiting on its own environment (a browser, a
 * sign-in), not on a decision about the ticket and not on a registered release.
 */
export const environmentWait = (result: StageResult | undefined): boolean =>
    isSetupStop(result) && result!.resolution?.kind === 'provider-wait' && !result!.resolution.release;

/** The ticket's current-stage result when it is such a wait on the ticket's present candidate; a moved head is a different run's history. */
export function currentEnvironmentWait(ticket: Pick<Ticket, 'stage' | 'commit'> & Partial<Pick<Ticket, 'results'>>, stage: Stage = ticket.stage): StageResult | undefined {
    const result = ticket.results?.[stage];
    return environmentWait(result) && result!.commit === ticket.commit ? result : undefined;
}

/** What that run said it was waiting for, as one line of model-written text. */
export const waitText = (result: StageResult): string => (result.blocker || result.summary).replace(/\s+/g, ' ').slice(0, 300);
