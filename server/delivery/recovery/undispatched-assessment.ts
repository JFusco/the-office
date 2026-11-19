import { holdReason } from '../../office/project-holds';
import { runtimeRevision } from '../../office/revision';
import { deliveryHumanInputs, deliveryInputSha256 } from '../../github/github-context';
import { harnessDelivers } from '../harness/scope';
import { metadataAppliesToHead } from '../publication/metadata-context';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { conflictOnlyAssessment } from '../repairs/conflict-repair';
import type { Store } from '../../store/store';
import { workKey, type StageResult, type TicketJob } from '../../../src/shared';

const LEAD_REVIEW_EVIDENCE = 'Office Lead review';
let running: string | undefined;
/** The revision of the code this service is running; read once. */
const runningRevision = () => running ??= runtimeRevision().hash;

/**
 * The saved assessment the harness may act on again, or undefined. It must be the job's last step and the
 * one the harness accepted (the review context points at it), a conflict-only readiness assessment of the
 * current head and pull request, read-only and settled, and what the review read must be unchanged. Only
 * an adopted pull request with no checkout of its own qualifies: its repair starts in a clone the harness
 * makes. An assessment whose review was already closed, which saves evidence on the result, is not acted
 * on twice. Pull request metadata under
 * repair and a CI repair waiting for a person keep their own handling.
 */
export function redispatchableAssessment(store: Store, job: TicketJob): StageResult | undefined {
    const last = job.steps.at(-1), result = last?.result;
    if (last?.stage !== 'lead-pr' || !result || job.reviewContext?.step !== job.steps.length - 1 || !job.existingPR || job.worktree) return undefined;
    if (!conflictOnlyAssessment(result) || result.commit !== job.head || result.prId !== job.pr || result.paidRuns !== 0) return undefined;
    if (metadataAppliesToHead(store, job) || job.ciRepairs?.at(-1)?.phase === 'blocked') return undefined;
    // The close of the review saves its own evidence on the result; one that has it was already acted on.
    if (result.evidence.some(item => item.environment === LEAD_REVIEW_EVIDENCE)) return undefined;
    const inputs = job.reviewInputSha256 ? job.reviewInputSha256 === deliveryInputSha256(store, job.key) : !deliveryHumanInputs(store, job.key).length;
    return inputs ? result : undefined;
}

/**
 * Queues again a hands-off job that stopped inside the harness after its conflict-only readiness
 * assessment was accepted (`redispatchableAssessment`): nothing was written, and the stop is one no
 * other recovery owns. The saved assessment is then dispatched without another review
 * (`redispatch-assessment.ts`). A refusal by the harness can only end differently when its code or the
 * provider changed, so this happens at most once per running revision; a job that is parked, held,
 * awaiting a merge, claimed, or has any unsettled receipt, board move or effect is left alone.
 */
export function requeueUndispatchedAssessments(store: Store, jobs: TicketJob[], revision = runningRevision()): string[] {
    const queued: string[] = [];
    if (store.state.paused || store.state.draining) return queued;
    for (const job of jobs) {
        if (!harnessDelivers(store, job) || job.status !== 'blocked' || job.stage !== 'lead-pr' || job.stop?.kind !== 'unclassified' || job.assessmentRedispatch?.revision === revision) continue;
        if (job.parked || !job.pr || holdReason(store.project, job.key) || holdReason(store.project, `GH-${job.pr}`) || job.mergeAttempt || job.mergeIntentId || job.mergeCommit || job.mergeApprovalRequired || job.prerequisites?.length) continue;
        if (!redispatchableAssessment(store, job)) continue;
        if (job.boardUpdates?.some(update => update.status !== 'verified') || job.steps.some(step => hasUncertainEffects(step.stage, step.result))) continue;
        // The review that produced the assessment finished; nothing of this job is running or claimed.
        const runs = store.state.workLog?.filter(work => work.requestId === job.id) || [];
        if (runs.some(work => work.status === 'running') || runs.filter(work => work.stage === 'github-lead-pr').at(-1)?.executionStatus !== 'completed') continue;
        if (store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id)) continue;
        const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
            .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
        if (effects.some(effect => effect.status !== 'verified' && !(effect.status === 'rejected' && !effect.dispatchedAt))) continue;
        job.assessmentRedispatch = { revision, step: job.steps.length - 1, at: store.clock.now().toISOString() };
        job.status = 'queued';
        job.detail = 'The saved conflict assessment was accepted but not acted on; the harness acts on it again without another review. Prior reviews, effects and repair budgets retained.';
        store.emit('delivery-resumed', `${job.key}: ${job.detail}`, 'pm', job.key);
        queued.push(job.key);
    }
    return queued;
}
