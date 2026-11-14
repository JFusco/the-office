import { expect, test } from 'vitest';
import { jiraCollection } from '../../../../server/cec/parking/jira-collection';
import { findComment } from '../../../../server/cec/parking/jira-issue';
import { CEC } from '../../../../server/office/config';

test('finds a later-page marker through native v2 data and top-level nextCursor', async () => {
    const calls: string[][] = [];
    const execute: any = async (_program: string, args: string[], options: any) => {
        calls.push(args); expect(options.readOnly).toBe(true);
        return JSON.stringify(args.includes('--after') ? { data: [{ id: '2', author: { accountId: CEC.account }, body: 'Office decision abc' }], pageInfo: { hasNextPage: false } }
            : { data: [{ id: '1', author: { accountId: 'other' }, body: 'Office decision abc' }], pageInfo: { hasNextPage: true, nextCursor: 'cursor-2' } });
    };
    expect(await findComment(execute, 'CEC-900', 'Office decision abc')).toEqual({ id: '2' });
    expect(calls[1]).toEqual(expect.arrayContaining(['--after', 'cursor-2']));
});

test('supports retained legacy edges and refuses missing, cyclic or unbounded pagination', async () => {
    const legacy: any = async () => JSON.stringify({ data: { changelog: { edges: [{ node: { id: 'old' } }], pageInfo: { hasNextPage: false } } } });
    expect(await jiraCollection(legacy, ['changelog', 'query'], 'changelog')).toEqual([{ id: 'old' }]);
    for (const info of [undefined, { hasNextPage: true }, { hasNextPage: true, nextCursor: 'same' }]) {
        const bad: any = async () => JSON.stringify({ data: [], pageInfo: info });
        await expect(jiraCollection(bad, ['comment', 'query'], 'comments')).rejects.toThrow(/incomplete|advance/);
    }
    let n = 0;
    const endless: any = async () => JSON.stringify({ data: [], pageInfo: { hasNextPage: true, nextCursor: String(++n) } });
    await expect(jiraCollection(endless, ['comment', 'query'], 'comments')).rejects.toThrow('bounded');
    expect(n).toBe(10);
});
