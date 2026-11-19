import { expect, test } from 'vitest';
import { enumerateIntakeList } from '../../../server/cec/intake-enumeration';
import { projectById } from '../../../server/office/projects';
import { jiraBinding } from '../../../server/office/project-bindings';

const base = jiraBinding(projectById('cec'));
const listUrl = `${base.site}/jira/software/c/projects/${base.projectKey}/list?jql=${encodeURIComponent(`project = ${base.projectKey} AND assignee = ${base.account} ORDER BY cf[10011] ASC`)}`;
const binding = { ...base, intakeListUrl: listUrl };
const issue = (number: number, extra: Record<string, unknown> = {}) => ({ key: `${base.projectKey}-${number}`, summary: `Ticket ${number}`, updated: '2026-11-19T10:00:00.000-0500',
    status: { name: 'To Do', id: '10000' }, issuetype: { name: 'Story', subtask: false }, assignee: { accountId: base.account }, ...extra });
/** A Jira that answers each query from its tickets, in key order, one page at a time. */
function jiraWith(issues: any[], page = 2) {
    const calls: string[] = [];
    const execute: any = async (program: string, args: string[], options: any) => {
        expect([program, args.slice(0, 3), options.readOnly]).toEqual(['twg', ['jira', 'workitem', 'query'], true]);
        const jql = args[args.indexOf('--jql') + 1]; calls.push(jql);
        const after = Number(/key > "[A-Z]+-(\d+)"/.exec(jql)?.[1] || 0);
        const rest = issues.filter(item => Number(String(item.key).split('-')[1]) > after);
        // The last page carries no pageInfo at all, as TWG 1.4.4 returns it.
        return JSON.stringify({ apiVersion: 'v2', data: { issues: rest.slice(0, page) }, ...(rest.length > page ? { pageInfo: { hasNextPage: true, nextCursor: 'cursor' } } : {}) });
    };
    return { execute, calls };
}

test('the list is read in key order until a page comes back empty, and every ticket is returned once', async () => {
    const jira = jiraWith([issue(10), issue(13), issue(58), issue(135), issue(179)]);
    const tickets = await enumerateIntakeList(jira.execute, binding);
    expect(tickets!.map(ticket => ticket.key)).toEqual(['CEC-10', 'CEC-13', 'CEC-58', 'CEC-135', 'CEC-179'].map(key => key.replace('CEC', base.projectKey)));
    expect(tickets![0]).toEqual({ key: `${base.projectKey}-10`, summary: 'Ticket 10', type: 'Story', status: 'To Do', statusId: '10000', assignee: base.account, subtask: false, boardMember: true,
        url: `${base.site}/browse/${base.projectKey}-10`, updated: '2026-11-19T10:00:00.000-0500' });
    // Three pages of tickets and the empty one that ends the read.
    expect(jira.calls).toHaveLength(4);
    expect(jira.calls[0]).toBe(`project = ${base.projectKey} AND assignee = "${base.account}" AND status IN (${base.statuses.intake.map(status => JSON.stringify(status.name)).join(', ')}) AND issuetype NOT IN subTaskIssueTypes() ORDER BY key ASC`);
    expect(jira.calls[1]).toContain(`AND key > "${base.projectKey}-13" ORDER BY key ASC`);
    expect(jira.calls[3]).toContain(`AND key > "${base.projectKey}-179" ORDER BY key ASC`);
});

test('an empty list is a complete read, and a board is not enumerated by the harness', async () => {
    const empty = jiraWith([]);
    expect(await enumerateIntakeList(empty.execute, binding)).toEqual([]);
    expect(empty.calls).toHaveLength(1);
    const board = jiraWith([issue(1)]);
    expect(await enumerateIntakeList(board.execute, { ...base, intakeListUrl: undefined })).toBeNull();
    expect(board.calls).toEqual([]);
});

test('a read that is not the list that was asked for is refused whole', async () => {
    const answer = (issues: unknown) => (async () => JSON.stringify({ data: { issues } })) as any;
    for (const [name, issues, message] of [
        ['a page that is not a list', undefined, 'incomplete'],
        ['more items than the page size', Array.from({ length: 101 }, (_, index) => issue(index + 1)), 'incomplete'],
        ['a key from another project', [{ ...issue(5), key: 'OTHER-5' }], 'advance'],
        ['a repeated key', [issue(5), issue(5)], 'advance'],
        ['keys out of order', [issue(9), issue(5)], 'advance'],
        ['a ticket assigned to someone else', [issue(5, { assignee: { accountId: 'someone-else' } })], 'assigned to someone else'],
        ['a ticket with no status id', [issue(5, { status: { name: 'To Do' } })], 'fields that decide eligibility'],
        ['a ticket with no type flag', [issue(5, { issuetype: { name: 'Story' } })], 'fields that decide eligibility'],
    ] as const) await expect(enumerateIntakeList(answer(issues), binding), name).rejects.toThrow(message);
    // A Jira that never runs out is stopped by the bound.
    let next = 0;
    const endless: any = async () => JSON.stringify({ data: { issues: [issue(++next)] } });
    await expect(enumerateIntakeList(endless, binding)).rejects.toThrow('bounded');
    // A failed command is the read's failure, not an empty list.
    await expect(enumerateIntakeList((async () => { throw new Error('twg exited 1'); }) as any, binding)).rejects.toThrow('twg exited 1');
});
