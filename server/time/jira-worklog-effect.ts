import { randomUUID } from 'node:crypto';
import type { EffectIntent, TimeEntry, TimePublication } from '../../src/shared';
import type { TimeLedgerState } from '../../src/contracts/timing';
import { EffectUncertainError, Effects } from '../store/effects';
import type { Store } from '../store/store';
import { easternInstant } from '../office/clock';

export const WORKLOG_LABEL = 'Office agent effort';
export const WORKLOG_PROPERTY = 'officeEntryId';
export const localWorklogId = (value: string) => value.split('/').at(-1)!;
export const jiraWorklogEffectId = (projectId: string, publicationId: string) => `jira-worklog:${projectId}:${publicationId}`;

/** The publication fields the worklog matcher compares. */
export interface WorklogMatch { worklogId: string; intendedValue: number; payload: unknown }
/** The publication fields a worklog save sends. */
export type WorklogSave = Pick<TimePublication, 'key' | 'intendedValue' | 'worklogId' | 'payload'>;
export type WorklogMatcher = (log: any, intent: WorklogMatch) => boolean;
/** One TWG connection: the identity read and the worklog adapter's reads and single write. */
export interface JiraWorklogTransport {
    whoami(): Promise<string | undefined>;
    list(key: string): Promise<any[]>;
    get(key: string, id: string): Promise<any>;
    save(input: WorklogSave): Promise<any>;
}
export type JiraConnect = (site: string, connection: string, profile: string | null) => JiraWorklogTransport;
/** The project's current Jira binding and saved connection; read again at every check. */
export interface JiraWorklogBinding { site: string; account: string; profile: string | null; connection: string }

/** The frozen operation. The operation (add or update) is decided here, never from a later observation. */
export interface JiraWorklogPayload {
    issueKey: string;
    seconds: number;
    started: string;
    text: string;
    property: string;
    author: string;
    worklogId: string | null;
    site: string;
    connection: string;
    profile: string | null;
}
export interface JiraWorklogPrior { publicationId: string; worklogId: string; intendedValue: number; started: string; author: string; text: string; property: string }
export interface JiraWorklogExpected {
    covered: TimePublication['covered'];
    /** Worklog ids carrying the Office marker: none for an add, the known id for an update. */
    markers: string[];
    prior: JiraWorklogPrior | null;
}
export interface JiraWorklogReceipt { id: string | null }

const UNCERTAIN = 'Jira time needs read-back; no automatic resubmission: ';
const MISMATCH = 'Saved Jira worklog identity, seconds, date, author, label or properties did not match';
const NO_READBACK = 'Uncertain Jira submission has no unique exact read-back; it cannot be resent';

/** Effect uncertainty already carries the rendered error; the shared pause rejection keeps the Jira wording. */
export function uncertaintyDetail(error: unknown): string {
    if (error instanceof EffectUncertainError)
        return UNCERTAIN + error.message;
    if (error instanceof Error && error.message === 'Office paused before dispatch')
        return `${UNCERTAIN}Error: Jira publishing paused before dispatch`;
    return UNCERTAIN + String(error);
}

const time = (store: Store) => store.state.coordination!.time!;
const find = (store: Store, publicationId: string, entryId: string) => {
    const ledger = time(store);
    return { ledger, publication: ledger.publications!.find(item => item.id === publicationId)!, entry: ledger.entries.find(item => item.id === entryId)! };
};
const latestVerified = (ledger: TimeLedgerState, entryId: string) => ledger.publications?.filter(publication => publication.provider === 'jira' && publication.covered.some(covered => covered.id === entryId) && publication.status === 'verified').at(-1);
const priorOf = (publication: TimePublication | undefined): JiraWorklogPrior | null => {
    if (!publication)
        return null;
    const payload = publication.payload as { started: string; author: string; property: string; text: string };
    return { publicationId: publication.id, worklogId: publication.worklogId, intendedValue: publication.intendedValue, started: payload.started, author: payload.author, text: payload.text, property: payload.property };
};
const priorMatch = (prior: JiraWorklogPrior): WorklogMatch => ({ worklogId: prior.worklogId, intendedValue: prior.intendedValue, payload: { started: prior.started, author: prior.author, property: prior.property, text: prior.text } });
const payloadMatch = (payload: JiraWorklogPayload, worklogId: string): WorklogMatch => ({ worklogId, intendedValue: payload.seconds, payload: { started: payload.started, author: payload.author, property: payload.property, text: payload.text } });
const marked = (logs: any[], marker: string) => logs.filter(log => log.properties.some((property: any) => property.key === WORKLOG_PROPERTY && property.value === marker));

export interface JiraWorklogAttempt {
    store: Store;
    entry: TimeEntry;
    binding: () => JiraWorklogBinding;
    transport: JiraWorklogTransport;
    matcher: WorklogMatcher;
}

/**
 * One fresh attempt for one day: a new publication and Effect, committed `prepared` with the day
 * reserved `posting` before Effects runs; then preflight reads, one claimed dispatch and read-back.
 * Never throws: every outcome is projected onto the ledger.
 */
export async function executeJiraWorklogEffect({ store, entry: selected, binding, transport, matcher }: JiraWorklogAttempt): Promise<void> {
    const ledger = time(store), frozen = binding(), prior = latestVerified(ledger, selected.id);
    const id = randomUUID(), effectId = jiraWorklogEffectId(store.project.id, id), entryId = selected.id;
    const started = easternInstant(selected.date, 12).toISOString().replace('Z', '+0000'), marker = `${store.project.id}:${selected.id}`;
    const text = `${WORKLOG_LABEL} · ${store.project.name} · ${selected.key} · ${selected.date}`;
    const covered = [{ id: selected.id, revision: selected.revision || 1, seconds: selected.seconds }];
    const publication: TimePublication = { id, provider: 'jira', projectId: store.project.id, key: selected.key, status: 'prepared', itemId: selected.id, fieldId: '', worklogId: selected.worklogId || '', baseline: null, previousValue: prior?.intendedValue ?? null, intendedValue: selected.seconds, covered, payload: { started, author: frozen.account, property: marker, text }, createdAt: store.clock.now().toISOString(), detail: '', effectId };
    const payload: JiraWorklogPayload = { issueKey: selected.key, seconds: selected.seconds, started, text, property: marker, author: frozen.account, worklogId: selected.worklogId ? localWorklogId(selected.worklogId) : null, site: frozen.site, connection: frozen.connection, profile: frozen.profile };
    const expected: JiraWorklogExpected = { covered: structuredClone(covered), markers: payload.worklogId ? [payload.worklogId] : [], prior: priorOf(prior) };
    const authorization = `jira-time-activated:${ledger.jiraActivatedAt}`;
    try {
        store.transaction(() => {
            (time(store).publications ??= []).push(publication);
            find(store, id, entryId).entry.status = 'posting';
        });
        const local = () => {
            const current = time(store);
            if (store.state.paused || !current?.enabled)
                throw new Error('Jira publishing paused before dispatch');
            if (current.jiraEnabled === false || `jira-time-activated:${current.jiraActivatedAt}` !== authorization)
                throw new Error('Jira publishing settings changed before dispatch');
            const now = binding();
            if (now.site !== payload.site || now.account !== payload.author || now.profile !== payload.profile || now.connection !== payload.connection)
                throw new Error('Jira worklog connection changed before dispatch; the attempt is not retargeted');
            if (JSON.stringify(priorOf(latestVerified(current, entryId))) !== JSON.stringify(expected.prior))
                throw new Error('The prior verified Jira publication changed before dispatch');
        };
        const receipt = await new Effects(store).execute<JiraWorklogPayload, JiraWorklogReceipt>({
            id: effectId, work: { projectId: store.project.id, kind: 'reconciliation', id: `time:${selected.key}` }, attemptId: `r${covered[0].revision}`,
            operation: payload.worklogId ? 'jira-worklog-update' : 'jira-worklog-add', target: selected.key, authorization, payload, expectedState: expected,
            preflight: async () => {
                local();
                if (await transport.whoami() !== payload.author)
                    throw new Error('Jira worklog author is not the configured Office account');
                const identified = marked(await transport.list(payload.issueKey), payload.property);
                if (identified.length > 1)
                    throw new Error('Multiple Jira worklogs have the Office identity');
                if (payload.worklogId && (!identified[0] || localWorklogId(identified[0].id) !== payload.worklogId))
                    throw new Error('Previously identified Jira worklog is missing; never recreate it');
                if (identified[0] && (!expected.prior || !matcher(identified[0], priorMatch(expected.prior))))
                    throw new Error('Jira worklog changed externally; preserve the human edit');
                if (JSON.stringify(identified.map(log => localWorklogId(log.id))) !== JSON.stringify(expected.markers))
                    throw new Error('Jira worklogs with the Office identity differ from the frozen operation; it is not converted');
                local();
            },
            dispatch: async frozenPayload => {
                // The ledger dispatch boundary: committed before TWG is called, or TWG is not called.
                store.transaction(() => {
                    const record = find(store, id, entryId);
                    record.publication.status = 'dispatching';
                    record.entry.status = 'posting';
                });
                const saved = await transport.save({ key: frozenPayload.issueKey, intendedValue: frozenPayload.seconds, worklogId: frozenPayload.worklogId || '', payload: { started: frozenPayload.started, property: frozenPayload.property, text: frozenPayload.text } });
                const savedId = saved?.id ? localWorklogId(String(saved.id)) : null;
                if (savedId)
                    store.transaction(() => { find(store, id, entryId).publication.worklogId = savedId; });
                return { id: savedId };
            },
            verify: async (saved, frozenPayload) => {
                if (!saved?.id)
                    throw new Error('Jira did not return a saved worklog identity');
                const observed = await transport.get(frozenPayload.issueKey, saved.id);
                if (frozenPayload.worklogId && saved.id !== frozenPayload.worklogId || !matcher(observed, payloadMatch(frozenPayload, saved.id)))
                    throw new Error(MISMATCH);
                return true;
            },
        });
        projectJiraWorklogEffect(store, id, entryId, { worklogId: receipt.id!, seconds: payload.seconds, site: payload.site });
    }
    catch (error) {
        store.transaction(() => {
            const record = find(store, id, entryId);
            if (record.publication?.status === 'dispatching')
                record.publication.status = 'uncertain';
            record.entry.status = 'uncertain';
            record.entry.detail = uncertaintyDetail(error);
        });
    }
}

export interface JiraWorklogReconcile {
    store: Store;
    entry: TimeEntry;
    publication: TimePublication;
    connect: JiraConnect;
    matcher: WorklogMatcher;
}

/**
 * Settles an attempted (dispatching or uncertain) Effect by read-back through its frozen connection:
 * the frozen account, a complete marker lookup and exactly one worklog matching the saved operation,
 * including any saved receipt id. Anything less stays uncertain; nothing is dispatched. Throws on failure.
 */
export async function reconcileJiraWorklogEffect({ store, entry, publication, connect, matcher }: JiraWorklogReconcile): Promise<void> {
    const effectId = publication.effectId!;
    const verified = await new Effects(store).reconcile<JiraWorklogReceipt>(effectId, async intent => {
        const payload = intent.payload as JiraWorklogPayload, transport = connect(payload.site, payload.connection, payload.profile);
        if (await transport.whoami() !== payload.author)
            throw new Error('Jira worklog author is not the configured Office account');
        const identified = marked(await transport.list(payload.issueKey), payload.property);
        if (identified.length > 1)
            throw new Error('Multiple Jira worklogs have the Office identity');
        const known = (intent.receipt as JiraWorklogReceipt | null)?.id || publication.worklogId || payload.worklogId || '';
        const log = identified[0], id = log ? localWorklogId(log.id) : '';
        if (!log || known && id !== localWorklogId(known) || !matcher(log, payloadMatch(payload, known)))
            return { verified: false, receipt: { id: null } };
        return { verified: true, receipt: { id } };
    });
    if (!verified)
        throw new Error(NO_READBACK);
    const intent = store.getEffect<JiraWorklogPayload>(effectId)!;
    projectVerifiedEffect(store, publication, entry, intent);
}

/** A verified Effect beside an unfinished ledger: finish from its receipt and saved payload, no Jira call. */
export function projectVerifiedEffect(store: Store, publication: TimePublication, entry: TimeEntry, intent: EffectIntent): void {
    const receipt = (intent.receipt as JiraWorklogReceipt | null)?.id || publication.worklogId;
    if (intent.status !== 'verified' || !receipt)
        throw new Error('Verified Jira effect has no saved worklog identity; read it back explicitly');
    const payload = intent.payload as JiraWorklogPayload;
    projectJiraWorklogEffect(store, publication.id, entry.id, { worklogId: localWorklogId(receipt), seconds: payload.seconds, site: payload.site });
}

/**
 * Finalizes one verified publication in a single transaction: the publication verified (healing a
 * missing receipt id), its covered revision posted, and `time-posted` emitted only the first time.
 * A newer measurement is never labelled posted by an older receipt. Repeating it emits nothing.
 */
export function projectJiraWorklogEffect(store: Store, publicationId: string, entryId: string, outcome: { worklogId: string; seconds: number; site: string }): void {
    store.transaction(() => {
        const { publication, entry } = find(store, publicationId, entryId);
        const first = publication.status !== 'verified', detail = `${WORKLOG_LABEL}: ${outcome.seconds}s verified; estimates preserved.`;
        publication.status = 'verified';
        publication.worklogId ||= outcome.worklogId;
        const covered = publication.covered.find(item => item.id === entry.id);
        if (covered && (entry.revision || 1) === covered.revision && entry.status !== 'posted') {
            Object.assign(entry, { worklogId: outcome.worklogId, status: 'posted', detail, url: `${outcome.site}/browse/${entry.key}` });
        }
        else
            entry.worklogId ||= outcome.worklogId;
        if (first)
            store.emit('time-posted', detail, 'pm', entry.key);
    });
}
