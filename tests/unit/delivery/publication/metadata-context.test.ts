import { afterEach, expect, test } from 'vitest';
import { realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, HEAD, BASE, REPOSITORY } from '../support/fake-github';
import { bindMetadata, assertMetadataBinding } from '../../../../server/delivery/publication/metadata-context';
import { metadataWorkspace } from '../../../../server/delivery/publication/metadata-workspace';
import { runHarnessStage } from '../../../../server/delivery/harness/run-harness-stage';
import { addMetadataHumanInput, metadataFixture } from '../../../fixtures/pr-metadata';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { acceptMetadataReview, requireMetadataReview } from '../../../../server/delivery/publication/metadata-review';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

function setup() {
    const f = fakeGitHub(), job = f.candidate();
    f.store.state.coordination!.enabled = true;
    f.artifactRoot(job);
    Object.assign(job, { pr: 200, prUrl: `https://github.com/${REPOSITORY}/pull/200` });
    const pr = { number: 200, html_url: job.prUrl, state: 'open', merged_at: null, title: 'fix: release scans', body: 'Closes #5',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: REPOSITORY } }, base: { sha: BASE, ref: 'main', repo: { full_name: REPOSITORY } } };
    job.prMetadataRepair = bindMetadata(f.delivery, job, pr, ['pr-metadata'], 'lead-pr');
    return { ...f, job, pr };
}

test('the immutable binding rejects a rewritten job head, metadata bytes and controls', () => {
    const f = setup(), r = f.job.prMetadataRepair!;
    expect(() => assertMetadataBinding(f.delivery, f.job)).not.toThrow();
    f.job.head = 'c'.repeat(40);
    expect(() => assertMetadataBinding(f.delivery, f.job)).toThrow('changed');
    f.job.head = HEAD; r.binding.before.body = 'Different body';
    expect(() => assertMetadataBinding(f.delivery, f.job)).toThrow('changed');
    r.binding.before.body = f.pr.body; f.store.state.draining = true;
    expect(() => assertMetadataBinding(f.delivery, f.job)).toThrow('changed');
});

test.each(['absent', 'prepared', 'rejected', 'foreign-job', 'foreign-binding', 'foreign-result', 'review-only', 'done-only'])('changed human input retains the fence for %s publication evidence', state => {
    const f = metadataFixture(), r = f.record, a = r.assessment!;
    if (state === 'review-only') r.phase = 'review';
    if (state === 'done-only') r.phase = 'done';
    if (!['absent', 'review-only', 'done-only'].includes(state)) {
        f.store.putEffect({ id: `harness:${f.job.id}:pr-metadata:${r.id}`, work: { projectId: f.store.project.id, kind: 'delivery', id: state === 'foreign-job' ? 'other' : f.job.id },
            attemptId: f.job.id, operation: 'github-pr-metadata', target: r.binding.url, authorization: 'office-harness',
            payload: { binding: state === 'foreign-binding' ? { ...r.binding, head: 'f'.repeat(40) } : r.binding, origin: r.origin,
                workerId: a.workerId, resultSha256: state === 'foreign-result' ? 'f'.repeat(64) : a.resultSha256, proposalSha256: a.proposalSha256, selected: a.selected },
            expectedState: {}, status: state === 'prepared' || state === 'rejected' ? state : 'uncertain', createdAt: '',
            dispatchedAt: state === 'prepared' || state === 'rejected' ? '' : f.store.clock.now().toISOString(),
            verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    }
    addMetadataHumanInput(f);
    expect(() => assertMetadataBinding(f.delivery, f.job)).toThrow('inputs or controls changed');
    expect(f.writes.patches).toBe(0);
});

test.each(['prepared', 'rejected', 'dispatching', 'uncertain', 'dispatched-rejection', 'wrong-operation', 'wrong-job', 'wrong-kind', 'wrong-head'])('metadata binding fences merge intent state: %s', async state => {
    const f = metadataFixture(); await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const leadClaim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'lead-fixture', 'lead-pr')!;
    const result: StageResult = { outcome: 'passed', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Metadata and readiness verified', blocker: '', evidence: [], receipts: [], previewUrl: '', qaRunDir: '', paidRuns: 0,
        findings: [{ id: 'pr-metadata', status: 'verified', summary: 'Metadata verified', expected: 'Selected content', actual: 'Native readback', attempts: 0 }] };
    const before = new Set(f.store.state.workLog?.map(w => w.id));
    f.job.steps.push({ stage: 'lead-pr', result }); f.nativeAssessment(result, { stage: 'github-lead-pr', claim: leadClaim });
    await withAssignment(leadClaim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before));
    await withAssignment(leadClaim, 'delivery', () => requireMetadataReview(f.delivery, f.job));
    f.store.finishClaim(leadClaim.id, 'completed');
    f.job.stage = 'merge';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'merge-fixture', 'merge')!;
    const id = f.job.mergeIntentId = `merge:${f.job.id}:${f.job.head}`;
    f.store.putEffect({ id, work: { projectId: f.store.project.id, kind: state === 'wrong-kind' ? 'reconciliation' : 'delivery', id: state === 'wrong-job' ? 'other' : f.job.id },
        attemptId: f.job.id, operation: state === 'wrong-operation' ? 'github-pr-metadata' : 'github-merge', target: f.job.prUrl, authorization: 'fixture',
        payload: { sha: state === 'wrong-head' ? 'f'.repeat(40) : f.job.head }, expectedState: {},
        status: state === 'prepared' || state === 'dispatching' || state === 'uncertain' ? state : 'rejected',
        createdAt: '', dispatchedAt: ['dispatching', 'uncertain', 'dispatched-rejection'].includes(state) ? '2026-11-10T00:00:00Z' : '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    const check = () => withAssignment(claim, 'delivery', () => assertMetadataBinding(f.delivery, f.job));
    if (['prepared', 'rejected'].includes(state)) expect(check).not.toThrow();
    else expect(check).toThrow('changed');
});

test('legacy recovery records never make an admitted job eligible for a general metadata path', async () => {
    const f = setup();
    f.job.candidateRecovery = { head: HEAD, findingIds: [], summary: 'Legacy source gate' };
    expect(() => assertMetadataBinding(f.delivery, f.job)).toThrow('changed');
    f.job.stage = 'prepare-pr';
    await expect(runHarnessStage(f.delivery, f.job, f.artifactRoot(f.job), true)).rejects.toThrow('cannot fall through');
    expect(f.state.calls).toHaveLength(0);
});

test('a retained conventional candidate uses its exact declared toolchain and locked install', async () => {
    const f = setup();
    writeFileSync(resolve(f.job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@11.1.1' }));
    const original = f.delivery.execute, observed: string[] = [];
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm') { observed.push(args.join(' ')); return args[0] === '--version' ? '11.1.1\n' : ''; }
        return original(program, args, options);
    }) as typeof original;
    expect(await metadataWorkspace(f.delivery, f.job, true)).toBe(realpathSync(f.job.worktree));
    expect(observed).toEqual(['--version', '--version', 'install --frozen-lockfile --prod=false --ignore-workspace']);
});

test('empty or root candidates and a wrong declared toolchain fail before installation', async () => {
    const f = setup();
    writeFileSync(resolve(f.job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@11.1.1' }));
    const original = f.delivery.execute; let installs = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm') { if (args[0] === 'install') installs++; return '10.33.0'; }
        return original(program, args, options);
    }) as typeof original;
    await expect(metadataWorkspace(f.delivery, f.job, true)).rejects.toThrow('exact declared');
    expect(installs).toBe(0);
    const rebind = () => { f.job.prMetadataRepair = undefined; f.job.prMetadataRepair = bindMetadata(f.delivery, f.job, f.pr, ['pr-metadata'], 'lead-pr'); };
    f.job.worktree = ''; rebind();
    await expect(metadataWorkspace(f.delivery, f.job)).rejects.toThrow('workspace');
    f.job.worktree = f.repo; rebind();
    await expect(metadataWorkspace(f.delivery, f.job)).rejects.toThrow('root workspace');
});
