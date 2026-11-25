import { afterEach, expect, test, vi } from 'vitest';
import { currentGitHubSource, type Runner } from '../../../server/github/call-scope';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import { Offices } from '../../../server/scheduling/offices';
import { enqueueRequest, executeRequest } from '../../../server/scheduling/requests';
import type { OfficeSnapshot } from '../../../src/shared';

const T0 = Date.parse('2026-11-24T12:00:00.000Z'), MINUTE = 60_000;
const board = JSON.stringify({ data: { user: { projectV2: { title: 'Board', url: 'https://github.com/users/JFusco/projects/8', shortDescription: '', readme: '', fields: { nodes: [{ name: 'Status', options: [{ name: 'Ready' }] }], pageInfo: { hasNextPage: false } }, items: { nodes: [], pageInfo: { hasNextPage: false, endCursor: null } } } } } });
const issue = (number: number) => ({ number, title: `Issue ${number}`, state: 'open', html_url: `https://github.com/JFusco/brain/issues/${number}`, updated_at: '2026-11-24T11:00:00Z' });
const hosts = JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'success', login: 'fixture' }] } });
afterEach(() => { vi.useRealTimers(); });
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
        expect(brain.store.state.pipelines?.items.map(item => item.name)).toEqual(['CI']);

        // The GitHub login probe through the Office runner: opaque, labelled health, its output forwarded to the check.
        const health = await new ServiceHealthChecks(base as any, office.githubCalls.run).report([snapshot]);
        expect(health.services.find(s => s.id === 'github')).toMatchObject({ status: 'connected', identity: 'fixture' });
        expect(p.calls.find(c => c.call.startsWith('auth status'))).toMatchObject({ source: 'health', forwarded: true });
        expect(office.githubCalls.report().sources.find(s => s.source === 'health')).toMatchObject({ invocations: 1, opaque: 1, unknown: 1, attempts: 0, families: [{ family: 'gh-auth' }] });
        expect(office.githubCalls.report()).toMatchObject({ serviceInstanceId: office.serviceInstanceId, totals: { invocations: 9 }, window: { complete: false, coveredMinutes: 0 } });

        // An hour later every count has expired, and the hour is fully covered.
        vi.setSystemTime(T0 + 61 * MINUTE);
        expect(office.githubCalls.report()).toMatchObject({ sources: [], totals: { invocations: 0 }, window: { complete: true, coveredMinutes: 60 } });
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

        // An ordinary refresh keeps the labels of the work it runs; its workflows' runs are already known.
        const next = enqueueRequest(brain.store, 'refresh');
        await office.githubCalls.bind(() => executeRequest(brain.store, brain.engine, coordinator, next));
        expect(office.githubCalls.report().sources.map(s => [s.source, s.invocations])).toEqual([['it', made], ['monitor', 4], ['pipelines', 1]]);
    } finally { close(office); }
});
