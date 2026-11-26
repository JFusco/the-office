import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { expect, test, vi } from 'vitest';
import { addMetadataHumanInput, metadataFixture } from '../../../fixtures/pr-metadata';
import { assessPRMetadata } from '../../../../server/delivery/publication/metadata-assessment';
import { harnessPrepare } from '../../../../server/delivery/publication/prepare-stage';
import { acceptMetadataReview, requireMetadataReview } from '../../../../server/delivery/publication/metadata-review';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { metadataScope } from '../../../../server/delivery/publication/metadata-provider';
import { digest } from '../../../../server/store/readback-evidence';
import { acceptStageResult } from '../../../../server/delivery/pipeline/accept-stage-result';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { readDescriptionHistory } from '../../../../server/delivery/publication/description-history';
import { publishMetadata } from '../../../../server/delivery/publication/publish-metadata';
import { metadataAppliesToHead } from '../../../../server/delivery/publication/metadata-context';
import { plan } from '../../../fixtures/ci-repair';
import { resumeParked } from '../../../../server/delivery/parking/resume';
import { expectedWait } from '../../../../server/incidents/expected-block';
import { stoppedRecord } from '../../../../server/incidents/sources/stopped-record';
import { CommandFailure } from '../../../../server/workers/process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INCIDENTS, staleFixture } from '../../../fixtures/stale-description';
import { editDescription } from '../support/fake-github';

function leadResult(f: ReturnType<typeof metadataFixture>, changes: Partial<StageResult> = {}): StageResult {
    return { outcome: 'passed', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Independently verified metadata and readiness', blocker: '', paidRuns: 0, previewUrl: '', qaRunDir: '', receipts: [],
        findings: [{ id: 'pr-metadata', status: 'verified', summary: 'Metadata verified', expected: 'Repository contract', actual: 'Exact selected metadata', attempts: 0 }],
        evidence: [{ id: 'checks', kind: 'provider', commit: f.job.head, summary: 'Current checks observed', path: '', url: f.job.prUrl, environment: 'fixture', observedAt: '' }],
        ...changes };
}

async function acceptLead(f: ReturnType<typeof metadataFixture>, result: StageResult, reviewStart: any = f.pr) {
    f.job.stage = 'lead-pr'; f.job.status = 'working';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'native-lead', 'lead-pr')!;
    const beforeWorkers = new Set(f.store.state.workLog?.map(w => w.id));
    const native = f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    try {
        await withAssignment(claim, 'delivery', () => acceptStageResult.call(f.delivery, { job: f.job, result, root: f.root, project: f.store.project,
            role: 'lead', issue: f.state.issue, continuation: undefined, reviewStart, beforeWorkers,
            inputSha256: deliveryInputSha256(f.store, f.job.key), technicalPhase: false,
            candidateAtStart: JSON.stringify({ id: f.job.id, stage: f.job.stage, head: f.job.head, branch: f.job.branch, worktree: f.job.worktree }) }));
    } finally { f.store.finishClaim(claim.id, 'completed'); }
    return native;
}

test('one actual native read-only assessment is persisted and reused without another model', async () => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run').mockImplementation(async () => { f.nativeAssessment(); return f.verdict as any; });
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(f.record.phase).toBe('publish'); expect(f.record.assessment?.selected).toEqual(f.selected);
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(model).toHaveBeenCalledTimes(1); expect(model.mock.calls[0][3]).toMatchObject({ readOnly: true, requestId: f.job.id, stage: 'github-pr-metadata-assessment' });
    expect(f.writes.patches).toBe(0);
});

test.each([false, true])('a completed metadata review accepts fresh same-head native proof with later comments=%s', async comments => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const preparation = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.job.steps.push({ stage: 'prepare-pr', result: preparation! }); f.store.finishClaim(f.claim.id, 'completed');
    if (comments) f.state.comments.push({ id: 500, user: { login: 'JFusco' }, body: 'Published metadata is ready for review' });
    const first = await acceptLead(f, leadResult(f)), priorIndex = f.record.reviewedAfterStep;
    expect(f.record.review?.workerId).toBe(first.worker.id); expect(f.record.phase).toBe('done');
    if (comments) f.state.comments.push({ id: 501, user: { login: 'JFusco' }, body: 'LGTM after the metadata repair' });
    f.pr.base.sha = 'c'.repeat(40);
    const next = await acceptLead(f, leadResult(f));
    expect(f.record.review?.workerId).toBe(next.worker.id); expect(f.record.reviewedAfterStep).toBe(f.job.steps.length - 1);
    expect(f.record.reviewedAfterStep).toBeGreaterThan(priorIndex!);
    await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
    expect(f.record.phase).toBe('done'); expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test('a native provider wait keeps metadata proof pending while ordinary observation queues fresh readiness', async () => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const preparation = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.job.steps.push({ stage: 'prepare-pr', result: preparation! }); f.store.finishClaim(f.claim.id, 'completed');
    const waiting = leadResult(f, { outcome: 'blocked', summary: 'Checks are running', blocker: 'Wait for exact-head checks',
        resolution: { kind: 'provider-wait', findingIds: ['checks'], evidenceIds: ['checks'], release: null } });
    waiting.findings.push({ id: 'checks', status: 'open', summary: 'Checks running', expected: 'Passed checks', actual: 'Queued', attempts: 0 });
    let complete = false;
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        status: complete ? 'completed' : 'in_progress', conclusion: complete ? 'success' : null }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    await acceptLead(f, waiting);
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'watching' }); expect(f.job.parked).toBeUndefined();
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined(); expect(f.record.reviewedAfterStep).toBeUndefined();
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    complete = true;
    await f.delivery.observe();
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
    await acceptLead(f, leadResult(f));
    expect(f.record.phase).toBe('done'); await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
    expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled(); expect(f.job.repairCycle).toBeUndefined();
});

test.each(['source-resolution', 'older-metadata'])('an unadmitted reserved metadata finding never falls through to source or CI repair: %s', async kind => {
    const f = metadataFixture();
    if (kind === 'older-metadata') await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    const record = structuredClone(f.record);
    f.store.finishClaim(f.claim.id, 'completed');
    if (kind === 'source-resolution') delete f.job.prMetadataRepair;
    else { f.record.phase = 'done'; f.job.head = f.pr.head.sha = 'd'.repeat(40); }
    const cycle = structuredClone(f.job.repairCycle), model = vi.spyOn(f.engine.agents, 'run'), ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const result = leadResult(f, { outcome: 'blocked', resolution: kind === 'older-metadata' ? null : { kind: 'source-repair', findingIds: ['pr-metadata'], evidenceIds: ['checks'], release: null } });
    result.findings[0].status = 'open';
    await expect(acceptLead(f, result)).rejects.toThrow('Unadmitted reserved PR metadata');
    expect(f.job.steps.at(-1)?.result).toEqual(result); expect(f.job.repairCycle).toEqual(cycle); expect(f.job.ciRepairs).toBeUndefined();
    expect(source).not.toHaveBeenCalled(); expect(ci).not.toHaveBeenCalled(); expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(kind === 'older-metadata' ? 1 : 0);
    if (kind === 'source-resolution') expect(f.job.prMetadataRepair).toBeUndefined();
    else expect(f.record).toEqual({ ...record, phase: 'done' });
});

test('fresh native Lead review accepts later authenticated human input while retaining the original binding', async () => {
    const f = metadataFixture(), binding = structuredClone(f.record.binding);
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(binding.inputSha256);
    await acceptLead(f, leadResult(f));
    expect(f.record.phase).toBe('done'); await claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job));
    expect(f.record.binding).toEqual(binding); expect(f.writes.patches).toBe(1);
});

test('authenticated human input before metadata dispatch retains the original input fence', async () => {
    const f = metadataFixture(); addMetadataHumanInput(f);
    expect(deliveryInputSha256(f.store, f.job.key)).not.toBe(f.record.binding.inputSha256);
    await expect(f.run(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('inputs or controls changed');
    expect(f.writes.patches).toBe(0);
});

test.each(['blocked', 'failed'] as const)('a native metadata-verifying %s verdict reaches ordinary CI routing without merge proof', async outcome => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        name: 'unit', status: 'completed', conclusion: 'failure' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const ci = vi.spyOn(f.delivery, 'queueCIRepair');
    const native = await acceptLead(f, leadResult(f, { outcome, resolution: null, blocker: 'Exact-head unit check failed' }));
    expect(ci).toHaveBeenCalledWith(f.job); expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose');
    expect(f.job.steps.at(-1)).toMatchObject({ workerId: native.worker.id, nativeResultSha256: native.resultSha256 });
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined();
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test.each([
    ['blocked', false], ['failed', false], ['blocked', true], ['failed', true],
] as const)('a native metadata-verifying %s source verdict uses bounded repair with failing CI=%s', async (outcome, failingCI) => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const history = structuredClone(f.record), effectId = `harness:${f.job.id}:pr-metadata:${f.record.id}`, effect = structuredClone(f.store.getEffect(effectId));
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head,
        name: 'unit', status: 'completed', conclusion: failingCI ? 'failure' : 'success' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const path = resolve(f.root, 'source-review.json');
    writeFileSync(path, JSON.stringify({ head: f.job.head, finding: 'src', detail: 'Unrelated source defect requires repair' }));
    const result = leadResult(f, { outcome, blocker: 'Unrelated source defect requires repair',
        resolution: { kind: 'source-repair', findingIds: ['src'], evidenceIds: ['src-ev'], release: null } });
    result.findings.push({ id: 'src', status: 'open', summary: 'Unrelated source defect', expected: 'Correct source behavior', actual: 'Defect observed', attempts: 0 });
    result.evidence.push({ id: 'src-ev', kind: 'review', commit: f.job.head, path, summary: 'Exact-head source defect', url: '', environment: 'fixture', observedAt: '' });
    const ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const native = await acceptLead(f, result);
    expect(ci).toHaveBeenCalledOnce(); expect(ci).toHaveBeenCalledWith(f.job);
    if (failingCI) {
        expect(source).not.toHaveBeenCalled(); expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued' });
        expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose'); expect(f.job.repairCycle).toBeUndefined();
    } else {
        expect(source).toHaveBeenCalledOnce(); expect(source).toHaveBeenCalledWith(f.job, result, f.root);
        expect(ci.mock.invocationCallOrder[0]).toBeLessThan(source.mock.invocationCallOrder[0]);
        expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'source',
            repairCycle: { pendingFindingIds: ['src'], attempts: 1, findingAttempts: { src: 1 }, phase: 'repair', publishedHead: f.job.head } });
        expect(f.job.ciRepairs).toBeUndefined();
    }
    expect(f.job.steps.at(-1)).toMatchObject({ workerId: native.worker.id, nativeResultSha256: native.resultSha256 });
    expect(f.store.state.knowledge?.learningConsumed?.some(id => id.startsWith(`job:${f.job.id}:lead-pr:`))).toBe(true);
    expect(f.record).toEqual(history); expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined();
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
    expect(f.store.getEffect(effectId)).toEqual(effect); expect(f.writes.patches).toBe(1); expect(model).not.toHaveBeenCalled();
});

test.each(['review', 'done'] as const)('verified metadata in phase %s becomes retained history on a repaired source head', async phase => {
    const f = metadataFixture(); await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.record.phase = phase; f.job.head = 'd'.repeat(40);
    const history = structuredClone(f.record);
    expect(metadataAppliesToHead(f.store, f.job)).toBe(false);
    await requireMetadataReview(f.delivery,f.job);
    expect(f.record).toEqual(history); expect(f.writes.patches).toBe(1);
    const effect = f.store.getEffect(`harness:${f.job.id}:pr-metadata:${f.record.id}`)!;
    f.store.putEffect({ ...effect, status: 'uncertain' });
    expect(metadataAppliesToHead(f.store, f.job)).toBe(true);
});

test.each(['pr-metadata', 'source'] as const)('provider-wait CI diagnosis keeps the admitted one-shot boundary for %s plans', async kind => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run').mockImplementation(async () => { f.nativeAssessment(); return f.verdict as any; });
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true)); f.store.finishClaim(f.claim.id, 'completed');
    const history = structuredClone(f.record), id = `harness:${f.job.id}:pr-metadata:${f.record.id}`, effect = structuredClone(f.store.getEffect(id));
    const execute = f.delivery.execute; let failing = false;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[1]?.includes('/check-runs')) return JSON.stringify({ total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head, name: 'unit', status: failing ? 'completed' : 'in_progress', conclusion: failing ? 'failure' : null }] });
        if (program === 'gh' && args[1]?.endsWith('/status')) return JSON.stringify({ sha: f.job.head, total_count: 0, statuses: [], state: 'success' });
        return execute(program, args, options);
    }) as typeof execute;
    await acceptLead(f, leadResult(f, { outcome: 'blocked', resolution: { kind: 'provider-wait', findingIds: ['checks'], evidenceIds: ['checks'], release: null } }));
    failing = true;
    await f.delivery.observe(); expect(f.job.ciRepairs?.at(-1)?.phase).toBe('diagnose');
    model.mockImplementation(async (_role, prompt) => {
        expect(prompt).not.toContain('pr-metadata (return');
        return { ...plan(kind), title: f.selected.title, body: f.selected.body } as any;
    });
    await claimedDelivery(f.store,f.job,()=>f.delivery.step(f.job));
    expect(f.job.ciRepairs!.at(-1)?.phase).toBe(kind === 'pr-metadata' ? 'blocked' : 'apply');
    if (kind === 'pr-metadata') expect(f.job.detail).toContain('one-shot');
    expect(f.record).toEqual(history); expect(f.store.getEffect(id)).toEqual(effect);
    expect(f.writes.patches).toBe(1); expect(model).toHaveBeenCalledTimes(2);
    await expect(claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job))).rejects.toThrow('Fresh independent');
});

test.each(['permission', 'human-hold', 'scope', 'uncertain-effect', 'release'] as const)('metadata verification does not release a genuine %s gate', async kind => {
    const f = metadataFixture(); await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'gated-lead', 'lead-pr')!;
    const result = leadResult(f, { outcome: 'failed', resolution: { kind: kind === 'release' ? 'provider-wait' : kind,
        findingIds: ['gate'], evidenceIds: ['checks'], release: kind === 'release' ? { registry: 'npm', package: 'fixture', minimum: '1.0.0' } : null } });
    f.job.steps.push({ stage: 'lead-pr', result });
    const before = new Set(f.store.state.workLog?.map(w => w.id));
    f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    await expect(withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before))).rejects.toThrow('explicitly verify');
    expect(f.record.phase).toBe('review'); expect(f.record.review).toBeUndefined(); expect(f.writes.patches).toBe(1);
});

test('a completed original assessment is read back after a lost harness return without dispatching another model', async () => {
    const f = metadataFixture(false), model = vi.spyOn(f.engine.agents, 'run');
    f.record.assessmentStartedAt = f.store.clock.now().toISOString(); f.record.assessmentClaimId = f.claim.id;
    f.record.scopeSha256 = digest(await f.run(() => metadataScope(f.delivery, f.job)));
    const original = f.nativeAssessment();
    await f.run(() => assessPRMetadata(f.delivery, f.job, f.root));
    expect(f.record.assessment?.workerId).toBe(original.worker.id); expect(f.record.phase).toBe('publish');
    expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0);
});

test('already-ready preparation consumes actual saved metadata instead of returning before the PATCH', async () => {
    const f = metadataFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const result = await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    expect(result?.outcome).toBe('passed'); expect(f.writes.patches).toBe(1); expect(f.pr.body).toBe(f.selected.body);
    expect(f.record.phase).toBe('review'); expect(model).not.toHaveBeenCalled();
    await expect(f.run(() => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)))).rejects.toThrow('Fresh independent');
});

test('publication alone cannot merge; a new native Lead must explicitly verify the original metadata finding', async () => {
    const f = metadataFixture();
    await f.run(() => harnessPrepare(f.delivery, f.job, f.root, true));
    f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'fresh-review', 'lead-pr')!;
    const result: StageResult = { outcome: 'passed', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        summary: 'Native fixture independently verified the corrected metadata and readiness', evidence: [], findings: [], receipts: [], paidRuns: 0,
        blocker: '', approach: null, prerequisites: null, previewUrl: '', qaRunDir: '' };
    const before = new Set(f.store.state.workLog!.map(w => w.id));
    f.job.steps.push({ stage: 'lead-pr', result });
    await expect(withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before))).rejects.toThrow('explicitly verify');
    result.findings = [{ id: 'pr-metadata', status: 'verified', summary: 'Canonical body verified', expected: 'Repository contract', actual: 'Exact selected content read back', attempts: 0 }];
    f.nativeAssessment(result, { stage: 'github-lead-pr', claim });
    await withAssignment(claim, 'delivery', () => acceptMetadataReview(f.delivery, f.job, result, before));
    expect(f.record.phase).toBe('done');
    await withAssignment(claim, 'delivery', () => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)));
    f.pr.body += '\nNew human edit';
    await expect(withAssignment(claim, 'delivery', () => claimedDelivery(f.store,f.job,()=>requireMetadataReview(f.delivery, f.job)))).rejects.toThrow('Reviewed metadata changed');
});

const TITLE = 'docs(operating): require explicit source acceptance [skip release]';
/** A current blocked readiness review of a title the repository's lint accepts; with `advisory`, a carried note beside it (the GH-189 shape). */
function humanEditReview(f: ReturnType<typeof metadataFixture>, advisory = true): StageResult {
    return leadResult(f, { outcome: 'blocked', resolution: null, summary: 'Release marker in the PR title', blocker: 'Remove [skip release] from the PR title',
        findings: [{ id: 'pr-metadata', status: 'open', summary: 'Release marker in the PR title', expected: 'Remove [skip release] from the title; keep the issue link', actual: '[skip release]', attempts: 0 },
            ...(advisory ? [{ id: 'review-note', status: 'open' as const, summary: 'Carried advisory: the OPERATING.md wording could be tighter', expected: 'Optional wording change', actual: 'Current wording', attempts: 0 }] : [])] });
}

/** An unbound published PR in review with both cards on the board; counts card writes by item. */
function humanEditFixture() {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed');
    f.pr.title = TITLE;
    f.state.cards[0].status = 'review'; f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'review' });
    const moves: string[] = [], execute = f.delivery.execute;
    let failPRReadAfterIssueMove = false;
    f.delivery.execute = (async (program, args, options) => {
        const request = program === 'gh' && args[1] === 'graphql' ? JSON.parse(options!.input!) : undefined;
        if (String(request?.query).startsWith('mutation')) moves.push(request.variables.item);
        if (failPRReadAfterIssueMove && String(request?.query).includes('fieldValues') && request.variables.item === 'pr-card' && f.state.cards[0].status === 'block') {
            failPRReadAfterIssueMove = false;
            throw new Error('gh: HTTP 502 reading the card');
        }
        return execute(program, args, options);
    }) as typeof execute;
    const api = f.delivery.api.bind(f.delivery);
    f.delivery.api = async path => path.includes('/check-runs') ? { total_count: 1, check_runs: [{ id: 10, head_sha: f.job.head, name: 'unit', status: 'completed', conclusion: 'success' }] } :
        path.endsWith('/status') ? { sha: f.job.head, total_count: 0, statuses: [], state: 'success' } : api(path);
    const parkEffects = () => (f.store.db.prepare('SELECT body FROM effects').all() as { body: string }[]).map(row => JSON.parse(row.body)).filter(e => e.id.includes(':park'));
    return { ...f, moves, parkEffects, failNextPRReadAfterIssueMove: () => { failPRReadAfterIssueMove = true; } };
}

const stores = (f: ReturnType<typeof metadataFixture>) => new Map([[f.store.project.id, f.store]]);

test.each([true, false])('a current PR edit the harness may not make parks once with one actionable comment; the edit and the issue card return run a fresh lead-pr (advisory=%s)', async advisory => {
    const f = humanEditFixture(), ci = vi.spyOn(f.delivery, 'queueCIRepair'), source = vi.spyOn(f.delivery, 'queueSourceRepair');
    const model = vi.spyOn(f.engine.agents, 'run');
    const result = humanEditReview(f, advisory);
    await acceptLead(f, result);
    expect(f.job).toMatchObject({ status: 'blocked', stage: 'lead-pr', parked: { stage: 'lead-pr', published: true } });
    expect(f.state.comments).toHaveLength(1);
    const body = f.state.comments[0].body as string;
    expect(body.startsWith(`Office decision ${f.job.id}:${f.job.steps.length}: PR #200 needs an edit to its title`)).toBe(true);
    expect(body).toContain("The edit Sam's review asks for: Remove [skip release] from the title; keep the issue link.");
    expect(body).toContain("Then move the issue card, not the pull request's card, back to Ready; the Office then runs a fresh review.");
    expect(body).toContain('A reply to Morgan does not resume it.');
    expect(body.includes('- review-note: Carried advisory: the OPERATING.md wording could be tighter.')).toBe(advisory);
    expect(f.job.parked!.instruction).toBe(body.slice(body.indexOf('\n\n') + 2));
    expect(f.state.cards.map(card => card.status)).toEqual(['block', 'block']);
    expect(f.moves).toEqual(['issue-card', 'pr-card']);
    expect(f.parkEffects().map(e => [e.id.replaceAll(f.job.id, 'job'), e.status]).sort()).toEqual([
        [`harness:job:park-comment:${f.job.steps.length}`, 'verified'],
        [`harness:job:park:job:${f.job.steps.length}:lane:issue-card`, 'verified'],
        [`harness:job:park:job:${f.job.steps.length}:lane:pr-card`, 'verified']]);
    expect(expectedWait(stoppedRecord(f.store.state, { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'lead-pr')!.facts)).toBe('decision');
    expect(ci).not.toHaveBeenCalled(); expect(source).not.toHaveBeenCalled(); expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0);
    expect(f.job.prMetadataRepair).toBeUndefined();

    // A reply is not a resume; the edit and the issue card back in Ready are.
    const assigned = [{ key: f.job.key, pickupStatus: 'Block' }] as any;
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: true, status: 'Ready' }, stores(f), new Date())).toEqual([]);
    f.pr.title = 'docs(operating): require explicit source acceptance';
    f.state.cards[0].status = 'ready'; assigned[0].pickupStatus = 'Ready';
    expect(resumeParked(f.store, f.delivery.jobs, assigned, { enabled: true, status: 'Ready' }, stores(f), new Date())).toEqual([f.job.key]);
    expect(f.job).toMatchObject({ status: 'queued', stage: 'lead-pr' }); expect(f.job.parked).toBeUndefined();
    const steps = f.job.steps.length;
    model.mockImplementation(async () => leadResult(f) as any);
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(model).toHaveBeenCalledOnce(); expect(model.mock.calls[0][3]).toMatchObject({ stage: 'github-lead-pr', readOnly: true, requestId: f.job.id });
    expect(f.job.steps).toHaveLength(steps + 1); expect(f.job.steps.at(-1)).toMatchObject({ stage: 'lead-pr', result: { outcome: 'passed' } });
    expect(f.state.comments).toHaveLength(1); expect(f.writes.patches).toBe(0);
});

test.each(['edited during the lint', 'edited during the review', 'lint tool error', 'not a harness delivery'] as const)('no park is written when the decision is stale or not the harness\'s: %s', async kind => {
    const f = humanEditFixture(), model = vi.spyOn(f.engine.agents, 'run');
    const lint = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run' && kind === 'edited during the lint') f.pr.title = 'Joe edited the title';
        if (program === 'pnpm' && args[0] === 'run' && kind === 'lint tool error') throw new CommandFailure('pnpm exited 1: missing helper', 'other', true);
        return lint(program, args, options);
    }) as typeof lint;
    if (kind === 'not a harness delivery') (f.job as any).closeoutRecovery = { id: 'legacy-closeout' };
    // What the review read is its own copy of the pull request, not the live object.
    const reviewStart = { ...structuredClone(f.pr), ...(kind === 'edited during the review' ? { title: 'What Sam read' } : {}) };
    const run = acceptLead(f, humanEditReview(f, false), reviewStart);
    await expect(run).rejects.toThrow(kind === 'lint tool error' ? 'missing helper' : 'Unadmitted reserved PR metadata');
    expect(f.job.parked).toBeUndefined(); expect(f.state.comments).toEqual([]); expect(f.moves).toEqual([]); expect(f.parkEffects()).toEqual([]);
    expect(f.state.cards.map(card => card.status)).toEqual(['review', 'review']);
    expect(model).not.toHaveBeenCalled(); expect(f.writes.patches).toBe(0);
});

test.each(['no board', 'no issue card'] as const)('with %s nothing promises a card-driven resume: the job stops with the edit and the fresh-review route', async kind => {
    const f = humanEditFixture();
    if (kind === 'no board') delete (f.store.project as any).githubProject;
    else f.state.cards.splice(0, 1);
    await expect(acceptLead(f, humanEditReview(f))).rejects.toThrow(kind === 'no board' ? 'It was not parked: this project has no configured board, so moving a card cannot resume it. Edit the PR, then ask for a fresh review with review-pr.'
        : 'It was not parked: the issue has no card on the board, so moving a card cannot resume it. Put the issue card back on the board, edit the PR, then ask for a fresh review with review-pr.');
    expect(f.job.parked).toBeUndefined(); expect(f.state.comments).toEqual([]); expect(f.moves).toEqual([]); expect(f.parkEffects()).toEqual([]);
});

test('a park that stops after the first card keeps its evidence unpublished and its comment unsent; the next pass finishes it without sending the first move again', async () => {
    const f = humanEditFixture(), model = vi.spyOn(f.engine.agents, 'run');
    f.failNextPRReadAfterIssueMove();
    await expect(acceptLead(f, humanEditReview(f))).rejects.toThrow('HTTP 502');
    expect(f.job).toMatchObject({ status: 'blocked', parked: { published: false } });
    expect(f.state.comments).toHaveLength(0); expect(f.moves).toEqual(['issue-card']);
    expect(f.state.cards.map(card => card.status)).toEqual(['block', 'review']);
    expect(resumeParked(f.store, f.delivery.jobs, [{ key: f.job.key, pickupStatus: 'Ready' }] as any, { enabled: true, status: 'Ready' }, stores(f), new Date())).toEqual([]);
    const steps = f.job.steps.length;
    f.job.status = 'queued';
    await claimedDelivery(f.store, f.job, () => f.delivery.step(f.job));
    expect(f.job).toMatchObject({ status: 'blocked', parked: { published: true } });
    expect(f.state.comments).toHaveLength(1); expect(f.moves).toEqual(['issue-card', 'pr-card']);
    expect(f.state.cards.map(card => card.status)).toEqual(['block', 'block']);
    expect(f.parkEffects().every(e => e.status === 'verified')).toBe(true); expect(f.parkEffects()).toHaveLength(3);
    expect(f.job.steps).toHaveLength(steps); expect(model).not.toHaveBeenCalled();
});

// GH-193 through the bounded handoff. Its native draft records live under a synthetic home.
const home = vi.hoisted(() => ({ path: '/nonexistent-office-home' }));
vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), homedir: () => home.path }));

/** Unassigned GH-193 taken over from its saved readiness review, waiting at prepare-pr for its one assessment. */
async function staleTakeover() {
    const f = staleFixture('GH-193'); home.path = f.home;
    expect(f.state.issue.assignees).toEqual([]);
    await acceptLead(f, f.review, structuredClone(f.pr));
    const r = f.job.prMetadataRepair!;
    expect(r.binding.staleDescription).toMatchObject({ head: INCIDENTS['GH-193'].published }); expect(f.job.stage).toBe('prepare-pr');
    f.job.status = 'working';
    const prep = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'stale-prepare', 'prepare-pr')!;
    const verdict = (title: string | null, body: string | null, outcome: 'repair' | 'unchanged' = 'repair') =>
        ({ outcome, findingIds: ['pr-metadata'], evidence: ['Retained review and validation of 074eedf'], summary: 'Refresh the description for 074eedf', title, body });
    const model = vi.spyOn(f.engine.agents, 'run'), prompts: string[] = [];
    const assess = (result: ReturnType<typeof verdict>) => model.mockImplementation(async (_role, prompt) => { prompts.push(prompt); f.nativeAssessment(result, { claim: prep }); return result as any; });
    const inPrep = <T>(fn: () => T) => withAssignment(prep, 'delivery', fn);
    return { f, r, prep, verdict, assess, model, prompts, inPrep, before: structuredClone(r.binding.before) };
}

test('GH-193: unassigned, one assessment refreshes the body for 074eedf with one body-only PATCH, then a separate same-head readiness pass verifies it', async () => {
    const { f, r, prep, verdict, assess, model, prompts, inPrep, before } = await staleTakeover();
    assess(verdict(before.title, f.selected.body));
    const preparation = await inPrep(() => harnessPrepare(f.delivery, f.job, f.root, true));
    expect(preparation?.outcome).toBe('passed'); expect(model).toHaveBeenCalledOnce();
    expect(prompts[0]).toContain(`STALE OWN DESCRIPTION: the harness proved the live body is the Office's own description, written for earlier head ${INCIDENTS['GH-193'].published}`);
    expect(f.writes.patches).toBe(1); expect(f.writes.inputs).toEqual([{ body: f.selected.body }]);
    expect(f.pr).toMatchObject({ title: before.title, body: f.selected.body });
    const effect = f.store.getEffect(`harness:${f.job.id}:pr-metadata:${r.id}`);
    expect(effect).toMatchObject({ status: 'verified', receipt: { head: INCIDENTS['GH-193'].head, title: before.title, body: f.selected.body } });
    expect(effect?.receipt).not.toHaveProperty('revision');
    expect(r.phase).toBe('review');
    await inPrep(() => acceptStageResult.call(f.delivery, { job: f.job, result: preparation!, project: f.store.project, root: f.root,
        issue: f.state.issue, role: 'lead', continuation: undefined, reviewStart: undefined, beforeWorkers: new Set<string>(),
        inputSha256: deliveryInputSha256(f.store, f.job.key), technicalPhase: false,
        candidateAtStart: JSON.stringify({ id: f.job.id, stage: f.job.stage, head: f.job.head, branch: f.job.branch, worktree: f.job.worktree }) }));
    f.store.finishClaim(prep.id, 'completed');
    expect(f.job).toMatchObject({ stage: 'lead-pr', status: 'queued', head: INCIDENTS['GH-193'].head });
    const fresh = await acceptLead(f, leadResult(f));
    expect(r.phase).toBe('done'); expect(r.review?.workerId).toBe(fresh.worker.id);
    expect(f.job.steps.at(-1)?.result).toMatchObject({ commit: INCIDENTS['GH-193'].head, outcome: 'passed' });
    await claimedDelivery(f.store, f.job, () => requireMetadataReview(f.delivery, f.job));
    expect(model).toHaveBeenCalledOnce(); expect(f.writes.patches).toBe(1);
});

test.each([
    ['unchanged', (v: any, before: any, refreshed: string) => v(null, null, 'unchanged'), 'left the body unchanged'],
    ['a byte-identical repair', (v: any, before: any) => v(before.title, before.body), 'left the body unchanged'],
    ['a title-only repair', (v: any, before: any) => v('feat(optimizely): retitled SaaS field limits', before.body), 'changed the title'],
] as const)('%s blocks at capture and on reuse, with zero PATCHes and zero fresh reviews', async (_name, make, reason) => {
    const { f, r, verdict, assess, model, inPrep, before } = await staleTakeover();
    const leads = () => f.store.state.workLog!.filter(w => w.requestId === f.job.id && w.stage === 'github-lead-pr').length, priorLeads = leads();
    const result = make(verdict, before, f.selected.body);
    assess(result);
    await expect(inPrep(() => harnessPrepare(f.delivery, f.job, f.root, true))).rejects.toThrow(reason);
    expect(r.phase).toBe('blocked'); expect(r.assessment).toMatchObject({ outcome: result.outcome });
    // After a restart the saved genuine result blocks again, with no second assessment.
    await expect(inPrep(() => harnessPrepare(f.delivery, f.job, f.root, true))).rejects.toThrow(reason);
    // Reuse of the saved result refuses it too, whatever phase it is found in.
    r.phase = 'publish';
    await expect(inPrep(() => publishMetadata(f.delivery, f.job))).rejects.toThrow(reason);
    expect(model).toHaveBeenCalledOnce(); expect(f.writes.patches).toBe(0);
    expect(f.job.stage).toBe('prepare-pr'); expect(leads()).toBe(priorLeads);
});

test('a human edit restored before dispatch, or an altered saved proof, stops the write; a lost return is read back without a resend', async () => {
    const restored = await staleTakeover();
    restored.assess(restored.verdict(restored.before.title, restored.f.selected.body));
    await restored.inPrep(() => assessPRMetadata(restored.f.delivery, restored.f.job, restored.f.root));
    expect(restored.r.phase).toBe('publish');
    editDescription(restored.f.pr, `${restored.before.body}Joe\n`); editDescription(restored.f.pr, restored.before.body);
    await expect(restored.inPrep(() => publishMetadata(restored.f.delivery, restored.f.job))).rejects.toThrow('changed after its stale-description proof');
    expect(restored.f.writes.patches).toBe(0); expect(restored.f.store.getEffect(`harness:${restored.f.job.id}:pr-metadata:${restored.r.id}`)).toBeUndefined();

    const altered = await staleTakeover();
    altered.assess(altered.verdict(altered.before.title, altered.f.selected.body));
    await altered.inPrep(() => assessPRMetadata(altered.f.delivery, altered.f.job, altered.f.root));
    const saved = structuredClone(altered.r.binding);
    altered.r.binding.staleDescription!.head = 'f'.repeat(40);
    await expect(altered.inPrep(() => publishMetadata(altered.f.delivery, altered.f.job))).rejects.toThrow('Bound PR metadata identity');
    // Even with its digest recomputed, a proof bound to another revision meets the provider's own.
    altered.r.binding = { ...saved, staleDescription: { ...saved.staleDescription!, revision: { ...saved.staleDescription!.revision, sha256: 'e'.repeat(64) } } };
    altered.r.bindingSha256 = digest(altered.r.binding);
    await expect(altered.inPrep(() => publishMetadata(altered.f.delivery, altered.f.job))).rejects.toThrow('changed after its stale-description proof');
    expect(altered.f.writes.patches).toBe(0);

    const lost = await staleTakeover();
    lost.assess(lost.verdict(lost.before.title, lost.f.selected.body));
    await lost.inPrep(() => assessPRMetadata(lost.f.delivery, lost.f.job, lost.f.root));
    lost.f.writes.loseResponse = true;
    await expect(lost.inPrep(() => publishMetadata(lost.f.delivery, lost.f.job))).rejects.toThrow('499');
    await lost.inPrep(() => publishMetadata(lost.f.delivery, lost.f.job));
    const effect = lost.f.store.getEffect(`harness:${lost.f.job.id}:pr-metadata:${lost.r.id}`) as any;
    expect(effect.status).toBe('verified'); expect(effect.receipt.revision).toBeUndefined();
    expect(lost.f.writes.patches).toBe(1); expect(lost.r.phase).toBe('review'); expect(lost.f.pr.body).toBe(lost.f.selected.body);
});

test('retargeting during the prepared Effect history read stops the stale refresh before dispatch', async () => {
    const { f, r, before, verdict, assess, inPrep } = await staleTakeover();
    assess(verdict(before.title, f.selected.body));
    await inPrep(() => assessPRMetadata(f.delivery, f.job, f.root));
    const execute = f.delivery.execute, id = 'harness:' + f.job.id + ':pr-metadata:' + r.id;
    let retargeted = false;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'gh' && args[1] === 'graphql' && JSON.parse(options!.input!).query.includes('userContentEdits') &&
            f.store.getEffect(id)?.status === 'prepared') {
            f.pr.base.ref = 'release';
            retargeted = true;
        }
        return execute(program, args, options);
    }) as typeof execute;
    await expect(inPrep(() => publishMetadata(f.delivery, f.job))).rejects.toThrow('changed after its stale-description proof');
    expect(retargeted).toBe(true);
    expect(f.store.getEffect(id)?.dispatchedAt).toBeFalsy();
    expect(f.writes.patches).toBe(0);
});

test.each(['github-pr-metadata', 'ci-pr-metadata'])('saved %s proof blocks fresh dispatch and allows uncertain intent read-back', async operation => {
    const { f, r, verdict, assess, inPrep, before } = await staleTakeover();
    assess(verdict(before.title, f.selected.body));
    await inPrep(() => assessPRMetadata(f.delivery, f.job, f.root));
    editDescription(f.pr, before.body + 'Previous edit');
    editDescription(f.pr, before.body);
    const history = await readDescriptionHistory(f.store, f.delivery.execute, f.job.pr);
    r.binding.staleDescription = { ...r.binding.staleDescription!, source: { kind: 'effect', operation, effectId: 'legacy-patch' }, revision: history.revision };
    r.bindingSha256 = digest(r.binding);

    const key = 'pr-metadata:' + r.id, id = 'harness:' + f.job.id + ':' + key;
    const publish = () => inPrep(() => publishMetadata(f.delivery, f.job));
    await expect(publish()).rejects.toThrow('requires creation evidence');
    expect(f.writes.patches).toBe(0);
    expect(f.store.getEffect(id)).toBeUndefined();

    const { workerId, resultSha256, proposalSha256, selected } = r.assessment!;
    const at = f.store.clock.now().toISOString();
    f.store.putEffect({ id, operation: 'github-pr-metadata', target: f.job.prUrl,
        work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, authorization: 'office-harness',
        status: 'uncertain', createdAt: at, dispatchedAt: at, verifiedAt: '', receipt: null, error: 'Lost response', elapsedMs: 1,
        expectedState: { key }, payload: { binding: r.binding, origin: r.origin, original: null, workerId, resultSha256, proposalSha256, selected } });
    editDescription(f.pr, f.selected.body);
    await publish();
    expect(f.store.getEffect(id)).toMatchObject({ status: 'verified', receipt: { head: f.job.head, ...f.selected } });
    expect(f.writes.patches).toBe(0);
    expect(r.phase).toBe('review');
});
