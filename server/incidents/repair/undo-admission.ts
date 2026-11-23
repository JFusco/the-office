import type { ResumeRefusal } from '../../../src/contracts/incidents';

/** The refusals an admission itself can make; the other two are the pass's (see resume-arrivals.ts). */
export type AdmissionRefusal = Exclude<ResumeRefusal, 'resumes-paused' | 'release-unconfirmed'>;

/** Statuses of a request that still owns its work. */
export const PENDING: readonly string[] = ['queued', 'working'];

export const WAIT_ENDED = 'The repair wait no longer holds for this stop: it ran out, the stop changed, or something stronger explains it.';

/** Thrown inside an admitting transaction to undo it whole: the queue refused or answered with a request it already held, or the wait ran out while it answered. */
export class Undone extends Error { constructor(readonly code: AdmissionRefusal, readonly detail: string) { super(detail); } }
