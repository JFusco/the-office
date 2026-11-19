import { afterEach, expect, test } from 'vitest';
import { Engine } from '../../../server/scheduling/engine';
import { JiraOperations } from '../../../server/cec/jira-operations';
import { PROJECT_BINDINGS } from '../../../server/office/projects';
import { cecStore } from './parking/fixtures';

const registry = PROJECT_BINDINGS as Map<string, NonNullable<ReturnType<typeof PROJECT_BINDINGS.get>>>;
const bindings = registry.get('cec')!, original = bindings.jira;
afterEach(() => { registry.set('cec', bindings); });

/** The CEC office with its intake source set to the project list, and a Jira that holds these tickets. */
function office(issues: any[], fail = '') {
    const jira = original, listUrl = `${jira.site}/jira/software/c/projects/${jira.projectKey}/list?jql=${encodeURIComponent(`project = ${jira.projectKey} AND assignee = ${jira.account} ORDER BY cf[10011] ASC`)}`;
    registry.set('cec', { ...bindings, jira: { ...jira, intakeListUrl: listUrl } });
    const { store } = cecStore();
    store.state.tickets = []; store.state.paused = false;
    const engine = new Engine(store);
    let models = 0;
    engine.agents.intake = async () => { models++; throw new Error('the model must not run'); };
    engine.jira = new JiraOperations(store, (async (_program: string, args: string[]) => {
        if (fail) throw new Error(fail);
        const after = Number(/key > "[A-Z]+-(\d+)"/.exec(args[args.indexOf('--jql') + 1])?.[1] || 0);
        return JSON.stringify({ data: { issues: issues.filter(issue => Number(issue.key.split('-')[1]) > after) } });
    }) as any);
    return { store, engine, models: () => models, jira };
}
const issue = (jira: typeof original, number: number) => ({ key: `${jira.projectKey}-${number}`, summary: `Ticket ${number}`, updated: '', status: jira.statuses.intake[0], issuetype: { name: 'Story', subtask: false }, assignee: { accountId: jira.account } });

test('in list mode the mailbox is filled from the harness\'s own read and no model runs', async () => {
    const a = office([issue(original, 901), issue(original, 902)]);
    await a.engine.checkMail();
    expect(a.models()).toBe(0);
    expect(a.store.state.intake).toMatchObject({ status: 'idle', error: '' });
    expect(a.store.state.tickets.map(ticket => ticket.key)).toEqual([`${a.jira.projectKey}-901`, `${a.jira.projectKey}-902`]);
    expect(a.store.state.events.some(event => event.kind === 'mail-delivered' && event.message.includes('2 eligible tickets delivered'))).toBe(true);
});

test('a list read that fails blocks the mailbox with its reason and delivers nothing', async () => {
    const a = office([issue(original, 901)], 'twg exited 1: not authenticated');
    await a.engine.checkMail();
    expect(a.models()).toBe(0);
    expect(a.store.state.intake).toMatchObject({ status: 'blocked' });
    expect(a.store.state.intake.error).toContain('not authenticated');
    expect(a.store.state.tickets).toEqual([]);
});
