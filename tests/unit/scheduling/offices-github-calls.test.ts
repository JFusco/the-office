import { afterEach, expect, test, vi } from 'vitest';
import { currentGitHubSource, withGitHubSource, type Runner } from '../../../server/github/call-scope';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { startServiceTicks } from '../../../server/office/service-ticks';
import { apiRoute } from '../../../server/office/http/api-routes';
import { CEC } from '../../../server/office/config';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { Offices } from '../../../server/scheduling/offices';
import { enqueueRequest, executeRequest } from '../../../server/scheduling/requests';
import type { OfficeSnapshot } from '../../../src/shared';
import { generatedPR, graphqlPulls, included, isInventoryQuery, noOpenPRs, type GraphqlPR, type Kind } from '../github/support/pull-fixtures';
import { scheduledWork } from '../../../server/scheduling/scheduled-work';
import { CommandFailure } from '../../../server/workers/process';

const T0 = Date.parse('2026-11-24T12:00:00.000Z'), MINUTE = 60_000;
const board = JSON.stringify({ data: { user: { projectV2: { title: 'Board', url: 'https://github.com/users/JFusco/projects/8', shortDescription: '', readme: '', fields: { nodes: [{ name: 'Status', options: [{ name: 'Ready' }] }], pageInfo: { hasNextPage: false } }, items: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } } });
const issue = (number: number) => ({ number, title: `Issue ${number}`, state: 'open', html_url: `https://github.com/JFusco/brain/issues/${number}`, updated_at: '2026-11-24T11:00:00Z' });
const hosts = JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'success', login: 'fixture' }] } });
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });
function close(office: Offices) { office.dispose(); for (const { store } of office.entries.values()) store.close(); office.control.db.close(); }

/** Simulated `gh` children. Each records the source it ran under; `hold` keeps one call open until `release`. */
function provider(hold?: RegExp) {
    let release = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    const calls: { call: string; source: string; forwarded: boolean }[] = [];
    const raw: Runner = async (program, args, options = {}) => {
        if (program !== 'gh') throw new Error(`unexpected ${program}`);
        const call = args.join(' ');
        calls.push({ call, source: currentGitHubSource(), forwarded: typeof options.onOutput === 'function' });
        options.onSpawn?.(4200 + calls.length);
        if (hold?.test(call)) await held;
        const variables = isInventoryQuery(options) ? JSON.parse(options.input!).variables : undefined;
        const out = args[0] === 'auth' ? hosts : variables ? noOpenPRs(`${variables.owner}/${variables.name}`) : args[1] === 'graphql' ? board
            : args[1] === 'repos/JFusco/brain/pulls/419' ? '{"number":419,"state":"closed","merged":true,"merge_commit_sha":"fixture"}'
            : /issues\?state=open&assignee/.test(call) ? '[[]]'
            : /brain\/issues\?state=open/.test(call) ? JSON.stringify([[issue(1)], [issue(2)]])
            : /issues\?state=open|pulls\?state=open/.test(call) ? '[[]]'
            : /actions\/runs\?|actions\/workflows\/\d+\/runs/.test(call) ? '{"workflow_runs":[]}'
            : /actions\/workflows\?/.test(call) ? JSON.stringify({ workflows: [{ id: 1, name: 'CI', state: 'active', html_url: 'https://github.com/JFusco/brain/actions' }] }) : undefined;
        if (out === undefined) throw new Error(`unexpected gh ${call}`);
        options.onOutput?.('stdout', out);
        return out;
    };
    return { raw, calls, release };
}
const families = (office: Offices) => Object.fromEntries(office.githubCalls.report().sources.map(s => [s.source, Object.fromEntries(s.families.map(f => [f.family, [f.invocations, f.pages]]))]));
const snapshot = { project: { id: 'brain', name: 'Brain' }, paused: false, coordination: { listener: { lastCheckedAt: new Date(T0).toISOString(), error: '' } }, workLog: [], slackDeliveries: [] } as unknown as OfficeSnapshot;
const base = async (program: string) => program === 'curl' ? JSON.stringify({ status: { indicator: 'none', description: 'ok' }, components: [] }) : program === 'claude' ? '{"loggedIn":true}' : program === 'twg' ? '{"data":{"accountId":"a"}}' : '"id"';

test('the real monitor and workflow callback are counted apart while a second project polls, beside health, and the hour rolls and restarts', async () => {
    vi.useFakeTimers({ toFake: ['Date'], now: T0 });
    // The second project's assignment read stays open until the first project's observation, workflow callback included, has ended.
    const p = provider(/cms-field-vocabulary\/issues\?state=open&assignee/), office = new Offices(p.raw);
    try {
        const brain = office.get('brain'), cms = office.get('cms-field-vocabulary');
        await office.githubCalls.bind(async () => {
            const second = cms.coordinator!.readAssignments();
            const first = brain.engine.observe().then(() => p.release());
            await Promise.all([first, second]);
        });
        const workflow = p.calls.findIndex(c => /actions\/workflows\?/.test(c.call)), assignment = p.calls.findIndex(c => /assignee/.test(c.call));
        expect(assignment).toBeLessThan(workflow);
        expect(p.calls.filter(c => c.call.includes('cms-field-vocabulary')).every(c => c.source === 'assignments')).toBe(true);
        expect(families(office)).toEqual({
            monitor: { issues: [1, 2], 'monitor-pr-graphql': [1, 1], 'actions-runs': [1, 1], graphql: [1, 1] },
            pipelines: { workflows: [1, 1], 'workflow-runs': [1, 1] },
            assignments: { issues: [1, 1], graphql: [1, 1] },
        });
        const { projects, totals } = office.githubCalls.report();
        expect(projects.map(({ project, invocations, sources }) => [project, invocations, sources.map(s => [s.source, s.invocations])])).toEqual([
            ['brain', 6, [['monitor', 4], ['pipelines', 2]]],
            ['cms-field-vocabulary', 2, [['assignments', 2]]],
        ]);
        for (const key of Object.keys(totals) as (keyof typeof totals)[])
            expect(projects.reduce((sum, row) => sum + row[key], 0), key).toBe(totals[key]);
        expect(brain.store.state.pipelines?.items.map(item => item.name)).toEqual(['CI']);

        // The GitHub login probe through the Office runner: opaque, labelled health, its output forwarded to the check.
        const health = await new ServiceHealthChecks(base as any, office.githubCalls.run).report([snapshot]);
        expect(health.services.find(s => s.id === 'github')).toMatchObject({ status: 'connected', identity: 'fixture' });
        expect(p.calls.find(c => c.call.startsWith('auth status'))).toMatchObject({ source: 'health', forwarded: true });
        expect(office.githubCalls.report().sources.find(s => s.source === 'health')).toMatchObject({ invocations: 1, opaque: 1, unknown: 1, attempts: 0, families: [{ family: 'gh-auth' }] });
        expect(office.githubCalls.report()).toMatchObject({ serviceInstanceId: office.serviceInstanceId, totals: { invocations: 9 }, window: { complete: false, coveredMinutes: 0 } });

        // An hour later every count has expired, and the hour is fully covered.
        vi.setSystemTime(T0 + 61 * MINUTE);
        expect(office.githubCalls.report()).toMatchObject({ sources: [], projects: [], totals: { invocations: 0 }, window: { complete: true, coveredMinutes: 60 } });
    } finally { close(office); }

    // A restarted Office starts a new ledger: its report covers only the time since it started.
    const restarted = new Offices(provider().raw);
    try {
        await restarted.get('brain').engine.github.api('pulls?state=open&per_page=100', true);
        vi.setSystemTime(T0 + 71 * MINUTE);
        expect(restarted.githubCalls.report()).toMatchObject({ collectingSince: new Date(T0 + 61 * MINUTE).toISOString(), window: { from: new Date(T0 + 61 * MINUTE).toISOString(), coveredMinutes: 10, complete: false }, totals: { invocations: 1 } });
        expect(restarted.serviceInstanceId).not.toBe(office.serviceInstanceId);
    } finally { close(restarted); }
});

test('a refresh IT saved as its recovery is counted once, as IT’s, through the monitor and pipelines it runs', async () => {
    const p = provider(), office = new Offices(p.raw);
    try {
        const brain = office.get('brain'), coordinator = brain.coordinator!;
        void coordinator.state;
        const ordinary = enqueueRequest(brain.store, 'refresh'), joined = enqueueRequest(brain.store, 'refresh');
        expect(joined).toBe(ordinary);
        brain.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'project-progress': { requestId: joined.id, attempts: 1, nextAt: '', status: 'retrying', detail: 'saved error' } } };
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, coordinator, ordinary));
        expect(ordinary.status).toBe('completed');
        // Monitor and workflow reads, whatever this file's earlier test left saved: every one is IT's, each counted once.
        const made = p.calls.length;
        expect(made).toBeGreaterThanOrEqual(5);
        expect(p.calls.every(c => c.source === 'it')).toBe(true);
        expect(office.githubCalls.report().sources.map(s => [s.source, s.invocations])).toEqual([['it', made]]);
        expect(office.githubCalls.report().projects).toMatchObject([{ project: 'brain', invocations: made, sources: [{ source: 'it', invocations: made }] }]);

        // An ordinary refresh keeps the labels of the work it runs; its workflows' runs are already known.
        const next = enqueueRequest(brain.store, 'refresh');
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, coordinator, next));
        expect(office.githubCalls.report().sources.map(s => [s.source, s.invocations])).toEqual([['it', made], ['monitor', 4], ['pipelines', 1]]);
        // The PR inventory and the board keep their own families under the pinned owner; no per-PR REST read is made.
        expect(families(office).it).toMatchObject({ 'monitor-pr-graphql': [1, 1], graphql: [1, 1] });
        expect(Object.keys(families(office).it)).not.toEqual(expect.arrayContaining(['pull']));
    } finally { close(office); }
});

test('a queued dependency observation counts its provider read under dependency refresh', async () => {
    const p = provider(), office = new Offices(p.raw);
    try {
        const { store, engine, coordinator } = office.get('brain');
        const owner = coordinator!;
        owner.state.listener.reviews = [{
            id: 'review', key: 'GH-1', summary: 'Review', url: '', queuedAt: '', startedAt: '', endedAt: '',
            status: 'held', detail: '', owner: '', prerequisites: [{
                target: { projectId: 'brain', kind: 'pr', id: '419' },
                condition: 'pr-merged', evidence: 'Fixture', observedAt: '',
            }],
        }];
        const request = enqueueRequest(store, 'observe-dependencies');
        await office.githubCalls.bind(() => executeRequest(store, engine, owner, request));

        expect(request.status).toBe('completed');
        expect(owner.state.dependencyObservations).toMatchObject([{ exists: true, complete: true, error: '' }]);
        expect(families(office)).toEqual({ 'dependency-refresh': { pull: [1, 1] } });
        expect(office.githubCalls.report().projects).toMatchObject([{ project: 'brain', invocations: 1 }]);
    } finally { close(office); }
});

test.each([false, true])('health stays busy for a quota sample across the fence (sample fails: %s)', async fails => {
    vi.useFakeTimers({ now: T0 });
    vi.stubEnv('OFFICE_NO_POLL', undefined);
    let finishSample!: () => void;
    const sample = new Promise<string>((resolve, reject) => {
        finishSample = () => {
            if (fails) reject(new Error('sample failed'));
            else resolve('{"resources":{"core":{"used":9,"remaining":4991,"limit":5000,"reset":1795000000}}}');
        };
    });
    const raw = vi.fn<Runner>(async (_program, _args, options) => {
        options?.onSpawn?.(4200);
        return sample;
    });
    const offices = new Offices(raw), serviceHealth = new ServiceHealthChecks();
    const itSpecialist = new ITSpecialist(offices, serviceHealth);
    vi.spyOn(offices, 'pump').mockResolvedValue(undefined);
    vi.spyOn(offices, 'tick').mockResolvedValue(undefined);
    vi.spyOn(itSpecialist, 'tick').mockResolvedValue(undefined);
    const loadedRevision = { hash: 'fixture', manifest: [] };
    const context = { offices, itSpecialist, loadedRevision, serviceHealth, ...offices.get('brain'), project: 'brain', snapshotText: () => '', vite: null, config: { projects: [], cec: CEC, holds: {} } };
    const url = new URL('http://127.0.0.1:4318/api/health');
    const health = async () => (await apiRoute(new Request(url), url, context))!.json();
    const stop = offices.githubCalls.bind(() => startServiceTicks(context));
    const token = 'synthetic-fence-token';
    try {
        expect(await health()).toMatchObject({ busy: false });
        await vi.advanceTimersByTimeAsync(10_000);
        expect(raw).toHaveBeenCalledTimes(1);
        expect(raw).toHaveBeenCalledWith('gh', ['api', 'rate_limit'], expect.any(Object));
        expect(offices.operations.count).toBe(1);
        offices.fence.acquire(token, 'fixture');
        expect(await health()).toMatchObject({ busy: true, fence: { status: 'held' } });
        finishSample();
        await vi.advanceTimersByTimeAsync(0);
        expect(await health()).toMatchObject({ busy: false, fence: { status: 'held' } });
        await vi.advanceTimersByTimeAsync(MINUTE);
        expect(raw).toHaveBeenCalledTimes(1);
    } finally { stop(); offices.fence.release(token); close(offices); }
});

/** `provider()` with the open-PR inventory served from `prs`; a continuation of `failing` kind fails after it spawned. */
function inventory(prs: () => GraphqlPR[], failing?: Kind) {
    const p = provider(), pulls = graphqlPulls(prs);
    const raw: Runner = async (program, args, options = {}) => {
        if (!isInventoryQuery(options)) return p.raw(program, args, options);
        p.calls.push({ call: args.join(' '), source: currentGitHubSource(), forwarded: true });
        options.onSpawn?.(4300 + p.calls.length);
        const body = pulls.respond(options.input!);
        if (pulls.calls.at(-1)!.kind === failing) { options.onOutput?.('stderr', 'gh: Something went wrong'); throw new CommandFailure('gh exited 1: gh: Something went wrong while executing your query.', 'other', true); }
        const out = included(body);
        options.onOutput?.('stdout', out);
        return out;
    };
    return { ...p, raw, pulls };
}
const prFamily = (office: Offices, source: string, project = 'brain') => office.githubCalls.report().projects.find(p => p.project === project)?.sources.find(s => s.source === source)?.families.find(f => f.family === 'monitor-pr-graphql');

test('health splits PR inventory root and child calls, failed continuations included, under the project and a pinned owner', async () => {
    // Ten plain PRs fill the first root page; the next one needs a review continuation and a run continuation, which fails.
    const prs = [...Array.from({ length: 10 }, (_, i) => generatedPR(60 - i)), generatedPR(30, { reviews: 11, suites: [51] })];
    const p = inventory(() => prs, 'runs'), office = new Offices(p.raw);
    try {
        const brain = office.get('brain');
        await office.githubCalls.bind(() => brain.engine.observe());
        expect(brain.store.state.github).toMatchObject({ status: 'blocked', error: expect.stringContaining('Something went wrong') });
        expect(p.pulls.calls.map(call => call.kind)).toEqual(['root', 'root', 'reviews', 'runs']);
        // Two root calls and one child succeeded; one child failed: four invocations, three pages, two children, one child page.
        expect(prFamily(office, 'monitor')).toMatchObject({ invocations: 4, pages: 3, failures: 1, prChildInvocations: 2, prChildPages: 1, points: 3, unknownCost: 1 });
        const monitor = families(office).monitor;
        for (const rest of ['pulls', 'pull', 'pull-reviews', 'check-runs', 'statuses']) expect(monitor[rest]).toBeUndefined();

        // The same refresh saved as IT's recovery: every call is IT's, under the same project, the split intact.
        const request = enqueueRequest(brain.store, 'refresh');
        brain.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'project-progress': { requestId: request.id, attempts: 1, nextAt: '', status: 'retrying', detail: 'saved error' } } };
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, brain.coordinator!, request));
        expect(prFamily(office, 'it')).toMatchObject({ invocations: 4, pages: 3, prChildInvocations: 2, prChildPages: 1 });
        expect(office.githubCalls.report().totals.invocations).toBe(p.calls.length);
    } finally { close(office); }
});

test('the head read by OID and both check continuations are PR children, under the project and under a pinned owner', async () => {
    // One PR whose root page lists no commit: its head is read by OID, its eleventh suite needs a suite page, and that suite's runs a run page.
    const prs = [{ ...generatedPR(30, { suites: [...Array(10).fill(1), 51] }), commit: null }];
    const p = inventory(() => prs), office = new Offices(p.raw);
    try {
        const brain = office.get('brain');
        await office.githubCalls.bind(() => brain.engine.observe());
        expect(brain.store.state.github).toMatchObject({ status: 'idle', error: '' });
        expect(brain.store.state.github!.prs[0].checks).toHaveLength(61);
        expect(p.pulls.calls.map(call => call.kind)).toEqual(['root', 'head', 'suites', 'runs']);
        expect(prFamily(office, 'monitor')).toMatchObject({ invocations: 4, pages: 4, prChildInvocations: 3, prChildPages: 3, points: 4, unknownCost: 0 });
        const request = enqueueRequest(brain.store, 'refresh');
        brain.store.state.it = { checkedAt: '', nextCheckAt: '', status: 'monitoring', reports: [], services: [], recoveries: { 'project-progress': { requestId: request.id, attempts: 1, nextAt: '', status: 'retrying', detail: 'saved error' } } };
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, brain.coordinator!, request));
        expect(prFamily(office, 'it')).toMatchObject({ invocations: 4, pages: 4, prChildInvocations: 3, prChildPages: 3 });
        expect(families(office).it).toMatchObject({ graphql: [1, 1] });
        expect(office.githubCalls.report().totals.invocations).toBe(p.calls.length);
    } finally { close(office); }
});

test('scheduled time and cost callbacks and their unowned reconciliation are counted under time and cost for the project; IT keeps its read-backs', async () => {
    const p = provider(), office = new Offices(p.raw);
    try {
        const brain = office.get('brain'), stores = new Map([['brain', brain.store]]), now = brain.store.clock.now();
        const time = () => brain.store.state.coordination!.time as any;
        brain.store.state.coordination!.time = { enabled: true, githubField: true, activatedAt: now.toISOString(), entries: [{ id: 'GH-1:2026-11-23', key: 'GH-1', date: '2026-11-23', status: 'pending', seconds: 60 }],
            baselines: {}, publications: [], scopePolicy: 'model-work-v1', cost: { githubField: true, entries: [{ key: 'GH-2', revision: 1, status: 'pending', updatedAt: '2026-01-01T00:00:00Z', microUsd: 1000 }], baselines: {} } } as any;
        const run = async (stage: string) => {
            const item = scheduledWork(brain, stores, now, 'operations').find(item => item.stage === stage);
            expect(item, stage).toBeDefined();
            await office.githubCalls.bind(() => item!.execute()).catch(() => undefined);
        };
        await run('time-publication');
        await run('cost-publication');
        const sources = () => Object.fromEntries(office.githubCalls.report().projects.find(p => p.project === 'brain')!.sources.map(s => [s.source, s.invocations]));
        expect(Object.keys(sources()).sort()).toEqual(['cost', 'time']);
        expect(office.githubCalls.report().projects.map(p => p.project)).toEqual(['brain']);

        // Queued reconciliation no scope owns is time or cost; one IT saved as its recovery stays IT's.
        const before = sources();
        const reconcileTime = enqueueRequest(brain.store, 'reconcile-time', 'GH-1');
        Object.assign(time().entries[0], { status: 'uncertain' });
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, brain.coordinator!, reconcileTime));
        expect(sources().time).toBeGreaterThan(before.time);
        Object.assign(time().cost.entries[0], { status: 'posting', intendedUsd: 0.01, effectId: 'cost:brain:GH-2:r1:a0', attempt: 0 });
        brain.store.putEffect({ id: 'cost:brain:GH-2:r1:a0', work: { projectId: 'brain', kind: 'reconciliation', id: 'cost:GH-2' }, status: 'uncertain', dispatchedAt: '2026-01-01T00:00:00Z', payload: { item: 'item', field: 'field', usd: 0.01 } } as any);
        const reconcileCost = enqueueRequest(brain.store, 'reconcile-cost', 'GH-2', 'abandon');
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, brain.coordinator!, reconcileCost));
        expect(sources().cost).toBeGreaterThan(before.cost);
        expect(Object.keys(sources()).sort()).toEqual(['cost', 'time']);

        // A time read-back run inside IT's pinned work is IT's, through the callback's own time scope.
        time().entries = [{ id: 'GH-1:2026-11-23', key: 'GH-1', date: '2026-11-23', status: 'uncertain', seconds: 60 }];
        time().publications = [{ id: 'attempt', provider: 'github', projectId: 'brain', key: 'GH-1', status: 'uncertain', itemId: 'i', fieldId: 'f', worklogId: '', baseline: 0, previousValue: 0, intendedValue: 0.0167, covered: [], payload: {}, createdAt: '2026-01-01T00:00:00Z', detail: '' }];
        const readback = scheduledWork(brain, stores, now, 'operations').find(item => item.stage === 'time-readback');
        expect(readback).toBeDefined();
        const calls = p.calls.length;
        await office.githubCalls.bind(() => withGitHubSource('it', () => readback!.execute(), { project: 'brain', pin: true })).catch(() => undefined);
        expect(p.calls.length).toBeGreaterThan(calls);
        expect(p.calls.slice(calls).every(call => call.source === 'it')).toBe(true);
        // One ledger entry per spawned process, whoever owned it.
        expect(office.githubCalls.report().totals.invocations).toBe(p.calls.length);
        expect(office.githubCalls.report().sources.find(s => s.source === 'other')).toBeUndefined();
    } finally { close(office); }
});
