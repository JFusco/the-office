import type { Store } from '../store/store';
import type { command } from '../workers/process';

/**
 * Read-side helpers for a GitHub Projects (v2) Number field, shared by the hours and cost ledgers.
 * Each ledger keeps its own single fixed mutation. Every read fails closed on incomplete coverage.
 */
export type Graphql = (query: string, variables: Record<string, string | number>) => Promise<any>;

export function githubGraphql(store: Store, execute: typeof command): Graphql {
    return async (query, variables) => {
        const result = JSON.parse(await execute('gh', ['api', 'graphql', '--input', '-'], { input: JSON.stringify({ query, variables }), cwd: store.project.repo, timeout: 60000, readOnly: !query.trimStart().startsWith('mutation') }));
        if (result.errors?.length)
            throw new Error(result.errors.map((e: any) => e.message).join('; '));
        return result.data;
    };
}

/** The project and exactly one Number field with this name. */
export async function numberField(graphql: Graphql, owner: string, number: number, name: string): Promise<{ projectId: string; fieldId: string }> {
    const metadata = await graphql(`query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id fields(first:100){nodes{... on ProjectV2Field{id name dataType}} pageInfo{hasNextPage}}}}}`, { owner, number });
    const project = metadata.user?.projectV2;
    if (!project || project.fields.pageInfo.hasNextPage)
        throw new Error('Project field coverage is incomplete');
    const fields = project.fields.nodes.filter((f: any) => f?.name === name);
    if (fields.length !== 1 || fields[0].dataType !== 'NUMBER')
        throw new Error(`Exactly one Number field named ${name} is required`);
    return { projectId: project.id, fieldId: fields[0].id };
}

/** The board item for an issue, paging until found; its field values must be fully covered. */
export async function boardItem(graphql: Graphql, projectId: string, issueNumber: number, repository: string): Promise<{ id: string; fieldValues: { nodes: any[] } }> {
    let after = '', item: any;
    do {
        const data = await graphql(`query($project:ID!,$after:String){node(id:$project){... on ProjectV2{items(first:100,after:$after){nodes{id content{... on Issue{number repository{nameWithOwner}}} fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id}}}} pageInfo{hasNextPage}}} pageInfo{hasNextPage endCursor}}}}}`, { project: projectId, ...(after ? { after } : {}) });
        const page = data.node.items;
        item = page.nodes.find((i: any) => i.content?.number === issueNumber && i.content.repository.nameWithOwner === repository);
        if (item)
            break;
        if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after))
            throw new Error('Board pagination did not advance');
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
    } while (after);
    if (!item || item.fieldValues.pageInfo.hasNextPage)
        throw new Error('Issue is not on this board or field coverage is incomplete; nothing written');
    return item;
}

export function numberValue(item: { fieldValues: { nodes: any[] } }, fieldId: string): number | null {
    return item.fieldValues.nodes.find((n: any) => n.field?.id === fieldId)?.number ?? null;
}

/** Independent read of one item's Number field value. */
export async function readNumber(graphql: Graphql, itemId: string, fieldId: string): Promise<number | null> {
    const check = await graphql(`query($item:ID!){node(id:$item){... on ProjectV2Item{fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id}}}} pageInfo{hasNextPage}}}}}`, { item: itemId });
    if (!check.node || check.node.fieldValues.pageInfo.hasNextPage)
        throw new Error('Board field read-back coverage is incomplete');
    return numberValue(check.node, fieldId);
}
