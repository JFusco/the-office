import { afterEach, expect, test, vi } from 'vitest';
import { cleanupFakes, fakeGitHub, BASE, HEAD, REPOSITORY } from '../delivery/support/fake-github';
import { adoptDependabot } from '../../../server/delivery/intake/dependabot/adopt';
import { GitHubDelivery } from '../../../server/delivery/pipeline/github-delivery';
import { currentGitHubSource } from '../../../server/github/call-scope';
import { GitHubCalls } from '../../../server/github/github-calls';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { Coordinator } from '../../../server/scheduling/coordination';
import { Engine } from '../../../server/scheduling/engine';
import { enqueueRequest, executeRequest } from '../../../server/scheduling/requests';
import type { TicketJob } from '../../../src/shared';
afterEach(cleanupFakes);

const T0 = Date.parse('2026-11-26T13:00:00.000Z'), RESET = T0 / 1000 + 1800, UNTIL = new Date(RESET * 1000).toISOString();
const REFUSED = 'Error: gh exited 1: API rate limit exceeded for user ID 486049. (HTTP 403)';
const QUOTA_LOW = `GitHub quota low. Observation resumes at ${UNTIL}.`;
const BODY = 'Updates `eslint` from 10.3.0 to 10.4.0';
const prior = { key: 'GH-5', summary: 'Restore', url: `https://github.com/${REPOSITORY}/issues/5`, assignee: 'JFusco', status: 'open', statusId: '', updated: '', type: 'GitHub issue', subtask: false, pickupStatus: 'Ready' };

/**
 * A hands-off GitHub project whose Dependabot adoption left its PR-body PATCH uncertain: the write landed and its
 * answer was lost. The account's core quota is then sampled below the 10% reserve, and the last assignment poll and
 * GitHub observation were refused. Every call is recorded with the source it ran under.
 */
async function belowTheFloor(remaining = { core: 400, graphql: 5000 }) {
    const f = fakeGitHub();
    f.state.cards = [{ id: 'pr-card', kind: 'PullRequest', number: 121, status: 'ready' }];
    Object.assign(f.state.issue, { title: '', body: '', assignees: [] });
    f.state.prs.push({ number: 121, html_url: `https://github.com/${REPOSITORY}/pull/121`, state: 'open', draft: false, user: { login: 'dependabot[bot]' }, title: 'chore(deps-dev): bump eslint', body: BODY,
        head: { sha: HEAD, ref: 'dependabot/npm_and_yarn/eslint', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
    f.state.prFiles[121] = ['package.json']; f.state.prCommits[121] = ['dependabot[bot]'];
    const calls: { source: string; line: string }[] = [];
    // GitHub's list still serves the row from before the PATCH; the PR's own detail has the new body.
    let staleRows: any[] | undefined;
    const execute = async (program: string, args: string[], options?: any): Promise<string> => {
        calls.push({ source: currentGitHubSource(), line: `${program} ${args.join(' ')}` });
        if (args[1] === 'rate_limit') return JSON.stringify({ resources: { core: { limit: 5000, used: 5000 - remaining.core, remaining: remaining.core, reset: RESET }, graphql: { limit: 5000, used: 5000 - remaining.graphql, remaining: remaining.graphql, reset: RESET } } });
        if (staleRows && args[1] === `repos/${REPOSITORY}/pulls?state=open&per_page=100`) return JSON.stringify([staleRows]);
        return (f.execute as any)(program, args, options);
    };
    const lost = async (program: string, args: string[], options?: any) => {
        const out = await execute(program, args, options);
        if (args.includes('PATCH')) throw new Error('timeout after the PATCH was sent');
        return out;
    };
    await adoptDependabot(f.store, lost as any, f.delivery.jobs, f.store.state.coordination!.pickup!);
    const record = f.store.state.coordination!.adoptions![0], effect = `harness:${record.id}:pr-body:121:${HEAD}`;
    staleRows = [{ ...f.state.prs[0], body: BODY }];
    let now = T0;
    const github = new GitHubCalls(execute as any, '', () => now);
    await github.quota.sample();
    // As Offices builds it: the engine, its GitHub monitor and the coordinator share the one governor.
    const engine = new Engine(f.store, undefined, undefined, undefined, undefined, execute as any, github.governor);
    const c = new Coordinator(f.store, engine, execute as any);
    c.activate(new Date(T0 - 3_600_000));
    let assignmentReads = 0;
    c.readAssignments = async () => { assignmentReads++; return [prior]; };
    Object.assign(c.state.listener, { error: REFUSED, lastCheckedAt: '2026-11-26T12:58:00.000Z', assigned: [prior] });
    f.store.state.github = { status: 'blocked', error: REFUSED, observedAt: '2026-11-26T12:57:00.000Z', issues: [], prs: [], runs: [] };
    engine.agents.run = async () => { throw new Error('No model run expected'); };
    const it = new ITSpecialist({ entries: new Map([[f.store.project.id, { store: f.store, engine, coordinator: c }]]) } as any, { report: async () => ({ checkedAt: '', context: '', services: [] }) } as any);
    calls.length = 0;
    return { f, c, engine, it, github, record, effect, calls, assignmentReads: () => assignmentReads, at: (ms: number) => { now = ms; }, patches: () => f.state.calls.filter(call => call.includes('PATCH')) };
}

test('a real poll below the floor reads back the uncertain adoption PATCH, repeats nothing, and IT spends nothing', async () => {
    const x = await belowTheFloor();
    expect(x.f.store.getEffect(x.effect)?.status).toBe('uncertain');
    expect(x.patches()).toHaveLength(1);
    x.f.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'retrying', reports: [], services: [], recoveries: { 'assignment-listener': { attempts: 1, nextAt: '', status: 'retrying', detail: REFUSED } } };

    expect(await x.c.poll(new Date(T0))).toEqual({ until: UNTIL });
    // The owning adoption path read the PR back on its own and settled the original intent.
    expect(x.calls).toContainEqual({ source: 'bot-adoption', line: `gh api repos/${REPOSITORY}/pulls/121` });
    expect(x.f.store.getEffect(x.effect)?.status).toBe('verified');
    expect(x.record).toMatchObject({ status: 'adopted', issue: 5 });
    expect(x.patches()).toHaveLength(1);
    // Nothing that only feeds new intake was read.
    expect(x.assignmentReads()).toBe(0);
    expect(x.calls.filter(call => ['alerts', 'discovery', 'dependency-refresh', 'merge-notices', 'monitor', 'pipelines'].includes(call.source))).toEqual([]);
    // The deferral wrote no reader error: the refused poll's error, time and assignments stand.
    expect(x.c.state.listener).toMatchObject({ error: REFUSED, lastCheckedAt: '2026-11-26T12:58:00.000Z', assigned: [prior], deferredUntil: UNTIL });
    expect(x.f.store.state.github).toMatchObject({ status: 'blocked', error: REFUSED, observedAt: '2026-11-26T12:57:00.000Z' });

    await x.it.tick(new Date(T0 + 1_000), true);
    const it = x.f.store.state.it!;
    expect(Object.keys(it.recoveries)).toEqual(['assignment-listener']);
    expect(it.recoveries['assignment-listener']).toMatchObject({ attempts: 1, status: 'retrying' });
    expect(x.c.state.requests ?? []).toEqual([]);
    expect(it.reports.at(-1)!.followUps.filter(followUp => followUp.detail === QUOTA_LOW)).toEqual([
        { id: 'assignment-listener', owner: 'IT', detail: QUOTA_LOW, nextAt: UNTIL, routine: true },
        { id: 'project-progress', owner: 'IT', detail: QUOTA_LOW, nextAt: UNTIL, routine: true },
    ]);
    expect(it.status).toBe('monitoring');
});

test('the rest of the protected work keeps its tick under the hold: pending cleanup and the PR observation of live jobs', async () => {
    const x = await belowTheFloor();
    const seeded = { status: 'pending' as const, detail: 'Earlier cleanup could not finish.', at: '2026-11-26T12:00:00.000Z' };
    const job = Object.assign(x.f.candidate(), { status: 'completed', stage: 'closeout', candidateCleanup: { ...seeded } });
    const observed = vi.spyOn(GitHubDelivery.prototype, 'observe');
    try {
        await x.c.poll(new Date(T0));
        expect(observed).toHaveBeenCalledTimes(1);
        expect(job.candidateCleanup).not.toEqual(seeded);
        expect(x.c.state.listener).toMatchObject({ error: REFUSED, deferredUntil: UNTIL });
    } finally { observed.mockRestore(); }
});

test('a refresh queued before the hold records the deferral and leaves the last observation and its error', async () => {
    const x = await belowTheFloor();
    const request = enqueueRequest(x.f.store, 'refresh');
    await executeRequest(x.f.store, x.engine, x.c, request);
    expect(request).toMatchObject({ status: 'completed', detail: QUOTA_LOW });
    expect(x.calls).toEqual([]);
    expect(x.f.store.state.github).toMatchObject({ status: 'blocked', error: REFUSED, observedAt: '2026-11-26T12:57:00.000Z' });
    expect(x.c.state.listener.error).toBe(REFUSED);
});

test('at the deadline the poll reads assignments again and a completed read clears the earlier error', async () => {
    const x = await belowTheFloor();
    await x.c.poll(new Date(T0));
    x.at(RESET * 1000);
    x.c.readAssignments = async () => [];
    await x.c.poll(new Date(RESET * 1000));
    expect(x.c.state.listener.error).toBe('');
    expect(x.c.state.listener.deferredUntil).toBeUndefined();
    expect(x.c.state.listener.lastCheckedAt).not.toBe('2026-11-26T12:58:00.000Z');
});

/** A live job on a stacked PR the stale open list does not carry, so its dependency refresh reads it by number. */
function liveChild(x: Awaited<ReturnType<typeof belowTheFloor>>) {
    x.f.state.prs.push({ number: 123, html_url: `https://github.com/${REPOSITORY}/pull/123`, state: 'open', draft: false, user: { login: 'JFusco' }, title: 'Child', body: 'Closes #5',
        head: { sha: 'c'.repeat(40), ref: 'codex/5-child', repo: { full_name: REPOSITORY } }, base: { ref: 'main', sha: BASE, repo: { full_name: REPOSITORY } }, merged_at: null });
    const job = { id: 'child-job', key: 'GH-7', pr: 123, prUrl: `https://github.com/${REPOSITORY}/pull/123`, requestedAt: '2026-11-26T12:00:00.000Z', status: 'watching', stage: 'lead-pr', head: 'c'.repeat(40), worktree: '', branch: 'codex/5-stale', detail: '', steps: [] } as TicketJob;
    x.c.state.jobs!.push(job);
    return job;
}

test('at 500 of 5,000 GraphQL points with healthy core, the board and refresh wait while the REST-only dependency lookup and read-backs run', async () => {
    const x = await belowTheFloor({ core: 4600, graphql: 500 }), job = liveChild(x);
    const observed = vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    try {
        expect(x.github.governor.hold()).toBeUndefined();
        expect(await x.c.poll(new Date(T0))).toEqual({ until: UNTIL });
        // GraphQL-dependent work waits: no assignment or board read, no intake consumers, no monitor.
        expect(x.assignmentReads()).toBe(0);
        expect(x.calls.filter(call => ['assignments', 'alerts', 'discovery', 'merge-notices', 'monitor', 'pipelines'].includes(call.source))).toEqual([]);
        // Core-only work continues: the live job's PR is read by number and its routing refreshed.
        expect(x.calls).toContainEqual({ source: 'dependency-refresh', line: `gh api repos/${REPOSITORY}/pulls/123` });
        expect(job.branch).toBe('codex/5-child');
        // The protected read-back settled the uncertain adoption PATCH without repeating it.
        expect(x.f.store.getEffect(x.effect)?.status).toBe('verified');
        expect(x.patches()).toHaveLength(1);
        expect(observed).toHaveBeenCalledTimes(1);
        expect(x.c.state.listener).toMatchObject({ error: REFUSED, lastCheckedAt: '2026-11-26T12:58:00.000Z', assigned: [prior], deferredUntil: UNTIL });
        // A refresh queued meanwhile records the deferral and reads nothing.
        x.calls.length = 0;
        const request = enqueueRequest(x.f.store, 'refresh');
        await executeRequest(x.f.store, x.engine, x.c, request);
        expect(request).toMatchObject({ status: 'completed', detail: QUOTA_LOW });
        expect(x.calls).toEqual([]);
    } finally { observed.mockRestore(); }
});

test('under a shared refusal the background dependency lookup waits too', async () => {
    const x = await belowTheFloor({ core: 4600, graphql: 4600 }), job = liveChild(x);
    x.github.governor.refused({ secondary: true });
    const observed = vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    try {
        expect(await x.c.poll(new Date(T0))).toEqual({ until: new Date(T0 + 60_000).toISOString() });
        expect(x.calls.filter(call => call.source === 'dependency-refresh')).toEqual([]);
        expect(job.branch).toBe('codex/5-stale');
        expect(observed).toHaveBeenCalledTimes(1);
    } finally { observed.mockRestore(); }
});

test('a failed dependency lookup under a GraphQL-only reserve keeps the routing and the hold: no listener error, the protected tick runs', async () => {
    const x = await belowTheFloor({ core: 4600, graphql: 500 }), job = liveChild(x);
    x.f.state.fail = (_program, args) => args[1] === `repos/${REPOSITORY}/pulls/123` ? 'gh exited 1: Server Error (HTTP 502)' : false;
    const observed = vi.spyOn(GitHubDelivery.prototype, 'observe').mockResolvedValue(undefined);
    try {
        expect(await x.c.poll(new Date(T0))).toEqual({ until: UNTIL });
        expect(job.branch).toBe('codex/5-stale');
        expect(observed).toHaveBeenCalledTimes(1);
        expect(x.c.state.listener).toMatchObject({ error: REFUSED, deferredUntil: UNTIL });
    } finally { observed.mockRestore(); }
});
