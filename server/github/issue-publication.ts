import { FeatureError } from '../features/progression/failure';
import { z } from 'zod';
import type { FeatureManifest, FeatureManifestItem, FeatureOperation } from '../../src/contracts/features';
import type { EffectIntent } from '../../src/shared';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { cardStatus, projectCards, projectGraphql, setCardStatus, statusField } from '../delivery/board/project-graphql';
import type { FeaturePublisher, PublicationReceipt } from '../features/publication';

const Content = z.object({ title: z.string().min(1), body: z.string().min(1), labels: z.array(z.string()), assignees: z.array(z.string()) }).strict();
const Assign = z.object({ assignees: z.array(z.string()).min(1) }).strict();
const Board = z.object({ action: z.enum(['add', 'status']), projectId: z.string().min(1), fieldId: z.string().min(1), optionId: z.string(), name: z.string() }).strict();
const number = (key: string) => { if (!/^GH-[1-9][0-9]*$/.test(key)) throw new Error('Invalid GitHub feature ticket'); return key.slice(3); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export class GitHubIssuePublisher implements FeaturePublisher {
    constructor(private store: Store, private provenance: { id: string; sourceTicket?: string; marker(itemId: string): string }, private execute: typeof command = command) {}
    private async api(path: string, method = 'GET', body?: unknown) {
        return JSON.parse(await this.execute('gh', ['api', path, '--method', method, ...(body ? ['--input', '-'] : [])], { input: body ? JSON.stringify(body) : undefined, readOnly: method === 'GET', timeout: 60000, cwd: this.store.project.repo }));
    }
    private async issue(key: string) { return this.api('repos/' + this.store.project.repository + '/issues/' + number(key)); }
    private content(raw: any) { return { title: raw.title, body: raw.body || '', labels: raw.labels.map((l: any) => l.name).sort(), assignees: raw.assignees.map((a: any) => a.login).sort() }; }
    private receipt(raw: any): PublicationReceipt { return { key: 'GH-' + raw.number, url: raw.html_url }; }
    async closed(key: string): Promise<boolean> { const issue = await this.issue(key); return issue.number === Number(number(key)) && issue.state === 'closed'; }
    async openItems(): Promise<{ key: string; text: string; url: string }[]> {
        const pages = JSON.parse(await this.execute('gh', ['api', 'repos/' + this.store.project.repository + '/issues?state=open&per_page=100', '--paginate', '--slurp'], { readOnly: true, timeout: 60000 }));
        if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page))) throw new Error('Incomplete GitHub duplicate coverage');
        return pages.flat().map((issue: any) => ({ key: 'GH-' + issue.number, text: String(issue.title) + '\n' + String(issue.body), url: issue.html_url }));
    }
    async context() {
        const user = await this.api('user'), field = this.store.project.githubProject ? await statusField(this.store, this.execute) : null;
        const existing = this.provenance.sourceTicket ? this.content(await this.issue(this.provenance.sourceTicket)) : null;
        return JSON.stringify({ provider: 'github', destination: this.store.project.repository, featureId: this.provenance.id, assignee: 'JFusco', pickupStatus: this.store.state.coordination?.pickup?.status || 'Ready', board: field, existing,
            contract: 'Each item has a stable id, title, key (empty for create), action, predecessor id (empty for first), criteria, operations. create/update payload: {title,body,labels:[],assignees:[]}; create uses empty assignees. body must include office-feature-FEATURE_ID-item-ITEM_ID as a visible provenance line. update expected is the exact observed {title,body,labels,assignees}. assign payload: {assignees:[the verified account]}. For configured board add two board operations with payload {action:add|status,projectId,fieldId,optionId,name}; add uses empty optionId/name, status uses the verified pickupStatus option. Every operation has a stable id, kind, payload, expected object. Preserve IDs from prior mappings. Only these operations are supported.' });
    }
    async validate(manifest: FeatureManifest) {
        if (manifest.provider !== 'github' || manifest.destination !== this.store.project.repository) throw new FeatureError('invalid-content', 'Wrong publication destination');
        const repository = await this.api('repos/' + this.store.project.repository);
        if (!repository.permissions?.push) throw new FeatureError('unsupported', 'GitHub publication permission is unavailable');
        for (const item of manifest.items) {
            const content = item.operations.find(o => ['create', 'update'].includes(o.kind));
            if (!content || !Content.parse(content.payload).body.includes(this.provenance.marker(item.id))) throw new FeatureError('invalid-content', 'Ticket content needs its displayed stable provenance marker');
            const original = item.operations.find(o => o.kind === 'update')?.expected;
            const proposed = Content.parse(content.payload);
            if (original && ((original.labels as string[] || []).some(label => !proposed.labels.includes(label)))) throw new FeatureError('invalid-content', 'Preserve unrelated existing issue labels');
            const assignment = item.operations.filter(o => o.kind === 'assign').at(-1);
            if (!assignment || !Assign.parse(assignment.payload).assignees.includes('JFusco')) throw new FeatureError('invalid-content', 'Feature delivery requires the verified Office GitHub assignee');
            if (original && (original.assignees as string[] || []).some(assignee => !Assign.parse(assignment.payload).assignees.includes(assignee))) throw new FeatureError('invalid-content', 'Preserve existing issue assignees');
            if (this.store.project.githubProject) {
                const board = item.operations.filter(o => o.kind === 'board').at(-1);
                if (!board || Board.parse(board.payload).action !== 'status' || Board.parse(board.payload).name !== (this.store.state.coordination?.pickup?.status || 'Ready')) throw new FeatureError('invalid-content', 'Feature preview must include the final Ready board lane');
            }
            for (const operation of item.operations) await this.preflight(item, operation, item.key);
        }
    }
    async preflight(_item: FeatureManifestItem, op: FeatureOperation, key: string) {
        if (op.kind === 'create') {
            const content = Content.parse(op.payload);
            for (const label of content.labels) await this.api('repos/' + this.store.project.repository + '/labels/' + encodeURIComponent(label));
            if (content.assignees.length) throw new FeatureError('invalid-content', 'Create must be unassigned until identity is reserved');
        } else if (op.kind === 'update') {
            Content.parse(op.payload);
            if (!key || !same(this.content(await this.issue(key)), Content.parse(op.expected))) throw new Error('Existing issue changed since the preview');
        } else if (op.kind === 'assign') Assign.parse(op.payload);
        else if (op.kind === 'board') {
            const payload = Board.parse(op.payload), field = await statusField(this.store, this.execute);
            if (payload.projectId !== field.projectId || payload.fieldId !== field.fieldId || payload.action === 'status' && !field.options.some(o => o.id === payload.optionId && o.name === payload.name)) throw new Error('Board metadata changed since the preview');
        } else throw new FeatureError('unsupported', 'Unsupported GitHub publication operation');
    }
    async dispatch(_item: FeatureManifestItem, op: FeatureOperation, key: string, _marker: string): Promise<PublicationReceipt> {
        const endpoint = 'repos/' + this.store.project.repository + '/issues';
        if (op.kind === 'create') return this.receipt(await this.api(endpoint, 'POST', Content.parse(op.payload)));
        if (op.kind === 'update' || op.kind === 'assign') return this.receipt(await this.api(endpoint + '/' + number(key), 'PATCH', op.kind === 'update' ? Content.parse(op.payload) : Assign.parse(op.payload)));
        const payload = Board.parse(op.payload), issue = await this.issue(key);
        if (payload.action === 'add') await projectGraphql(this.store, this.execute, 'mutation($project:ID!,$content:ID!){addProjectV2ItemById(input:{projectId:$project,contentId:$content}){item{id}}}', { project: payload.projectId, content: issue.node_id }, false);
        else {
            const cards = await projectCards(this.store, this.execute, payload.projectId, [{ kind: 'Issue', number: Number(number(key)) }]);
            if (cards.length !== 1) throw new Error('A unique mapped board card is required');
            await setCardStatus(this.store, this.execute, payload.projectId, cards[0].id, payload.fieldId, payload.optionId);
        }
        return this.receipt(issue);
    }
    async verify(receipt: PublicationReceipt, op: FeatureOperation) {
        const issue = await this.issue(receipt.key);
        if (issue.html_url !== receipt.url || issue.pull_request || issue.state !== 'open') return false;
        if (op.kind === 'create' || op.kind === 'update') {
            const expected = Content.parse(op.payload), actual = this.content(issue);
            const matches = actual.title === expected.title && actual.body === expected.body && same(actual.labels, [...expected.labels].sort()) && same(actual.assignees, [...expected.assignees].sort());
            if (matches) receipt.requirementPostimage = {target: this.store.project.repository + '#' + number(receipt.key), content: {summary: issue.title, description: issue.body || '', labels: actual.labels}};
            return matches;
        }
        if (op.kind === 'assign') return same(this.content(issue).assignees, [...Assign.parse(op.payload).assignees].sort());
        const payload = Board.parse(op.payload), cards = await projectCards(this.store, this.execute, payload.projectId, [{ kind: 'Issue', number: Number(number(receipt.key)) }]);
        return cards.length === 1 && (payload.action === 'add' || await cardStatus(this.store, this.execute, cards[0].id, payload.fieldId) === payload.optionId);
    }
    async verifyFinal(item: FeatureManifestItem, receipt: PublicationReceipt) {
        const content = item.operations.filter(o => ['create', 'update'].includes(o.kind)).at(-1)!;
        const assignment = item.operations.find(o => o.kind === 'assign')!;
        const finalContent = { ...content, payload: { ...content.payload, ...assignment.payload } };
        const board = item.operations.filter(o => o.kind === 'board').at(-1);
        return await this.verify(receipt, finalContent) && (!board || await this.verify(receipt, board));
    }
    async readBack(intent: Readonly<EffectIntent>) {
        const payload = intent.payload as { operation: FeatureOperation; key: string; marker: string };
        let key = payload.key;
        if (payload.operation.kind === 'create') {
            const pages = JSON.parse(await this.execute('gh', ['api', 'repos/' + this.store.project.repository + '/issues?state=all&per_page=100', '--paginate', '--slurp'], { readOnly: true, timeout: 60000 }));
            const matches = pages.flat().filter((i: any) => !i.pull_request && String(i.body).includes(payload.marker));
            if (matches.length !== 1) return { verified: false, receipt: { key: '', url: '' } };
            key = 'GH-' + matches[0].number;
        }
        const receipt = this.receipt(await this.issue(key));
        return { verified: await this.verify(receipt, payload.operation), receipt };
    }
}
