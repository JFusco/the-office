import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { acceptStageResult } from '../../../../server/delivery/pipeline/accept-stage-result';
import { ReleaseMarkerRefusal } from '../../../../server/delivery/publication/release-marker-stop';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { enqueueRequest } from '../../../../server/scheduling/requests';
import type { StageResult } from '../../../../src/shared';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { BASE, cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';

afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

/** An update-base result on a published PR, through acceptStageResult itself. */
function updateBase(markerLog: string) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', pr: 200, repairReason: 'conflicts' }), root = f.artifactRoot(job), merged = 'c'.repeat(40);
    f.state.remote[job.branch] = HEAD;
    f.state.local.head = merged;
    f.state.markerLog = markerLog;
    const path = resolve(root, 'update-base-checks.txt');
    writeFileSync(path, 'synthetic');
    const result = { outcome: 'passed', summary: 'Merged the target', commit: merged, worktree: job.worktree, branch: job.branch, blocker: '', prId: 200, previewUrl: '', qaRunDir: '', paidRuns: 0,
        approach: null, prerequisites: [], findings: [], receipts: [], evidence: [{ id: 'checks', kind: 'checks', summary: 'Synthetic', path, commit: merged, environment: 'test', url: '', observedAt: '' }] } as unknown as StageResult;
    const accept = () => claimedDelivery(f.store, job, () => acceptStageResult.call(f.delivery, { job, result, project: f.store.project, root, issue: f.state.issue, role: 'developer', continuation: undefined,
        reviewStart: undefined, inputSha256: deliveryInputSha256(f.store, job.key), beforeWorkers: new Set<string>(), technicalPhase: false,
        candidateAtStart: JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree }) }));
    return { f, job, result, accept, merged };
}

test('an update-base head that introduces a marker the check cannot clear is refused before adoption: prior head kept, no return, blocked typed', async () => {
    const { f, job, accept, merged } = updateBase(`${'c'.repeat(40)}\n${HEAD}\ndocs(readme): reword [skip release]\n\0`);
    const error = await accept().then(() => undefined, failure => failure);
    expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
    expect(job).toMatchObject({ status: 'blocked', head: HEAD, stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('unknown release wiring') } } });
    expect(job.head).not.toBe(merged);
    expect(job.releaseMarkerReturns).toBeUndefined();
    // The live refs were read only because a marker was found; nothing was written.
    expect(f.state.calls.filter(call => call.startsWith('git ls-remote'))).toEqual([`git ls-remote --heads origin refs/heads/${job.branch} refs/heads/main`]);
    expect(f.state.mutations).toEqual([]);
    expect(BASE).toBe(f.state.targetTip);
});

test('an unmarked update-base head is adopted as before, with no live read', async () => {
    const { f, job, accept, merged } = updateBase('');
    await accept();
    expect(job).toMatchObject({ head: merged, status: 'queued' });
    expect(f.state.calls.some(call => call.startsWith('git ls-remote'))).toBe(false);
});

test('a refusal raised under an owning reconciliation request is recorded on the request as blocked even while paused', async () => {
    const { f, job } = updateBase('');
    const request = enqueueRequest(f.store, 'reconcile-pr-link', job.key, '');
    const { executeRequest } = await import('../../../../server/scheduling/requests');
    const { indeterminate } = await import('../../../../server/delivery/publication/release-marker-stop');
    const { GitHubDelivery } = await import('../../../../server/delivery/pipeline/github-delivery');
    vi.spyOn(GitHubDelivery.prototype, 'reconcileWrongLink').mockImplementation(async () => { f.store.state.paused = true; throw indeterminate('tool unavailable: no npm beside the Office\'s Node'); });
    const coordinator: any = { sessionBridge: { refresh: async () => {}, forProject: () => ({ complete: true, fresh: true, ownership: { status: 'clear' } }) } };
    await executeRequest(f.store, f.engine, coordinator, request).catch(() => undefined);
    expect(request).toMatchObject({ status: 'blocked', stop: { kind: 'release-marker', releaseMarker: { reason: 'indeterminate', diagnostic: expect.stringContaining('tool unavailable') } } });
});

// Direct cases for the adoption helpers themselves.
test('checkAdoption reads nothing where the check does not apply, and persists then rethrows a refusal on the job', async () => {
    const { checkAdoption } = await import('../../../../server/delivery/publication/marker-adoption');
    const { PROJECT_POLICY_INPUTS } = await import('../../../../server/office/projects');
    const { savedState } = await import('../../store/saved-state-fixture');
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base', status: 'working' } as any), candidate = { head: 'c'.repeat(40), branch: job.branch, worktree: job.worktree };
    f.state.markerLog = `${'c'.repeat(40)}\n${HEAD}\ndocs(readme): reword [skip release]\n\0`;
    const inputs = PROJECT_POLICY_INPUTS as Map<string, object>, saved = inputs.get('cms-field-vocabulary');
    inputs.set('cms-field-vocabulary', { ...saved, releaseMarkerCheck: false });
    const calls = f.state.calls.length;
    try { await checkAdoption(f.delivery, job, candidate); } finally { if (saved) inputs.set('cms-field-vocabulary', saved); else inputs.delete('cms-field-vocabulary'); }
    expect(f.state.calls).toHaveLength(calls);
    const error = await checkAdoption(f.delivery, job, candidate).then(() => undefined, failure => failure);
    expect(error).toBeInstanceOf(ReleaseMarkerRefusal);
    expect(job).toMatchObject({ status: 'blocked', head: HEAD, stop: { kind: 'release-marker' } });
    expect(savedState<any>(f.store).coordination.jobs.find((item: any) => item.id === job.id).stop.kind).toBe('release-marker');
    // With an observation the live refs are not read again, even for a marker it must classify.
    const g = fakeGitHub(), other = g.candidate({ stage: 'update-base', status: 'working' } as any), before = g.state.calls.length;
    g.state.markerLog = f.state.markerLog;
    await expect(checkAdoption(g.delivery, other, { head: 'c'.repeat(40), branch: other.branch, worktree: other.worktree }, { target: g.state.targetTip, published: '' })).rejects.toBeInstanceOf(ReleaseMarkerRefusal);
    expect(g.state.calls.slice(before).some(call => call.startsWith('git ls-remote'))).toBe(false);
    expect(other.stop?.kind).toBe('release-marker');
});

test('writer and continuation adoption skip a correction, a screened implement result and an unchanged head', async () => {
    const { checkContinuationAdoption, checkWriterAdoption } = await import('../../../../server/delivery/publication/marker-adoption');
    const f = fakeGitHub(), job = f.candidate({ stage: 'update-base' });
    f.state.markerLog = `${'c'.repeat(40)}\n${HEAD}\ndocs(readme): reword [skip release]\n\0`;
    const result = { commit: 'c'.repeat(40), worktree: job.worktree, branch: job.branch } as StageResult;
    await checkWriterAdoption(f.delivery, { job, result, markerCorrection: {} } as any);
    await checkWriterAdoption(f.delivery, { job: { ...job, stage: 'implement' }, result, writerCheckout: {} } as any);
    await checkWriterAdoption(f.delivery, { job, result: { ...result, commit: job.head } } as any);
    await checkContinuationAdoption(f.delivery, job, { ...result, commit: job.head });
    await checkContinuationAdoption(f.delivery, job, { ...result, worktree: '' });
    expect(f.state.calls.some(call => call.startsWith('git log -z'))).toBe(false);
    await expect(checkWriterAdoption(f.delivery, { job, result } as any)).rejects.toBeInstanceOf(ReleaseMarkerRefusal);
    await expect(checkContinuationAdoption(f.delivery, job, result)).rejects.toBeInstanceOf(ReleaseMarkerRefusal);
});

// Review repair pass (run 1ce11217): the owner revalidates its proof after the asynchronous check.
test('an update-base adoption revalidates ownership and the checkout after classification; a stable candidate still advances', async () => {
    const { GitHubDelivery } = await import('../../../../server/delivery/pipeline/github-delivery');
    const marked = `${'c'.repeat(40)}\n${HEAD}\ndocs(wiki): sync [skip release]\n\0`;
    for (const move of ['checkout', 'ownership', 'none'] as const) {
        const { f, job, result, merged } = updateBase('');
        // The superset holds a marker; the live narrowing shows it came from the target, so classification reads the live refs.
        const execute = async (program: string, args: string[], options: any) => {
            if (program === 'git' && args[0] === 'log' && args[1] === '-z') return args.includes(`^${BASE}`) ? '' : marked;
            if (program === 'git' && args[0] === 'ls-remote') {
                if (move === 'checkout') f.state.local.head = 'd'.repeat(40);
                if (move === 'ownership') { const jobs = f.store.state.coordination!.jobs!; jobs[jobs.indexOf(job)] = { ...job }; }
            }
            return f.execute(program, args, options);
        };
        const delivery = new GitHubDelivery(f.store, f.engine, execute as any), root = f.artifactRoot(job);
        const run = claimedDelivery(f.store, job, () => acceptStageResult.call(delivery, { job, result, project: f.store.project, root, issue: f.state.issue, role: 'developer', continuation: undefined,
            reviewStart: undefined, inputSha256: deliveryInputSha256(f.store, job.key), beforeWorkers: new Set<string>(), technicalPhase: false,
            candidateAtStart: JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree }) }));
        if (move === 'none') { await run; expect(job.head).toBe(merged); continue; }
        await expect(run).rejects.toThrow(move === 'checkout' ? 'The candidate checkout moved during release-marker classification' : 'Delivery ownership or candidate changed during release-marker classification');
        expect(job.head).toBe(HEAD);
    }
});

// Review repair pass (run cab5a4a5): authority is read again after the final checkout read.
test('a pause or new human input during the final HEAD read adopts nothing; a stable candidate still advances', async () => {
    const { GitHubDelivery } = await import('../../../../server/delivery/pipeline/github-delivery');
    const { addMetadataHumanInput } = await import('../../../fixtures/pr-metadata');
    const marked = `${'c'.repeat(40)}\n${HEAD}\ndocs(wiki): sync [skip release]\n\0`;
    for (const change of ['pause', 'input', 'none'] as const) {
        const { f, job, result, merged } = updateBase('');
        let classified = false, changedAt = '';
        const execute = async (program: string, args: string[], options: any) => {
            if (program === 'git' && args[0] === 'log' && args[1] === '-z') return args.includes(`^${BASE}`) ? '' : marked;
            if (program === 'git' && args[0] === 'ls-remote') classified = true;
            // The revalidation's own read: after classification, the checkout still shows the submitted commit.
            if (program === 'git' && args[0] === 'rev-parse' && args[1] === 'HEAD' && classified && !changedAt) {
                changedAt = args.join(' ');
                if (change === 'pause') f.store.state.paused = true;
                if (change === 'input') addMetadataHumanInput({ store: f.store, job });
            }
            return f.execute(program, args, options);
        };
        const delivery = new GitHubDelivery(f.store, f.engine, execute as any), root = f.artifactRoot(job);
        const run = claimedDelivery(f.store, job, () => acceptStageResult.call(delivery, { job, result, project: f.store.project, root, issue: f.state.issue, role: 'developer', continuation: undefined,
            reviewStart: undefined, inputSha256: deliveryInputSha256(f.store, job.key), beforeWorkers: new Set<string>(), technicalPhase: false,
            candidateAtStart: JSON.stringify({ id: job.id, stage: job.stage, head: job.head, branch: job.branch, worktree: job.worktree }) }));
        if (change === 'none') { await run; expect(job).toMatchObject({ head: merged, status: 'queued' }); expect(changedAt).toBe('rev-parse HEAD'); continue; }
        await expect(run).rejects.toThrow(change === 'pause' ? 'Office paused before a harness write' : 'Human delivery inputs changed during release-marker classification');
        expect(changedAt).toBe('rev-parse HEAD');
        expect(job.head).toBe(HEAD);
        expect(job.stage).toBe('update-base');
    }
});
