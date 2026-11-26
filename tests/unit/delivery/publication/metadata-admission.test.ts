import { expect, test, vi } from 'vitest';
import { metadataFixture } from '../../../fixtures/pr-metadata';
import { admitPRMetadata, evaluatePRMetadata } from '../../../../server/delivery/publication/metadata-admission';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { CommandFailure } from '../../../../server/workers/process';
import { withAssignment } from '../../../../server/workers/assignment-context';
import type { StageResult } from '../../../../src/shared';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { workerFailure } from '../../../../server/workers/process';
import { digest } from '../../../../server/store/readback-evidence';
import { editDescription } from '../support/fake-github';
import { INCIDENTS, RUN, liveBody, staleFixture, type IncidentKey } from '../../../fixtures/stale-description';

test.each(['content', 'auth', 'unknown', 'source', 'permission'])('ordinary metadata admission preserves the distinction: %s', async kind => {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'lead-fixture', 'lead-pr')!;
    const result = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree, receipts: [], evidence: [],
        findings: [{ id: kind === 'source' ? 'source' : 'pr-metadata', status: 'open', summary: 'Missing PR structure', expected: 'Canonical body', actual: 'Missing sections', attempts: 0 }],
        resolution: kind === 'permission' ? { kind: 'permission', findingIds: ['pr-metadata'], evidenceIds: [], release: null } : null,
    } as unknown as StageResult;
    f.job.steps.push({ stage: 'lead-pr', result });
    const prior = f.delivery.execute;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') throw new CommandFailure(kind === 'auth' ? 'Authentication required' : kind === 'unknown' ? 'pnpm exited 1: missing helper' :
            'pnpm exited 1: Pull request body does not match the repository contract:\n- Missing Summary', kind === 'auth' ? 'authentication' : 'other', true);
        return prior(program, args, options);
    }) as typeof prior;
    const run = () => withAssignment(claim, 'delivery', () => admitPRMetadata(f.delivery, f.job, result, deliveryInputSha256(f.store, f.job.key)));
    if (kind === 'auth' || kind === 'unknown') await expect(run()).rejects.toThrow(kind === 'auth' ? 'Authentication' : 'missing helper');
    else expect(await run()).toBe(kind === 'content');
    expect(!!f.job.prMetadataRepair).toBe(kind === 'content');
    expect(f.job.stage).toBe(kind === 'content' ? 'prepare-pr' : 'lead-pr');
    expect(f.writes.patches).toBe(0);
});

test('a native title-only rejection with a valid body admits the reserved metadata handoff', async () => {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    f.pr.title = 'bad'; f.pr.body = f.selected.body;
    writeFileSync(resolve(f.job.worktree, 'commitlint.config.cjs'), 'module.exports = {};');
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'title-review', 'lead-pr')!;
    const result = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree,
        findings: [{ id: 'pr-metadata', status: 'open', summary: 'Invalid title', expected: 'Conventional title', actual: 'bad', attempts: 0 }],
        resolution: null, receipts: [], evidence: [] } as unknown as StageResult;
    f.job.steps.push({ stage: 'lead-pr', result });
    const prior = f.delivery.execute, stdout = '⧗   --- input ---\nbad\n✖   subject may not be empty [subject-empty]\n✖   type may not be empty [type-empty]\n\n✖   found 2 problems, 0 warnings\n\n';
    let bodyChecks = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') bodyChecks++;
        if (program === 'pnpm' && args[1] === 'commitlint') {
            options?.onOutput?.('stdout', stdout);
            throw new CommandFailure(workerFailure('pnpm', 1, stdout, ''), 'other', true);
        }
        return prior(program, args, options);
    }) as typeof prior;
    expect(await withAssignment(claim, 'delivery', () => admitPRMetadata(f.delivery, f.job, result, deliveryInputSha256(f.store, f.job.key)))).toBe(true);
    expect(bodyChecks).toBe(1); expect(f.job.stage).toBe('prepare-pr'); expect(f.delivery.jobs[0].prMetadataRepair?.binding.before).toEqual({ title: 'bad', body: f.selected.body });
    expect(f.job.repairCycle).toBeUndefined(); expect(f.writes.patches).toBe(0);
});

/** A saved blocked review whose metadata finding the repository lint accepts, with `extra` other open findings. */
function accepted(extra = 0, edit?: () => void, onRead?: (reads: number) => void) {
    const f = metadataFixture(false); delete f.job.prMetadataRepair; f.store.finishClaim(f.claim.id, 'completed'); f.job.stage = 'lead-pr';
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'lead-fixture', 'lead-pr')!;
    const result = { outcome: 'blocked', commit: f.job.head, prId: f.job.pr, branch: f.job.branch, worktree: f.job.worktree, receipts: [], evidence: [], resolution: null,
        findings: [{ id: 'pr-metadata', status: 'open', summary: 'Release marker in the title', expected: 'No marker', actual: '[skip release]', attempts: 0 },
            ...Array.from({ length: extra }, (_, i) => ({ id: `note-${i}`, status: 'open', summary: 'Carried advisory', expected: '', actual: '', attempts: 0 }))],
    } as unknown as StageResult;
    f.job.steps.push({ stage: 'lead-pr', result });
    let lints = 0;
    const prior = f.delivery.execute;
    let reads = 0;
    f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') { lints++; edit?.(); }
        if (program === 'gh' && args[0] === 'api' && args[1]?.endsWith('/pulls/200')) onRead?.(++reads);
        return prior(program, args, options);
    }) as typeof prior;
    const evaluate = (reviewed: any = structuredClone(f.pr)) => withAssignment(claim, 'delivery', () => evaluatePRMetadata(f.delivery, f.job, result, deliveryInputSha256(f.store, f.job.key), reviewed));
    return { f, result, evaluate, lints: () => lints };
}

test('content the lint accepts, or other open findings, is a bound human edit of the saved review; nothing is taken over', async () => {
    for (const extra of [0, 1]) {
        const { f, result, evaluate, lints } = accepted(extra);
        const decision = await evaluate();
        expect(decision).toEqual({ route: 'human-edit', why: extra ? 'other-findings' : 'lint-accepted', finding: result.findings[0], others: result.findings.slice(1), step: 0,
            resultSha256: digest(result), inputSha256: deliveryInputSha256(f.store, f.job.key),
            pr: { number: 200, url: f.job.prUrl, head: f.job.head, branch: f.job.branch, title: f.pr.title, body: f.pr.body } });
        // Only the sole finding needs the lint to tell takeover from a human edit.
        expect(lints()).toBe(extra ? 0 : 1);
        expect(f.job).toMatchObject({ stage: 'lead-pr' }); expect(f.job.prMetadataRepair).toBeUndefined(); expect(f.writes.patches).toBe(0);
    }
});

test('a same-head edit during the review or the lint makes the decision stale; the boolean wrapper still reads it as no takeover', async () => {
    const lint = accepted(0, () => { lint.f.pr.title = 'Joe edited it'; });
    expect(await lint.evaluate()).toEqual({ route: 'ineligible', reason: 'the pull request changed while its content was read' });
    const review = accepted(1);
    expect(await review.evaluate({ ...structuredClone(review.f.pr), body: 'What Sam read' })).toEqual({ route: 'ineligible', reason: 'the pull request changed after the review started' });
    const wrapper = accepted();
    expect(await wrapper.evaluate(null)).toEqual({ route: 'ineligible', reason: 'the pull request changed after the review started' });
    expect(await withAssignment(wrapper.f.store.activeClaims()[0], 'delivery', () => admitPRMetadata(wrapper.f.delivery, wrapper.f.job, wrapper.result, deliveryInputSha256(wrapper.f.store, wrapper.f.job.key)))).toBe(false);
});

test('a PR closed or merged without a text change on the second read gives no human edit, and refuses a takeover', async () => {
    for (const close of [(pr: any) => { pr.state = 'closed'; }, (pr: any) => { pr.merged_at = '2026-11-24T00:00:00Z'; pr.state = 'closed'; }]) {
        // The second read of the PR is the one after the lint, or after the binding when no lint runs.
        for (const extra of [0, 1]) {
            const run: { f?: any } = {};
            const review = accepted(extra, undefined, reads => { if (reads === 2) close(run.f.pr); });
            run.f = review.f;
            expect(await review.evaluate()).toEqual({ route: 'ineligible', reason: 'the pull request is no longer the open pull request the review read' });
            expect(review.f.job.prMetadataRepair).toBeUndefined(); expect(review.f.writes.patches).toBe(0);
        }
    }
    const takeover = accepted(0, undefined, reads => { if (reads === 2) takeover.f.pr.state = 'closed'; });
    const prior = takeover.f.delivery.execute;
    takeover.f.delivery.execute = (async (program, args, options) => {
        if (program === 'pnpm' && args[0] === 'run') throw new CommandFailure('pnpm exited 1: Pull request body does not match the repository contract:\n- Missing Summary', 'other', true);
        return prior(program, args, options);
    }) as typeof prior;
    await expect(takeover.evaluate()).rejects.toThrow('Live metadata changed during content admission');
    expect(takeover.f.job.prMetadataRepair).toBeUndefined(); expect(takeover.f.job.stage).toBe('lead-pr');
});

test('replacing the saved finding during the final PR read invalidates the original decision', async () => {
    const review = accepted(1, undefined, reads => {
        if (reads === 2) review.result.findings = review.result.findings.map(finding => ({ ...finding, expected: 'Use a new title' }));
    });
    expect(await review.evaluate()).toMatchObject({ route: 'ineligible', reason: 'the saved review changed while the pull request was read' });
    expect(review.f.job.parked).toBeUndefined();
    expect(review.f.state.calls.filter(call => call.includes('mutation') || call.includes('--method POST'))).toEqual([]);
});

// The incident histories. Their native draft records live under a synthetic home.
const home = vi.hoisted(() => ({ path: '/nonexistent-office-home' }));
vi.mock('node:os', async original => ({ ...await original<typeof import('node:os')>(), homedir: () => home.path }));

/** The incident's final blocked readiness review, saved, and read once against its live PR; `onRead` sees each PR and history read. */
function incident(key: IncidentKey, options: Parameters<typeof staleFixture>[1] = {}, onRead?: (kind: 'pr' | 'history', reads: number, f: ReturnType<typeof staleFixture>) => void) {
    const f = staleFixture(key, options); home.path = f.home;
    const claim = f.leadClaim(), execute = f.delivery.execute, reads = { pr: 0, history: 0 };
    let lints = 0;
    f.delivery.execute = (async (program, args, opts) => {
        if (program === 'pnpm' && args[0] === 'run') lints++;
        const kind = program === 'gh' && args[1] === 'graphql' && JSON.parse(opts!.input!).query.includes('userContentEdits') ? 'history' :
            program === 'gh' && args[0] === 'api' && args[1]?.endsWith(`/pulls/${f.job.pr}`) ? 'pr' : undefined;
        if (kind) onRead?.(kind, ++reads[kind], f);
        return execute(program, args, opts);
    }) as typeof execute;
    const evaluate = (reviewed: any = structuredClone(f.pr)) => {
        f.job.steps.push({ stage: 'lead-pr', result: f.review });
        return withAssignment(claim, 'delivery', () => evaluatePRMetadata(f.delivery, f.job, f.review, deliveryInputSha256(f.store, f.job.key), reviewed));
    };
    return { f, evaluate, lints: () => lints, reads };
}

test('GH-193: the sole open pr-metadata at 074eedf on the run\'s unedited description for 8cab916 is taken over', async () => {
    const { f, evaluate, lints } = incident('GH-193'), i = INCIDENTS['GH-193'];
    expect(f.job.steps.at(-1)?.result.findings.filter(x => x.status === 'open')).toEqual([]);
    expect(await evaluate()).toEqual({ route: 'takeover' });
    const r = f.job.prMetadataRepair!;
    expect(f.job).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
    expect(f.job.detail).toContain("Office's own, written for 8cab916");
    expect(r.binding.findingIds).toEqual(['pr-metadata']);
    expect(r.binding.staleDescription).toEqual({ route: 'stale-own-description', head: i.published, source: { kind: 'maintenance', runId: RUN, step: 5, workerId: i.draft.worker },
        contentSha256: digest({ title: i.title, body: liveBody('GH-193') }), revision: expect.objectContaining({ edits: 0, lastEditId: null, lastEditedAt: null }) });
    expect(r.bindingSha256).toBe(digest(r.binding)); expect(r.binding.before).toEqual({ title: i.title, body: liveBody('GH-193') });
    expect(lints()).toBe(1); expect(f.ancestry.calls).toHaveLength(1); expect(f.writes.patches).toBe(0);
    expect(f.job.repairCycle).toMatchObject({ attempts: 1, pendingFindingIds: [] });
});

test('GH-195: the carried refresh-pr-description advisory beside pr-metadata at 774257b still takes over, binding only the reserved ID', async () => {
    const { f, evaluate, lints } = incident('GH-195'), i = INCIDENTS['GH-195'];
    const shape = f.job.steps.map(s => [s.stage, s.result.outcome, s.result.commit.slice(0, 7)]);
    expect(shape).toEqual([['prepare-pr', 'passed', 'bc8800c'], ['prepare-pr', 'passed', 'bc8800c'], ['lead-pr', 'blocked', 'bc8800c'], ['update-base', 'passed', '774257b'],
        ['review', 'passed', '774257b'], ['validate', 'passed', '774257b'], ['draft', 'passed', '774257b'], ['prepare-pr', 'passed', '774257b']]);
    for (const at of [4, 5]) expect(f.job.steps[at].result.findings.map(x => [x.id, x.status])).toEqual([['integrate-current-main', 'verified'], ['refresh-pr-description', 'open']]);
    expect(f.review.findings.map(x => [x.id, x.status])).toEqual([['integrate-current-main', 'verified'], ['refresh-pr-description', 'open'], ['pr-metadata', 'open']]);
    expect(await evaluate()).toEqual({ route: 'takeover' });
    expect(f.job.prMetadataRepair!.binding.findingIds).toEqual(['pr-metadata']);
    expect(f.job.prMetadataRepair!.binding.staleDescription).toMatchObject({ head: i.published, source: { step: 9, workerId: i.draft.worker } });
    // A mixed result still skips the admission lint.
    expect(lints()).toBe(0); expect(f.writes.patches).toBe(0);
});

test('an unrelated open companion parks with every companion preserved, before any authorship read', async () => {
    const { f, evaluate, reads } = incident('GH-195');
    f.review.findings.push({ id: 'source-defect', status: 'open', summary: 'Unrelated source defect', expected: 'Fixed', actual: 'Broken', attempts: 0 });
    const decision = await evaluate();
    expect(decision).toMatchObject({ route: 'human-edit', why: 'other-findings', others: [{ id: 'refresh-pr-description' }, { id: 'source-defect' }] });
    expect(reads.history).toBe(0); expect(f.job.prMetadataRepair).toBeUndefined(); expect(f.ancestry.calls).toEqual([]);
});

test.each<[string, IncidentKey, Parameters<typeof staleFixture>[1], (f: ReturnType<typeof staleFixture>) => void]>([
    ['no attributable creation', 'GH-193', {}, f => { f.maintenance.status = 'blocked'; }],
    ['a human edit since, restored', 'GH-193', {}, f => { const body = f.pr.body; editDescription(f.pr, `${body}Joe\n`); editDescription(f.pr, body); }],
    ['a published head that is not an ancestor', 'GH-193', { ancestry: 'not-ancestor' }, () => {}],
    ['a carried advisory with no attribution', 'GH-195', {}, f => { f.maintenance.status = 'blocked'; }],
])('%s keeps the existing human-edit decision', async (_name, key, options, change) => {
    const { f, evaluate } = incident(key, options);
    change(f);
    expect(await evaluate()).toMatchObject({ route: 'human-edit', why: key === 'GH-193' ? 'lint-accepted' : 'other-findings', finding: { id: 'pr-metadata' } });
    expect(f.job.prMetadataRepair).toBeUndefined(); expect(f.job.stage).toBe('lead-pr'); expect(f.writes.patches).toBe(0);
});

test('a provider or Git failure while reading authorship stays an error', async () => {
    const missing = incident('GH-193', { ancestry: 'missing' });
    await expect(missing.evaluate()).rejects.toThrow('git exited 128');
    const failing = incident('GH-193', {}, (kind, reads) => { if (kind === 'history' && reads === 1) throw new Error('gh: HTTP 502'); });
    await expect(failing.evaluate()).rejects.toThrow('HTTP 502');
    expect(missing.f.job.prMetadataRepair).toBeUndefined(); expect(failing.f.job.prMetadataRepair).toBeUndefined();
});

test.each<[string, (kind: 'pr' | 'history', reads: number, f: ReturnType<typeof staleFixture>) => void, string]>([
    ['the review replaced during the last read', (kind, reads, f) => { if (kind === 'history' && reads === 2) f.review.findings = f.review.findings.map(x => ({ ...x, expected: 'Changed' })); },
        'the saved review changed while the pull request was read'],
    ['the head moved during the last read', (kind, reads, f) => { if (kind === 'pr' && reads === 2) f.pr.head.sha = 'f'.repeat(40); }, 'the pull request changed while its content was read'],
    ['the description edited and restored during the authorship read', (kind, reads, f) => {
        if (kind === 'history' && reads === 2) { const body = f.pr.body; editDescription(f.pr, `${body}x`); editDescription(f.pr, body); }
    }, 'the pull request description changed while its authorship was read'],
])('%s binds nothing and parks nothing', async (_name, onRead, reason) => {
    const { f, evaluate } = incident('GH-193', {}, onRead);
    expect(await evaluate()).toEqual({ route: 'ineligible', reason });
    expect(f.job.prMetadataRepair).toBeUndefined(); expect(f.job.parked).toBeUndefined(); expect(f.writes.patches).toBe(0);
});
