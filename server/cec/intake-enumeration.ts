import { jira, type Execute } from './parking/jira-transport';
import { projectListScope } from './intake-scope';
import type { JiraBinding } from '../office/project-bindings-config';
import type { Ticket } from '../../src/shared';

const PAGE = 100, MAX_PAGES = 20;
type Intake = Pick<Ticket, 'key' | 'summary' | 'type' | 'status' | 'statusId' | 'assignee' | 'subtask' | 'boardMember' | 'url' | 'updated'>;
const text = (value: unknown) => typeof value === 'string' ? value : '';

/**
 * Every eligible parent ticket in the configured project list, read by the harness itself. Null when the
 * intake source is the board, which the harness does not enumerate.
 *
 * TWG marks a further page with a cursor and marks the last page with nothing at all, so the end of a
 * read cannot be told from a marker. The list is read in key order instead, each page asking for keys
 * after the last one, until a page comes back empty: an explicit end. A page whose keys repeat, fail to
 * advance, or belong to another project, or an item assigned to someone else, means the read is not the
 * list that was asked for, and the whole read is refused.
 */
export async function enumerateIntakeList(execute: Execute, binding: JiraBinding): Promise<Intake[] | null> {
    const list = projectListScope(binding);
    if (!list) return null;
    const statuses = binding.statuses.intake.map(status => JSON.stringify(status.name)).join(', ');
    const scope = `${list.jql} AND status IN (${statuses}) AND issuetype NOT IN subTaskIssueTypes()`;
    const tickets: Intake[] = [];
    let last = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
        const jql = `${scope}${last ? ` AND key > "${binding.projectKey}-${last}"` : ''} ORDER BY key ASC`;
        const issues = (await jira(execute, binding, ['query', '--jql', jql, '--fields', 'summary,status,issuetype,assignee,updated', '--first', String(PAGE)], true))?.issues;
        if (!Array.isArray(issues) || issues.length > PAGE) throw new Error('Jira intake list page was incomplete');
        if (!issues.length) return tickets;
        for (const issue of issues) {
            const match = new RegExp(`^${binding.projectKey}-([1-9][0-9]*)$`).exec(text(issue?.key)), number = Number(match?.[1]);
            if (!match || number <= last) throw new Error('Jira intake list did not advance in key order');
            const status = issue.status, type = issue.issuetype, assignee = text(issue.assignee?.accountId);
            if (assignee !== binding.account || !text(status?.name) || !text(status?.id) || !text(type?.name) || typeof type.subtask !== 'boolean' || !text(issue.summary))
                throw new Error(`Jira intake list returned ${issue.key} without the fields that decide eligibility, or assigned to someone else`);
            last = number;
            tickets.push({ key: issue.key, summary: issue.summary, type: type.name, status: status.name, statusId: status.id, assignee, subtask: type.subtask,
                boardMember: true, url: `${binding.site}/browse/${issue.key}`, updated: text(issue.updated) });
        }
    }
    throw new Error('Jira intake list exceeded the bounded read');
}
