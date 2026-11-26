import type { OfficeProject } from '../../src/shared';
import { backgroundHold, GRAPHQL_WORK, quotaLow, type QuotaGate, type QuotaHold } from './quota-governor';
import type { Resource } from './rate-limit-samples';

/** A background read that met a quota hold between two of its requests. Nothing it staged is published. */
export class QuotaHeld extends Error {
    constructor(readonly hold: QuotaHold) { super(quotaLow(hold)); this.name = 'QuotaHeld'; }
}
/** The hold a failure carries when it is a recognized mid-read deferral, never an error. */
export const heldBy = (error: unknown): QuotaHold | undefined => error instanceof QuotaHeld ? error.hold : undefined;

/** Asked before each background request; throws `QuotaHeld` while the gate holds a resource the read needs. */
export type QuotaCheck = () => void;
/** The check for one project's background reads, GraphQL-dependent by default. Jira/Azure projects are never held. */
export const quotaCheck = (project: Pick<OfficeProject, 'provider'>, gate?: QuotaGate, resources: readonly Resource[] = GRAPHQL_WORK): QuotaCheck => () => {
    const hold = backgroundHold(project, gate, resources);
    if (hold) throw new QuotaHeld(hold);
};
