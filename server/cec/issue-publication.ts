import { FeatureError } from '../features/progression/failure';
import { z } from 'zod';
import type { FeatureManifest, FeatureManifestItem, FeatureOperation } from '../../src/contracts/features';
import type { EffectIntent } from '../../src/shared';
import type { Store } from '../store/store';
import { CEC } from '../office/config';
import { command } from '../workers/process';
import { unpack } from '../cec/jira-operations';
import type { FeaturePublisher, PublicationReceipt } from '../features/publication';

const Content = z.object({ space: z.literal('CEC'), type: z.string().min(1), summary: z.string().min(1), description: z.string().min(1), labels: z.array(z.string().regex(/^[a-zA-Z0-9_-]+$/)) }).strict();
const Assignment = z.object({ assignee: z.string().min(1) }).strict();
const Transition = z.object({ id: z.string().min(1), status: z.string().min(1) }).strict();
const keyOf = (key: string) => { if (!/^CEC-[1-9][0-9]*$/.test(key)) throw new Error('Invalid CEC ticket identity'); return key; };
export const jiraText = (value: any): string => typeof value === 'string' ? value : value?.type === 'text' ? value.text : value?.type === 'hardBreak' ? '\n' : Array.isArray(value?.content) ? value.content.map(jiraText).join(value.type === 'doc' ? '\n' : '') : '';
function plainDescription(value: any): boolean {
    return value == null || typeof value === 'string' || typeof value === 'object' && ['doc', 'paragraph', 'text', 'hardBreak'].includes(value.type) &&
        (!value.marks || Array.isArray(value.marks) && value.marks.length === 0) && (!value.content || Array.isArray(value.content) && value.content.every(plainDescription));
}
export class JiraIssuePublisher implements FeaturePublisher {
    constructor(private store: Store, private provenance: { id: string; sourceTicket?: string; marker(itemId: string): string }, private execute: typeof command = command) {}
    private async call(args: string[], readOnly = true) { return unpack(await this.execute('twg', ['jira', ...args, '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { readOnly, timeout: 60000 })); }
    private async issue(key: string) { const raw = await this.call(['workitem', 'get', keyOf(key)]); return raw.workItem || raw.issue || raw; }
    private receipt(raw: any): PublicationReceipt { return { key: keyOf(raw.key), url: raw.url || CEC.site + '/browse/' + raw.key }; }
    private content(raw: any) { const fields = raw.fields || raw; return { summary: fields.summary, description: jiraText(fields.description), labels: [...(fields.labels || [])].sort() }; }
    private async boardFilter() {
        const raw = await this.call(['board', 'scope', 'query', '--id', String(CEC.board), '--project', 'CEC']);
        const board = raw.boards?.[0] || raw.board || raw;
        const id = board.filter?.id || board.configuration?.filter?.id;
        if (!id || !/^\d+$/.test(String(id))) throw new Error('Board filter metadata is unavailable; approval requires verified membership rules');
        return String(id);
    }
    private async query(jql: string) {
        const data = await this.call(['workitem', 'query', '--jql', jql, '--first', '100', '--fields', 'summary,description,labels,assignee,status']);
        if (!Array.isArray(data.issues)) throw new Error('Jira query coverage is unavailable');
        if (data.pageInfo?.hasNextPage || data.hasNextPage || data.total > data.issues.length || data.issues.length >= 100) throw new Error('Jira query is incomplete; narrow the reconciliation');
        return data.issues;
    }
    private async types() {
        const values = await this.call(['workitem', 'types', 'query', '--project', 'CEC', '--level', '0']);
        if (!Array.isArray(values) || !values.length) throw new Error('CEC issue type metadata is unavailable');
        return values.filter(t => t.hierarchyLevel === 0 && t.subtask === false);
    }
    private async metadata(type: string) {
        if (!(await this.types()).some(t => t.name === type)) throw new FeatureError('unsupported', 'CEC issue type is not a verified base issue type');
        const metadata = await this.call(['workitem', 'field', 'create-metadata', '--space', 'CEC', '--type', type]);
        if (!Array.isArray(metadata.fields)) throw new Error('CEC required-field metadata is unavailable');
        const missing = metadata.fields.filter((field: any) => field.required && !['summary', 'description', 'project', 'issuetype', 'labels'].includes(field.id));
        if (missing.length) throw new FeatureError('unsupported', 'Unsupported required CEC fields: ' + missing.map((field: any) => field.id + ' (' + field.name + ')').join(', '));
        return metadata;
    }
    async closed(key: string): Promise<boolean> { const issue = await this.issue(key); return issue.key === key && (issue.fields || issue).status?.statusCategory?.key === 'done'; }
    async openItems(): Promise<{ key: string; text: string; url: string }[]> {
        return (await this.query('project = CEC AND statusCategory != Done')).map((issue: any) => ({ key: issue.key, text: JSON.stringify(this.content(issue)), url: this.receipt(issue).url }));
    }
    async context() {
        const types = await this.types(), preferred = types.find(t => t.name === 'Build Task') || types[0];
        if (!preferred) throw new FeatureError('unsupported', 'No supported CEC base issue type');
        const metadata = await this.metadata(preferred.name);
        const filter = await this.boardFilter(), existing = this.provenance.sourceTicket ? await this.issue(this.provenance.sourceTicket) : null;
        return JSON.stringify({ provider: 'azure', destination: this.store.project.repository, featureId: this.provenance.id, assignee: CEC.account, boardFilter: filter, types, recommendedType: preferred.name, metadata, existing,
            contract: 'Manifest items use stable id,title,key(empty for create),action,predecessor,criteria,operations. create/update payload is {space:"CEC",type:verified issue type name,summary,description,labels:[]}; include the displayed provenance line office-feature-FEATURE_ID-item-ITEM_ID in description and that exact marker as a label. update.expected is observed {summary,description,labels}. assign payload is {assignee:verified Office account}. transition payload {id,status} may only use discovered transitions, with expected {status:observed source status}. Do not invent workflow IDs or required metadata. New tickets retain initial status; their default assignment is guarded until identity is mapped. Every operation has id,kind,payload,expected.' });
    }
    async validate(manifest: FeatureManifest) {
        if (manifest.provider !== 'azure' || manifest.destination !== this.store.project.repository) throw new FeatureError('invalid-content', 'Wrong CEC publication destination');
        await this.boardFilter();
        for (const item of manifest.items) {
            const content = item.operations.find(o => ['create', 'update'].includes(o.kind)), marker = this.provenance.marker(item.id);
            if (!content || !Content.parse(content.payload).description.includes(marker) || !Content.parse(content.payload).labels.includes(marker)) throw new FeatureError('invalid-content', 'CEC preview needs its stable provenance text and label');
            const assignment = item.operations.filter(o => o.kind === 'assign').at(-1);
            if (!assignment || Assignment.parse(assignment.payload).assignee !== CEC.account) throw new FeatureError('invalid-content', 'CEC preview must assign the verified Office account');
            for (const operation of item.operations) await this.preflight(item, operation, item.key);
        }
    }
    async preflight(_item: FeatureManifestItem, operation: FeatureOperation, key: string) {
        if (operation.kind === 'create') await this.metadata(Content.parse(operation.payload).type);
        else if (operation.kind === 'update') {
            const payload = Content.parse(operation.payload);
            await this.metadata(payload.type);
            const current = await this.issue(key), fields = current.fields || current;
            if (!plainDescription(fields.description)) throw new FeatureError('unsupported', 'Rich Jira content requires a lossless update adapter');
            if ((fields.labels || []).some((label: string) => !payload.labels.includes(label))) throw new FeatureError('invalid-content', 'CEC update must preserve existing labels');
            if (JSON.stringify(this.content(current)) !== JSON.stringify(operation.expected)) throw new Error('CEC ticket content changed since approval preview');
        } else if (operation.kind === 'assign') {
            if (Assignment.parse(operation.payload).assignee !== CEC.account) throw new FeatureError('invalid-content', 'Wrong CEC assignee');
        } else if (operation.kind === 'transition') {
            const p = Transition.parse(operation.payload), current = await this.issue(key);
            if ((current.fields || current).status?.name !== operation.expected.status) throw new Error('CEC status changed since preview');
            const data = await this.call(['workitem', 'transition', '--id', keyOf(key)]);
            const transition = data.transitions?.find((t: any) => String(t.id) === p.id && (t.to?.name || t.status?.name) === p.status);
            if (!transition || transition.requirements?.some((r: any) => r.required)) throw new FeatureError('unsupported', 'Transition or required fields need a new product decision');
        } else throw new FeatureError('unsupported', 'Unsupported CEC publication operation');
    }
    async dispatch(_item: FeatureManifestItem, operation: FeatureOperation, key: string, _marker: string): Promise<PublicationReceipt> {
        let args: string[];
        if (operation.kind === 'create' || operation.kind === 'update') {
            const p = Content.parse(operation.payload);
            args = ['workitem', operation.kind, ...(operation.kind === 'create' ? ['--space', p.space, '--type', p.type] : ['--id', keyOf(key)]), '--summary', p.summary, '--description', p.description, '--description-format', 'plain', '--labels', p.labels.join(',')];
        } else if (operation.kind === 'assign') args = ['workitem', 'update', '--id', keyOf(key), '--assignee', Assignment.parse(operation.payload).assignee];
        else args = ['workitem', 'transition', '--id', keyOf(key), '--transition-id', Transition.parse(operation.payload).id];
        const raw = await this.call(args, false), record = raw.workItem || raw.issue || raw;
        return this.receipt(record.key ? record : await this.issue(key));
    }
    async verify(receipt: PublicationReceipt, operation: FeatureOperation) {
        const raw = await this.issue(receipt.key), fields = raw.fields || raw;
        if (operation.kind === 'create' || operation.kind === 'update') {
            const p = Content.parse(operation.payload);
            const matches = JSON.stringify(this.content(raw)) === JSON.stringify({ summary: p.summary, description: p.description, labels: [...p.labels].sort() });
            if (matches) receipt.requirementPostimage = {target: CEC.site + '/browse/' + receipt.key, content: {summary: fields.summary, description: fields.description ?? null, labels: [...(fields.labels || [])].sort()}};
            return matches;
        }
        if (operation.kind === 'assign') return fields.assignee?.accountId === Assignment.parse(operation.payload).assignee &&
            (await this.query('filter = ' + await this.boardFilter() + ' AND key = "' + keyOf(receipt.key) + '"')).length === 1;
        return fields.status?.name === Transition.parse(operation.payload).status;
    }
    async verifyFinal(item: FeatureManifestItem, receipt: PublicationReceipt) {
        const content = item.operations.filter(o => ['create', 'update'].includes(o.kind)).at(-1)!;
        const assignment = item.operations.find(o => o.kind === 'assign')!;
        const raw = await this.issue(receipt.key), fields = raw.fields || raw;
        const status = fields.status, type = fields.issuetype || fields.issueType || raw.issueType;
        return await this.verify(receipt, content) && await this.verify(receipt, assignment) &&
            !raw.subtask && !type?.subtask && type?.name === Content.parse(content.payload).type &&
            ((status?.name === 'Open' && String(status.id) === '1') || (status?.name === 'To Do' && String(status.id) === '10000'));
    }
    async readBack(intent: Readonly<EffectIntent>) {
        const p = intent.payload as { operation: FeatureOperation; key: string; marker: string };
        let key = p.key;
        if (p.operation.kind === 'create') {
            if (!/^[a-zA-Z0-9_-]+$/.test(p.marker)) throw new Error('Invalid marker');
            const matches = await this.query('project = CEC AND labels = "' + p.marker + '"');
            if (matches.length !== 1) return { verified: false, receipt: { key: '', url: '' } };
            key = matches[0].key;
        }
        const receipt = this.receipt(await this.issue(key));
        return { verified: await this.verify(receipt, p.operation), receipt };
    }
}
