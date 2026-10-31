import { publishJiraTime } from './jira-time';
import type { Store } from '../store/store';
import { command } from '../workers/process';
const syncing = new WeakSet<Store>();
const FIELD = 'Time Spent (Hours)';
import { timeLedger } from './time-accounting';
export { timeLedger, captureTime } from './time-accounting';
export class TimeLedger {
    constructor(private store: Store, private execute: typeof command = command) { }
    async graphql(query: string, variables: Record<string, string | number>) {
        const result = JSON.parse(await this.execute('gh', ['api', 'graphql', '--input', '-'], { input: JSON.stringify({ query, variables }), cwd: this.store.project.repo, timeout: 60000, readOnly: !query.trimStart().startsWith('mutation') }));
        if (result.errors?.length)
            throw new Error(result.errors.map((e: any) => e.message).join('; '));
        return result.data;
    }
    async sync(reconcileKey?: string) {
        if (syncing.has(this.store))
            return;
        syncing.add(this.store);
        try {
            await this.publish(reconcileKey);
        }
        finally {
            syncing.delete(this.store);
        }
    }
    private async publish(reconcileKey?: string) {
        if (this.store.project.provider === 'azure') {
            await publishJiraTime(this.store, this.execute, reconcileKey);
            return;
        }
        const ledger = timeLedger(this.store);
        if (!ledger.enabled || !ledger.githubField || this.store.project.provider !== 'github')
            return;
        const entry = ledger.entries.find(e => reconcileKey ? e.key === reconcileKey && e.status === 'uncertain' : e.status === 'pending');
        if (!entry)
            return;
        const config = this.store.project.githubProject;
        if (!config) {
            entry.detail = 'No GitHub board configured.';
            this.store.save();
            return;
        }
        let attempted = false;
        this.store.save();
        try {
            const metadata = await this.graphql(`query($owner:String!,$number:Int!){user(login:$owner){projectV2(number:$number){id fields(first:100){nodes{... on ProjectV2Field{id name dataType}} pageInfo{hasNextPage}}}}}`, { owner: config.owner, number: config.number });
            const project = metadata.user?.projectV2;
            if (!project || project.fields.pageInfo.hasNextPage)
                throw new Error('Project field coverage is incomplete');
            const fields = project.fields.nodes.filter((f: any) => f?.name === FIELD);
            if (fields.length !== 1 || fields[0].dataType !== 'NUMBER')
                throw new Error(`Exactly one Number field named ${FIELD} is required`);
            const fieldId = fields[0].id;
            let after = '', item: any;
            do {
                const data = await this.graphql(`query($project:ID!,$after:String){node(id:$project){... on ProjectV2{items(first:100,after:$after){nodes{id content{... on Issue{number repository{nameWithOwner}}} fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id}}}} pageInfo{hasNextPage}}} pageInfo{hasNextPage endCursor}}}}}`, { project: project.id, ...(after ? { after } : {}) });
                const page = data.node.items;
                item = page.nodes.find((i: any) => i.content?.number === Number(entry.key.slice(3)) && i.content.repository.nameWithOwner === this.store.project.repository);
                if (item)
                    break;
                if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after))
                    throw new Error('Board pagination did not advance');
                after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
            } while (after);
            if (!item || item.fieldValues.pageInfo.hasNextPage)
                throw new Error('Issue is not on this board or field coverage is incomplete; no hours written');
            const current = item.fieldValues.nodes.find((n: any) => n.field?.id === fieldId)?.number ?? null;
            const baselines = ledger.baselines ??= {}, saved = baselines[entry.key];
            if (reconcileKey) {
                const publication = ledger.publications?.find(publication => publication.key === entry.key && publication.status === 'uncertain');
                if (!publication || publication.itemId !== item.id || publication.fieldId !== fieldId)
                    throw new Error('Frozen publication identity is missing; legacy uncertainty requires explicit reconciliation');
                if (current !== publication.intendedValue)
                    throw new Error('Board hours differ from the exact attempted value; old values and negative reads do not establish non-execution');
                if (saved)
                    saved.lastWritten = publication.intendedValue;
                publication.status = 'verified';
                entry.status = 'posted';
                entry.url = config.url;
                entry.detail = `Exact attempted board value ${publication.intendedValue}h verified by read-back; no write repeated.`;
                this.store.emit('time-reconciled', entry.detail, 'pm', entry.key);
                return;
            }
            if (saved && (saved.itemId !== item.id || current !== saved.lastWritten))
                throw new Error('Board hours changed outside the Office; reconcile before overwriting');
            const baseline = saved || { baseline: current ?? 0, lastWritten: current, itemId: item.id };
            if (!saved)
                baselines[entry.key] = baseline;
            const seconds = ledger.entries.filter(e => e.key === entry.key).reduce((n, e) => n + e.seconds, 0), hours = Number((baseline.baseline + seconds / 3600).toFixed(4));
            this.store.save();
            if (this.store.state.paused || !ledger.enabled || !ledger.githubField)
                throw new Error('Publishing settings changed before dispatch');
            const covered = ledger.entries.filter(e => e.key === entry.key).map(e => ({ id: e.id, revision: e.revision || 1, seconds: e.seconds }));
            const publication: import('../../src/shared').TimePublication = { id: crypto.randomUUID(), provider: 'github', projectId: this.store.project.id, key: entry.key, status: 'dispatching', itemId: item.id, fieldId, worklogId: '', baseline: baseline.baseline, previousValue: current, intendedValue: hours, covered, payload: { project: project.id, item: item.id, field: fieldId, hours }, createdAt: this.store.clock.now().toISOString(), detail: '' };
            (ledger.publications ??= []).push(publication);
            entry.status = 'posting';
            this.store.save();
            attempted = true;
            await this.graphql(`mutation($project:ID!,$item:ID!,$field:ID!,$hours:Float!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{number:$hours}}){projectV2Item{id}}}`, { project: project.id, item: item.id, field: fieldId, hours });
            const check = await this.graphql(`query($item:ID!){node(id:$item){... on ProjectV2Item{fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2Field{id}}}} pageInfo{hasNextPage}}}}}`, { item: item.id });
            if (check.node.fieldValues.pageInfo.hasNextPage || check.node.fieldValues.nodes.find((n: any) => n.field?.id === fieldId)?.number !== hours)
                throw new Error('Saved board hours could not be read back');
            publication.status = 'verified';
            baseline.lastWritten = hours;
            entry.status = 'posted';
            entry.url = config.url;
            entry.detail = `${seconds}s of measured Office work attributed to Joe; board total ${hours}h. Baseline ${baseline.baseline}h preserved.`;
            this.store.emit('time-posted', `${entry.key}: ${hours} hours verified on the project board.`, 'pm', entry.key);
        }
        catch (error) {
            if (attempted) {
                const publication = ledger.publications?.filter(p => p.key === entry.key).at(-1);
                if (publication)
                    publication.status = 'uncertain';
            }
            entry.status = 'uncertain';
            entry.detail = `Time sync needs read-back; no automatic retry: ${String(error)}`;
        }
        finally {
            this.store.save();
        }
    }
}
