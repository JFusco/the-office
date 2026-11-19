import type { WorkApproach } from '../../../src/shared';

/** Each gate's levels, lightest first. */
export const LEVELS = { plan: ['none', 'brief', 'reviewed'], review: ['none', 'focused', 'full'], validation: ['developer-checks', 'independent-checks', 'browser'] } as const;

/**
 * A revised approach from Sam's assessment after the repair budget ran out, with every gate level kept at
 * least as strict as the ticket's current one. The assessment always has an open finding, so an approach
 * that names a lighter level could never be recorded; its changed checks and reason are what extend the
 * repair window, and no gate is lowered by it.
 */
export function heldApproachLevels(recorded: Pick<WorkApproach, 'plan' | 'review' | 'validation'> | undefined, revised: WorkApproach): WorkApproach {
    // A ticket with no recorded approach is held to the levels recordApproach assumes for it.
    const current = recorded || { plan: 'reviewed', review: 'focused', validation: 'browser' };
    const stricter = <K extends keyof typeof LEVELS>(level: K): WorkApproach[K] => {
        const order = LEVELS[level] as readonly string[];
        return (order.indexOf(revised[level]) < order.indexOf(current[level]) ? current[level] : revised[level]) as WorkApproach[K];
    };
    return { ...revised, plan: stricter('plan'), review: stricter('review'), validation: stricter('validation') };
}
