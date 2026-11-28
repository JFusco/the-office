import type { MaintenancePublication, MaintenancePublicationCandidate, MaintenanceRun } from '../../../src/shared';

type Step = MaintenanceRun['steps'][number];

/** A step saved under the #612 contract: its worker wrote content only, and the harness publishes it. */
export const versionedStep = (step: Step | undefined): boolean => step?.publicationVersion === 1;

/** The run's harness-owned publication progress, created on first use. Kept outside every `step.result`. */
export function publicationOf(run: MaintenanceRun): MaintenancePublication {
    return run.publication ??= { version: 1, candidates: [], evidence: [] };
}

/** The progress record of one vendor-review candidate, by its position in the run. */
export function candidateProgress(run: MaintenanceRun, index: number): MaintenancePublicationCandidate | undefined {
    return run.publication?.candidates.find(candidate => candidate.index === index);
}

export function ensureCandidateProgress(run: MaintenanceRun, index: number, key: string): MaintenancePublicationCandidate {
    const existing = candidateProgress(run, index);
    if (existing) {
        if (existing.key !== key) throw new Error('The saved publication identity of this candidate changed; reconcile the original run');
        return existing;
    }
    const created: MaintenancePublicationCandidate = { index, key };
    publicationOf(run).candidates.push(created);
    return created;
}
