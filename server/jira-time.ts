import type { TimeEntry, TimePublication } from '../src/shared';
import type { Store } from './store';
import { command } from './process';
import { CEC } from './config';
import { captureTime } from './time-accounting';
import { easternDay, easternInstant } from './clock';
const label = 'Office agent effort';
const propertyKey = 'officeEntryId';
const locks = new Set<string>();
const data = (raw: string): any => {
    const result = JSON.parse(raw);
    if (result.error || result.ok === false)
        throw new Error('Jira worklog transport did not confirm success');
    return result.data;
};
const localId = (value: string) => value.split('/').at(-1)!;
/** One selected TWG connection, complete pagination and property read-back. */
export class JiraWorklogs {
    constructor(private execute: typeof command, public connection = `twg:${CEC.site}`) {
        if (connection !== `twg:${CEC.site}`)
            throw new Error('Unverified Jira worklog connection');
    }
    private async call(action: string, args: string[], write = false): Promise<any> {
        return data(await this.execute('twg', ['jira', 'workitem', 'worklog', action, ...args, '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: !write }));
    }
    async get(key: string, id: string): Promise<any> { const result = await this.call('get', ['--issue-id', key, '--id', id, '--expand', 'properties']); return result?.worklog || result; }
    async list(key: string): Promise<any[]> {
        const logs: any[] = [];
        let after = '';
        do {
            const result = await this.call('query', ['--issue-id', key, '--first', '100', '--expand', 'properties', ...(after ? ['--after', after] : [])]);
            const page = result?.worklogs || result;
            const nodes = Array.isArray(page?.nodes) ? page.nodes : Array.isArray(page?.edges) ? page.edges.map((edge: any) => edge.node) : Array.isArray(page?.items) ? page.items : null;
            if (!nodes || typeof page.pageInfo?.hasNextPage !== 'boolean')
                throw new Error('Jira worklog pagination coverage is unverified');
            for (const node of nodes) {
                if (!node?.id)
                    throw new Error('Jira worklog identity missing');
                const log = Array.isArray(node.properties) ? node : await this.get(key, node.id);
                if (!Array.isArray(log.properties))
                    throw new Error('Jira worklog property expansion is unavailable');
                logs.push(log);
            }
            if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after))
                throw new Error('Jira worklog pagination did not advance');
            after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : '';
        } while (after);
        return logs;
    }
    async save(publication: TimePublication): Promise<any> {
        const payload = publication.payload as {
            started: string;
            property: string;
            text: string;
        };
        const args = ['--issue-id', publication.key, '--time-spent-seconds', String(publication.intendedValue), '--started', payload.started, '--comment', payload.text, '--comment-format', 'plain', '--properties-json', JSON.stringify([{ key: propertyKey, value: payload.property }]), '--adjust-estimate', 'leave', '--notify-users', 'false', '--expand', 'properties'];
        if (publication.worklogId)
            args.push('--id', publication.worklogId);
        const result = await this.call(publication.worklogId ? 'update' : 'add', args, true);
        return result?.worklog || result;
    }
}
export async function publishJiraTime(store: Store, execute: typeof command, reconcileKey?: string): Promise<void> {
    const ledger = store.state.coordination?.time;
    if (!ledger?.enabled || ledger.jiraEnabled === false || !ledger.jiraActivatedAt || !ledger.jiraConnection)
        return;
    if (!reconcileKey)
        captureTime(store);
    const entry = ledger.entries.find(entry => reconcileKey ? entry.key === reconcileKey && entry.status === 'uncertain' : entry.status === 'pending' && entry.date < easternDay(store.clock.now()) && entry.date >= easternDay(new Date(ledger.jiraActivatedAt!)));
    if (!entry)
        return;
    const lock = `${store.project.id}:${entry.key}`;
    if (locks.has(lock))
        return;
    locks.add(lock);
    let publication: TimePublication | undefined;
    try {
        const identity = data(await execute('twg', ['whoami', '-o', 'json', '--output-summary', 'none'], { readOnly: true, timeout: 60000 }));
        if (identity?.accountId !== CEC.account)
            throw new Error('Jira worklog author is not the configured Office account');
        const adapter = new JiraWorklogs(execute, ledger.jiraConnection), marker = `${store.project.id}:${entry.id}`;
        const logs = await adapter.list(entry.key), identified = logs.filter(log => log.properties.some((property: any) => property.key === propertyKey && property.value === marker));
        if (identified.length > 1)
            throw new Error('Multiple Jira worklogs have the Office identity');
        if (reconcileKey) {
            publication = ledger.publications?.find(publication => publication.provider === 'jira' && publication.key === entry.key && publication.status === 'uncertain');
            if (!publication || identified.length !== 1 || !matches(identified[0], publication))
                throw new Error('Uncertain Jira submission has no unique exact read-back; it cannot be resent');
        }
        else {
            const prior = ledger.publications?.filter(publication => publication.provider === 'jira' && publication.covered.some(covered => covered.id === entry.id) && publication.status === 'verified').at(-1);
            if (entry.worklogId && (!identified[0] || localId(identified[0].id) !== localId(entry.worklogId)))
                throw new Error('Previously identified Jira worklog is missing; never recreate it');
            if (identified[0] && (!prior || !matches(identified[0], prior)))
                throw new Error('Jira worklog changed externally; preserve the human edit');
            const started = easternInstant(entry.date, 12).toISOString().replace('Z', '+0000');
            publication = { id: crypto.randomUUID(), provider: 'jira', projectId: store.project.id, key: entry.key, status: 'prepared', itemId: entry.id, fieldId: '', worklogId: entry.worklogId || '', baseline: null, previousValue: prior?.intendedValue ?? null, intendedValue: entry.seconds, covered: [{ id: entry.id, revision: entry.revision || 1, seconds: entry.seconds }], payload: { started, author: CEC.account, property: marker, text: `${label} · ${store.project.name} · ${entry.key} · ${entry.date}` }, createdAt: store.clock.now().toISOString(), detail: '' };
            (ledger.publications ??= []).push(publication);
            store.save();
            if (store.state.paused || !ledger.enabled)
                throw new Error('Jira publishing paused before dispatch');
            publication.status = 'dispatching';
            entry.status = 'posting';
            store.save();
            const saved = await adapter.save(publication);
            if (!saved?.id)
                throw new Error('Jira did not return a saved worklog identity');
            publication.worklogId = localId(saved.id);
            store.save();
            const observed = await adapter.get(entry.key, publication.worklogId);
            if (!matches(observed, publication))
                throw new Error('Saved Jira worklog identity, seconds, date, author, label or properties did not match');
        }
        publication.status = 'verified';
        entry.worklogId = localId(identified[0]?.id || publication.worklogId);
        entry.status = 'posted';
        entry.detail = `${label}: ${publication.intendedValue}s verified; estimates preserved.`;
        entry.url = `${CEC.site}/browse/${entry.key}`;
        store.emit('time-posted', entry.detail, 'pm', entry.key);
    }
    catch (error) {
        if (publication?.status === 'dispatching')
            publication.status = 'uncertain';
        entry.status = 'uncertain';
        entry.detail = `Jira time needs read-back; no automatic resubmission: ${String(error)}`;
    }
    finally {
        store.save();
        locks.delete(lock);
    }
}
function matches(log: any, publication: TimePublication): boolean {
    const payload = publication.payload as {
        started: string;
        author: string;
        property: string;
        text: string;
    };
    return !!log?.id && (!publication.worklogId || localId(log.id) === localId(publication.worklogId)) && log.author?.accountId === payload.author && log.timeSpentSeconds === publication.intendedValue && easternDay(new Date(log.started)) === easternDay(new Date(payload.started)) && JSON.stringify(log.comment).includes(payload.text) && Array.isArray(log.properties) && log.properties.some((property: any) => property.key === propertyKey && property.value === payload.property);
}
