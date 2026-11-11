import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { ownedPath, terminationObservation } from '../../store/readback-evidence';
import { continuationJsonArtifact, continuationWorktree } from './implementation/continuation-evidence';
import { workerProfile } from '../../workers/worker-profiles';
import type { Store } from '../../store/store';
import type { TicketJob, WorkClaim } from '../../../src/shared';

/** Original identity/termination only. This cannot establish completion or safe effects. */
export function readStoppedBaseOriginal(store: Store, job: TicketJob, originalWorkId: string) {
    const works = (store.state.workLog || []).filter(w => w.requestId === job.id && w.stage === 'github-update-base');
    const work = works[0];
    if (!/^[a-zA-Z0-9-]+$/.test(job.id) || !/^[a-zA-Z0-9-]+$/.test(originalWorkId) ||
        !job.existingPR || !job.pr || job.stage !== 'update-base' || !['interrupted', 'blocked'].includes(job.status) ||
        !/^[a-f0-9]{40}$/.test(job.head) || !job.branch || !job.worktree || job.parked || job.mergeAttempt || job.mergeIntentId || job.mergeCommit ||
        job.steps.some(step => step.stage === 'update-base' || step.workerId === originalWorkId) || works.length !== 1 || !work ||
        work.id !== originalWorkId || work.sessionId !== work.id || work.status !== 'interrupted' || work.executionStatus || !work.durationUncertain ||
        work.role !== 'developer' || work.provider !== 'claude' || work.lane !== 'delivery' || work.ticket !== job.key || !work.claimId ||
        store.state.workLog?.some(w => w.id !== work.id && (w.sessionId === work.sessionId || w.requestId === job.id && ['running', 'stopping'].includes(w.status))) ||
        store.activeClaims().some(c => c.work.kind === 'delivery' && c.work.id === job.id))
        throw new Error('Exact original interrupted published base-update worker without a result is required');
    const dates = [work.startedAt, work.lastHeartbeatAt, work.endedAt].map(Date.parse);
    if (dates.some(value => !Number.isFinite(value)) || dates[0] > dates[1] || dates[1] > dates[2] ||
        !Number.isFinite(work.elapsedMs) || work.elapsedMs < 0 || work.elapsedMs > dates[2] - dates[0])
        throw new Error('Retained original interrupted timing is required');
    const rows = store.db.prepare('SELECT body FROM work_claims WHERE id=?').all(work.claimId) as { body: string }[];
    if (rows.length !== 1) throw new Error('One original base-update claim is required');
    const claim: WorkClaim = JSON.parse(rows[0].body);
    if (claim.id !== work.claimId || !['completed', 'interrupted'].includes(claim.status) || claim.lane !== 'delivery' || claim.stage !== 'update-base' ||
        claim.work.projectId !== store.project.id || claim.work.kind !== 'delivery' || claim.work.id !== job.id ||
        !Number.isFinite(Date.parse(claim.claimedAt)) || !Number.isFinite(Date.parse(claim.endedAt)) ||
        Date.parse(claim.claimedAt) > dates[0] || Date.parse(claim.endedAt) < dates[2])
        throw new Error('Original base-update claim has not terminated with its worker');
    const termination = terminationObservation(store, work);
    // A private retained candidate must remain under this job, never the primary repo.
    ownedPath(store, job.worktree);
    ownedPath({ dataRoot: resolve(store.dataRoot, 'ticket-work', job.id) }, job.worktree);
    const candidate = continuationWorktree(job.worktree), root = resolve(store.dataRoot, 'sessions', work.id);
    if (['result.json', 'execution-completion.json', 'provider-completion.json', 'completed-output.json'].some(name => existsSync(resolve(root, name))))
        throw new Error('Original completion artifacts require their existing readback path');
    const files = ['provider.json', 'assignment.json', 'assignment-identity.json', 'capabilities.json']
        .map(name => continuationJsonArtifact(store, resolve(root, name)));
    const [provider, assignment, identity, capabilities] = files.map(file => file.value), profile = workerProfile(work.stage, false);
    if (provider.project !== store.project.id || provider.repository !== store.project.repository || provider.role !== work.role ||
        provider.provider !== work.provider || provider.readOnly !== false || provider.session !== work.sessionId ||
        assignment.id !== work.id || assignment.claimId !== claim.id || assignment.stage !== work.stage || assignment.role !== work.role ||
        assignment.lane !== 'delivery' || !isDeepStrictEqual(assignment.work, claim.work) || assignment.profile !== profile.name ||
        assignment.scope?.repository !== store.project.repository || assignment.scope.worktree !== job.worktree || assignment.scope.artifacts !== root ||
        !isDeepStrictEqual(capabilities, profile) || identity.attemptId !== work.id || identity.requestId !== job.id ||
        identity.projectId !== store.project.id || identity.repository !== store.project.repository || identity.role !== work.role || identity.threadId !== work.sessionId)
        throw new Error('Original base-update assignment, capability or native identity changed');
    return { worker: structuredClone(work), claim, candidate, files: files.map(file => file.file), termination };
}
