import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { bindMetadata } from '../../../../server/delivery/publication/metadata-context';
import { PRMetadataAssessmentSchema, assessPRMetadata, savedMetadataAssessment } from '../../../../server/delivery/publication/metadata-assessment';
import { withAssignment } from '../../../../server/workers/assignment-context';
afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

function setup() {
    const f = fakeGitHub(), job = f.candidate();
    f.store.state.coordination!.enabled = true;
    const root = f.artifactRoot(job);
    Object.assign(job, { pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    const pr = { number: 200, html_url: job.prUrl, state: 'open', merged_at: null, title: 'fix: release scans', body: 'Closes #5',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: REPOSITORY } }, base: { sha: BASE, ref: 'main', repo: { full_name: REPOSITORY } } };
    job.prMetadataRepair = bindMetadata(f.delivery, job, pr, ['pr-metadata'], 'lead-pr');
    return { ...f, job, root };
}

test('metadata assessment has a dedicated strict schema without widening stage resolutions', () => {
    const result = { outcome: 'blocked', findingIds: ['pr-metadata'], evidence: ['Original scope is unclear'], summary: 'Retain the original hold', title: null, body: null };
    expect(PRMetadataAssessmentSchema.parse(result)).toEqual(result);
    expect(PRMetadataAssessmentSchema.safeParse({ ...result, resolution: { kind: 'source-repair' } }).success).toBe(false);
    expect(PRMetadataAssessmentSchema.safeParse({ ...result, evidence: [] }).success).toBe(false);
});

test('a consumed or interrupted assessment cannot dispatch another model worker', async () => {
    const f = setup(), run = vi.spyOn(f.engine.agents, 'run');
    f.job.prMetadataRepair!.assessmentStartedAt = f.store.clock.now().toISOString();
    await expect(assessPRMetadata(f.delivery, f.job, f.root)).rejects.toThrow('no second worker');
    expect(run).not.toHaveBeenCalled();
    expect(f.state.calls).toHaveLength(0);
});

test('a saved assessment flag without bound native worker and digest proof is rejected', () => {
    const f = setup();
    f.job.prMetadataRepair!.assessmentStartedAt = f.store.clock.now().toISOString();
    expect(() => savedMetadataAssessment(f.delivery, f.job)).toThrow('digest-bound');
});

test('incomplete live ownership stops before workspace preparation and model dispatch', async () => {
    const f = setup(), run = vi.spyOn(f.engine.agents, 'run');
    f.job.stage = 'prepare-pr'; f.job.status = 'working';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'fixture', 'prepare-pr')!;
    f.delivery.execute = (async (program: string) => {
        expect(program).toBe('curl');
        return JSON.stringify({ project: f.store.project.id, key: f.job.key, complete: false, fresh: true, ownership: { status: 'unavailable' } });
    }) as typeof f.delivery.execute;
    await expect(withAssignment(claim, 'delivery', () => assessPRMetadata(f.delivery, f.job, f.root))).rejects.toThrow('Fresh complete clear');
    expect(run).not.toHaveBeenCalled();
    expect(f.job.prMetadataRepair!.assessmentStartedAt).toBeUndefined();
});
