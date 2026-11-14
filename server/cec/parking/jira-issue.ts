import { jiraCollection } from './jira-collection';
import { CEC } from '../../office/config';
import { jira, type Execute } from './jira-transport';
export { jira, type Execute } from './jira-transport';

export const BLOCKED = 'Blocked';
export interface LiveIssue { key: string; status: string; assignee: string; updated: string }

/** Live status, assignee and update time for one or more issues in a single read. */
export async function readIssues(execute: Execute, keys: string[]): Promise<LiveIssue[]> {
    if (!keys.length) return [];
    const data = await jira(execute, ['get', ...keys], true);
    const issues: any[] = Array.isArray(data) ? data : Array.isArray(data.items) ? data.items : [data];
    return issues.map(issue => ({ key: String(issue.key || ''), status: String(issue.status?.name || ''), assignee: String(issue.assignee?.accountId || ''), updated: String(issue.updated || '') }));
}

export async function readIssue(execute: Execute, key: string): Promise<LiveIssue> {
    const issue = (await readIssues(execute, [key])).find(item => item.key === key);
    if (!issue) throw new Error(`Jira did not return ${key}`);
    return issue;
}

/** The Office account's comment carrying `marker`, read across every page; null only after a complete read. */
export async function findComment(execute: Execute, key: string, marker: string): Promise<{ id: string } | null> {
    const nodes = await jiraCollection(execute, ['comment', 'query', '--issue-id', key], 'comments');
    const saved = nodes.find(comment => comment.id && comment.author?.accountId === CEC.account && JSON.stringify(comment.body ?? '').includes(marker));
    return saved ? { id: String(saved.id) } : null;
}
