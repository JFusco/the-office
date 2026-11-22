import type { RepairBoundary } from '../../../src/contracts/incidents';
import type { RepairResume } from '../../../src/contracts/work';
import type { TicketJob } from '../../../src/shared';

/** Crossed, with what shows it; not crossed yet; or why this boundary can never be judged for this resume. */
export type Crossing = { crossed: true; detail: string } | { crossed: false } | { unjudged: string };

/**
 * Whether a delivery job got past the boundary a fix declared, since its resume was admitted.
 * Pure: it reads the job as its project holds it now and how it stood at the admission.
 *
 * - `stage-result-passed`: a step saved after the admission, of that stage, whose result passed.
 *   A job's steps carry no time, so "after" is the step count the admission recorded; a job that
 *   now has fewer steps than it had then cannot be judged.
 * - `stage-left`: the job is at another stage and is not cancelled. A job that was not at that
 *   stage when it was resumed had nothing to leave, and cannot be judged.
 * - `record-settled`: the job is completed.
 *
 * A job that is missing has crossed nothing.
 */
export function boundaryCrossed(boundary: RepairBoundary, job: Pick<TicketJob, 'stage' | 'status' | 'steps'> | undefined, stood: NonNullable<RepairResume['stood']>): Crossing {
    if (boundary.kind === 'record-settled') return job?.status === 'completed' ? { crossed: true, detail: 'The job completed after its resume.' } : { crossed: false };
    if (boundary.kind === 'stage-left') {
        if (stood.stage !== boundary.stage) return { unjudged: `The job was at ${stood.stage}, not ${boundary.stage}, when it was resumed.` };
        return job && job.status !== 'cancelled' && job.stage !== boundary.stage ? { crossed: true, detail: `The job left ${boundary.stage} for ${job.stage} after its resume.` } : { crossed: false };
    }
    if (!job) return { crossed: false };
    if (job.steps.length < stood.steps) return { unjudged: `The job has ${job.steps.length} steps and had ${stood.steps} when it was resumed.` };
    return job.steps.slice(stood.steps).some(step => step.stage === boundary.stage && step.result.outcome === 'passed')
        ? { crossed: true, detail: `A passed ${boundary.stage} result was saved after the resume.` } : { crossed: false };
}
