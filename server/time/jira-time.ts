import { twgProfile } from '../cec/twg-connection';
import type { TimeEntry } from '../../src/shared';
import type { TimeLedgerState } from '../../src/contracts/timing';
import { publishableEntry } from './publishable';
import type { Store } from '../store/store';
import { command } from '../workers/process';
import { jiraBinding } from '../office/project-bindings';
import { captureTime } from './time-accounting';
import { easternDay } from '../office/clock';
import { provenNeverSent, unresolvedAttempts } from './jira-attempts';
import { WORKLOG_PROPERTY as propertyKey, executeJiraWorklogEffect, localWorklogId as localId, projectJiraWorklogEffect, projectVerifiedEffect, reconcileJiraWorklogEffect, uncertaintyDetail } from './jira-worklog-effect';
import type { JiraConnect, JiraWorklogBinding, WorklogMatch, WorklogSave } from './jira-worklog-effect';
const locks = new Set<string>();
const envelope = (raw: string): any => {
    const result = JSON.parse(raw);
    if (result.error || result.ok === false)
        throw new Error('Jira worklog transport did not confirm success');
    return result;
};
const data = (raw: string): any => envelope(raw).data;
/** One selected TWG connection, complete pagination and property read-back. */
export class JiraWorklogs {
    constructor(private execute: typeof command, private site: string, public connection = `twg:${site}`, private profile: string[] = []) {
        if (connection !== `twg:${site}`)
            throw new Error('Unverified Jira worklog connection');
    }
    private async call(action: string, args: string[], write = false, whole = false): Promise<any> {
        const result = envelope(await this.execute('twg', ['jira', 'workitem', 'worklog', action, ...args, '--site', this.site, ...this.profile, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: !write }));
        return whole ? result : result.data;
    }
    async get(key: string, id: string): Promise<any> { const result = await this.call('get', ['--issue-id', key, '--id', id, '--expand', 'properties']); return result?.worklog || result; }
    async list(key: string): Promise<any[]> {
        const logs: any[] = [];
        let after = '';
        do {
            const result = await this.call('query', ['--issue-id', key, '--first', '100', '--expand', 'properties', ...(after ? ['--after', after] : [])], false, true);
            // TWG v2 returns the page as a bare array with pageInfo beside it; older output nests both.
            const page = Array.isArray(result?.data) ? { nodes: result.data, pageInfo: result.pageInfo } : result?.data?.worklogs || result?.data;
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
            const cursor = page.pageInfo.endCursor ?? page.pageInfo.nextCursor;
            if (page.pageInfo.hasNextPage && (!cursor || cursor === after))
                throw new Error('Jira worklog pagination did not advance');
            after = page.pageInfo.hasNextPage ? cursor : '';
        } while (after);
        return logs;
    }
    async save(publication: WorklogSave): Promise<any> {
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
/** The identity read and worklog adapter for one saved site, connection and TWG profile. */
const connectWith = (execute: typeof command): JiraConnect => (site, connection, profile) => {
    const login = twgProfile({ site, twgProfile: profile ?? undefined }), worklogs = new JiraWorklogs(execute, site, connection, login);
    return {
        whoami: async () => data(await execute('twg', ['whoami', ...login, '-o', 'json', '--output-summary', 'none'], { readOnly: true, timeout: 60000 }))?.accountId,
        list: key => worklogs.list(key),
        get: (key, id) => worklogs.get(key, id),
        save: input => worklogs.save(input),
    };
};
const bindingOf = (store: Store) => (): JiraWorklogBinding => {
    const jira = jiraBinding(store.project);
    return { site: jira.site, account: jira.account, profile: jira.twgProfile || null, connection: store.state.coordination?.time?.jiraConnection || '' };
};
export async function publishJiraTime(store: Store, execute: typeof command, reconcileKey?: string): Promise<void> {
    const ledger = store.state.coordination?.time;
    if (reconcileKey && ledger && (finishVerifiedEffects(store, ledger, reconcileKey) || requeueNeverSent(store, ledger, reconcileKey)))
        return;
    if (!ledger?.enabled || ledger.jiraEnabled === false || !ledger.jiraActivatedAt || !ledger.jiraConnection)
        return;
    if (!reconcileKey)
        captureTime(store);
    const entry = reconcileKey ? readBackEntry(store, ledger, reconcileKey) : publishableEntry(ledger, store.project.provider, entry => entry.date < easternDay(store.clock.now()) && entry.date >= easternDay(new Date(ledger.jiraActivatedAt!)));
    if (!entry)
        return;
    const lock = `${store.project.id}:${entry.key}`;
    if (locks.has(lock))
        return;
    locks.add(lock);
    try {
        const connect = connectWith(execute), binding = bindingOf(store);
        if (reconcileKey)
            await readBack(store, ledger, entry, connect, binding);
        else if (unresolvedAttempts(store, ledger, entry).length)
            throw new Error('An earlier Jira attempt for this day is unresolved; read it back before another write');
        else {
            const frozen = binding();
            await executeJiraWorklogEffect({ store, entry, binding, transport: connect(frozen.site, frozen.connection, frozen.profile), matcher: matches });
        }
    }
    catch (error) {
        entry.status = 'uncertain';
        entry.detail = uncertaintyDetail(error);
    }
    finally {
        store.save();
        locks.delete(lock);
    }
}
/** The uncertain day to read back: the first one with an unresolved attempt, else the first one. */
function readBackEntry(store: Store, ledger: TimeLedgerState, key: string): TimeEntry | undefined {
    const uncertain = ledger.entries.filter(entry => entry.key === key && entry.status === 'uncertain');
    return uncertain.find(entry => unresolvedAttempts(store, ledger, entry).length) || uncertain[0];
}
/**
 * Read-back of the one unresolved attempt bound to this day. An attempted Effect is settled through
 * Effects; a publication without one (or beside a missing, prepared or rejected one) keeps the legacy
 * read-back of its saved payload. Either way nothing is ever resent.
 */
async function readBack(store: Store, ledger: TimeLedgerState, entry: TimeEntry, connect: JiraConnect, binding: () => JiraWorklogBinding): Promise<void> {
    const open = unresolvedAttempts(store, ledger, entry), attempt = open[0];
    if (open.length > 1)
        throw new Error('Several unresolved Jira attempts cover this day; reconcile them explicitly');
    if (!attempt || attempt.publication.projectId !== store.project.id || attempt.publication.key !== entry.key)
        throw new Error('Uncertain Jira submission has no unique exact read-back; it cannot be resent');
    if (attempt.state === 'projectable' && attempt.effect)
        return projectVerifiedEffect(store, attempt.publication, entry, attempt.effect);
    if (attempt.effect && ['dispatching', 'uncertain'].includes(attempt.effect.status))
        return reconcileJiraWorklogEffect({ store, entry, publication: attempt.publication, connect, matcher: matches });
    const jira = binding(), transport = connect(jira.site, jira.connection, jira.profile), marker = `${store.project.id}:${entry.id}`;
    if (await transport.whoami() !== jira.account)
        throw new Error('Jira worklog author is not the configured Office account');
    const identified = (await transport.list(entry.key)).filter(log => log.properties.some((property: any) => property.key === propertyKey && property.value === marker));
    if (identified.length > 1)
        throw new Error('Multiple Jira worklogs have the Office identity');
    if (identified.length !== 1 || !matches(identified[0], attempt.publication))
        throw new Error('Uncertain Jira submission has no unique exact read-back; it cannot be resent');
    projectJiraWorklogEffect(store, attempt.publication.id, entry.id, { worklogId: localId(identified[0].id), seconds: attempt.publication.intendedValue, site: jira.site });
}
/** A verified Effect beside an unfinished ledger is finished from its receipt, with no Jira call. */
function finishVerifiedEffects(store: Store, ledger: TimeLedgerState, key: string): boolean {
    let finished = false;
    for (const entry of ledger.entries.filter(item => item.key === key && item.status === 'uncertain')) {
        const open = unresolvedAttempts(store, ledger, entry);
        if (open.length !== 1 || open[0].state !== 'projectable' || !open[0].effect || open[0].publication.projectId !== store.project.id || open[0].publication.key !== key)
            continue;
        try {
            projectVerifiedEffect(store, open[0].publication, entry, open[0].effect);
            finished = true;
        }
        catch (error) {
            entry.detail = uncertaintyDetail(error);
            store.save();
        }
    }
    return finished;
}
/**
 * A day left uncertain with no dispatched attempt failed before anything reached Jira (a read or
 * identity check), so there is nothing to read back. Reconciling it queues it to publish again;
 * no provider call is needed. A dispatched attempt keeps the read-back-only rule.
 */
function requeueNeverSent(store: Store, ledger: TimeLedgerState, key: string): boolean {
    // A day with a known worklog is held for a human (missing worklog, measurement gap), never requeued here.
    const entry = ledger.entries.find(item => item.key === key && item.status === 'uncertain' && provenNeverSent(store, ledger, item));
    if (!entry)
        return false;
    entry.status = 'pending';
    entry.detail = `No Jira write was attempted; queued to publish again. Previously: ${entry.detail}`;
    store.emit('time-requeued', `${entry.key} ${entry.date}: no Jira write was attempted; queued to publish again.`, 'pm', entry.key);
    store.save();
    return true;
}
function matches(log: any, publication: WorklogMatch): boolean {
    const payload = publication.payload as {
        started: string;
        author: string;
        property: string;
        text: string;
    };
    return !!log?.id && (!publication.worklogId || localId(log.id) === localId(publication.worklogId)) && log.author?.accountId === payload.author && log.timeSpentSeconds === publication.intendedValue && easternDay(new Date(log.started)) === easternDay(new Date(payload.started)) && JSON.stringify(log.comment).includes(payload.text) && Array.isArray(log.properties) && log.properties.some((property: any) => property.key === propertyKey && property.value === payload.property);
}
