import { afterEach, expect, test } from 'vitest';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../support/fake-github';
import { boardDraft, transientDraft } from './retry-fixture';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { readPublication } from '../../../../server/delivery/publication/read-command';
import { Coordinator } from '../../../../server/scheduling/coordination';
import { reconcileReadRetries } from '../../../../server/scheduling/read-retries';
import { currentOutbox } from '../../../../server/conversations/current-outbox';
import { noteGitHubFailure } from '../../../../server/github/refusal-capture';
import type { TicketJob } from '../../../../src/shared';

afterEach(cleanupFakes);
type Fake = ReturnType<typeof fakeGitHub>;
const PR_URL = `https://github.com/${REPOSITORY}/pull/200`;

/** The Office around one job: the real coordinator and scheduler claims over the synthetic provider, with every call and its input recorded. */
function office(f: Fake, job: TicketJob) {
    f.store.state.paused = false;
    const calls: { line: string; input?: any }[] = [];
    const execute = async (program: string, args: string[], options: any = {}) => { calls.push({ line: `${program} ${args.join(' ')}`, input: options.input?.startsWith?.('{') ? JSON.parse(options.input) : undefined }); return f.execute(program, args, options); };
    const coordinator = new Coordinator(f.store, f.engine, execute as any);
    const ref = { projectId: f.store.project.id, kind: 'delivery' as const, id: job.id };
    const claims: string[] = [];
    const claimed = async <T>(owner: string, work: () => Promise<T>, end: 'completed' | 'interrupted' = 'completed') => {
        const claim = f.store.claimWork(ref, owner, job.stage)!;
        claims.push(claim.id);
        try { return await withAssignment(claim, 'delivery', work); } finally { f.store.finishClaim(claim.id, end); }
    };
    return {
        calls, claims, claimed,
        /** The draft claim that originally stopped, with the provenance read it retained. */
        original: () => claimed('original-draft', () => readPublication(f.store, f.execute as any, job, f.artifactRoot(job), 'viewer'), 'interrupted'),
        /** The planner schedules the stop's retry and, at its time, queues it. */
        plan: () => { reconcileReadRetries(f.store, new Date()); expect(job.retry?.nextAt, job.detail).toBeTruthy(); reconcileReadRetries(f.store, new Date(job.retry!.nextAt)); expect(job.status, job.detail).toBe('queued'); },
        pump: () => claimed('scheduler', () => coordinator.pump({ kind: 'delivery', id: job.id })),
        writes: () => ({ pushes: f.state.calls.filter(call => call.startsWith('git push ')).length, creates: f.state.calls.filter(call => call.startsWith('gh pr create ')).length,
            comments: f.state.mutations.filter(m => m.method === 'POST' && /\/comments$/.test(m.target)).length, cards: f.state.mutations.filter(m => m.method === 'GRAPHQL').length,
            edits: f.state.mutations.filter(m => m.method === 'PATCH').length }),
    };
}
const comment = (f: Fake, job: TicketJob) => ({ id: 950, html_url: `${f.issueUrl}#issuecomment-950`, user: { login: 'JFusco' },
    body: `Office delivery ${job.id}: Draft PR ${PR_URL} is linked to this issue. Sam will check PR readiness; maintainer merge and release gates still apply.` });
const openPR = (f: Fake, job: TicketJob, body = 'Closes #5') => f.state.prs.push({ number: 200, html_url: PR_URL, state: 'open', draft: true, title: 'fix', body,
    head: { sha: HEAD, ref: job.branch }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null, updated_at: '2026-11-24T18:00:00Z' });

/** GH-407 as saved: PR 200 open at the head, both cards in In review, the PR card's move uncertain on a 499. */
function gh407(cardAt = 'review') {
    const { f, job } = boardDraft(fakeGitHub(), { pr: 200, prUrl: PR_URL });
    openPR(f, job);
    f.state.remote[job.branch] = HEAD;
    f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: cardAt });
    return { f, job, o: office(f, job) };
}

test('GH-407: the first provider request is the saved card read; a landed move, the linked PR and an existing comment advance with zero writes', async () => {
    const { f, job, o } = gh407();
    f.state.comments.push(comment(f, job));
    await o.original();
    o.plan();
    const before = o.calls.length;
    await o.pump();
    const first = o.calls[before];
    expect(first.line).toBe('gh api graphql --input -');
    expect(first.input).toMatchObject({ variables: { item: 'pr-card' } });
    expect(first.input.query).toContain('fieldValues');
    // The tracked PR's dependency read comes after it.
    expect(o.calls.slice(before).findIndex(call => call.line.includes(`repos/${REPOSITORY}/pulls/200`))).toBeGreaterThan(0);
    expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued', pr: 200 });
    expect(job.boardUpdates!.every(update => update.status === 'verified')).toBe(true);
    expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
});

test('GH-407: with no comment and proven-unsent history, one comment is posted through its Effect and read back; nothing else is written', async () => {
    const { f, job, o } = gh407();
    await o.original();
    o.plan();
    await o.pump();
    expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
    expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 1, cards: 0, edits: 0 });
    const intent = f.store.getEffect(`harness:${job.id}:draft-link-comment:200`);
    expect(intent?.status).toBe('verified');
});

test('GH-407: across an intervening claimed 503 on the card read, its recorded read proves that claim; altering the proof prevents the first comment', async () => {
    // Unaltered; its artifact changed beside the ledger; or ledger and artifact both rewritten to another card.
    for (const alter of [false, 'artifact', 'content'] as const) {
        const { f, job, o } = gh407();
        await o.original();
        o.plan();
        f.state.fail = (_program, args) => args[1] === 'graphql' ? 'gh exited 1: gh: HTTP 503' : false;
        await o.pump();
        expect(job).toMatchObject({ stage: 'draft', status: 'blocked', stop: { kind: 'transient' } });
        expect(job.retry!.binding!.mode).toBe('board');
        f.state.fail = () => false;
        if (alter) {
            const root = f.artifactRoot(job);
            const proof = readdirSync(root).map(name => resolve(root, name)).find(path => path.endsWith('.json') && readFileSync(path, 'utf8').includes('draft-card-read-v1'))!;
            const body = readFileSync(proof, 'utf8').replaceAll('"pr-card"', '"other-card"');
            writeFileSync(proof, body);
            if (alter === 'content') f.store.db.prepare('UPDATE attempts SET body=? WHERE id=?').run(body, proof.split('/').at(-1)!.replace(/\.json$/, ''));
        }
        o.plan();
        expect(job.retry!.attempts).toBe(2);
        await o.pump();
        if (!alter) {
            expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
            expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 1, cards: 0, edits: 0 });
        } else {
            expect(job).toMatchObject({ stage: 'draft', status: 'blocked' });
            expect(job.detail).toContain('Earlier draft claim has no certain comment receipt');
            expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
            expect(currentOutbox(f.store).find(action => action.id === `ticket-job:${job.id}`)?.status).toBe('open');
        }
    }
});

test('GH-407: with history that cannot prove the comment was never sent, the job stops for Joe with zero POSTs', async () => {
    const { f, job, o } = gh407();
    // An earlier draft claim with no retained read: nothing proves what it sent.
    await o.claimed('unrecorded-draft', async () => undefined, 'interrupted');
    o.plan();
    await o.pump();
    expect(job).toMatchObject({ stage: 'draft', status: 'blocked' });
    expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
    reconcileReadRetries(f.store, new Date());
    expect(job.retry!.nextAt).toBe('');
    expect(currentOutbox(f.store).find(action => action.id === `ticket-job:${job.id}`)?.status).toBe('open');
});

test('GH-407: a move read back at another option stays blocked across reload and ticks, with zero mutations of any kind', async () => {
    const f = fakeGitHub(5, { onDisk: true });
    const { job } = boardDraft(f, { pr: 200, prUrl: PR_URL });
    openPR(f, job); f.state.remote[job.branch] = HEAD; f.state.cards[0].status = 'review';
    f.state.cards.push({ id: 'pr-card', kind: 'PullRequest', number: 200, status: 'progress' });
    const o = office(f, job);
    await o.original();
    o.plan();
    await o.pump();
    expect(job).toMatchObject({ stage: 'draft', status: 'blocked' });
    expect(job.detail).toContain('read back: not at target; not resent');
    expect(job.boardUpdates!.at(-1)).toMatchObject({ status: 'uncertain', readBack: { outcome: 'not-at-target', observed: 'progress' } });
    const { store } = f.reopen();
    const reloaded = store.state.coordination!.jobs!.find(candidate => candidate.id === job.id)!;
    expect(reloaded.boardUpdates!.at(-1)!.readBack?.outcome).toBe('not-at-target');
    store.state.paused = false;
    const calls = f.state.calls.length;
    for (let tick = 0; tick < 3; tick++) reconcileReadRetries(store, new Date(Date.now() + tick * 3600_000));
    expect(reloaded.status).toBe('blocked');
    expect(reloaded.retry!.nextAt).toBe('');
    expect(f.state.calls.length).toBe(calls);
    expect(f.state.mutations.filter(m => m.method !== 'GET')).toEqual([]);
    expect(currentOutbox(store).find(action => action.id === `ticket-job:${job.id}`)?.detail).toContain('Automatic retry:');
});

test('GH-407: a dependency found after the saved card read keeps the job from advancing', async () => {
    const { f, job, o } = gh407();
    await o.original();
    // A live parent job whose PR head is this PR's base.
    const parent = { ...structuredClone(job), id: 'parent-job', key: 'GH-9', pr: 201, prUrl: `https://github.com/${REPOSITORY}/pull/201`, status: 'watching', stage: 'lead-pr', boardUpdates: [], retry: undefined, stop: undefined } as TicketJob;
    f.delivery.jobs.push(parent);
    f.state.prs.push({ number: 201, html_url: `https://github.com/${REPOSITORY}/pull/201`, state: 'open', draft: false, body: '', head: { sha: BASE, ref: 'main' }, base: { ref: 'release', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
    o.plan();
    const before = o.calls.length;
    await o.pump();
    expect(o.calls[before].line).toBe('gh api graphql --input -');
    expect(job.boardUpdates!.every(update => update.status === 'verified')).toBe(true);
    expect(job).toMatchObject({ stage: 'draft', status: 'queued', dependsOnPR: 201 });
    expect(job.prerequisites).toContainEqual(expect.objectContaining({ condition: 'job-completed', target: expect.objectContaining({ id: parent.id }) }));
    expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
});

test('board recovery stays read-only: a changed head, a missing branch or PR, another issue\'s PR or a moved card goes to Joe with zero writes', async () => {
    const cases: [string, (f: Fake, job: TicketJob) => void, RegExp][] = [
        ['a changed remote head', (f, job) => { f.state.remote[job.branch] = 'c'.repeat(40); }, /remote .* is at ccccccc/],
        ['a missing branch', (f, job) => { delete f.state.remote[job.branch]; }, /remote branch .* is missing/],
        ['a closed PR', f => { f.state.prs[0].state = 'closed'; }, /is not open/],
        ['another issue\'s same-head PR', f => { f.state.prs[0].body = 'Closes #99'; }, /not natively linked to issue #5/],
        ['a card moved again', f => { f.state.cards[0].status = 'progress'; }, /issue card is no longer in In review/],
    ];
    for (const [name, change, reason] of cases) {
        const { f, job, o } = gh407();
        await o.original();
        o.plan();
        change(f, job);
        await o.pump();
        expect(job.status, name).toBe('blocked');
        expect(job.detail, name).toMatch(reason);
        expect(job.detail, name).toContain('Nothing was pushed, created, edited or moved');
        expect(o.writes(), name).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
        // The PR card's own move was verified; the restriction stays on the job for any later read.
        expect(job.retry!.binding!.mode, name).toBe('board');
        reconcileReadRetries(f.store, new Date());
        expect(job.retry!.nextAt, name).toBe('');
    }
});

/** GH-408 as saved: a clean candidate, every card move verified, no remote branch and no PR, stopped on a timed-out read. */
function gh408() {
    const { f, job } = transientDraft();
    f.state.cards[0].status = 'progress';
    return { f, job, o: office(f, job) };
}

test('GH-408: a stopped draft claim re-enters through the pump and publishes once; a later stop and re-entry keep one push and one create', async () => {
    const { f, job, o } = gh408();
    await o.original();
    o.plan();
    // The retry publishes, then stops on a read after publication settled.
    let failing = true;
    f.state.fail = (_program, args) => failing && args[0] === 'api' && args[1] === `repos/${REPOSITORY}/pulls/200` ? 'gh: HTTP 502' : false;
    await o.pump();
    expect(job, job.detail).toMatchObject({ stage: 'draft', status: 'blocked', stop: { kind: 'transient' } });
    expect(o.writes()).toEqual({ pushes: 1, creates: 1, comments: 0, cards: 1, edits: 0 });
    failing = false;
    o.plan();
    await o.pump();
    expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued', pr: 200 });
    expect(o.writes()).toEqual({ pushes: 1, creates: 1, comments: 1, cards: 1, edits: 0 });
});

test('GH-408: an existing same-head PR linked to another issue stops the retry before any write; a correctly linked one is adopted', async () => {
    for (const linked of [false, true]) {
        const { f, job, o } = gh408();
        await o.original();
        openPR(f, job, linked ? 'Closes #5' : 'Closes #99');
        f.state.remote[job.branch] = HEAD;
        o.plan();
        await o.pump();
        if (!linked) {
            expect(job).toMatchObject({ stage: 'draft', status: 'blocked' });
            expect(job.detail).toContain('Existing PR #200 is not this issue\'s draft: it is not natively linked to this issue');
            expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
            expect(f.state.cards[0].status).toBe('progress');
        } else {
            expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued', pr: 200 });
            expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 1, cards: 1, edits: 0 });
        }
    }
});

test('a fresh card move from an automatic draft is one Effect, bound to the draft, head and lane, dispatching while it is sent', async () => {
    const { f, job, o } = gh408();
    await o.original();
    o.plan();
    const seen: string[] = [];
    // Looks at the Effects ledger at the moment each GraphQL call is made.
    f.state.fail = (_program, args) => {
        if (args[1] === 'graphql') seen.push(...(f.store.db.prepare("SELECT id FROM effects WHERE status='dispatching'").all() as { id: string }[]).map(row => row.id));
        return false;
    };
    await o.pump();
    expect(job.stage, job.detail).toBe('prepare-pr');
    expect(seen.some(id => id.startsWith(`harness:${job.id}:draft:${HEAD}:in-review:lane:issue-card`))).toBe(true);
});

test('revalidation: a change between planning and claim entry withdraws the retry, shows its reason and starts nothing', async () => {
    const changes: [string, (f: Fake, job: TicketJob) => void][] = [
        ['a changed head', (_f, job) => { job.head = 'c'.repeat(40); }],
        ['a park', (_f, job) => { job.parked = { stage: 'draft', reason: 'choose', at: new Date().toISOString(), published: false }; }],
        ['a merge attempt', (_f, job) => { job.mergeAttempt = { head: HEAD, at: new Date().toISOString() }; }],
        ['an unsettled Effect', (f, job) => { f.store.db.prepare('INSERT INTO effects(id, work_key, status, body) VALUES(?, ?, ?, ?)').run('e', `${f.store.project.id}:delivery:${job.id}`, 'uncertain', JSON.stringify({ attemptId: job.id })); }],
        ['a legacy recovery added after queueing', (_f, job) => { job.candidateRecovery = { head: HEAD, findingIds: [], summary: 'legacy' }; }],
    ];
    for (const [name, change] of changes) {
        const { f, job, o } = gh408();
        await o.original();
        o.plan();
        change(f, job);
        let models = 0;
        f.engine.agents.run = (async () => { models++; throw new Error('no model'); }) as any;
        const before = f.state.calls.length;
        await o.pump();
        expect(job.status, name).toBe('blocked');
        expect(job.retry!.withdrawn?.reason, name).toBeTruthy();
        expect(job.detail, name).toContain('Automatic retry withdrawn');
        expect(f.state.calls.length, name).toBe(before);
        expect(models, name).toBe(0);
        reconcileReadRetries(f.store, new Date(Date.now() + 3600_000));
        expect(job.retry!.nextAt, name).toBe('');
    }
});

test('a dependency refresh that fails with 503 records its own stop and takes the next counted delay; no repeat request before it', async () => {
    const { f, job, o } = gh407();
    await o.original();
    o.plan();
    let reads = 0;
    f.state.fail = (_program, args) => args[1] === `repos/${REPOSITORY}/pulls/200` && ++reads > 0 ? 'gh exited 1: gh: HTTP 503' : false;
    await o.pump();
    expect(job).toMatchObject({ stage: 'draft', status: 'blocked', stop: { kind: 'transient' } });
    expect(job.detail).toContain('HTTP 503');
    reconcileReadRetries(f.store, new Date());
    expect(job.retry).toMatchObject({ attempts: 1, limit: 6, binding: { mode: 'board' } });
    expect(Date.parse(job.retry!.nextAt) - Date.now()).toBeGreaterThan(100_000);
    const calls = f.state.calls.length;
    await o.pump();
    expect(f.state.calls.length).toBe(calls);
});

test('a board recovery that verifies one card and fails the next read keeps its read-only mode: a 503 is counted, a permission failure is Joe\'s, a quota refusal waits uncounted', async () => {
    for (const [failure, expectation] of [['gh exited 1: gh: HTTP 503', 'counted'], ['gh exited 1: gh: Resource not accessible by integration (HTTP 403)', 'person'], ['gh exited 1: gh: API rate limit exceeded for user ID 1. (HTTP 403)', 'quota']] as const) {
        const { f, job, o } = gh407();
        // Both cards' moves were saved uncertain; the issue card's read succeeds and the PR card's fails.
        job.boardUpdates![1] = { ...job.boardUpdates![1], status: 'uncertain', detail: 'gh exited 1: gh: HTTP 499' };
        await o.original();
        o.plan();
        let reads = 0;
        f.state.fail = (_program, args) => args[1] === 'graphql' && ++reads === 2 ? failure : false;
        // The quota refusal is reported by the metered runner with its deadline, as in production.
        const deadline = new Date(Date.now() + 25 * 60_000).toISOString();
        const execute = f.execute;
        (f as any).execute = async (program: string, args: string[], options: any = {}) => {
            try { return await execute(program, args, options); }
            catch (error) {
                if (expectation === 'quota') noteGitHubFailure({ args: args.join(' '), text: String((error as Error).message), readOnly: !!options.readOnly, at: new Date().toISOString(),
                    refusal: { principal: 'operator', resource: 'graphql', at: new Date().toISOString(), deadline, secondary: false, text: failure, readOnly: true } });
                throw error;
            }
        };
        await o.pump();
        expect(job.boardUpdates![1].status, failure).toBe('verified');
        expect(job.boardUpdates![2].status, failure).toBe('uncertain');
        expect(job.status, failure).toBe('blocked');
        reconcileReadRetries(f.store, new Date());
        if (expectation === 'counted') expect(job.retry, failure).toMatchObject({ attempts: 1, limit: 6, binding: { mode: 'board' } });
        if (expectation === 'quota') expect(job.retry, failure).toMatchObject({ attempts: 1, nextAt: deadline, failure: { category: 'provider-limit', retryAt: deadline } });
        if (expectation === 'person') { expect(job.retry!.nextAt, failure).toBe(''); expect(currentOutbox(f.store).find(action => action.id === `ticket-job:${job.id}`)?.status).toBe('open'); }
        expect(o.writes(), failure).toEqual({ pushes: 0, creates: 0, comments: 0, cards: 0, edits: 0 });
    }
});

test('a model-free stage an automatic draft retry entered never falls through to a model worker; a review retry may', async () => {
    const { assertNoModelFallback } = await import('../../../../server/delivery/attempts/retry-entry');
    const { f, job } = gh408();
    const claim = f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'scheduler', 'draft')!;
    for (const mode of ['draft', 'board', 'read'] as const) {
        job.retry = { attempts: 1, nextAt: '', history: [], exhausted: false, binding: { job: job.id, stop: '', stage: 'draft', head: HEAD, pr: 0, branch: job.branch, worktree: job.worktree, mode, reason: 'x', claim: claim.id } };
        const check = () => withAssignment(claim, 'delivery', () => assertNoModelFallback(job));
        if (mode === 'read') expect(check).not.toThrow(); else expect(check).toThrow('no model worker was started');
        // Outside the claim that entered it, nothing is an automatic retry.
        expect(() => assertNoModelFallback(job)).not.toThrow();
    }
    f.store.finishClaim(claim.id, 'completed');
});

test('a board recovery re-entered after its cards were verified records its provenance read as that claim\'s first', async () => {
    const { f, job, o } = gh407();
    await o.original();
    o.plan();
    for (const update of job.boardUpdates!) update.status = 'verified';
    const before = o.calls.length;
    // The PR read fails after the claim's first read, so the claim ends without acceptance.
    f.state.fail = (_program, args) => args[1] === `repos/${REPOSITORY}/pulls/200` ? 'gh exited 1: gh: HTTP 503' : false;
    await o.pump();
    expect(o.calls[before].line).toBe('gh api user --method GET');
    expect(job).toMatchObject({ stage: 'draft', status: 'blocked', stop: { kind: 'transient' } });
    f.state.fail = () => false;
    o.plan();
    await o.pump();
    // That claim's own read proves it, so the first comment is posted once.
    expect(job, job.detail).toMatchObject({ stage: 'prepare-pr', status: 'queued' });
    expect(o.writes()).toEqual({ pushes: 0, creates: 0, comments: 1, cards: 0, edits: 0 });
});
