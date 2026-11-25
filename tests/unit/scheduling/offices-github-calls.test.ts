import { afterEach, expect, test, vi } from 'vitest';
import { currentGitHubSource, type Runner } from '../../../server/github/call-scope';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { startServiceTicks } from '../../../server/office/service-ticks';
import { apiRoute } from '../../../server/office/http/api-routes';
import { CEC } from '../../../server/office/config';
import { ITSpecialist } from '../../../server/it/it-specialist';
import { Offices } from '../../../server/scheduling/offices';
import { enqueueRequest, executeRequest } from '../../../server/scheduling/requests';
import type { OfficeSnapshot } from '../../../src/shared';

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
        const out = args[0] === 'auth' ? hosts : args[1] === 'graphql' ? board
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
            monitor: { issues: [1, 2], pulls: [1, 1], 'actions-runs': [1, 1], graphql: [1, 1] },
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
