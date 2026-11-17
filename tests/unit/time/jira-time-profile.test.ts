import { afterEach, expect, test, vi } from 'vitest';
import { Store } from '../../../server/store/store';
import { PROJECT_BINDINGS, projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { publishJiraTime } from '../../../server/time/jira-time';
import type { ProjectBindings } from '../../../server/office/project-bindings-config';

const stores: Store[] = [];
const registry = PROJECT_BINDINGS as Map<string, ProjectBindings>, original = registry.get('cec')!;
afterEach(() => { registry.set('cec', original); stores.splice(0).forEach(store => store.close()); vi.restoreAllMocks(); });

/** One pending Jira entry whose measured work is confirmed, as the worklog publication tests set it up. */
function setup() {
    const clock = { now: () => new Date('2026-10-30T14:00:00Z'), monotonic: () => 0 }, store = new Store(':memory:', projectById('cec'), undefined, clock);
    stores.push(store);
    const site = original.jira.site, start = '2026-10-29T13:00:00Z', end = '2026-10-29T13:00:30.000Z';
    store.state.coordination = coordination();
    store.state.coordination.time = { enabled: true, githubField: false, activatedAt: '2026-10-29T00:00:00Z', jiraActivatedAt: '2026-10-29T13:00:00Z', jiraConnection: `twg:${site}`, entries: [{ id: 'CEC-999:2026-10-29', revision: 1, key: 'CEC-999', date: '2026-10-29', seconds: 30, sourceIds: ['work'], status: 'pending', detail: '', url: '' }], publications: [] } as never;
    store.state.workLog = [{ id: 'work', role: 'developer', task: 'Measured fixture', ticket: 'CEC-999', stage: 'implement', requestId: 'run', sessionId: 'native', provider: 'fixture', model: 'fixture', effort: 'fixture', status: 'completed', startedAt: start, lastHeartbeatAt: end, endedAt: end, elapsedMs: 30000, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: end, segments: [{ startedAt: start, endedAt: end, durationMs: 30000 }] }] as never;
    return store;
}

/** Records every TWG argv and answers like Jira for one new worklog. */
function jira() {
    const calls: string[][] = [];
    let log: any = null;
    const execute: any = async (_program: string, args: string[]) => {
        calls.push(args);
        const get = (flag: string) => args[args.indexOf(flag) + 1];
        let data: any;
        if (args[0] === 'whoami') data = { accountId: original.jira.account };
        else if (args[3] === 'query') data = { nodes: log ? [log] : [], pageInfo: { hasNextPage: false } };
        else if (args[3] === 'get') data = log;
        else {
            log = { id: '10', author: { accountId: original.jira.account }, started: get('--started'), timeSpentSeconds: Number(get('--time-spent-seconds')), comment: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: get('--comment') }] }] }, properties: JSON.parse(get('--properties-json')) };
            data = log;
        }
        return JSON.stringify({ data });
    };
    return { calls, execute };
}
const tail = (site: string) => ['--site', site, '-o', 'json', '--output-summary', 'none'];

test('without a TWG profile the identity read and worklog calls are exactly as before', async () => {
    const store = setup(), { calls, execute } = jira();
    await publishJiraTime(store, execute);
    expect(store.state.coordination!.time!.entries[0].status).toBe('posted');
    expect(calls[0]).toEqual(['whoami', '-o', 'json', '--output-summary', 'none']);
    const worklogs = calls.filter(args => args[2] === 'worklog');
    expect(worklogs.length).toBeGreaterThan(1);
    for (const args of worklogs) {
        expect(args.slice(-6)).toEqual(tail(original.jira.site));
        expect(args).not.toContain('--profile');
    }
});

test('a configured TWG profile reaches the identity read and every worklog call', async () => {
    registry.set('cec', { ...original, jira: { ...original.jira, twgProfile: 'cec-office' } });
    const store = setup(), { calls, execute } = jira();
    await publishJiraTime(store, execute);
    expect(store.state.coordination!.time!.entries[0].status).toBe('posted');
    expect(calls[0]).toEqual(['whoami', '--profile', 'cec-office', '-o', 'json', '--output-summary', 'none']);
    const worklogs = calls.filter(args => args[2] === 'worklog');
    expect(worklogs.length).toBeGreaterThan(1);
    for (const args of worklogs) expect(args.slice(-8)).toEqual(['--site', original.jira.site, '--profile', 'cec-office', '-o', 'json', '--output-summary', 'none']);
    // The persisted connection string is unchanged by a profile.
    expect(store.state.coordination!.time!.jiraConnection).toBe(`twg:${original.jira.site}`);
});
