import { CEC } from '../../office/config';
import { unpack } from '../jira-operations';
import type { command } from '../../workers/process';

export type Execute = typeof command;
export const BLOCKED = 'Blocked';
export interface LiveIssue { key: string; status: string; assignee: string; updated: string }

/** One TWG Jira work-item call on the configured site. */
export async function jira(execute: Execute, args: string[], readOnly: boolean) {
    return unpack(await execute('twg', ['jira', 'workitem', ...args, '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 }));
}

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
    let after = '';
    do {
        const result = await jira(execute, ['comment', 'query', '--issue-id', key, '--first', '100', ...(after ? ['--after', after] : [])], true);
        const page = result.comments || result;
        const nodes = page.nodes || page.edges?.map((edge: any) => edge.node);
        if (!Array.isArray(nodes) || typeof page.pageInfo?.hasNextPage !== 'boolean')
            throw new Error('Jira comment page was incomplete');
        const saved = nodes.find((comment: any) => comment.author?.accountId === CEC.account && JSON.stringify(comment.body ?? '').includes(marker));
        if (saved) return { id: String(saved.id) };
        if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after))
            throw new Error('Jira comment pagination did not advance');
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
    } while (after);
    return null;
}
