import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { afterEach, expect, test, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { park } from '../../../../server/delivery/parking/park';
import { resumeProviderReviews } from '../../../../server/delivery/parking/resume-provider-review';
import { deliveryInputSha256, deliveryResearchSha256 } from '../../../../server/github/github-context';
import { HOLDS } from '../../../../server/office/config';
import { workKey, type StageResult } from '../../../../src/shared';

afterEach(() => { delete HOLDS['GH-5']; cleanupFakes(); });

function research(f: ReturnType<typeof fakeGitHub>, at = '2026-11-09T23:30:00Z') {
    f.store.state.messages.push({ id: 'research-request', requestId: 'research-request', from: 'human', to: 'lead', ticket: 'GH-5', status: 'answered', error: '', receipts: [], body: 'Read provider documentation', createdAt: at } as any,
        { id: 'research-answer', requestId: 'research-request', from: 'lead', to: 'lead', ticket: 'GH-5', status: 'answered', error: '', receipts: [], body: 'An old preview alone does not require rebasing; current readiness still needs assessment.', sessionId: 'native-research', createdAt: at } as any);
    f.store.state.workLog!.push({ id: 'research-worker', sessionId: 'native-research', role: 'lead', ticket: 'GH-5', stage: 'conversation', status: 'completed', endedAt: at } as any);
}

async function fixture(prLane = 'review') {
    const f = fakeGitHub(), job = f.candidate({ stage: 'lead-pr', status: 'working', existingPR: true, pr: 362, prUrl: `https://github.com/${f.store.project.repository}/pull/362` });
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 362, status: prLane });
    f.state.prs.push({ number: 362, html_url: job.prUrl, state: 'open', draft: false, mergeable: true, body: 'Closes #5',
        head: { sha: HEAD, ref: job.branch, repo: { full_name: f.store.project.repository } },
        base: { ref: 'main', sha: BASE, repo: { full_name: f.store.project.repository } }, merged_at: null, updated_at: '2026-11-09T23:00:00Z' });
    const result: StageResult = { outcome: 'blocked', summary: 'Wait for current provider readiness', blocker: 'Old preview', commit: HEAD,
        worktree: job.worktree, branch: job.branch, prId: 362, receipts: [], evidence: [], findings: [], previewUrl: '', qaRunDir: '', paidRuns: 0,
        resolution: { kind: 'provider-wait', findingIds: [], evidenceIds: [] } };
    job.steps.push({ stage: 'lead-pr', result });
    await claimedDelivery(f.store, job, () => park(f.delivery, job, result));
    job.parked!.at = '2026-11-09T23:05:00Z';
    for (const update of job.boardUpdates!) update.at = '2026-11-09T23:06:00Z';
    research(f);
    const writes: string[] = [];
    let afterRead = (_program: string, _args: string[], _options: any) => {};
    const execute = async (program: string, args: string[], options: any = {}) => {
        const query = program === 'gh' && args[1] === 'graphql' ? JSON.parse(options.input).query : '';
        if (query.startsWith('mutation')) writes.push(JSON.parse(options.input).variables.item);
        let response = program === 'curl' ? JSON.stringify({ complete: true, fresh: true, project: f.store.project.id, key: job.key, ownership: { status: 'clear' } }) : await f.execute(program, args, options);
        // This fixture's native combined-status response must bind the exact head.
        if (program === 'gh' && args[0] === 'api' && args[1].endsWith(`/commits/${HEAD}/status`))
            response = JSON.stringify({ ...JSON.parse(response), sha: HEAD });
        afterRead(program, args, options);
        return response;
    };
    f.delivery.execute = execute as any;
    return { f, job, result, writes, execute, afterRead: (fn: typeof afterRead) => { afterRead = fn; } };
}

test('new bound research resumes only the same Office-parked job after both exact cards settle', async () => {
    const { f, job, writes } = await fixture(), saved = structuredClone(job.parked), originalSteps = structuredClone(job.steps);
    job.repairCycle = { owner: 'developer', attempts: 1, phase: 'verify', pendingFindingIds: [], findingAttempts: { 'main-conflict': 1 } } as any;
    const budget = structuredClone(job.repairCycle);
    await resumeProviderReviews(f.delivery);
    expect(job).toMatchObject({ id: job.id, head: HEAD, status: 'queued', stage: 'lead-pr' });
    expect(job.parked).toBeUndefined();
    expect(job.steps).toEqual(originalSteps);
    expect(job.repairCycle).toEqual(budget);
    expect(f.state.cards.map(card => card.status)).toEqual(['review', 'review']);
    expect(writes).toEqual(['issue-card', 'pr-card']);
    const effects = (f.store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: f.store.project.id, kind: 'delivery', id: job.id })) as any[])
        .map(row => JSON.parse(row.body)).filter(effect => effect.id.includes(':provider-review:'));
    expect(effects).toHaveLength(2);
    expect(effects.every(effect => effect.status === 'verified' && JSON.stringify(effect.payload.originalPark) === JSON.stringify(saved))).toBe(true);
    await resumeProviderReviews(f.delivery);
    expect(writes).toHaveLength(2);
});

test('a verified no-op for a human-placed Block card does not authorize either return', async () => {
    const { f, job, writes } = await fixture('block');
    expect(job.boardUpdates!.find(update => update.item === 'pr-card')!.detail).toBe('Block already verified.');
    await resumeProviderReviews(f.delivery);
    expect(writes).toEqual([]);
    expect(job.parked).toBeDefined();
    expect(job.status).toBe('blocked');
    expect(f.state.cards.map(card => card.status)).toEqual(['block', 'block']);
});

test('legacy original-transition readback receipts still authorize Office-owned returns', async () => {
    const { f, job, writes } = await fixture();
    for (const update of job.boardUpdates!) update.detail = 'Original board transition verified by read-back; no mutation repeated.';
    await resumeProviderReviews(f.delivery);
    expect(job.status).toBe('queued');
    expect(writes).toEqual(['issue-card', 'pr-card']);
});

test('a partial return with a lost response is read back at the original effect IDs without another mutation', async () => {
    const { f, job, writes, execute } = await fixture();
    let lose = true;
    f.delivery.execute = async (program, args, options) => {
        const output = await execute(program, args, options);
        if (lose && writes.length === 2 && program === 'gh' && args[1] === 'graphql' && JSON.parse(options!.input!).query.startsWith('mutation')) {
            lose = false; throw new Error('Lost second mutation response');
        }
        return output;
    };
    await resumeProviderReviews(f.delivery);
    expect(job.status).toBe('blocked'); expect(job.parked).toBeDefined(); expect(writes).toHaveLength(2);
    await resumeProviderReviews(f.delivery);
    expect(job.status).toBe('queued'); expect(writes).toHaveLength(2);
});

test('an uncertain original effect or unlanded return is preserved without sending again', async () => {
    const original = await fixture();
    original.f.store.putEffect({ id: 'original-write', work: { projectId: original.f.store.project.id, kind: 'delivery', id: original.job.id },
        status: 'uncertain', dispatchedAt: '2026-11-09T23:00:00Z' } as any);
    await resumeProviderReviews(original.f.delivery);
    expect(original.writes).toEqual([]); expect(original.job.status).toBe('blocked');
    const x = await fixture();
    let attempted = 0;
    x.f.delivery.execute = async (p, a, o) => {
        if (p === 'gh' && a[1] === 'graphql' && JSON.parse(o!.input!).query.startsWith('mutation')) { attempted++; throw new Error('Unknown outcome before response'); }
        return x.execute(p, a, o);
    };
    await resumeProviderReviews(x.f.delivery);
    await resumeProviderReviews(x.f.delivery);
    expect(x.job.status).toBe('blocked'); expect(x.job.parked).toBeDefined(); expect(x.writes).toEqual([]);
    expect(attempted).toBe(1);
});

test('a human lane, missing original card or unproven park prevents either return write', async () => {
    for (const change of [
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.state.cards[1].status = 'backlog'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.state.cards.pop(); },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.boardUpdates![0].head = 'c'.repeat(40); },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.boardUpdates![0].at = 'unknown'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.parked!.reason = 'A different decision'; },
    ]) {
        const x = await fixture(); change(x); await resumeProviderReviews(x.f.delivery);
        expect(x.writes).toEqual([]); expect(x.job.parked).toBeDefined(); expect(x.job.status).toBe('blocked');
    }
});

test('actual human decisions, releases and missing or unbound material research never auto-resume', async () => {
    for (const change of [
        (x: Awaited<ReturnType<typeof fixture>>) => { x.result.resolution!.kind = 'human-hold'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.parked!.release = { registry: 'npm', package: 'example', minimum: '2.0.0' }; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.messages[1].createdAt = '2026-11-09T22:00:00Z'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.workLog![0].status = 'running'; },
    ]) {
        const x = await fixture(); change(x); await resumeProviderReviews(x.f.delivery);
        expect(x.writes).toEqual([]); expect(x.job.status).toBe('blocked');
    }
});

test('native head, issue, link and current ownership drift refuse the original recovery', async () => {
    for (const change of [
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.state.prs[0].head.sha = 'c'.repeat(40); },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.state.issue.state = 'closed'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.state.prs[0].body = 'Closes #6'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.delivery.execute = async (p, a, o) => p === 'curl' ? JSON.stringify({ complete: true, fresh: true, project: x.f.store.project.id, key: x.job.key, ownership: { status: 'owned' } }) : x.execute(p, a, o); },
    ]) {
        const x = await fixture(); change(x); await resumeProviderReviews(x.f.delivery);
        expect(x.writes).toEqual([]); expect(x.job.status).toBe('blocked');
    }
});

test('pause, holds, prerequisites, approvals and active claims preserve the park', async () => {
    for (const change of [
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.paused = true; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.draining = true; },
        (_x: Awaited<ReturnType<typeof fixture>>) => { HOLDS['GH-5'] = 'Joe hold'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.prerequisites = [{}] as any; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.mergeApprovalRequired = true; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.activeClaims = () => [{ work: { kind: 'delivery', id: x.job.id } }] as any; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.result.receipts.push({ verified: false, uncertain: true } as any); },
    ]) {
        const x = await fixture(); change(x); await resumeProviderReviews(x.f.delivery);
        expect(x.writes).toEqual([]); expect(x.job.status).toBe('blocked'); delete HOLDS['GH-5'];
    }
});

test('mutable identity and controls are rechecked after asynchronous native reads', async () => {
    for (const change of [
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.paused = true; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.job.branch = 'different'; },
        (x: Awaited<ReturnType<typeof fixture>>) => { x.f.store.state.messages[1].body += ' New material research.'; },
    ]) {
        const x = await fixture(); x.afterRead(program => { if (program === 'curl') change(x); });
        await resumeProviderReviews(x.f.delivery);
        expect(x.writes).toEqual([]); expect(x.job.status).toBe('blocked');
    }
});

test.each([0, 2])('worktree drift after %i return writes retains the park, steps and repair budget', async returnWrites => {
    const x = await fixture(), parkBefore = structuredClone(x.job.parked), stepsBefore = structuredClone(x.job.steps);
    x.job.repairCycle = { owner: 'developer', attempts: 1, phase: 'verify', pendingFindingIds: [], findingAttempts: { F001: 1 } } as any;
    const budget = structuredClone(x.job.repairCycle), newerWorktree = `${x.job.worktree}-newer`;
    x.afterRead(program => { if (program === 'curl' && x.writes.length === returnWrites) x.job.worktree = newerWorktree; });
    await resumeProviderReviews(x.f.delivery);
    expect(x.writes).toHaveLength(returnWrites);
    expect(x.job).toMatchObject({ status: 'blocked', worktree: newerWorktree, parked: parkBefore, steps: stepsBefore, repairCycle: budget });
});

test('completed bound research refreshes a watching PR once even when provider metadata is unchanged', async () => {
    const x = await fixture(); delete x.job.parked; x.job.status = 'watching'; x.f.store.state.messages = []; x.f.store.state.workLog = [];
    const empty = deliveryResearchSha256(x.f.store, x.job.key);
    const p = x.f.state.prs[0];
    x.job.lastPRFingerprint = JSON.stringify([HEAD, p.base.ref, BASE, p.draft, p.mergeable, p.updated_at, deliveryInputSha256(x.f.store, x.job.key), [], 'pending']);
    const legacy = x.job.lastPRFingerprint;
    await x.f.delivery.observe(); expect(x.job.detail).not.toContain('PR observation unavailable'); expect(x.job.status).toBe('watching');
    expect(x.job.lastPRFingerprint).toBe(legacy);
    research(x.f); expect(deliveryResearchSha256(x.f.store, x.job.key)).not.toBe(empty);
    await x.f.delivery.observe(); expect(x.job.status).toBe('queued');
    expect(JSON.parse(x.job.lastPRFingerprint!)).toEqual([...JSON.parse(legacy), deliveryResearchSha256(x.f.store, x.job.key)]);
    x.job.status = 'watching'; await x.f.delivery.observe(); expect(x.job.status).toBe('watching');
    expect(x.writes).toEqual([]);
});

test.each([false, true])('new or changed research bypasses a reusable review exactly once (prior research: %s)', async priorResearch => {
    const x = await fixture(); delete x.job.parked; x.job.status = 'watching';
    for (const card of x.f.state.cards) card.status = 'review';
    if (!priorResearch) { x.f.store.state.messages = []; x.f.store.state.workLog = []; }
    await x.f.delivery.observe();
    x.job.status = 'watching';
    const path = resolve(x.f.artifactRoot(x.job), 'saved-review.json');
    writeFileSync(path, '{}');
    const saved: StageResult = { ...x.result, outcome: 'passed', summary: 'Previous assessment', blocker: '', resolution: undefined,
        evidence: [{ id: 'saved', kind: 'review', path, commit: HEAD, summary: 'Saved review', environment: 'test', url: '', observedAt: '2026-11-09T23:00:00Z' }] };
    x.job.steps = [{ stage: 'lead-pr', result: saved }];
    x.job.reviewContext = { head: HEAD, issueUpdatedAt: x.f.state.issue.updated_at, prUpdatedAt: x.f.state.prs[0].updated_at, baseSha: BASE, target: 'main', step: 0 };
    x.job.reviewInputSha256 = deliveryInputSha256(x.f.store, x.job.key);
    const fresh = { ...structuredClone(saved), summary: 'Fresh research assessment' };
    const run = vi.fn(async () => fresh);
    x.f.engine.agents.run = run as any;
    // Provider status alone still permits the ordinary saved-result path.
    x.job.lastPRFingerprint = JSON.stringify([...JSON.parse(x.job.lastPRFingerprint!).slice(0, 8), 'old-state', ...(priorResearch ? [deliveryResearchSha256(x.f.store, x.job.key)] : [])]);
    await x.f.delivery.observe();
    expect(x.job.reviewContext).toBeDefined();
    await claimedDelivery(x.f.store,x.job,()=>x.f.delivery.step(x.job));
    expect(run).not.toHaveBeenCalled();
    expect(x.job.status).toBe('watching');
    if (priorResearch) x.f.store.state.messages[1].body += ' New material research.';
    else research(x.f);
    const body = x.f.store.state.messages[1].body;
    await x.f.delivery.observe();
    expect(x.job.status).toBe('queued');
    expect(x.job.reviewContext).toBeUndefined();
    expect(x.job.steps[0].result).toBe(saved);
    await claimedDelivery(x.f.store,x.job,()=>x.f.delivery.step(x.job));
    expect(run).toHaveBeenCalledExactlyOnceWith('lead', expect.stringContaining(body), expect.anything(), expect.objectContaining({ stage: 'github-lead-pr', readOnly: true }));
    expect(x.job.steps).toHaveLength(2);
    expect(x.job.steps.at(-1)!.result).toBe(fresh);
    expect(x.job.status).toBe('watching');
    await x.f.delivery.observe();
    expect(x.job.status).toBe('watching');
    expect(run).toHaveBeenCalledTimes(1);
    expect(x.writes).toEqual([]);
});
