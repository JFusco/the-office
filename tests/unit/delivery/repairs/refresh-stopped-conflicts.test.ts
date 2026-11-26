import { afterEach, expect, test } from 'vitest';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { markAwaitingRepair } from '../../incidents/repair/mark-fixture';
import { cleanupFakes, fakeGitHub, BASE, HEAD } from '../support/fake-github';
import { refreshStoppedConflicts } from '../../../../server/delivery/repairs/refresh-stopped-conflicts';
import { refreshConflicted } from '../../../../server/delivery/repairs/refresh-conflicted';
import { HOLDS } from '../../../../server/office/config';
import type { StageResult, TicketJob } from '../../../../src/shared';

afterEach(() => { delete HOLDS['GH-5']; delete HOLDS['GH-200']; cleanupFakes(); });

const OLD = 'c'.repeat(40), MOVED = 'e'.repeat(40), URL = 'https://github.com/JFusco/cms-field-vocabulary/pull/200';
const result = (job: TicketJob, commit: string, extra: Partial<StageResult> = {}): StageResult => ({ outcome: 'passed', summary: 'ok', commit, blocker: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: job.worktree, branch: job.branch, prId: 200, qaRunDir: '', paidRuns: 0, ...extra } as StageResult);
const checks = (commit: string) => [{ id: `checks-${commit.slice(0, 4)}`, kind: 'checks', summary: 'required checks', path: '/evidence', commit, environment: 'fixture', url: '', observedAt: '' }] as any;

/**
 * A GH-189-shaped job: blocked at its readiness review on an unadmitted `pr-metadata` verdict, on an accepted refresh
 * head (or the team's reviewed head), whose PR #200 conflicts with main at that head in the cache and live.
 */
function stopped(proof: 'refresh' | 'team' | 'none' = 'refresh', status: 'blocked' | 'interrupted' = 'blocked') {
    const f = fakeGitHub();
    const job = f.candidate({ stage: 'lead-pr', status, pr: 200, prUrl: URL, detail: 'Error: an unadmitted pr-metadata finding stopped the readiness review', stop: { kind: 'unclassified', at: '2026-11-23T19:47:48Z' } });
    f.store.state.coordination!.merges = { enabled: true, authorizedAt: '2026-11-01T00:00:00Z' };
    f.state.cards[0].status = 'review'; f.state.remote[job.branch] = HEAD;
    job.steps.push({ stage: 'review', result: result(job, proof === 'team' ? HEAD : OLD) });
    if (proof === 'refresh') { job.repairReason = 'conflicts'; job.steps.push({ stage: 'update-base', result: result(job, HEAD, { evidence: checks(HEAD) }) }); }
    job.steps.push({ stage: 'lead-pr', result: result(job, HEAD, { outcome: 'blocked', findings: [{ id: 'pr-metadata', status: 'open', severity: 'medium', summary: 'stale description' }] as any }) });
    f.state.prs.push({ number: 200, html_url: URL, state: 'open', draft: false, mergeable: false, body: 'Closes #5', head: { sha: HEAD, ref: job.branch, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } }, merged_at: null, merge_commit_sha: null, updated_at: '2026-11-24T20:07:00Z' });
    f.store.state.github = { status: 'idle', error: '', observedAt: '', issues: [], runs: [], prs: [{ number: 200, title: '', state: 'open', draft: false, author: 'JFusco', head: HEAD, base: 'main', url: URL, mergedAt: '', mergeable: false, reviews: [], checks: [] }] } as any;
    const sweep = () => refreshStoppedConflicts(f.delivery);
    const events = () => f.store.state.events.filter(e => e.kind === 'pr-conflict-refresh-queued').length;
    const reads = () => f.state.calls.length;
    return { ...f, job, pr: f.state.prs[0], row: f.store.state.github!.prs[0], sweep, events, reads };
}
type Fixture = ReturnType<typeof stopped>;
const expectUntouched = (f: Fixture, before: TicketJob) => { expect(f.job).toEqual(before); expect(f.events()).toBe(0); };

function markRepairWait({ store, job }: Fixture) {
    const at = store.clock.now().toISOString();
    return markAwaitingRepair(store.state, store.project.id, { kind: 'delivery', id: job.id }, 'lead-pr', { since: at, progressAt: at });
}

test('a GH-189-shaped job is refreshed on the next observation, superseding its stopped review with its verdict kept', async () => {
    const f = stopped(), steps = structuredClone(f.job.steps);
    await f.delivery.observe();
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts', head: HEAD, pr: 200 });
    expect(f.job.stop).toBeUndefined();
    expect(f.job.detail).toContain('supersedes the stopped review, whose verdict stays in the saved steps');
    expect(f.job.steps).toEqual(steps);
    expect(f.events()).toBe(1);
});

test('a refused queue save rolls the stop and the event back together', async () => {
    const f = stopped(), before = structuredClone(f.job), save = f.store.save.bind(f.store);
    f.store.save = () => { if (f.job.stage === 'update-base') throw new Error('Synthetic save failure'); save(); };
    await f.sweep();
    f.store.save = save;
    expectUntouched(f, before);
});

test.each([['interrupted', 'team'], ['blocked', 'team']] as const)('an %s job on a team-reviewed head is refreshed too', async (status, proof) => {
    const f = stopped(proof, status);
    await f.sweep();
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued', repairReason: 'conflicts' });
});

test('a head with neither proof, or three saved base updates of any kind, is left alone', async () => {
    const none = stopped('none'), before = structuredClone(none.job);
    await none.sweep(); expectUntouched(none, before);
    cleanupFakes();
    const capped = stopped();
    capped.job.steps.splice(1, 0, { stage: 'update-base', result: result(capped.job, OLD) }, { stage: 'update-base', result: result(capped.job, OLD, { summary: 'source repair' }) });
    const cappedBefore = structuredClone(capped.job);
    await capped.sweep(); expectUntouched(capped, cappedBefore);
});

test('the default refresh still refuses a stopped readiness review', () => {
    const f = stopped();
    expect(refreshConflicted(f.store, f.job, f.pr)).toBe(false);
    expect(f.job.stage).toBe('lead-pr');
});

/** GH-195's case: an earlier metadata repair on an older head, published and verified, with its history. */
function metadataHistory(f: Fixture, head: string, phase: 'review' | 'done', effect = true) {
    const binding = { projectId: f.store.project.id, repository: f.store.project.repository, jobId: f.job.id, key: f.job.key, pr: 200, url: URL, head, branch: f.job.branch, base: 'main', worktree: f.job.worktree, inputSha256: 'i', findingIds: ['pr-metadata'], before: { title: 't', body: 'b' }, beforeSha256: 's' };
    const assessment = { workerId: 'w', claimId: 'c', sessionId: 's', resultPath: '/r', resultSha256: 'r', outcome: 'repair' as const, summary: '', evidence: [], selected: { title: 't2', body: 'b2' }, proposalSha256: 'p' };
    f.job.prMetadataRepair = { id: 'meta-1', origin: 'lead-pr', phase, bindingSha256: 'x', binding, assessment, publishedAfterStep: 1, reviewedAfterStep: 2 };
    if (effect) f.store.putEffect({ id: `harness:${f.job.id}:pr-metadata:meta-1`, work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-metadata', target: URL, authorization: 'office-harness',
        payload: { binding, origin: 'lead-pr', workerId: 'w', resultSha256: 'r', proposalSha256: 'p', selected: assessment.selected }, expectedState: { key: 'pr-metadata:meta-1' }, status: 'verified', createdAt: '', dispatchedAt: '2026-11-25T00:00:00Z', verifiedAt: '2026-11-25T00:00:01Z', receipt: { ok: true }, error: '', elapsedMs: 0 });
}

test.each(['review', 'done'] as const)('GH-195: a verified metadata repair (%s) on an older head is kept intact when its PR later conflicts', async phase => {
    const f = stopped();
    metadataHistory(f, OLD, phase);
    f.job.repairCycle = {
        owner: 'developer', findingAttempts: { 'main-integration-conflict': 1 }, attempts: 1,
        pendingFindingIds: [], sourceStage: 'lead-pr', sourceHead: OLD, phase: 'verify', publishedHead: HEAD,
    };
    const cycle = structuredClone(f.job.repairCycle);
    const repair = structuredClone(f.job.prMetadataRepair);
    const effect = structuredClone(f.store.getEffect(`harness:${f.job.id}:pr-metadata:meta-1`));
    f.row.mergeable = true; f.pr.mergeable = true;
    await f.sweep();
    expect(f.job.stage).toBe('lead-pr');
    f.row.mergeable = false; f.pr.mergeable = false;
    await f.sweep();
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued' });
    expect(f.job.repairCycle).toEqual(cycle);
    expect(f.job.prMetadataRepair).toEqual(repair);
    expect(f.store.getEffect(`harness:${f.job.id}:pr-metadata:meta-1`)).toEqual(effect);
});

test.each([['a same-head done binding', HEAD, true], ['an older binding missing its Effect', OLD, false]] as const)('%s keeps the job out of the refresh', async (_kind, head, effect) => {
    const f = stopped();
    metadataHistory(f, head, 'done', effect);
    const before = structuredClone(f.job);
    await f.sweep(); expectUntouched(f, before);
});

test.each<[string, (f: Fixture) => void]>([
    ['no cache', f => { f.store.state.github = undefined; }],
    ['no cached row', f => { f.store.state.github!.prs = []; }],
    ['a clean row', f => { f.row.mergeable = true; }],
    ['a pending row', f => { f.row.mergeable = null; }],
    ['another head', f => { f.row.head = MOVED; }],
    ['another base', f => { f.row.base = 'release'; }],
    ['a draft row', f => { f.row.draft = true; }],
    ['a closed row', f => { f.row.state = 'closed'; }],
])('%s costs the sweep no provider read', async (_kind, change) => {
    const f = stopped(), before = structuredClone(f.job);
    change(f);
    const calls = f.reads();
    await f.sweep();
    expect(f.reads()).toBe(calls);
    expectUntouched(f, before);
});

test.each([[true], [null]] as const)('preparation records the live head and mergeability (%s), so the sweep then reads nothing', async live => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'prepare-pr', status: 'queued', pr: 200, prUrl: URL });
    const issue = Number(job.key.slice(3)), step = (role: string, stage: string, head: string, extra: Record<string, unknown> = {}) => ({ role, stage, result: { outcome: 'passed', summary: '', ledger: '', receipts: [], blocker: '', candidates: [{ issue, worktree: '/w', branch: 'b', head, summary: '' }], ...extra } });
    f.store.state.maintenance = { runs: [{ id: 'run', status: 'completed', steps: [step('developer', 'proposal-plan', OLD), step('developer', 'proposal', HEAD), step('lead', 'proposal-review', HEAD),
        step('developer', 'draft-pr', HEAD, { receipts: [{ id: 'pr', action: 'draft-pr', target: 'u', verified: true, uncertain: false, detail: '' }] })] }] } as any;
    f.state.prs.push({ number: 200, html_url: URL, state: 'open', draft: true, mergeable: live, body: 'Closes #5', head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: 'JFusco/cms-field-vocabulary' } } });
    f.store.state.github = { status: 'idle', error: '', observedAt: '', issues: [], runs: [], prs: [{ number: 200, title: '', state: 'open', draft: true, author: 'JFusco', head: OLD, base: 'main', url: URL, mergedAt: '', mergeable: false, reviews: [], checks: [] }] } as any;
    f.engine.agents.run = async () => { throw new Error('No model expected'); };
    await claimedDelivery(f.store, job, () => f.delivery.step(job));
    expect(job.stage).toBe('lead-pr');
    expect(f.store.state.github!.prs[0]).toMatchObject({ head: HEAD, mergeable: live });
    job.status = 'blocked';
    const calls = f.state.calls.length;
    await refreshStoppedConflicts(f.delivery);
    expect(f.state.calls.length).toBe(calls);
});

test.each<[string, (f: Fixture) => void]>([
    ['a pending live read', f => { f.pr.mergeable = null; }],
    ['a clean live read', f => { f.pr.mergeable = true; }],
    ['a moved head', f => { f.pr.head.sha = MOVED; }],
    ['a moved branch', f => { f.pr.head.ref = 'other-branch'; }],
    ['another target', f => { f.pr.base.ref = 'release'; }],
    ['a missing issue link', f => { f.pr.body = 'No link'; }],
    ['a draft', f => { f.pr.draft = true; }],
    ['a closed PR', f => { f.pr.state = 'closed'; }],
    ['a merged PR', f => { Object.assign(f.pr, { state: 'closed', merged_at: '2026-11-26T00:00:00Z', merge_commit_sha: 'f'.repeat(40) }); }],
    ['a failed read', f => { f.state.fail = (_p, args) => args.some(a => a.endsWith('/pulls/200')) ? 'HTTP 502: Bad Gateway' : false; }],
])('%s keeps the stop and queues nothing', async (_kind, change) => {
    const f = stopped(), before = structuredClone(f.job);
    change(f);
    await f.sweep(); expectUntouched(f, before);
});

test.each<[string, (f: Fixture) => void]>([
    ['an issue hold', () => { HOLDS['GH-5'] = 'Synthetic hold'; }],
    ['a PR hold', () => { HOLDS['GH-200'] = 'Synthetic hold'; }],
    ['a pause', f => { f.store.state.paused = true; }],
    ['a drain', f => { f.store.state.draining = true; }],
    ['a park', f => { f.job.parked = { stage: 'lead-pr', reason: 'r', at: '', fromStatus: 'blocked', marker: 'm', published: true } as any; }],
    ['a prerequisite', f => { f.job.prerequisites = [{ key: 'GH-1' }] as any; }],
    ['a trailing superseded stage result', f => { f.job.steps.push({ stage: 'superseded-stage-result', result: result(f.job, HEAD) }); }],
    ['a queued request', f => { (f.store.state.coordination!.requests ??= []).push({ id: 'r', key: 'GH-5', status: 'queued' } as any); }],
    ['a working request', f => { (f.store.state.coordination!.requests ??= []).push({ id: 'r', key: 'GH-5', status: 'working' } as any); }],
    ['a running worker', f => { (f.store.state.workLog ??= []).push({ id: 'w', requestId: f.job.id, status: 'running' } as any); }],
    ['a stopping worker', f => { (f.store.state.workLog ??= []).push({ id: 'w', requestId: f.job.id, status: 'stopping' } as any); }],
    ['a delivery claim', f => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'other', 'lead-pr'); }],
    ['a ticket claim', f => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: `ticket:${f.job.key}` }, 'other', 'lead-pr'); }],
    ['a blocked CI repair', f => { f.job.ciRepairs = [{ phase: 'blocked' }] as any; }],
    ['a stopped-base update', f => { f.job.stoppedBaseUpdate = {} as any; }],
    ['an uncertain-effect stop', f => { f.job.stop = { kind: 'uncertain-effect', at: '' }; }],
    ['an authority stop', f => { f.job.stop = { kind: 'authority', at: '' }; }],
    ['a source-closed stop', f => { f.job.stop = { kind: 'source-closed', at: '' }; }],
    ['an unverified board move', f => { (f.job.boardUpdates ??= []).push({ status: 'pending' } as any); }],
    ['a certain but unverified lead-pr read receipt', f => { f.job.steps.at(-1)!.result.receipts.push({ id: 'read', action: 'read', target: URL, verified: false, uncertain: false, detail: '' }); }],
    ...(['prepared', 'uncertain', 'rejected-after-dispatch'] as const).map(status => [`a ${status} job Effect`, (f: Fixture) => f.store.putEffect({ id: 'other-write', work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-body', target: URL, authorization: 'x', payload: {}, expectedState: {}, status: status === 'rejected-after-dispatch' ? 'rejected' : status, createdAt: '', dispatchedAt: status === 'prepared' ? '' : '2026-11-25T00:00:00Z', verifiedAt: '', receipt: null, error: '', elapsedMs: null })] as [string, (f: Fixture) => void]),
])('%s keeps an otherwise eligible job out of the refresh', async (_kind, change) => {
    const f = stopped();
    change(f);
    const before = structuredClone(f.job);
    await f.sweep(); expectUntouched(f, before);
});

test('a repair wait for the stopped job costs the sweep no provider read', async () => {
    const f = stopped(), before = structuredClone(f.job);
    const wait = structuredClone(markRepairWait(f));
    const calls = f.reads();
    await f.sweep();
    expect(f.reads()).toBe(calls);
    expect(f.store.state.coordination!.repairWaits?.[`delivery/${f.job.id}`]).toEqual(wait);
    expectUntouched(f, before);
});

test.each(['verified', 'rejected-before-dispatch'] as const)('a %s job Effect does not block the refresh', async status => {
    const f = stopped();
    f.store.putEffect({ id: 'other-write', work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-body', target: URL, authorization: 'x', payload: {}, expectedState: {}, status: status === 'verified' ? 'verified' : 'rejected', createdAt: '', dispatchedAt: status === 'verified' ? '2026-11-25T00:00:00Z' : '', verifiedAt: '', receipt: null, error: '', elapsedMs: null });
    await f.sweep();
    expect(f.job.stage).toBe('update-base');
});

test.each<[string, (f: Fixture) => void, (f: Fixture) => void]>([
    ['the status changes', f => { f.job.status = 'queued'; }, f => expect(f.job.status).toBe('queued')],
    ['the job is cancelled', f => { f.job.status = 'cancelled'; }, f => expect(f.job.status).toBe('cancelled')],
    ['the job is replaced by an equal clone', f => { const i = f.delivery.jobs.indexOf(f.job); f.delivery.jobs[i] = structuredClone(f.job); }, f => expect(f.delivery.jobs.find(j => j.id === f.job.id)!.stage).toBe('lead-pr')],
    ['the last verdict is edited in place', f => { f.job.steps.at(-1)!.result.summary = 'edited'; }, f => expect(f.job.steps.at(-1)!.result.summary).toBe('edited')],
    ['a claim is taken', f => { f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, 'other', 'lead-pr'); }, f => expect(f.store.activeClaims()).toHaveLength(1)],
    ['a PR hold is added', () => { HOLDS['GH-200'] = 'Synthetic hold'; }, () => expect(HOLDS['GH-200']).toBe('Synthetic hold')],
    ['a request is queued', f => { (f.store.state.coordination!.requests ??= []).push({ id: 'r', key: 'GH-5', status: 'queued' } as any); }, f => expect(f.store.state.coordination!.requests).toHaveLength(1)],
    ['an unsettled Effect appears', f => { f.store.putEffect({ id: 'late', work: { projectId: f.store.project.id, kind: 'delivery', id: f.job.id }, attemptId: f.job.id, operation: 'github-pr-body', target: URL, authorization: 'x', payload: {}, expectedState: {}, status: 'uncertain', createdAt: '', dispatchedAt: '2026-11-25T00:00:00Z', verifiedAt: '', receipt: null, error: 'lost', elapsedMs: null }); }, f => expect(f.store.getEffect('late')?.status).toBe('uncertain')],
])('when %s during the live read, nothing is queued and the change survives', async (_kind, change, survives) => {
    const f = stopped();
    let changed = false;
    f.state.fail = (_p, args) => { if (!changed && args.some(a => a.endsWith('/pulls/200'))) { changed = true; change(f); } return false; };
    await f.sweep();
    expect(changed).toBe(true);
    expect(f.events()).toBe(0);
    survives(f);
});

test('a repair wait installed during the pull read preserves the marker and the stopped job', async () => {
    const f = stopped(), before = structuredClone(f.job);
    let wait: ReturnType<typeof markRepairWait> | undefined;
    f.state.fail = (_program, args) => {
        if (args.some(a => a.endsWith('/pulls/200'))) wait = structuredClone(markRepairWait(f));
        return false;
    };
    await f.sweep();
    expect(wait).toBeDefined();
    expect(f.store.state.coordination!.repairWaits?.[`delivery/${f.job.id}`]).toEqual(wait);
    expectUntouched(f, before);
});

test('a refused candidate does not keep a later eligible candidate from its refresh', async () => {
    const f = stopped();
    // An earlier job in the pass whose stop must be reconciled on its own.
    const refused: TicketJob = { ...structuredClone(f.job), id: 'refused-job', key: 'GH-6', pr: 201, prUrl: 'https://github.com/JFusco/cms-field-vocabulary/pull/201', stop: { kind: 'uncertain-effect', at: '' } };
    f.delivery.jobs.unshift(refused);
    f.store.state.github!.prs.unshift({ ...f.row, number: 201, url: refused.prUrl });
    await f.sweep();
    expect(refused.stage).toBe('lead-pr');
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued' });
    expect(f.events()).toBe(1);
});

test('a running worker without a claim ID costs the sweep no provider read', async () => {
    const f = stopped(), before = structuredClone(f.job);
    (f.store.state.workLog ??= []).push({ id: 'w', requestId: f.job.id, status: 'running' } as any);
    const calls = f.reads();
    await f.sweep();
    expect(f.reads()).toBe(calls);
    expectUntouched(f, before);
});

test.each<[string, Parameters<typeof stopped>[0], (f: Fixture) => void]>([
    ['a spent refresh budget', 'refresh', f => { f.job.steps.splice(1, 0, { stage: 'update-base', result: result(f.job, OLD) }, { stage: 'update-base', result: result(f.job, OLD, { summary: 'source repair' }) }); }],
    ['a head without review proof', 'none', () => {}],
    ['merges disabled without an authorization for the head', 'refresh', f => { f.store.state.coordination!.merges!.enabled = false; }],
    ['an empty saved worktree', 'refresh', f => { f.job.worktree = ''; }],
])('%s costs two consecutive sweeps no provider call', async (_kind, proof, change) => {
    const f = stopped(proof);
    change(f);
    const before = structuredClone(f.job), calls = f.reads();
    for (let pass = 0; pass < 2; pass++) {
        await f.sweep();
        expect(f.reads()).toBe(calls);
        expectUntouched(f, before);
    }
});

test('an admissible job is read from GitHub once and queued once; the next sweep reads nothing', async () => {
    const f = stopped(), calls = f.reads();
    await f.sweep();
    expect(f.state.calls.slice(calls)).toEqual([
        'gh api repos/JFusco/cms-field-vocabulary/pulls/200',
        'gh pr view 200 --repo JFusco/cms-field-vocabulary --json closingIssuesReferences',
    ]);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued' });
    expect(f.events()).toBe(1);
    const after = f.reads();
    await f.sweep();
    expect(f.reads()).toBe(after);
    expect(f.events()).toBe(1);
});

test('disabled merges with an authorization for exactly the job head still verify on GitHub and queue', async () => {
    const f = stopped();
    f.store.state.coordination!.merges!.enabled = false;
    f.job.mergeAuthorization = { head: HEAD } as any;
    const calls = f.reads();
    await f.sweep();
    expect(f.reads()).toBe(calls + 2);
    expect(f.job).toMatchObject({ stage: 'update-base', status: 'queued' });
});
