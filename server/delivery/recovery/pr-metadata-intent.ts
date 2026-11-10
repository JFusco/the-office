import { z } from 'zod';
import { isDeepStrictEqual } from 'node:util';
import { digest } from '../../store/readback-evidence';
import { completedExecution } from '../../workers/worker-completion';
import { continuationWorkerProof } from './implementation/continuation-evidence';
import { hasUncertainEffects } from '../pipeline/github-delivery';
import { harnessDelivers } from '../harness/scope';
import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob } from '../../../src/shared';

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const PRMetadataRecoveryInput = z.object({ jobId: z.string().uuid(), head: z.string().regex(/^[a-f0-9]{40}$/), workerId: z.string().uuid(),
    parkAt: z.string().datetime(), parkSha256: hash, proposal: z.object({ path: z.string().startsWith('/'), sha256: hash, bytes: z.number().int().positive().max(200000) }).strict(),
    authorization: z.object({ reference: z.string().min(1).max(1024), sha256: hash }).strict(),
}).strict();

export function metadataHistory(job: TicketJob): string {
    return digest({ stage: job.stage, parked: job.parked, steps: job.steps, repairCycle: job.repairCycle,
        boardUpdates: job.boardUpdates, approach: job.approach, decisions: job.decisions });
}

/** Positive original completion and permission park, rather than a prose-based auto-unblock. */
export function originalMetadataWorker(store: Store, job: TicketJob, workerId: string): string[] {
    const step = job.steps.at(-1), worker = store.state.workLog?.find(w => w.id === workerId), park = job.parked;
    if (!harnessDelivers(store, job) || job.status !== 'blocked' || job.stage !== 'update-base' || !park?.published || park.release || park.stage !== job.stage ||
        !step || step.stage !== job.stage || step.result.outcome !== 'blocked' || step.result.resolution?.kind !== 'permission' || step.result.resolution.release ||
        park.reason !== (step.result.blocker || step.result.summary).trim() || step.result.commit !== job.head || step.result.prId !== job.pr ||
        !worker || worker.role !== 'developer' || worker.stage !== 'github-update-base' || !completedExecution(store, worker) ||
        !worker.endedAt || Date.parse(worker.endedAt) > Date.parse(park.at) || job.steps.some(s => hasUncertainEffects(s.stage, s.result)))
        throw new Error('Exact completed original metadata permission park is required');
    const proof = continuationWorkerProof(store, job, worker, false, job.worktree);
    if (!isDeepStrictEqual(proof.result, step.result)) throw new Error('Original blocked native source result differs');
    const ids = step.result.resolution.findingIds, open = step.result.findings.filter(f => f.status === 'open').map(f => f.id);
    if (!ids.length || new Set(ids).size !== ids.length || !isDeepStrictEqual([...open].sort(), [...ids].sort()))
        throw new Error('Explicit original metadata finding set is required');
    return ids;
}

/** The operator command authorizes assessment of this exact proposal; it grants no merge or source acceptance. */
export function enqueueMetadataRecovery(store: Store, key: string, value: unknown): HarnessRequest {
    const input = PRMetadataRecoveryInput.parse(value), jobs = store.state.coordination?.jobs?.filter(j => j.id === input.jobId && j.key === key) || [], job = jobs[0];
    if (jobs.length !== 1 || !job || job.head !== input.head) throw new Error('One original metadata job/head is required');
    const requests = store.state.coordination!.requests ??= [];
    const old = requests.filter(q => q.action === 'reconcile-pr-metadata' && q.key === key && q.head === input.head);
    if (old.length > 1 || old.length && !isDeepStrictEqual(old[0].prMetadataRecovery, input)) throw new Error('Original metadata recovery intent changed');
    if (old.length) return old[0];
    originalMetadataWorker(store, job, input.workerId);
    if (job.prMetadataRepair || job.parked?.at !== input.parkAt || digest(job.parked) !== input.parkSha256)
        throw new Error('Original metadata park lease changed');
    const request: HarnessRequest = { id: crypto.randomUUID(), action: 'reconcile-pr-metadata', key, head: input.head, prMetadataRecovery: input,
        lane: 'delivery', status: 'queued', requestedAt: store.clock.now().toISOString(), detail: 'Exact original metadata assessment authorized; source and merge gates remain.' };
    requests.push(request); store.save(); return request;
}
