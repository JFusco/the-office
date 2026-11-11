import type { Store } from '../../store/store';
import type { HarnessRequest, TicketJob, WorkRef } from '../../../src/shared';
import { digest } from '../../store/readback-evidence';
import { PACKED165 } from '../recovery/packed165-policy';

const accounting = new Set(['reconcile-time', 'reconcile-cost', 'apply-time-scope', 'correct-recovery-time']);
const nonDelivery = new Set(['refresh', 'poll', 'observe-dependencies', 'check-it', 'retry-checkpoint', 'reconcile-maintenance',
    'reconcile-native-refresh', 'reconcile-native-checkpoint', 'file-lesson-issue', 'admit-improvement']);
const originalReads = new Set(['resume-discovery', 'reconcile-implementation', 'reconcile-validation', 'reconcile-scope-repair',
    'reconcile-preparation', 'reconcile-review', 'reconcile-activation', 'reconcile-closeout', 'cleanup-merged-candidate']);
export type DeliverySubject = { kind: 'job'; job: TicketJob; request?: HarnessRequest } | { kind: 'unrelated' } | { kind: 'unresolved'; reason: string };

/** Classify persisted subjects, never chat titles, branches or the shape of a head string. */
export function resolveDeliveryWork(store: Store, work: WorkRef): DeliverySubject {
    if (work.projectId !== store.project.id) return { kind: 'unrelated' };
    const jobs = store.state.coordination?.jobs || [], requests = store.state.coordination?.requests || [];
    const direct = jobs.filter(j => j.id === work.id), registered = requests.filter(r => r.id === work.id);
    if (direct.length > 1 || registered.length > 1 || direct.length && registered.length) return { kind: 'unresolved', reason: 'Ambiguous persisted delivery subject' };
    if (direct.length) return work.kind === 'delivery' ? { kind: 'job', job: direct[0] } : { kind: 'unresolved', reason: 'Delivery job claimed under another work kind' };
    if (registered.length) {
        const request = registered[0];
        if (accounting.has(request.action) || nonDelivery.has(request.action)) return { kind: 'unrelated' };
        // Non-delivery request kinds keep their own scheduling and permission contracts.
        if (!['reconcile-pr-metadata', 'reconcile-base-update', 'authorize-green-merge-156', PACKED165.action, 'authorize-source-amendment', 'adopt-candidate', ...originalReads].includes(request.action))
            return jobs.some(j => j.key === request.key && j.status !== 'cancelled')
                ? { kind: 'unresolved', reason: 'Legacy or unknown same-ticket operation retains its own recovery gate' } : { kind: 'unrelated' };
        if (work.kind !== 'reconciliation') return { kind: 'unresolved', reason: 'Delivery request claimed under another work kind' };
        const matches = jobs.filter(j => j.key === request.key && j.status !== 'cancelled');
        if (matches.length !== 1) return { kind: 'unresolved', reason: 'Recovery request has no unique original job' };
        const job = matches[0], original = store.state.workLog?.filter(w => w.id === request.head && w.requestId === job.id && w.ticket === job.key) || [];
        let bound = false;
        if (request.action === 'reconcile-pr-metadata') {
            const p = request.prMetadataRecovery, r = job.prMetadataRepair?.original;
            bound = !!p && p.jobId === job.id && p.head === job.head && request.head === job.head &&
                !!store.state.workLog?.some(w => w.id === p.workerId && w.requestId === job.id && w.ticket === job.key) &&
                (r ? r.requestId === request.id && r.workerId === p.workerId && r.parkAt === p.parkAt && r.parkSha256 === p.parkSha256 &&
                    digest(r.proposal) === digest(p.proposal) && digest(r.authorization) === digest(p.authorization)
                    : job.parked?.at === p.parkAt && digest(job.parked) === p.parkSha256);
        }
        else if (request.action === PACKED165.action) bound = store.project.id === PACKED165.project && store.project.repository === PACKED165.repository &&
            job.id === PACKED165.job && job.key === PACKED165.key && request.head === PACKED165.head &&
            (job.head === PACKED165.head || job.packedPublicationRepair?.original.head === PACKED165.head);
        else if (request.action === 'authorize-green-merge-156') bound = request.head === job.stoppedBaseUpdate?.originalWorkId && original.length === 1 && original[0].stage === 'github-update-base' && original[0].status === 'interrupted' && !original[0].executionStatus;
        else if (request.action === 'reconcile-base-update') bound =
            request.head === job.head && !!job.head && !!job.boardUpdates?.some(u => u.head === request.head && u.stage === 'update-base') ||
            original.length === 1 && original[0].stage === 'github-update-base' && original[0].status === 'interrupted' && !original[0].executionStatus;
        else if (request.action === 'authorize-source-amendment') bound = request.sourceAmendment?.projectId === store.project.id && request.sourceAmendment.jobId === job.id && request.sourceAmendment.originalHead === request.head;
        else if (request.action === 'adopt-candidate') {
            const candidates = job.steps.map(s => s.result).filter(r => r.commit && r.worktree && r.branch);
            const unique = new Set(candidates.map(r => JSON.stringify([r.commit, r.worktree, r.branch])));
            bound = !request.head && unique.size === 1;
        }
        else if (originalReads.has(request.action)) {
            bound = original.length === 1;
            if (request.action === 'reconcile-activation' && !bound) {
                const reservation = job.implementationContinuation?.sourceConfig?.reservation;
                const row = reservation && store.db.prepare('SELECT body FROM work_claims WHERE id=?').get(reservation.claimId) as { body: string } | undefined;
                const claim = row && JSON.parse(row.body);
                bound = !!reservation && request.head === reservation.claimId && reservation.head === job.head &&
                    reservation.phase === job.implementationContinuation?.phase && !store.state.workLog?.some(w => w.claimId === reservation.claimId) &&
                    claim?.work.projectId === store.project.id && claim.work.kind === 'delivery' && claim.work.id === job.id &&
                    ['completed', 'interrupted'].includes(claim.status) && !!claim.endedAt;
            }
        }
        // A recovery's existing handler must additionally validate its action-specific native proof,
        // reservation and phase. Subject resolution never supplies those permissions.
        return bound ? { kind: 'job', job, request } : { kind: 'unresolved', reason: 'Recovery is not bound to its saved original job/worker' };
    }
    // These IDs are emitted by named non-ticket producers, not arbitrary unknown requests.
    if (work.kind === 'reconciliation' && (
        /^time(?:-readback)?:/.test(work.id) && store.state.coordination?.time?.entries.some(e => work.id.endsWith(`:${e.id}`)) ||
        /^cost(?:-readback)?:/.test(work.id) && store.state.coordination?.time?.cost?.entries.some(e => work.id.endsWith(`:${e.key}`)) ||
        work.id.startsWith('recovery:') && store.state.maintenance?.runs.some(r => work.id === `recovery:${r.id}`))) return { kind: 'unrelated' };
    if (work.kind === 'delivery' && (store.state.deliveryQueue?.some(r => r.id === work.id) || store.state.tickets.some(t => work.id === `ticket:${t.key}`))) return { kind: 'unrelated' };
    // CTO/knowledge/conversation/feature/etc. are not unknown delivery owners (plan FIND-013).
    if (work.kind !== 'delivery' && work.kind !== 'reconciliation') return { kind: 'unrelated' };
    return { kind: 'unresolved', reason: 'Unidentified delivery or reconciliation claim' };
}
