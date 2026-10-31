import { afterEach, expect, test } from 'vitest';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import { publishJiraTime } from '../../../server/time/jira-time';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { CEC } from '../../../server/office/config';
const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
function setup() { const clock = { now: () => new Date('2026-10-30T14:00:00Z'), monotonic: () => 0 }, store = new Store(':memory:', projectById('cec'), undefined, clock); stores.push(store); store.state.coordination = coordination(); store.state.coordination.time = { enabled: true, githubField: false, activatedAt: '2026-10-29T00:00:00Z', jiraActivatedAt: '2026-10-29T13:00:00Z', jiraConnection: `twg:${CEC.site}`, entries: [{ id: 'CEC-999:2026-10-29', revision: 1, key: 'CEC-999', date: '2026-10-29', seconds: 30, sourceIds: ['work'], status: 'pending', detail: '', url: '' }], publications: [] }; confirmed(store, 30); return store; }
function confirmed(store: Store, seconds: number, start = '2026-10-29T13:00:00Z') {
    const end = new Date(Date.parse(start) + seconds * 1000).toISOString();
    store.state.workLog = [{ id: 'work', role: 'developer', task: 'Measured fixture', ticket: 'CEC-999', stage: 'implement', requestId: 'run', sessionId: 'native', provider: 'fixture', model: 'fixture', effort: 'fixture', status: 'completed', startedAt: start, lastHeartbeatAt: end, endedAt: end, elapsedMs: seconds * 1000, queuedMs: 0, inputTokens: null, outputTokens: null, durationUncertain: false, reportedAt: end, segments: [{ startedAt: start, endedAt: end, durationMs: seconds * 1000 }] }];
}
test('Jira creates one identified worklog then updates the same ID, with exact seconds and preserved estimates', async () => {
    const store = setup();
    let log: any = null, creates = 0, updates = 0;
    const execute: any = async (_program: string, args: string[]) => {
        const get = (flag: string) => args[args.indexOf(flag) + 1];
        let data: any;
        if (args[0] === 'whoami')
            data = { accountId: CEC.account };
        else if (args[3] === 'query')
            data = { nodes: log ? [log] : [], pageInfo: { hasNextPage: false } };
        else if (args[3] === 'get')
            data = log;
        else {
            expect(get('--adjust-estimate')).toBe('leave');
            expect(get('--time-spent-seconds')).toBe(updates ? '40' : creates ? '40' : '30');
            if (args[3] === 'add')
                creates++;
            else {
                updates++;
                expect(get('--id')).toBe('10');
            }
            log = { id: '10', author: { accountId: CEC.account }, started: get('--started'), timeSpentSeconds: Number(get('--time-spent-seconds')), comment: { type: 'doc', version: 1, content: [{ type: 'paragraph', content: [{ type: 'text', text: get('--comment') }] }] }, properties: JSON.parse(get('--properties-json')) };
            data = log;
        }
        return JSON.stringify({ data });
    };
    await publishJiraTime(store, execute);
    const entry = store.state.coordination!.time!.entries[0];
    expect(entry).toMatchObject({ status: 'posted', worklogId: '10' });
    confirmed(store, 40);
    await publishJiraTime(store, execute);
    expect([creates, updates]).toEqual([1, 1]);
    log.timeSpentSeconds = 500;
    confirmed(store, 50);
    await publishJiraTime(store, execute);
    expect(entry.status).toBe('uncertain');
    expect([creates, updates]).toEqual([1, 1]);
});
test('QA comment uncertainty blocks and cannot be reposted', async () => {
    const store = setup(), ticket: any = { key: 'CEC-999', commit: 'a'.repeat(40), runId: 'run' }, result: any = { outcome: 'passed', summary: 'Independent check result', commit: ticket.commit, evidence: [], findings: [], receipts: [] };
    let writes = 0;
    const execute: any = async (_program: string, args: string[]) => {
        if (args.includes('get'))
            return JSON.stringify({ data: { key: ticket.key, assignee: { accountId: CEC.account } } });
        writes++;
        throw new Error('transport lost after dispatch');
    };
    const adapter = new JiraOperations(store, execute);
    await expect(adapter.qaComment(ticket, 'qa', 'attempt', result)).rejects.toThrow();
    await expect(adapter.qaComment(ticket, 'qa', 'attempt', result)).rejects.toThrow('read-back');
    expect(writes).toBe(1);
    expect(store.getEffect('qa-comment:attempt')?.status).toBe('uncertain');
    expect(result.receipts).toEqual([]);
});
test('prospective publication recaptures intervals crossing activation and excludes earlier effort', async () => {
    const store = setup();
    confirmed(store, 120, '2026-10-29T12:59:00Z');
    let log: any, submitted = 0;
    const execute: any = async (_program: string, args: string[]) => {
        const value = (flag: string) => args[args.indexOf(flag) + 1];
        let data: any;
        if (args[0] === 'whoami')
            data = { accountId: CEC.account };
        else if (args[3] === 'query')
            data = { nodes: log ? [log] : [], pageInfo: { hasNextPage: false } };
        else if (args[3] === 'get')
            data = log;
        else {
            submitted = Number(value('--time-spent-seconds'));
            log = { id: '11', author: { accountId: CEC.account }, started: value('--started'), timeSpentSeconds: submitted, comment: value('--comment'), properties: JSON.parse(value('--properties-json')) };
            data = log;
        }
        return JSON.stringify({ data });
    };
    await publishJiraTime(store, execute);
    expect(submitted).toBe(60);
    expect(store.state.workLog![0].elapsedMs).toBe(120000);
    const earlier = setup();
    confirmed(earlier, 30, '2026-10-29T12:00:00Z');
    let calls = 0;
    await publishJiraTime(earlier, (async () => { calls++; throw Error('must not call provider'); }) as any);
    expect(calls).toBe(0);
    expect(earlier.state.coordination!.time!.entries[0].status).toBe('excluded');
});
test('QA comment readback accepts canonical ADF paragraphs without trailing blank lines', async () => {
    const store = setup(), ticket: any = { key: 'CEC-999', commit: 'a'.repeat(40), runId: 'run' }, result: any = { outcome: 'blocked', summary: 'Evidence missing', blocker: 'Screenshot is absent', commit: ticket.commit, evidence: [], findings: [], receipts: [] };
    let saved: any;
    const execute: any = async (_program: string, args: string[]) => {
        let data: any;
        if (args.includes('get'))
            data = { key: ticket.key, assignee: { accountId: CEC.account } };
        else if (args.includes('create')) {
            const text = args[args.indexOf('--body') + 1];
            expect(text).toBe(text.trimEnd());
            expect(text).toContain('blocked:');
            expect(text).toContain(result.blocker);
            saved = { id: '20', author: { accountId: CEC.account }, body: { type: 'doc', content: text.split('\n').map(line => ({ type: 'paragraph', content: [{ type: 'text', text: line }] })) } };
            data = saved;
        }
        else
            data = { nodes: [saved], pageInfo: { hasNextPage: false } };
        return JSON.stringify({ data });
    };
    await new JiraOperations(store, execute).qaComment(ticket, 'qa', 'canonical', result);
    expect(result.receipts[0].verified).toBe(true);
});
