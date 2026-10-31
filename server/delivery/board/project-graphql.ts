import { command } from '../../process';
import type { Store } from '../../store';

export type Execute = typeof command;

export async function projectGraphql(store: Store, execute: Execute, query: string, variables: Record<string, string | number>, readOnly = true): Promise<any> {
    const result = JSON.parse(await execute('gh', ['api', 'graphql', '--input', '-'], { input: JSON.stringify({ query, variables }), cwd: store.project.repo, timeout: 60000, readOnly }));
    if (result.errors?.length)
        throw new Error(result.errors.map((e: any) => e.message).join('; '));
    return result.data;
}

export interface StatusField { projectId: string; fieldId: string; options: { id: string; name: string }[] }

export async function statusField(store: Store, execute: Execute): Promise<StatusField> {
    const config = store.project.githubProject!;
    const data = await projectGraphql(store, execute, `query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id fields(first:100){nodes{... on ProjectV2SingleSelectField{id name options{id name}}} pageInfo{hasNextPage}}}}}`, { owner: config.owner, number: config.number });
    const project = data.user?.projectV2, fields = project?.fields.nodes.filter((f: any) => f?.name === 'Status');
    if (!project?.id || project.fields.pageInfo.hasNextPage || fields?.length !== 1)
        throw new Error('Project Status metadata is incomplete');
    return { projectId: project.id, fieldId: fields[0].id, options: fields[0].options };
}

export interface ProjectCard { id: string; kind: 'Issue' | 'PullRequest'; number: number }

/** Complete pagination; only cards for this repository's issue and PR numbers are returned. */
export async function projectCards(store: Store, execute: Execute, projectId: string, wanted: { kind: ProjectCard['kind']; number: number }[]): Promise<ProjectCard[]> {
    const found: ProjectCard[] = [], seen = new Set<string>();
    let after = '';
    do {
        const page = (await projectGraphql(store, execute, `query($project:ID!,$after:String){node(id:$project){... on ProjectV2{items(first:100,after:$after){nodes{id content{__typename ... on Issue{number repository{nameWithOwner}} ... on PullRequest{number repository{nameWithOwner}}}} pageInfo{hasNextPage endCursor}}}}}`, { project: projectId, ...(after ? { after } : {}) })).node?.items;
        if (!page?.nodes)
            throw new Error('Project items are unavailable');
        for (const item of page.nodes) {
            const content = item.content;
            if (content?.repository?.nameWithOwner !== store.project.repository) continue;
            if (wanted.some(w => w.kind === content.__typename && w.number === content.number))
                found.push({ id: item.id, kind: content.__typename, number: content.number });
        }
        if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || seen.has(page.pageInfo.endCursor)))
            throw new Error('Project item pagination did not advance');
        after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
        seen.add(after);
    } while (after);
    return found;
}

export async function cardStatus(store: Store, execute: Execute, item: string, field: string): Promise<string | undefined> {
    const data = await projectGraphql(store, execute, `query($item:ID!){node(id:$item){... on ProjectV2Item{id fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{optionId field{... on ProjectV2SingleSelectField{id}}}} pageInfo{hasNextPage}}}}}`, { item });
    if (data.node?.id !== item || data.node.fieldValues.pageInfo.hasNextPage)
        throw new Error('Board status read-back coverage is incomplete');
    return data.node.fieldValues.nodes.find((n: any) => n.field?.id === field)?.optionId;
}

export async function setCardStatus(store: Store, execute: Execute, projectId: string, item: string, field: string, option: string): Promise<void> {
    await projectGraphql(store, execute, `mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}`, { project: projectId, item, field, option }, false);
}
