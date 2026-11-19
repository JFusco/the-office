import { resolve } from 'node:path';
import { deliveryHumanInputs, deliveryInputSha256 } from '../../github/github-context';
import { holdReason } from '../../office/project-holds';
import { runtimeRevision } from '../../office/revision';
import { officeQAEvidenceGap, QA_GATE_REFUSALS } from '../../qa/report-evidence';
import { withoutReviewAdvisories } from '../findings/review-advisories';
import { harnessDelivers } from '../harness/scope';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import { workKey, type StageResult, type TicketJob } from '../../../src/shared';

let running: string | undefined;
/** The revision of the code this service is running; read once. */
const runningRevision = () => running ??= runtimeRevision().hash;

/**
 * True when the job stopped because the QA gate refused this result, and the human inputs QA ran on are
 * unchanged. The gate records its refusal on the job; a job refused before it did is recognised by its
 * stop saying exactly one of the things the gate says, which nothing else in delivery says. Any other
 * stop after a passing QA result (human input that arrived during the run, a later check) is not this.
 */
function refusedByGate(store: Store, job: TicketJob): boolean {
    const refusal = job.qaGateRefusal;
    if (refusal) return refusal.step === job.steps.length - 1 && refusal.inputSha256 === deliveryInputSha256(store, job.key);
    if (!QA_GATE_REFUSALS.some(said => job.detail === `Error: ${said}`)) return false;
    return job.reviewInputSha256 ? job.reviewInputSha256 === deliveryInputSha256(store, job.key) : !deliveryHumanInputs(store, job.key).length;
}

/**
 * Why the job's saved QA result cannot be accepted now, or '' when it can. It must be the job's last
 * step, a pass for the current head, refused by the gate on inputs that have not changed, with its saved
 * report and evidence still in place; the gate is run again on it exactly as acceptance runs it.
 */
export function refusedQADecline(store: Store, job: TicketJob): string {
    const last = job.steps.at(-1), result = last?.result;
    if (last?.stage !== 'validate' || !result?.qa || result.outcome !== 'passed' || result.commit !== job.head) return 'the last step is not a passing QA result for the current head';
    if (job.implementationContinuation || job.implementationRecovery || job.discoveryRecovery || job.stoppedBaseUpdate) return 'the job is under a continuation or recovery with its own gates';
    if (!refusedByGate(store, job)) return job.qaGateRefusal?.step === job.steps.length - 1 ? 'the human inputs QA ran on have changed' : 'the stop was not the QA gate refusing this result';
    const gap = officeQAEvidenceGap(withoutReviewAdvisories(store, job, result), { key: job.key, head: job.head, stage: 'github-validate', approach: job.approach }, resolve(store.dataRoot, 'ticket-work', job.id));
    return gap ? `the QA gate still refuses it: ${gap}` : '';
}

/** The passing QA result the gate refused and would accept now, or undefined (`refusedQADecline`). */
export function acceptableRefusedQA(store: Store, job: TicketJob): StageResult | undefined {
    return refusedQADecline(store, job) ? undefined : job.steps.at(-1)!.result;
}

/**
 * Queues again a hands-off job blocked at validate whose saved QA result the gate refused and now accepts
 * (`acceptableRefusedQA`). The saved result is then accepted without another QA run
 * (`reaccept-qa-result.ts`). At most once per running revision; a job that is parked, held, awaiting a
 * merge, claimed, or has any unsettled receipt, board move or effect is left alone.
 */
export function requeueRefusedQAResults(store: Store, jobs: TicketJob[], revision = runningRevision()): string[] {
    const queued: string[] = [];
    if (store.state.paused || store.state.draining) return queued;
    for (const job of jobs) {
        if (!harnessDelivers(store, job) || job.status !== 'blocked' || job.stage !== 'validate' || job.stop?.kind !== 'unclassified' || job.qaReaccept?.revision === revision) continue;
        if (job.steps.at(-1)?.stage !== 'validate') continue;
        if (job.parked || holdReason(store.project, job.key) || job.pr && holdReason(store.project, `GH-${job.pr}`) || job.mergeAttempt || job.mergeIntentId || job.mergeCommit || job.mergeApprovalRequired || job.prerequisites?.length) continue;
        if (job.boardUpdates?.some(update => update.status !== 'verified') || job.steps.some(step => hasUncertainEffects(step.stage, step.result))) continue;
        const runs = store.state.workLog?.filter(work => work.requestId === job.id) || [];
        if (runs.some(work => work.status === 'running') || runs.filter(work => work.stage === 'github-validate').at(-1)?.executionStatus !== 'completed') continue;
        if (store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id)) continue;
        const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
            .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
        if (effects.some(effect => effect.status !== 'verified' && !(effect.status === 'rejected' && !effect.dispatchedAt))) continue;
        if (!acceptableRefusedQA(store, job)) continue;
        const at = store.clock.now().toISOString();
        // A refusal from before the gate recorded one is recorded now, while the stop still says what it was.
        job.qaGateRefusal ??= { step: job.steps.length - 1, inputSha256: deliveryInputSha256(store, job.key), at };
        job.qaReaccept = { revision, step: job.steps.length - 1, at };
        job.status = 'queued';
        job.detail = 'The saved QA result passes the QA gate; the harness accepts it without another QA run. Prior reviews, effects and repair budgets retained.';
        store.emit('delivery-resumed', `${job.key}: ${job.detail}`, 'pm', job.key);
        queued.push(job.key);
    }
    return queued;
}
