import { expect, test } from 'vitest';
import { candidateProgress, ensureCandidateProgress, publicationOf, versionedStep } from '../../../../server/maintenance/publication/publication-state';
import type { MaintenanceRun } from '../../../../src/shared';

test('publication progress lives beside the steps, keyed by candidate, and never in a worker result', () => {
    const run = { id: 'r', steps: [{ stage: 'proposal', publicationVersion: 1, result: { candidates: [] } }] } as unknown as MaintenanceRun;
    expect(versionedStep(run.steps[0])).toBe(true);
    expect(versionedStep({ ...run.steps[0], publicationVersion: undefined })).toBe(false);
    expect(candidateProgress(run, 0)).toBeUndefined();
    const progress = ensureCandidateProgress(run, 0, 'k');
    expect(publicationOf(run).candidates).toEqual([progress]);
    expect(ensureCandidateProgress(run, 0, 'k')).toBe(progress);
    expect(() => ensureCandidateProgress(run, 0, 'other')).toThrow(/identity/);
    expect(run.steps[0].result).toEqual({ candidates: [] });
});
