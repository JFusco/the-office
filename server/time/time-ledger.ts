import { publishJiraTime } from './jira-time';
import type { Store } from '../store/store';
import { command } from '../workers/process';
const syncing = new WeakSet<Store>();
const FIELD = 'Time Spent (Hours)';
import { timeLedger } from './time-accounting';
import { publishableEntry } from './publishable';
import { boardItem, githubGraphql, numberField, numberValue, readNumber } from './board-number-field';
export { timeLedger, captureTime } from './time-accounting';
export class TimeLedger {
    constructor(private store: Store, private execute: typeof command = command) { }
    graphql(query: string, variables: Record<string, string | number>) { return githubGraphql(this.store, this.execute)(query, variables); }
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
        const entry = reconcileKey ? ledger.entries.find(e => e.key === reconcileKey && e.status === 'uncertain') : publishableEntry(ledger, this.store.project.provider);
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
            const graphql = (query: string, variables: Record<string, string | number>) => this.graphql(query, variables);
            const { projectId, fieldId } = await numberField(graphql, config.owner, config.number, FIELD), project = { id: projectId };
            const item = await boardItem(graphql, projectId, Number(entry.key.slice(3)), this.store.project.repository);
            const current = numberValue(item, fieldId);
            const baselines = ledger.baselines ??= {}, saved = baselines[entry.key];
            if (reconcileKey) {
                const publication = ledger.publications?.filter(publication => publication.key === entry.key && publication.status === 'uncertain').at(-1);
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
            if (await readNumber(graphql, item.id, fieldId) !== hours)
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
