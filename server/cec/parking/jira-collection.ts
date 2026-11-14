import { jiraResponse, type Execute } from './jira-transport';

/** A bounded, complete native collection read. Missing or repeated cursors never mean an empty page. */
export async function jiraCollection(execute: Execute, args: string[], collection: string): Promise<any[]> {
    let after = '';
    const seen = new Set<string>(), records: any[] = [];
    for (let count = 0; count < 10; count++) {
        const response = await jiraResponse(execute, [...args, '--first', '100', ...(after ? ['--after', after] : [])], true);
        const page = response.data[collection] || response.data;
        const nodes = Array.isArray(page) ? page : page.nodes || page.edges?.map((edge: any) => edge.node);
        const info = page.pageInfo || response.pageInfo;
        if (!Array.isArray(nodes) || typeof info?.hasNextPage !== 'boolean') throw new Error('Jira collection page was incomplete');
        records.push(...nodes);
        if (!info.hasNextPage) return records;
        const next = info.endCursor || info.nextCursor;
        if (typeof next !== 'string' || !next || seen.has(next)) throw new Error('Jira collection pagination did not advance');
        seen.add(next);
        after = next;
    }
    throw new Error('Jira collection exceeded the bounded read');
}

