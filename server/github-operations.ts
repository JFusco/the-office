import type { Store } from './store';
import { Effects } from './effects';
import { command } from './process';
/** Fixed repository operations; no arbitrary command or endpoint is exposed. */
export class GitHubOperations {
    constructor(private store: Store, private execute: typeof command = command) { }
    private async api(path: string, method = 'GET', body?: unknown): Promise<any> {
        return JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/${path}`, '--method', method, ...(body ? ['--input', '-'] : [])], { cwd: this.store.project.repo, input: body ? JSON.stringify(body) : undefined, timeout: 60000, readOnly: method === 'GET' }));
    }
    async issue(number: number): Promise<any> {
        this.number(number);
        const issue = await this.api(`issues/${number}`);
        if (issue.number !== number || issue.pull_request || issue.html_url !== `https://github.com/${this.store.project.repository}/issues/${number}`)
            throw new Error('GitHub issue identity mismatch');
        return issue;
    }
    async comments(number: number): Promise<any[]> {
        this.number(number);
        const pages = JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/issues/${number}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: this.store.project.repo, timeout: 60000, readOnly: true }));
        if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page)))
            throw new Error('GitHub comment coverage is incomplete');
        return pages.flat();
    }
    private number(value: number) {
        if (!Number.isSafeInteger(value) || value <= 0)
            throw new Error('Positive issue number required');
    }
    async comment(number: number, runId: string, text: string, preflight: () => Promise<void>): Promise<any> {
        const id = `native-closeout-comment:${number}:${runId}`;
        const effects = new Effects(this.store), previous = this.store.getEffect(id);
        if (previous)
            text = (previous.payload as {
                text: string;
            }).text;
        if (previous && ['uncertain', 'dispatching'].includes(previous.status)) {
            if (!await effects.reconcile(id, async (intent) => { const matches = (await this.comments(number)).filter(comment => comment.body === text && Date.parse(comment.created_at) >= Date.parse(intent.createdAt) - 2000); return { verified: matches.length === 1, receipt: matches[0] || null }; }))
                throw new Error('Original closeout comment remains uncertain; no resend');
        }
        return effects.execute({ id, work: { projectId: this.store.project.id, kind: 'issue', id: String(number) }, attemptId: runId, operation: 'github-native-closeout-comment', target: `GH-${number}`, authorization: 'verified-native-refresh', payload: { text }, expectedState: { runId }, preflight,
            dispatch: async (value) => this.api(`issues/${number}/comments`, 'POST', { body: value.text }), verify: async (receipt) => {
                if (!receipt.id)
                    return false;
                const saved = await this.api(`issues/comments/${receipt.id}`);
                return saved.body === text && saved.html_url === receipt.html_url;
            } });
    }
    async closeIssue(number: number, runId: string, preflight: () => Promise<void>): Promise<void> {
        const effects = new Effects(this.store), id = `native-closeout-state:${number}:${runId}`;
        const intent = this.store.getEffect(id);
        if (intent && ['uncertain', 'dispatching'].includes(intent.status)) {
            if (!await effects.reconcile(id, async () => { const saved = await this.issue(number); return { verified: saved.state === 'closed', receipt: saved }; }))
                throw new Error('Original issue closure remains uncertain');
        }
        await effects.execute({ id, work: { projectId: this.store.project.id, kind: 'issue', id: String(number) }, attemptId: runId, operation: 'github-native-closeout-state', target: `GH-${number}`, authorization: 'verified-native-refresh', payload: { state: 'closed', state_reason: 'completed' }, expectedState: { runId }, preflight, dispatch: async (payload) => this.api(`issues/${number}`, 'PATCH', payload), verify: async () => (await this.issue(number)).state === 'closed' });
    }
    async done(number: number, runId: string, preflight: () => Promise<void>): Promise<void> {
        const config = this.store.project.githubProject;
        if (!config)
            throw new Error('No configured GitHub board');
        const graph = async (query: string, variables: Record<string, unknown>, write = false) => {
            const result = JSON.parse(await this.execute('gh', ['api', 'graphql', '--input', '-'], { input: JSON.stringify({ query, variables }), cwd: this.store.project.repo, timeout: 60000, readOnly: !write }));
            if (result.errors?.length)
                throw new Error('GitHub board operation did not succeed');
            return result.data;
        };
        const data = await graph('query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id fields(first:100){nodes{... on ProjectV2SingleSelectField{id name options{id name}}} pageInfo{hasNextPage}}}}}', { owner: config.owner, number: config.number });
        const project = data.user?.projectV2, fields = project?.fields.nodes.filter((field: any) => field?.name === 'Status');
        if (!project || project.fields.pageInfo.hasNextPage || fields.length !== 1)
            throw new Error('Board Status field coverage is incomplete');
        const field = fields[0], options = field.options.filter((option: any) => option.name === 'Done');
        if (options.length !== 1)
            throw new Error('Actual Done lane is unavailable');
        let after = '', item: any;
        do {
            const page = (await graph('query($project:ID!,$after:String){node(id:$project){... on ProjectV2{items(first:100,after:$after){nodes{id content{... on Issue{number repository{nameWithOwner}}}} pageInfo{hasNextPage endCursor}}}}}', { project: project.id, after: after || null })).node.items;
            item = page.nodes.find((item: any) => item.content?.number === number && item.content.repository?.nameWithOwner === this.store.project.repository);
            if (item)
                break;
            if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after))
                throw new Error('Board pagination did not advance');
            after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
        } while (after);
        if (!item)
            throw new Error('No existing issue card on the configured board');
        const read = async () => {
            const node = (await graph('query($id:ID!){node(id:$id){... on ProjectV2Item{fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{optionId field{... on ProjectV2SingleSelectField{id}}}} pageInfo{hasNextPage}}}}}', { id: item.id })).node;
            if (!node || node.fieldValues.pageInfo.hasNextPage)
                throw new Error('Board field read-back is incomplete');
            return node.fieldValues.nodes.find((value: any) => value.field?.id === field.id)?.optionId;
        };
        const id = `native-closeout-board:${number}:${runId}`, effects = new Effects(this.store), previous = this.store.getEffect(id);
        if (previous && ['dispatching', 'uncertain'].includes(previous.status) && !await effects.reconcile(id, async () => ({ verified: await read() === options[0].id, receipt: { itemId: item.id } })))
            throw new Error('Previous Done transition remains uncertain');
        await effects.execute({ id, work: { projectId: this.store.project.id, kind: 'issue', id: String(number) }, attemptId: runId, operation: 'github-native-closeout-board', target: config.url, authorization: 'verified-native-refresh', payload: { project: project.id, item: item.id, field: field.id, option: options[0].id }, expectedState: { runId }, preflight: async () => {
                await preflight();
                const current = await read();
                if (!field.options.some((option: any) => option.id === current && ['Ready', 'In progress', 'In review', 'Done'].includes(option.name)))
                    throw new Error('Board lane was deferred or is unclassified');
            }, dispatch: async (variables) => graph('mutation($project:ID!,$item:ID!,$field:ID!,$option:String!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{singleSelectOptionId:$option}}){projectV2Item{id}}}', variables, true), verify: async () => await read() === options[0].id });
    }
}
