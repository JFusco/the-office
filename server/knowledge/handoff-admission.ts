import { learningDigest } from './learning-events';
import { touchesUnsettled, type UnsettledEffects } from '../operations/stale-records';
import type { BlockerFollowup, TeamMessage, WorkClaim, WorkTime } from '../../src/shared';

/**
 * One open Harper diagnosis per follow-up. Decisions over explicit inputs: which bound request owns a follow-up's
 * hand-off, which queued duplicates never started and are settled as history, whether the hand-off is still open,
 * and what the action currently due is about, so that wording a provider changes with every request is not a new
 * action. Settling is the only change; nothing is deleted.
 */

type Entry = BlockerFollowup['history'][number];
type OwnerStatus = NonNullable<Entry['ownerStatus']>;
type Item = Pick<BlockerFollowup, 'id' | 'source' | 'history' | 'nextAction' | 'handoffId' | 'handoffIds'>;

/** What these decisions read about one project. */
export interface HandoffEvidence {
    projectId: string;
    messages: TeamMessage[];
    /** This project's running or stopping work claims. */
    claims: readonly WorkClaim[];
    workLog: readonly WorkTime[];
    unsettled: UnsettledEffects;
}

/** What is recorded when a follow-up's source is no longer retained: neither an owner exit nor a return. */
export const SOURCE_MISSING = { detail: 'Original source is no longer retained; outcome unknown.', proof: { sourceMissing: true } } as const;
const SOURCE_MISSING_FINGERPRINT = learningDigest(['unknown', SOURCE_MISSING.proof, SOURCE_MISSING.detail]);
const OPEN = new Set(['queued', 'working']), LIVE = new Set(['running', 'stopping']);

/** The item's bindings in saved order: its historical ones, then the current one when it is not among them. */
export function bindings(item: Pick<BlockerFollowup, 'handoffId' | 'handoffIds'>): string[] {
    const ids = [...(item.handoffIds || [])];
    if (item.handoffId && !ids.includes(item.handoffId)) ids.push(item.handoffId);
    return ids;
}

/** A request Harper sent for this item: Harper to Morgan, and positively bound to it. */
export function harperRequest(item: Pick<BlockerFollowup, 'handoffId' | 'handoffIds'>, message: Pick<TeamMessage, 'id' | 'from' | 'to'>): boolean {
    return message.from === 'knowledge' && message.to === 'pm' && bindings(item).includes(message.id);
}

/** Makes `id` the item's current binding; the binding it displaces stays among the historical ones. */
export function bindHandoff(item: Pick<BlockerFollowup, 'handoffId' | 'handoffIds'>, id: string): void {
    if (item.handoffId === id) return;
    if (item.handoffId && !(item.handoffIds ??= []).includes(item.handoffId)) item.handoffIds.push(item.handoffId);
    item.handoffId = id;
}

function indexed(messages: readonly TeamMessage[]): Map<string, TeamMessage> {
    const byId = new Map<string, TeamMessage>();
    for (const message of messages) if (!byId.has(message.id)) byId.set(message.id, message);
    return byId;
}

type Execution = Pick<HandoffEvidence, 'projectId' | 'claims' | 'workLog'>;
/** This project's exact conversation claim for the request, running or stopping. */
const claimed = (message: Pick<TeamMessage, 'id'>, evidence: Execution) =>
    evidence.claims.some(claim => claim.work.projectId === evidence.projectId && claim.work.kind === 'conversation' && claim.work.id === message.id && LIVE.has(claim.status));
/** A worker run under the request's own id, running or stopping. A worker that shares only a ticket is not it. */
const workerLive = (message: Pick<TeamMessage, 'requestId'>, evidence: Execution) =>
    !!message.requestId && evidence.workLog.some(work => work.requestId === message.requestId && LIVE.has(work.status));

/** A Harper request still executing: its exact conversation claim, or its worker, is running or stopping. */
export function executing(message: Pick<TeamMessage, 'id' | 'requestId'>, evidence: Execution): boolean {
    return claimed(message, evidence) || workerLive(message, evidence);
}
/** A bound request in flight: working, under its exact claim, or for Harper's own requests, with its worker still running or stopping. */
const inFlight = (item: Item, message: TeamMessage, evidence: Execution) =>
    message.status === 'working' || claimed(message, evidence) || harperRequest(item, message) && workerLive(message, evidence);

/** The item's bound requests that exist and were not settled, in saved binding order. */
function bound(item: Item, byId: Map<string, TeamMessage>): TeamMessage[] {
    return bindings(item).flatMap(id => { const message = byId.get(id); return message && !message.supersededByHandoffId ? [message] : []; });
}

/** Harper's unsettled requests for this item, in saved binding order. */
export function harperRequests(item: Item, messages: readonly TeamMessage[]): TeamMessage[] {
    return bound(item, indexed(messages)).filter(message => harperRequest(item, message));
}

/**
 * The bound request that owns the item's hand-off. One still in flight wins (the current binding first, then the
 * last in saved order); otherwise the current binding, finished or adopted; otherwise, for an item saved with
 * historical bindings only, the last of them.
 */
export function survivingHandoff(item: Item, evidence: Execution, byId: Map<string, TeamMessage>): TeamMessage | undefined {
    const requests = bound(item, byId), flying = requests.filter(message => inFlight(item, message, evidence));
    if (flying.length) return flying.find(message => message.id === item.handoffId) ?? flying.at(-1);
    return requests.find(message => message.id === item.handoffId) ?? requests.at(-1);
}

/** Settlement reason, naming the hand-off the follow-up kept. */
export const supersededError = (handoffId: string) => `Superseded by this follow-up's current hand-off (${handoffId}); not run.`;

/**
 * Pins each follow-up's surviving hand-off, then settles its bound, queued Harper requests that show no sign of
 * having started (no claim, session, worker run, receipt, reply or unsettled write of their own) as failed history
 * naming the survivor. Every started request is left as it is. Returns how many were settled.
 */
export function settleHandoffs(followups: Item[], evidence: HandoffEvidence): number {
    if (!followups.some(item => item.handoffId || item.handoffIds?.length)) return 0;
    const byId = indexed(evidence.messages), sharing = new Map<string, number>();
    for (const message of evidence.messages) sharing.set(message.requestId, (sharing.get(message.requestId) || 0) + 1);
    // A reply carries its request's id, so any other message sharing it is one.
    const started = (message: TeamMessage) => message.status !== 'queued' || !!message.sessionId || (message.receipts || []).length > 0
        || evidence.claims.some(claim => claim.work.projectId === evidence.projectId && claim.work.kind === 'conversation' && claim.work.id === message.id)
        || !!message.requestId && evidence.workLog.some(work => work.requestId === message.requestId)
        || (sharing.get(message.requestId) || 0) > 1
        || touchesUnsettled(evidence.unsettled, [{ projectId: evidence.projectId, kind: 'conversation', id: message.id }]);
    let settled = 0;
    for (const item of followups) {
        const survivor = survivingHandoff(item, evidence, byId);
        if (!survivor) continue;
        bindHandoff(item, survivor.id);
        for (const id of bindings(item)) {
            const message = byId.get(id);
            if (!message || message === survivor || message.status !== 'queued' || message.supersededByHandoffId || !harperRequest(item, message) || started(message)) continue;
            Object.assign(message, { status: 'failed', supersededByHandoffId: survivor.id, error: supersededError(survivor.id) });
            settled++;
        }
    }
    return settled;
}

/**
 * Whether the item's hand-off is still open: its current binding is queued or working, or a bound request is still
 * executing (a working Harper request, an exact conversation claim, or a Harper worker still running or stopping).
 */
export function openHandoff(item: Item, evidence: Pick<HandoffEvidence, 'projectId' | 'claims' | 'workLog' | 'messages'>): boolean {
    const byId = indexed(evidence.messages), current = item.handoffId ? byId.get(item.handoffId) : undefined;
    if (current && OPEN.has(current.status)) return true;
    return bindings(item).some(id => {
        const message = byId.get(id);
        if (!message) return false;
        return harperRequest(item, message) ? message.status === 'working' || executing(message, evidence) : claimed(message, evidence);
    });
}

/** A distinct id for the next admission: Harper's prefix for the item and the next send ordinal past every binding and saved id. */
export function nextHandoffId(item: Item, messages: readonly TeamMessage[]): string {
    const taken = new Set([...messages.map(message => message.id), ...bindings(item)]);
    let ordinal = bindings(item).length + 1, id = '';
    do id = `harper-followup:${item.id}:send-${ordinal++}`; while (taken.has(id));
    return id;
}

/** GitHub's support footer names the request and when it was answered: it changes with every request, never with the failure. */
const GITHUB_SUPPORT_FOOTER = /(\brequest ID )[0-9A-F]+(?::[0-9A-F]+)*( and timestamp )\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?: ?UTC| ?Z)?/gi;
const GITHUB_REQUEST_HEADER = /(\bx-github-request-id:[ \t]*)[0-9A-F]+(?::[0-9A-F]+)*/gi;

/** The text without provider occurrence metadata. Status codes, paths, resources, later lines and instructions stay. */
export function withoutProviderOccurrence(text: string): string {
    return text.replace(GITHUB_SUPPORT_FOOTER, '$1<request-id>$2<timestamp>').replace(GITHUB_REQUEST_HEADER, '$1<request-id>');
}

/** IT reads whose advice to Morgan depends on whether the failure is a temporary read failure (`server/it/delivery-recoveries.ts`). */
const CATEGORIZED = new Set(['assignment-listener', 'project-progress']);
const sourceMissing = (entry: Entry) => entry.fingerprint === SOURCE_MISSING_FINGERPRINT;

/** IT's status at an entry; an entry saved before it was recorded reads the disposition derived from it. Absent when unknown. */
function ownerStatus(entry: Entry): OwnerStatus | undefined {
    if (sourceMissing(entry)) return undefined;
    if (entry.ownerStatus) return entry.ownerStatus;
    // A positive resolution ('confirmed') recorded no status.
    return entry.disposition === 'needs-input' ? 'needs-human' : entry.disposition === 'unresolved' ? 'retrying' : entry.disposition === 'unknown' ? 'resolved' : undefined;
}
const exit = (entry: Entry) => { const status = ownerStatus(entry); return status === 'retrying' || status === 'resolved'; };

/** The ordered history position of the needs-human observation that opened the episode entry `at` belongs to; -1 for none. */
function episodeAt(history: readonly Entry[], at: number): number {
    let start = -1;
    for (let index = 0; index <= at && index < history.length; index++) {
        const status = ownerStatus(history[index]);
        if (status === 'needs-human') { if (start < 0) start = index; }
        else if (status) start = -1;
    }
    return start;
}

const lastIndex = <T>(values: readonly T[], match: (value: T) => boolean, before = values.length) => { for (let index = before - 1; index >= 0; index--) if (match(values[index])) return index; return -1; };
const actionKey = (action: string) => learningDigest(['action', withoutProviderOccurrence(action)]);
const recoveryKey = (item: Item, episode: number, detail: string | undefined, temporary: (text: string) => boolean) =>
    learningDigest(['recovery', episode, CATEGORIZED.has(item.source.id) && detail !== undefined ? temporary(detail) : null]);

/**
 * What the action currently due is about. A recovery is about its needs-human episode and, for the two IT reads
 * whose advice depends on it, whether `detail` (IT's raw diagnostic) is a temporary read failure. Any other
 * follow-up is about its whole requested action, less provider occurrence metadata.
 */
export function materialKey(item: Item, detail: string, temporary: (text: string) => boolean): string {
    if (item.source.kind !== 'recovery') return actionKey(detail);
    return recoveryKey(item, episodeAt(item.history, item.history.length - 1), detail, temporary);
}

/**
 * The key of a follow-up whose Harper hand-offs were admitted before keys were recorded. The last of them is matched
 * to the observation it was admitted for by its old id; request dates order identical text only where they can, and
 * a tie keeps the later match. When that diagnosis was answered before a recorded owner exit that preceded the
 * current return, the key is the episode it served, so the return is still due once. Otherwise the key is the latest
 * source-present material (at an exit, the episode before it). Undefined when nothing saved supports a key.
 */
export function legacyMaterialKey(item: Item, messages: readonly TeamMessage[], temporary: (text: string) => boolean): string | undefined {
    const effective = harperRequests(item, messages).at(-1);
    if (!effective) return undefined;
    const history = item.history, created = Date.parse(effective.createdAt);
    const matches = history.flatMap((entry, index) => typeof entry.detail === 'string' && `harper-followup:${item.id}:${learningDigest(entry.detail)}` === effective.id ? [index] : []);
    const matched = matches.length <= 1 ? matches[0] : Number.isFinite(created) ? matches.filter(index => Date.parse(history[index].at) <= created).at(-1) : undefined;
    const present = lastIndex(history, entry => !sourceMissing(entry));
    const detailAt = (index: number) => history[index]?.detail ?? (index === history.length - 1 ? item.nextAction : undefined);
    if (item.source.kind !== 'recovery') {
        const detail = matched !== undefined ? history[matched].detail : present >= 0 ? detailAt(present) : undefined;
        return detail === undefined ? undefined : actionKey(detail);
    }
    if (present < 0) return undefined;
    if (matched !== undefined && effective.status === 'answered') {
        const served = episodeAt(history, matched), left = history.findIndex((entry, index) => index > matched && exit(entry));
        const current = ownerStatus(history[present]) === 'needs-human' ? episodeAt(history, present) : -1;
        // When Morgan's answer was recorded: the latest reply, so a diagnosis still being answered cannot appear to precede the exit.
        const replies = messages.filter(reply => reply.id !== effective.id && reply.requestId === effective.requestId && reply.from === 'pm' && reply.status === 'answered').map(reply => Date.parse(reply.createdAt));
        const answered = replies.length && replies.every(Number.isFinite) ? Math.max(...replies) : NaN;
        if (served >= 0 && left > matched && current > left && answered < Date.parse(history[left].at)) return recoveryKey(item, served, history[matched].detail, temporary);
    }
    if (ownerStatus(history[present]) === 'needs-human') return recoveryKey(item, episodeAt(history, present), detailAt(present), temporary);
    const before = lastIndex(history, entry => ownerStatus(entry) === 'needs-human', present);
    return recoveryKey(item, before < 0 ? -1 : episodeAt(history, before), before < 0 ? undefined : detailAt(before), temporary);
}
