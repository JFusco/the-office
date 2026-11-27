import { touchesUnsettled, type UnsettledEffects } from '../../operations/stale-records';
import { temporaryReadFailure } from '../../scheduling/temporary-read';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { harnessDelivers } from '../harness/scope';
import { hasUncertainEffects } from '../pipeline/uncertain-effects';
import { quotaStop } from './transient-schedule';
import type { Store } from '../../store/store';
import type { BoardUpdate, DeliveryRetryBinding, TicketJob } from '../../../src/shared';

/** The outer stop a draft's own card move saves when its write could not be read back (`move-lane.ts`, `project-progress.ts`). */
export const BOARD_STOP = /Board transition needs read-back|Previous board transition remains uncertain/;
/** What a confirmed miss saves; a person resolves it. */
export const NOT_AT_TARGET = 'read back: not at target; not resent';

export type DraftAdmission =
    | { mode: 'draft' | 'board'; diagnostic: string; reason: string; updates?: NonNullable<DeliveryRetryBinding['updates']> }
    | { refused: string };

const retryable = (text: string) => temporaryReadFailure(text) || quotaStop(text);
const ref = (job: TicketJob, store: Pick<Store, 'project'>) => [{ projectId: store.project.id, kind: 'delivery' as const, id: job.id }, ...(/^GH-\d+$/.test(job.key) ? [{ projectId: store.project.id, kind: 'issue' as const, id: job.key.slice(3) }] : [])];

/** A write of this job that the Effects ledger still holds dispatching or uncertain, by work reference or attempt. */
export function unsettledFor(store: Pick<Store, 'project'>, job: TicketJob, unsettled: UnsettledEffects): boolean {
    return touchesUnsettled(unsettled, ref(job, store)) || unsettled.attempts.has(job.id);
}

/** The draft's saved card moves that a board recovery may only read back: uncertain, at this stage and head, with a transient provider diagnostic. */
function boardOnly(job: TicketJob, open: BoardUpdate[]): string | null {
    if (!open.length) return 'No uncertain card move is saved';
    for (const update of open) {
        if (update.readBack?.outcome === 'not-at-target') return 'A card move was read back as not at its target; a person resolves it';
        if (update.status !== 'uncertain') return 'A card move was started and not settled; it is not read back automatically';
        if (update.stage !== 'draft' || update.head !== job.head) return 'An uncertain card move belongs to another stage or head';
        if (!update.item || !update.field || !update.option || !update.target) return 'An uncertain card move has no identifiable item, field and target';
        if (!retryable(update.detail)) return 'An uncertain card move failed for a reason that is not a transient provider failure';
    }
    return null;
}

/**
 * Whether a stopped hands-off `draft` may run again by itself, and how. Model-free harness publication only, on
 * current registered eligibility, with an identified candidate and nothing of its own unsettled. An ordinary draft
 * retry needs a transient stop with every card move verified (`draft`). A board recovery needs the outer stop of
 * its own card move and only uncertain moves of this draft and head whose saved diagnostic is transient (`board`):
 * it is read-only for its whole life. A saved draft is judged on its current evidence, whatever its age.
 */
export function draftRetryAdmission(store: Store, job: TicketJob, unsettled: UnsettledEffects | (() => UnsettledEffects), detail = job.detail): DraftAdmission {
    const admit = (admission: Exclude<DraftAdmission, { refused: string }>): DraftAdmission =>
        unsettledFor(store, job, typeof unsettled === 'function' ? unsettled() : unsettled) ? { refused: 'A write of this job is unsettled in the Effects ledger' } : admission;
    if (job.stage !== 'draft') return { refused: 'Not a draft' };
    if (!harnessDelivers(store, job)) return { refused: 'This draft keeps its dedicated recovery route' };
    if (!/^[a-f0-9]{40}$/.test(job.head) || !job.branch || !job.worktree) return { refused: 'No identified candidate to publish' };
    if (job.parked) return { refused: 'The job is parked for a decision' };
    if (job.mergeAttempt) return { refused: 'A merge was attempted' };
    if (job.steps.some(step => hasUncertainEffects(step.stage, step.result))) return { refused: 'A saved result has an unconfirmed write receipt' };
    if (store.state.coordination?.requests?.some(request => request.key === job.key && ['queued', 'working'].includes(request.status)))
        return { refused: 'A recovery request owns this ticket' };
    const eligibility = assessDeliveryEligibility(store, job);
    // Drain only defers dispatch; it does not take the retry from the job.
    const blockers = eligibility.blockers.filter(blocker => blocker !== 'Office is draining' && blocker !== 'Project is paused');
    if (blockers.length) return { refused: blockers.join('; ') };
    const open = (job.boardUpdates || []).filter(update => update.status !== 'verified' || update.readBack);
    if (open.some(update => update.readBack?.outcome === 'not-at-target')) return { refused: 'A card move was read back as not at its target; a person resolves it' };
    const bound = job.retry?.binding?.mode === 'board' && job.retry.binding.head === job.head && job.retry.stage === job.stage && job.retry.head === job.head;
    const updates = open.map(update => ({ item: update.item, field: update.field, option: update.option, at: update.at }));
    if (bound) {
        // Once a recovery is read-only it stays so, through partial matches and later failed reads.
        const saved = job.retry!.binding!.updates || [];
        if (open.some(update => !saved.some(s => s.item === update.item && s.field === update.field && s.option === update.option && s.at === update.at)))
            return { refused: 'A card move outside the saved recovery is open' };
        const refusal = open.length ? boardOnly(job, open) : null;
        if (refusal) return { refused: refusal };
        // The latest read decides: the original outer stop carries the saved move's own diagnostic.
        const diagnostic = BOARD_STOP.test(detail) && job.stop?.kind === 'uncertain-effect' ? open.at(-1)?.detail ?? job.retry!.latest?.detail ?? detail : detail;
        return retryable(diagnostic) && (job.stop?.kind !== 'uncertain-effect' || BOARD_STOP.test(detail)) ? admit({ mode: 'board', diagnostic, reason: 'card read-back continues read-only', updates: saved })
            : { refused: 'The latest card or publication read did not fail for a transient reason' };
    }
    if (job.stop?.kind === 'uncertain-effect') {
        if (!BOARD_STOP.test(detail)) return { refused: 'An unrelated write is unconfirmed' };
        const refusal = boardOnly(job, open);
        if (refusal) return { refused: refusal };
        return admit({ mode: 'board', diagnostic: open.at(-1)!.detail, reason: 'only uncertain card moves of this draft, with a transient provider failure', updates });
    }
    if (open.length) return { refused: 'A card move is not verified' };
    if (job.stop?.kind !== 'transient' && !(job.stop?.kind === 'unclassified' && retryable(detail))) return { refused: 'The stop is not a transient read' };
    if (!retryable(detail)) return { refused: 'The stop is not a transient read' };
    return admit({ mode: 'draft', diagnostic: detail, reason: 'transient stop with every card move verified' });
}
