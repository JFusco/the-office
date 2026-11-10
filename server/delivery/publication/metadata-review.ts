import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { artifact } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import { currentAssignment } from '../../workers/assignment-context';
import { assertMetadataBinding, metadataAppliesToHead } from './metadata-context';
import { metadataProvider, metadataOwnership } from './metadata-provider';
import { savedMetadataAssessment } from './metadata-assessment';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { StageResult, TicketJob } from '../../../src/shared';

function verdict(job: TicketJob, result: StageResult, allowOrdinaryBlock = false): void {
    const r = job.prMetadataRepair!;
    const waiting = allowOrdinaryBlock && ['blocked', 'failed'].includes(result.outcome) && !result.resolution?.release &&
        (!result.resolution || ['provider-wait', 'source-repair', 'conflict-repair'].includes(result.resolution.kind));
    if ((!waiting && result.outcome !== 'passed') || result.commit !== r.binding.head || result.prId !== r.binding.pr ||
        result.branch !== r.binding.branch || result.worktree !== r.binding.worktree ||
        new Set(result.findings.map(f => f.id)).size !== result.findings.length ||
        r.binding.findingIds.some(id => !result.findings.some(f => f.id === id && f.status === 'verified')))
        throw new Error('Fresh Lead review must explicitly verify every original metadata finding');
}

/** The one metadata assessment is context, never the independent readiness verdict. */
export async function acceptMetadataReview(delivery: GitHubDelivery, job: TicketJob, result: StageResult, before: Set<string>): Promise<void> {
    if (!metadataAppliesToHead(delivery.store, job)) return;
    assertMetadataBinding(delivery, job);
    const r = job.prMetadataRepair!, claim = currentAssignment()?.claim;
    if (!['review', 'done'].includes(r.phase) || r.publishedAfterStep === undefined || job.steps.length - 1 < r.publishedAfterStep ||
        job.stage !== 'lead-pr' || !claim || claim.work.kind !== 'delivery' || claim.work.id !== job.id || claim.work.projectId !== delivery.store.project.id || claim.stage !== 'lead-pr' ||
        !delivery.store.activeClaims().some(c => isDeepStrictEqual(c, claim)))
        throw new Error('Actual fresh metadata readiness claim is required');
    verdict(job, result, true);
    const workers = (delivery.store.state.workLog || []).filter(w => !before.has(w.id) && w.requestId === job.id && w.stage === 'github-lead-pr');
    if (workers.length !== 1 || workers[0].role !== 'lead' || workers[0].claimId !== claim.id || !completedExecution(delivery.store, workers[0]))
        throw new Error('One completed actual fresh Lead readiness worker is required');
    const worker = workers[0], resultPath = resolve(delivery.store.dataRoot, 'sessions', worker.id, 'result.json'), file = artifact(delivery.store, resultPath);
    const native = JSON.parse(readFileSync(file.path, 'utf8'));
    const assignment = JSON.parse(readFileSync(artifact(delivery.store, resolve(delivery.store.dataRoot, 'sessions', worker.id, 'assignment.json')).path, 'utf8'));
    if (native.session !== worker.sessionId || !isDeepStrictEqual(native.result, result) || assignment.id !== worker.id || assignment.claimId !== claim.id ||
        assignment.role !== 'lead' || assignment.stage !== worker.stage || !isDeepStrictEqual(assignment.work, claim.work) ||
        assignment.scope?.repository !== r.binding.repository || realpathSync(assignment.scope?.worktree) !== realpathSync(r.binding.worktree))
        throw new Error('Original fresh readiness result or assignment differs');
    await currentMetadata(delivery, job);
    assertMetadataBinding(delivery, job);
    const step = job.steps.at(-1)!; step.workerId = worker.id; step.nativeResultSha256 = file.sha256;
    if (result.outcome !== 'passed') {
        delete r.review; delete r.reviewedAfterStep;
        r.phase = 'review'; delivery.store.save(); return;
    }
    r.review = { workerId: worker.id, resultPath, resultSha256: file.sha256, claimId: claim.id };
    r.reviewedAfterStep = job.steps.length - 1;
    r.phase = 'done'; delivery.store.save();
}

async function currentMetadata(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const selected = savedMetadataAssessment(delivery, job).selected!, pr = await metadataProvider(delivery, job);
    if (pr.title !== selected.title || pr.body !== selected.body) throw new Error('Reviewed metadata changed');
    await metadataOwnership(delivery, job, false);
    assertMetadataBinding(delivery, job);
}

/** Rechecked at ordinary merge preflight, including after intervening awaits. */
export async function requireMetadataReview(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    if (!metadataAppliesToHead(delivery.store, job)) return;
    assertMetadataBinding(delivery, job);
    const r = job.prMetadataRepair!, proof = r.review, index = r.reviewedAfterStep;
    if (r.phase !== 'done' || !proof || index === undefined || r.publishedAfterStep === undefined || index < r.publishedAfterStep)
        throw new Error('Fresh independent metadata readiness remains required');
    const step = job.steps[index], worker = delivery.store.state.workLog?.find(w => w.id === proof.workerId);
    if (step?.stage !== 'lead-pr' || step.workerId !== proof.workerId || step.nativeResultSha256 !== proof.resultSha256 ||
        !worker || worker.role !== 'lead' || worker.stage !== 'github-lead-pr' || worker.requestId !== job.id || worker.claimId !== proof.claimId ||
        !completedExecution(delivery.store, worker) || proof.resultPath !== resolve(delivery.store.dataRoot, 'sessions', worker.id, 'result.json'))
        throw new Error('Original completed fresh metadata review is unavailable');
    const file = artifact(delivery.store, proof.resultPath), native = JSON.parse(readFileSync(file.path, 'utf8'));
    if (file.sha256 !== proof.resultSha256 || native.session !== worker.sessionId) throw new Error('Fresh metadata review proof changed');
    verdict(job, native.result);
    await currentMetadata(delivery, job);
}
