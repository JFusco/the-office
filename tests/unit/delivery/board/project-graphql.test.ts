import { expect, test } from 'vitest';
import { metadataParkFixture } from '../../../fixtures/metadata-park';
import { projectCards } from '../../../../server/delivery/board/project-graphql';

const page = (nodes: unknown[], pageInfo: Record<string, unknown>) =>
    JSON.stringify({ data: { node: { items: { nodes, pageInfo } } } });

test('item inventory requires an explicit pagination flag before a park can write', async () => {
    const f = metadataParkFixture();
    const issue = { id: 'issue-card', content: { __typename: 'Issue', number: 5, repository: { nameWithOwner: f.store.project.repository } } };
    f.hooks.respond = call => call.request?.query.includes('items(first:100') ? page([issue], {}) : undefined;
    await expect(f.parkNow()).rejects.toThrow('Project items are unavailable or incomplete');
    expect(f.job.parked).toBeUndefined();
    expect(f.writes).toEqual({ posts: [], moves: [] });
});

test('item inventory follows advancing cursors and rejects a repeated cursor', async () => {
    const f = metadataParkFixture();
    const card = (id: string, kind: string, number: number) => ({ id, content: { __typename: kind, number, repository: { nameWithOwner: f.store.project.repository } } });
    const cursors: unknown[] = [];
    let repeat = false;
    f.hooks.respond = ({ request }) => {
        if (!request?.query.includes('items(first:100')) return;
        const after = request.variables.after;
        cursors.push(after);
        return !after ? page([card('issue-card', 'Issue', 5)], { hasNextPage: true, endCursor: 'next' })
            : page([card('pr-card', 'PullRequest', 200)], repeat ? { hasNextPage: true, endCursor: 'next' } : { hasNextPage: false });
    };
    const wanted = [{ kind: 'Issue', number: 5 }, { kind: 'PullRequest', number: 200 }] as const;
    const read = () => projectCards(f.store, f.delivery.execute, 'project', [...wanted]);
    expect(await read()).toEqual(wanted.map((item, index) => ({ ...item, id: index ? 'pr-card' : 'issue-card' })));
    expect(cursors).toEqual([undefined, 'next']);
    repeat = true;
    await expect(read()).rejects.toThrow('pagination did not advance');
});
