import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { artifact, digest } from '../../store/readback-evidence';
import { PACKED165, packed165EffectId, type Packed165Policy } from './packed165-policy';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

export function packed165Subject(store: Store, job: TicketJob, p: Packed165Policy = PACKED165) {
    return store.project.id === p.project && store.project.repository === p.repository && job.id === p.job && job.key === p.key;
}

/** Retain the original as uncertain. Approval authorizes a distinct repaired revision, never a retry or a positive audit. */
export function retainedPacked165Effect(store: Store, job: TicketJob, p: Packed165Policy = PACKED165) {
    const effect = store.getEffect(packed165EffectId(p));
    if (!packed165Subject(store, job, p) || !effect || digest(effect) !== p.effectSha256 || effect.status !== 'uncertain' ||
        effect.operation !== 'git-push' || effect.work.id !== job.id || effect.work.kind !== 'delivery' || effect.work.projectId !== p.project ||
        effect.target !== `${p.repository}:${p.branch}` || digest(effect.payload) !== digest({ head: p.head, branch: p.branch }))
        throw new Error('Exact preserved #165 push attempt is required');
    return effect;
}

export function packed165Admitted(store: Store, job: TicketJob, p: Packed165Policy = PACKED165): boolean {
    const repair = job.packedPublicationRepair;
    if (!repair || !packed165Subject(store, job, p) || job.head !== repair.head || job.branch !== repair.branch ||
        job.worktree !== repair.worktree || repair.original.head !== p.head || repair.original.branch !== p.branch ||
        repair.originalEffectId !== packed165EffectId(p) || repair.originalEffectSha256 !== p.effectSha256) return false;
    try {
        retainedPacked165Effect(store, job, p);
        const file = artifact(store, repair.proofPath), proof = JSON.parse(readFileSync(file.path, 'utf8'));
        const requests = store.state.coordination?.requests?.filter(r => r.id === repair.requestId) || [], request = requests[0];
        const row = store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(repair.claimId) as { body: string } | undefined;
        const claim = row && JSON.parse(row.body);
        return file.sha256 === repair.proofSha256 && proof.kind === 'joe-forward-only-packed165' && proof.requestId === repair.requestId && proof.claimId === repair.claimId &&
            proof.contentRoot === repair.contentRoot && artifact(store, resolve(repair.contentRoot, 'pr.json')).sha256 === proof.contentSha256 &&
            proof.jobId === job.id && proof.head === job.head && proof.branch === job.branch && proof.worktree === job.worktree &&
            proof.afterSha256 === p.afterSha256 && proof.beforeSha256 === p.beforeSha256 && proof.originalEffectSha256 === p.effectSha256 &&
            digest(proof.original) === digest(repair.original) && proof.historicalOutcome === 'retained-uncertain-not-replayed' &&
            requests.length === 1 && request.action === p.action && request.key === job.key && request.head === p.head &&
            claim?.work.projectId === p.project && claim.work.kind === 'reconciliation' && claim.work.id === repair.requestId &&
            claim.stage === p.action && claim.lane === 'delivery';
    } catch { return false; }
}
