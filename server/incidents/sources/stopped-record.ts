import { hasUncertainEffects } from '../../delivery/pipeline/uncertain-effects';
import type { Prerequisite, StopReason, WorkRef } from '../../../src/contracts/work';
import type { MaintenanceRun, OfficeSnapshot, StageResult } from '../../../src/shared';
import { deliveryRepairProjection } from '../../../src/work/delivery-repair-projection';
import { readinessNeedsFollowup } from '../../../src/work/work-summary';
import { REFUSED_RECEIPT } from '../../cec/qa/refused-result';
import type { StopFacts } from '../expected-block';
import { normalizeCause } from '../normalize-cause';

/** What the record behind a piece of scheduled work says about why it is not running. */
export interface StoppedRecord {
    /**
     * `stopped`: the record's own status is a stop, and the fields below describe it. `gated`: the
     * record could run, and only the scheduler's condition holds it. `ignored`: not a stop at all,
     * or one another collector reads.
     */
    standing: 'stopped' | 'gated' | 'ignored';
    /** The stage the scheduler projects this record at, where the record holds one of its own. */
    stage?: string;
    /** The ticket or issue key, for a hold lookup. */
    key: string;
    /** Other keys a hold on this work may be configured under, such as its pull request's. */
    keys?: string[];
    /** The record's own explanation: an error, a detail, a blocker. Never a conversation body. */
    text: string;
    /** The harness's own stable wording for a typed restriction, used as identity in place of text that changes. */
    identity?: string;
    /** Where the explanation came from, judged from the record and never from its wording. */
    author: 'harness' | 'model' | 'unknown';
    /** The typed cause, when the record has one of its own. */
    kind: string;
    stop: StopReason | null;
    head: string;
    lastWorker: string;
    /** Marks this stop of this record, so a later stop is told apart. */
    episode: string;
    facts: StopFacts;
    /** Subject kind and ID of another source's record of the same stop. */
    covers: [kind: string, id: string][];
    /** Every work reference a write for this record may be filed under. */
    effects: WorkRef[];
    /** When a retry the Office planned for this record comes due. */
    retryAt?: string;
    /** The structured prerequisites the record waits on. */
    prerequisites?: Prerequisite[];
    /** A saved result of this record reports a write whose outcome is unknown or unverified: a read-back is required, whatever the Effects ledger holds. */
    uncertainWrite?: boolean;
    /** `WorkFailure.category` of the run that worked this stop, while that failure still stands. */
    failure?: string;
}

/** What the stage runner writes on the receipt of a result it made itself when a stage was cut short. */
export const INTERRUPTED_RECEIPT = 'Worker did not return a verified final result';
/** The harness's own description of a merge waiting for a person; a job's detail changes while it waits. */
export const MERGE_APPROVAL = 'Merge approval required for the reviewed head';

type Refused = Pick<StageResult, 'outcome' | 'blocker' | 'summary' | 'resolution' | 'receipts'>;
type Run = NonNullable<OfficeSnapshot['workLog']>[number];
const STOPPED = ['blocked', 'interrupted'];
const pending = (retry: { exhausted?: boolean; nextAt?: string } | undefined) => !!retry && !retry.exhausted && !!retry.nextAt;
const refused = (result: StageResult | undefined): Refused | null => result && result.outcome !== 'passed' ? result : null;
const includes = (text: string, said: string | undefined) => { const words = normalizeCause(said); return !!words && normalizeCause(text).includes(words.slice(0, 80)); };
/** The stop repeats what a refused result said. */
const repeats = (text: string, result: Refused | null) => includes(text, result?.blocker || result?.summary);
/** A result the harness wrote itself: it carries the runner's own receipt for this ticket and stage. */
const synthesized = (result: Refused, key: string, stage: string) => !!result.receipts?.some(receipt => receipt.action === stage && receipt.target === key && !receipt.verified && [REFUSED_RECEIPT, INTERRUPTED_RECEIPT].includes(receipt.detail));
const lastRun = (state: OfficeSnapshot, of: (run: Run) => boolean) => state.workLog?.filter(of).at(-1);
/** A saved result with a write receipt of unknown outcome, the condition that stops Brain maintenance for a read-back. */
const unknownWrite = (result: { receipts?: readonly { uncertain?: boolean }[] } | undefined) => !!result?.receipts?.some(receipt => receipt.uncertain);
const ticketWriteUnconfirmed = (result: StageResult | undefined) =>
    unknownWrite(result) || !!result?.receipts?.some(receipt => receipt.action === 'jira-transition' && !receipt.verified);
/** The delivery pipeline's own rule for a result that still owes a read-back; a result saved without receipts owes none. */
const jobWriteUnconfirmed = (stage: string, result: StageResult | undefined) => !!result?.receipts && hasUncertainEffects(stage, result);
/** The run's typed failure still stands: a stage that accepted the result a failed run had saved was not stopped by that failure. */
const failed = (run: Run | undefined) => !!run?.failure && !run.completionAccepted;
/** A maintenance run's stop is its last step's blocker, and no typed failure says the harness stopped it. */
function stepBlocker(state: OfficeSnapshot, run: MaintenanceRun, text: string): StageResult['outcome'] | null {
    const result = run.steps?.at(-1)?.result;
    return result && result.outcome !== 'passed' && !!result.blocker && includes(text, result.blocker) && !failed(lastRun(state, worked => worked.requestId === run.id)) ? result.outcome : null;
}
/** Text a run may have handed back: the harness's only when no run worked the record or the run's failure is typed. */
const handedBack = (run: Run | undefined): 'harness' | 'unknown' => !run || failed(run) ? 'harness' : 'unknown';
const issue = (project: string, key: string): WorkRef[] => /^GH-\d+$/.test(key) ? [{ projectId: project, kind: 'issue', id: key.slice(3) }] : [];

/**
 * Finds the record a scheduled item stands for and reads its stop from typed fields. A saved stop
 * is read only while the record's status makes it current. Returns null for work with no retained
 * record of its own; the caller then has only the scheduler's reason, of unknown origin.
 */
export function stoppedRecord(state: OfficeSnapshot, work: WorkRef, stage: string): StoppedRecord | null {
    const c = state.coordination, project = work.projectId;
    const base = { standing: 'stopped', key: '', author: 'harness', kind: '', stop: null, head: '', lastWorker: '', facts: {}, covers: [], effects: [work] } satisfies Partial<StoppedRecord>;
    const worker = (id: string | undefined): [string, string][] => id ? [['worker', id]] : [];
    if (work.kind === 'delivery' && work.id.startsWith('ticket:')) {
        const ticket = state.tickets.find(ticket => ticket.key === work.id.slice(7));
        if (!ticket) return null;
        // Conversations and Slack sends carry the ticket's key too; only the stage's own run worked this stop.
        const run = lastRun(state, run => run.ticket === ticket.key && run.stage === ticket.stage), blocked = ticket.activity === 'blocked', stop = blocked ? ticket.stop ?? null : null;
        // Required Azure policies still running on the pull request's head: a wait the runner saved itself.
        const policies = ticket.stage === 'ci' && ticket.activity === 'waiting' && !!ticket.blocker;
        const stageResult = ticket.results[ticket.stage], moved = ticket.progressUpdates?.filter(update => update.stage === ticket.stage).at(-1)?.result;
        const result = refused(stageResult), transition = refused(moved);
        // The blocker is attributed to the attempt that produced it: a refused transition first, then the stage's result.
        const said = !policies && repeats(ticket.blocker, transition) ? transition : !policies && repeats(ticket.blocker, result) && !synthesized(result!, ticket.key, ticket.stage) && !failed(run) ? result : null;
        const harness = policies || !said && (repeats(ticket.blocker, result) || failed(run) || !!stop);
        const author = said ? 'model' : harness ? 'harness' : 'unknown', kind = policies ? 'provider-checks' : said ? said.resolution?.kind ?? said.outcome : harness ? stop?.kind ?? '' : '';
        // A delivery request that only mirrors this ticket's stop is the same stop.
        const mirrored = (state.deliveryQueue ?? []).filter(request => request.key === ticket.key && STOPPED.includes(request.status) && !!request.error && request.error === ticket.blocker).map((request): [string, string] => ['delivery', request.id]);
        return { ...base, standing: blocked || policies ? 'stopped' : 'gated', stage: ticket.stage, key: ticket.key, text: ticket.blocker, author, kind, stop, head: ticket.commit, lastWorker: run?.id ?? '', episode: stop?.at ?? `${ticket.runId}:${ticket.attempt}`,
            facts: policies ? { stopKind: 'provider-checks' } : said ? { resolution: said.resolution?.kind, parked: ticket.parked } : { stopKind: harness ? stop?.kind : undefined, parked: ticket.parked },
            covers: [...worker(run?.id), ...mirrored], effects: [work, { projectId: project, kind: 'delivery', id: ticket.key }], prerequisites: ticket.prerequisites,
            // A status change that was sent and could not be verified is a write of unknown outcome, as is any receipt that says so.
            uncertainWrite: ticketWriteUnconfirmed(stageResult) || ticketWriteUnconfirmed(moved), failure: failed(run) ? run!.failure!.category : undefined };
    }
    if (work.kind === 'delivery') {
        const job = c?.jobs?.find(job => job.id === work.id);
        if (job) {
            const run = lastRun(state, run => run.requestId === job.id), result = refused(job.steps.filter(step => step.stage === job.stage).at(-1)?.result), assessment = job.prMetadataRepair?.assessment;
            const followup = readinessNeedsFollowup(job), approval = !!job.mergeApprovalRequired, active = STOPPED.includes(job.status);
            // A watching job keeps whatever stop it had before; only a wait's own stop is current for it.
            const stop = active || job.status === 'watching' && ['provider-checks', 'pr-not-ready'].includes(job.stop?.kind ?? '') ? job.stop ?? null : null;
            // The stop repeats a saved result of the stage, a metadata assessment or a CI diagnosis saved outside its steps.
            const model = followup || active && !failed(run) && (repeats(job.detail, result) || assessment?.outcome === 'blocked' && includes(job.detail, assessment.summary) || includes(job.detail, job.ciRepairs?.at(-1)?.plan?.summary));
            const repair = deliveryRepairProjection(job);
            return { ...base, standing: active || job.status === 'watching' && (!!stop || approval || followup) ? 'stopped' : 'gated', stage: job.stage, key: job.key, keys: job.pr ? [`GH-${job.pr}`] : [], text: job.detail, identity: approval ? MERGE_APPROVAL : undefined, author: approval ? 'harness' : model ? 'model' : 'harness',
                kind: approval ? 'merge-approval' : followup ? 'readiness' : model ? result?.resolution?.kind ?? result?.outcome ?? 'blocked' : stop?.kind ?? '', stop, head: job.head, lastWorker: run?.id ?? '', episode: stop?.at ?? job.updatedAt ?? job.requestedAt,
                facts: { ...(model ? { resolution: followup ? undefined : result?.resolution?.kind } : { stopKind: stop?.kind }), parked: job.parked, mergeApproval: approval, retrying: pending(job.retry), exhausted: !!job.retry?.exhausted }, covers: worker(run?.id), effects: [work, ...issue(project, job.key)],
                retryAt: repair && 'retryAt' in repair ? repair.retryAt : undefined, prerequisites: job.prerequisites, uncertainWrite: job.steps.some(step => jobWriteUnconfirmed(step.stage, step.result)), failure: failed(run) ? run!.failure!.category : undefined };
        }
        const request = state.deliveryQueue?.find(request => request.id === work.id);
        if (!request) return null;
        const run = lastRun(state, run => run.requestId === request.id);
        // A delivery request's error can be the ticket's own blocker, which may be a model's.
        return { ...base, standing: STOPPED.includes(request.status) ? 'stopped' : 'gated', stage: request.action, key: request.key, text: request.error, author: 'unknown', episode: request.requestedAt,
            failure: failed(run) ? run!.failure!.category : undefined, effects: [work, { projectId: project, kind: 'delivery', id: request.key }, { projectId: project, kind: 'delivery', id: `ticket:${request.key}` }] };
    }
    if (work.kind === 'reconciliation') {
        const request = c?.requests?.find(request => request.id === work.id);
        if (!request) return null;
        const run = lastRun(state, run => run.requestId === request.id), author = handedBack(run), stopped = STOPPED.includes(request.status), stop = stopped ? request.stop ?? null : null;
        return { ...base, standing: stopped ? 'stopped' : 'gated', stage: request.action, key: request.key, text: request.detail, author, kind: author === 'harness' ? stop?.kind ?? '' : '', stop, head: request.head, lastWorker: run?.id ?? '', episode: stop?.at ?? request.requestedAt,
            facts: { stopKind: author === 'harness' ? stop?.kind : undefined }, failure: failed(run) ? run!.failure!.category : undefined, covers: worker(run?.id),
            effects: [work, ...(c?.jobs ?? []).filter(job => !!request.key && job.key === request.key).map(job => ({ projectId: project, kind: 'delivery' as const, id: job.id })), ...issue(project, request.key), ...(request.head ? [{ projectId: project, kind: 'reconciliation' as const, id: request.head }] : [])] };
    }
    if (work.kind === 'intake') {
        const review = c?.listener.reviews.find(review => review.id === work.id);
        if (!review) return null;
        // Another delivery already owns the ticket: the review is done, not stopped.
        if (review.status === 'owned') return { ...base, standing: 'ignored', key: review.key, text: '', episode: '' };
        const run = lastRun(state, run => run.requestId === review.id), harness = !!review.prerequisiteError || !!review.failure;
        // Without a typed failure the detail is Morgan's own summary of the review.
        return { ...base, standing: review.prerequisiteError || STOPPED.includes(review.status) ? 'stopped' : 'gated', key: review.key, text: review.prerequisiteError || review.detail, author: harness ? 'harness' : 'model', kind: review.prerequisiteError ? 'dependency' : review.failure?.category ?? 'review',
            lastWorker: run?.id ?? '', episode: review.endedAt || review.queuedAt, facts: { cause: review.prerequisiteError ? 'dependency' : undefined, failure: review.failure?.category, retrying: pending(review.retry), exhausted: !!review.retry?.exhausted }, failure: failed(run) ? run!.failure!.category : undefined, covers: worker(run?.id), prerequisites: review.prerequisites };
    }
    if (work.kind === 'checkpoint') {
        const checkpoint = c?.checkpoints.find(checkpoint => checkpoint.id === work.id);
        if (!checkpoint) return null;
        // A checkpoint whose maintenance ended blocked repeats that run's error, which can be a model's blocker.
        const run = state.maintenance?.runs.find(run => run.id === checkpoint.runId), outcome = run ? stepBlocker(state, run, checkpoint.detail) : null;
        // A mailbox checkpoint repeats the intake error, which a board-enumerating model may have written.
        const intake = !run && state.intake?.error && includes(checkpoint.detail, state.intake.error) ? lastRun(state, worked => worked.stage === 'intake') : undefined;
        return { ...base, standing: STOPPED.includes(checkpoint.status) ? 'stopped' : 'gated', text: checkpoint.detail, author: outcome ? 'model' : handedBack(intake), kind: outcome ?? '', episode: `${checkpoint.startRetries ?? 0}:${checkpoint.endedAt}`,
            failure: failed(intake) ? intake!.failure!.category : undefined, retryAt: checkpoint.retryAt || undefined, effects: [work, { projectId: project, kind: 'maintenance', id: checkpoint.runId }] };
    }
    if (work.kind === 'maintenance') {
        const run = state.maintenance?.runs.find(run => run.id === work.id);
        if (!run) return null;
        const last = lastRun(state, worked => worked.requestId === run.id), outcome = stepBlocker(state, run, run.error);
        // A checkpoint that only repeats this run's stop is the same stop.
        const mirrored = (c?.checkpoints ?? []).filter(checkpoint => checkpoint.runId === run.id && STOPPED.includes(checkpoint.status) && !!run.error && checkpoint.detail === run.error).map((checkpoint): [string, string] => ['checkpoint', checkpoint.id]);
        return { ...base, standing: STOPPED.includes(run.status) ? 'stopped' : 'gated', stage: run.stage, text: run.error, author: outcome ? 'model' : 'harness', kind: outcome ?? '', lastWorker: last?.id ?? '', episode: run.endedAt || run.requestedAt, facts: { retrying: pending(run.readbackRetry), exhausted: !!run.readbackRetry?.exhausted }, covers: [...worker(last?.id), ...mirrored], uncertainWrite: !!run.steps?.some(step => unknownWrite(step.result)), failure: failed(last) ? last!.failure!.category : undefined };
    }
    if (work.kind === 'continuation') {
        const followup = state.maintenance?.runs.find(run => run.id === work.id)?.blockerFollowup;
        return followup ? { ...base, standing: STOPPED.includes(followup.status) ? 'stopped' : 'gated', text: followup.detail, author: 'unknown', episode: '' } : null;
    }
    if (work.kind === 'notice') {
        const notice = c?.notices?.entries.find(notice => notice.id === work.id);
        if (!notice) return null;
        // A recipient lookup is a model's run; what it handed back may be its own blocker.
        const run = lastRun(state, run => run.requestId === notice.id);
        return { ...base, standing: ['blocked', 'uncertain'].includes(notice.status) ? 'stopped' : 'gated', key: notice.key ?? '', text: notice.detail, author: handedBack(run), kind: notice.status === 'uncertain' ? 'uncertain' : '', lastWorker: run?.id ?? '', episode: notice.createdAt,
            facts: { cause: notice.status === 'uncertain' ? 'unconfirmed' : undefined }, failure: failed(run) ? run!.failure!.category : undefined, covers: [['slack-delivery', notice.id], ...worker(run?.id)] };
    }
    if (work.kind === 'conversation') {
        // An investigation is scheduled as a conversation; its diagnosis is read by its own collector.
        if (stage === 'it-investigation') return { ...base, standing: 'ignored', text: '', episode: '' };
        const message = state.messages.find(message => message.id === work.id);
        if (!message) return null;
        const run = lastRun(state, run => !!message.requestId && run.requestId === message.requestId);
        return { ...base, standing: ['failed', 'interrupted'].includes(message.status) ? 'stopped' : 'gated', key: message.ticket ?? '', text: message.error, author: handedBack(run), lastWorker: run?.id ?? '', episode: message.createdAt, failure: failed(run) ? run!.failure!.category : undefined, covers: [['slack-delivery', message.id], ...worker(run?.id)],
            effects: [work, ...(c?.jobs ?? []).filter(job => !!message.ticket && job.key === message.ticket).map(job => ({ projectId: project, kind: 'delivery' as const, id: job.id }))] };
    }
    return null;
}
