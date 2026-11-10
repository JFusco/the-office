import { isDeepStrictEqual } from 'node:util';
import { resolve } from 'node:path';
import { workKey, type HarnessRequest } from '../../../src/shared';
import { digest, artifact } from '../../store/readback-evidence';
import { bindMetadata, assertMetadataBinding } from '../publication/metadata-context';
import { metadataProvider, metadataOwnership } from '../publication/metadata-provider';
import { metadataClaim } from '../publication/metadata-claim';
import { assessPRMetadata, savedMetadataAssessment } from '../publication/metadata-assessment';
import { publishMetadata } from '../publication/publish-metadata';
import { metadataHistory, originalMetadataWorker, PRMetadataRecoveryInput } from './pr-metadata-intent';
import { metadataPark } from './pr-metadata-park';
import { activeEffectId } from '../harness/effect';
import type { GitHubDelivery } from '../pipeline/github-delivery';

/** One original operator-authorized recovery, kept parked until actual publication and both returns verify. */
export async function reconcilePRMetadata(delivery: GitHubDelivery, request: HarnessRequest): Promise<void> {
    const { store } = delivery, input = PRMetadataRecoveryInput.parse(request.prMetadataRecovery);
    const job = delivery.jobs.find(j => j.id === input.jobId && j.key === request.key && j.head === input.head);
    if (!job || request.action !== 'reconcile-pr-metadata' || request.status !== 'working' || request.head !== input.head ||
        store.state.coordination?.requests?.find(q => q.id === request.id) !== request)
        throw new Error('Exact original registered metadata request is required');
    const findings = originalMetadataWorker(store, job, input.workerId);
    if (job.parked?.at !== input.parkAt || digest(job.parked) !== input.parkSha256) throw new Error('Original metadata park changed');
    if (!job.prMetadataRepair) {
        const pr = await delivery.verifyPR(job, true);
        const r = bindMetadata(delivery, job, pr, findings, 'original-recovery');
        r.original = { workerId: input.workerId, parkAt: input.parkAt, parkSha256: input.parkSha256, proposal: input.proposal, authorization: input.authorization,
            requestId: request.id, historySha256: metadataHistory(job) };
        job.prMetadataRepair = r; store.save();
    }
    const r = job.prMetadataRepair;
    const guard = async () => {
        assertMetadataBinding(delivery, job); metadataClaim(delivery, job);
        if (r.origin !== 'original-recovery' || !r.original || r.original.requestId !== request.id || !isDeepStrictEqual(request.prMetadataRecovery, input) ||
            r.original.workerId !== input.workerId || r.original.parkSha256 !== input.parkSha256 || r.original.parkAt !== input.parkAt ||
            !isDeepStrictEqual(r.original.proposal, input.proposal) || !isDeepStrictEqual(r.original.authorization, input.authorization) ||
            r.original.historySha256 !== metadataHistory(job) || digest(job.parked) !== input.parkSha256 || !isDeepStrictEqual(originalMetadataWorker(store, job, input.workerId), r.binding.findingIds))
            throw new Error('Original metadata history, authorization, proposal or park changed');
        const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
        const metadataEffectId = activeEffectId(store, `harness:${job.id}:pr-metadata:${r.id}`);
        if (effects.some(e => e.status !== 'verified' && !(e.status === 'rejected' && !e.dispatchedAt) &&
            !(e.operation === 'github-pr-metadata' && e.id === metadataEffectId) &&
            !(e.operation === 'github-project-status' && e.id.startsWith(`harness:${job.id}:metadata-park:${r.id}:`))))
            throw new Error('An original unrelated write remains uncertain');
        const proposal = artifact(store, input.proposal.path);
        if (proposal.sha256 !== input.proposal.sha256 || input.proposal.path !== resolve(store.dataRoot, 'ticket-work', job.id, 'update-base-checks', `pr-${job.pr}-body.md`))
            throw new Error('Original metadata proposal changed');
        await metadataProvider(delivery, job);
        await metadataOwnership(delivery, job, !store.getEffect(metadataEffectId)?.dispatchedAt && !['review', 'done'].includes(r.phase));
        assertMetadataBinding(delivery, job); metadataClaim(delivery, job);
    };
    await guard();
    const parked = await metadataPark(delivery, job, guard);
    if (r.phase === 'assessment') await assessPRMetadata(delivery, job, resolve(store.dataRoot, 'ticket-work', job.id));
    if (r.phase === 'blocked') throw new Error(r.assessment?.summary || 'Metadata reassessment retained the original park');
    if (r.phase === 'publish') await publishMetadata(delivery, job);
    if (r.phase !== 'review') throw new Error('Verified original metadata publication is required');
    const selected = savedMetadataAssessment(delivery, job).selected!, current = await metadataProvider(delivery, job);
    if (current.title !== selected.title || current.body !== selected.body) throw new Error('Original selected metadata is not published');
    const returns = await parked.restore();
    await guard();
    store.transaction(() => {
        (job.boardUpdates ??= []).push(...returns);
        r.original!.returnedEffects = returns.map(update => activeEffectId(store, `harness:${job.id}:metadata-park:${r.id}:${update.item}`));
        delete job.parked; delete job.reviewContext; delete job.reviewInputSha256; delete job.lastPRFingerprint;
        job.stage = 'prepare-pr'; job.status = 'queued';
        job.detail = 'Original exact metadata published and both Office-owned park returns verified. Fresh Lead review follows; source results, failures and budgets remain unchanged.';
        store.save();
    });
}

/** A crashed request tail may settle only from the same verified saved returns, never a cleared display. */
export function metadataRequestResolved(store: GitHubDelivery['store'], request: HarnessRequest): boolean {
    const input = request.prMetadataRecovery, job = store.state.coordination?.jobs?.find(j => j.id === input?.jobId && j.key === request.key), r = job?.prMetadataRepair;
    const ids = r?.original?.returnedEffects;
    return !!input && !!job && request.head === input.head && job.head === input.head && !job.parked && r?.origin === 'original-recovery' &&
        r.original?.requestId === request.id && ['review', 'done'].includes(r.phase) && !!ids && ids.length === 2 && new Set(ids).size === 2 && ids.every(id => {
            const effect = store.getEffect<Record<string, unknown>>(id);
            return effect?.status === 'verified' && effect.operation === 'github-project-status' && effect.work.id === job.id && effect.payload.head === input.head;
        });
}
