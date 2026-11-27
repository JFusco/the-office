import { unsettledEffects } from '../../operations/unsettled-effects';
import type { UnsettledEffects } from '../../operations/stale-records';
import { incompleteReadOutput, temporaryReadFailure } from '../../scheduling/temporary-read';
import { hasUncertainEffects } from '../pipeline/uncertain-effects';
import { BOARD_STOP, draftRetryAdmission, unsettledFor } from './draft-retry';
import { activeRetry, bindingChanged, inScope, queuedRetry } from './retry-binding';
import { deliveryPolicy, quotaCap, quotaStop, type DeliveryPolicy } from './transient-schedule';
import type { Store } from '../../store/store';
import type { DeliveryRetryBinding, TicketJob } from '../../../src/shared';

/** A job at a read-only review stage with nothing written or unsettled: the stage whose stop is re-run as it was. */
export function readOnlyStageJob(job: Pick<TicketJob, 'stage' | 'mergeAttempt' | 'steps'>): boolean {
    return ['review', 'lead-pr'].includes(job.stage) && !job.mergeAttempt && !job.steps.some(s => s.result.receipts.some(r => r.uncertain || !r.verified && !/^(?:get|read|query|inspect)\b/i.test(r.action)));
}

/**
 * The one current answer to "will the Office retry this delivery stop by itself?", for the planner, the timer,
 * claim entry, the outbox and the incident ledger alike. `pending`: yes, with retries or a quota wait left.
 * `ineligible`: the stop looks retryable but something vetoes it, or a planned retry was withdrawn; a person's.
 * `exhausted`: the allowance for this stage and head is spent; a person's. `none`: not a delivery retry at all.
 */
export interface DeliveryRetryDecision {
    state: 'none' | 'pending' | 'ineligible' | 'exhausted';
    reason: string;
    mode?: DeliveryRetryBinding['mode'];
    /** The failure the schedule is decided from: the latest read, or a board recovery's saved card diagnostic. */
    diagnostic?: string;
    policy?: DeliveryPolicy;
    updates?: DeliveryRetryBinding['updates'];
    /** What the decision was made for. A reader matches it to the job, stop, stage and head it sees. */
    job: string; stop: string; stage: string; head: string; at: string;
}

type RetryStore = Pick<Store, 'project' | 'state' | 'db' | 'clock' | 'activeClaims'>;
/** The Effects ledger as read once for a set of decisions, or the read itself, made only when a decision needs it. */
export type UnsettledRead = UnsettledEffects | (() => UnsettledEffects);
const retryable = (text: string) => temporaryReadFailure(text) || incompleteReadOutput(text) || quotaStop(text);

/** The decision as read for this job now. Read-only: it changes nothing. */
export function deliveryRetryDecision(store: RetryStore, job: TicketJob, now: Date, read: UnsettledRead = () => unsettledEffects(store)): DeliveryRetryDecision {
    // The ledger is read only once a decision gets as far as needing it: a stop that is not a retry costs no query.
    const unsettled = typeof read === 'function' ? read : () => read;
    const base = { job: job.id, stop: job.stop?.at ?? '', stage: job.stage, head: job.head, at: now.toISOString() };
    const none = (reason: string): DeliveryRetryDecision => ({ ...base, state: 'none', reason });
    // A queued retry, or one its claim has entered and not yet handed to the stage, is still decided on its stop.
    const queued = !!queuedRetry(job) || job.status === 'working' && !!activeRetry(job);
    if (!['blocked', 'interrupted'].includes(job.status) && !queued) return none('Not stopped');
    const prior = job.retry, retry = inScope(prior, job) ? prior : undefined;
    // The same stop with its stage, head or candidate changed underneath: the planned retry is stale and the stop a
    // person's. Only a genuinely new stop at another stage or head gets a fresh allowance.
    const stale = prior?.binding && prior.binding.stop === base.stop ? bindingChanged(job, prior.binding) : null;
    if (stale) return { ...base, state: 'ineligible', reason: stale };
    if (prior?.withdrawn && prior.withdrawn.stop === base.stop) return { ...base, state: 'ineligible', reason: prior.withdrawn.reason };
    // While queued the job's detail says so; the stop's own diagnostic is the one saved when it was queued.
    const detail = queued ? retry?.binding?.detail ?? job.detail : job.detail;
    // A bound retry is the evidence that this stop was retryable: a veto of it is a person's, not silence.
    const bound = !!retry?.binding && retry.binding.stop === base.stop;
    // So is a definitive card miss, and a record this stage and head already planned retries on.
    const retryShaped = bound || retryable(detail) || BOARD_STOP.test(detail) || !!job.boardUpdates?.some(update => update.readBack) || !!retry?.binding;
    const veto = (reason: string): DeliveryRetryDecision => ({ ...base, state: retryShaped ? 'ineligible' : 'none', reason });
    let mode: DeliveryRetryBinding['mode'], diagnostic: string, reason: string, updates: DeliveryRetryBinding['updates'];
    if (['review', 'lead-pr'].includes(job.stage)) {
        if (!readOnlyStageJob(job) || job.steps.some(step => hasUncertainEffects(step.stage, step.result))) return veto('A saved result has an unconfirmed write receipt');
        // A failed write keeps its uncertainty whatever HTTP status its text carries.
        if (job.stop?.kind === 'uncertain-effect') return veto('A write on this job is unconfirmed');
        if (!retryable(detail)) return none('The stop is not a transient read');
        if (unsettledFor(store, job, unsettled())) return veto('A write of this job is unsettled in the Effects ledger');
        mode = 'read'; diagnostic = detail; reason = 'read-only review stage';
    } else if (job.stage === 'draft') {
        const admission = draftRetryAdmission(store as Store, job, unsettled, detail);
        if ('refused' in admission) return veto(admission.refused);
        ({ mode, diagnostic, reason, updates } = admission);
    } else return none('Only review stages and a hands-off draft are retried here');
    if (bound) {
        if (retry!.binding!.mode !== mode) return { ...base, state: 'ineligible', reason: `The ${retry!.binding!.mode} retry no longer matches this ${mode} stop` };
    }
    const policy = deliveryPolicy(diagnostic, retry);
    if (retry?.exhausted) return { ...base, state: 'exhausted', reason: 'The retry allowance for this stage and head is spent', mode, diagnostic, policy };
    if (policy.kind === 'quota') {
        const since = retry?.quota?.since ?? (Number.isFinite(Date.parse(base.stop)) ? base.stop : base.at);
        if (now.getTime() >= quotaCap(since)) return { ...base, state: 'exhausted', reason: 'GitHub quota did not reset within six hours', mode, diagnostic, policy };
    } else {
        // A record saved before scoping keeps the three attempts it was planned with.
        const limit = retry && !retry.binding && retry.limit !== undefined ? Math.min(policy.limit, retry.limit) : policy.limit;
        if ((retry?.attempts ?? 0) >= limit && !retry?.nextAt && !queued) return { ...base, state: 'exhausted', reason: `All ${limit} counted retries for this stage and head failed`, mode, diagnostic, policy };
        return { ...base, state: 'pending', reason, mode, diagnostic, policy: { ...policy, limit }, updates };
    }
    return { ...base, state: 'pending', reason, mode, diagnostic, policy, updates };
}

/**
 * The decision for any delivery job of the store at one time, each made when first asked for and kept, with the
 * Effects ledger read at most once, and only when some decision needs it.
 */
export function deliveryRetryDecisions(store: RetryStore, now: Date, known?: UnsettledEffects): (job: TicketJob) => DeliveryRetryDecision | undefined {
    let ledger = known;
    const read = () => ledger ??= unsettledEffects(store), decided = new Map<string, DeliveryRetryDecision>();
    return job => {
        const saved = store.state.coordination?.jobs?.find(candidate => candidate.id === job.id);
        if (!saved) return undefined;
        if (!decided.has(saved.id)) decided.set(saved.id, deliveryRetryDecision(store, saved, now, read));
        return decided.get(saved.id);
    };
}

/** The decision still describes this job as it stands: same stop, stage and head. */
export const decidedFor = (decision: DeliveryRetryDecision | undefined, job: Pick<TicketJob, 'id' | 'stage' | 'head' | 'stop'>) =>
    !!decision && decision.job === job.id && decision.stage === job.stage && decision.head === job.head && decision.stop === (job.stop?.at ?? '');
