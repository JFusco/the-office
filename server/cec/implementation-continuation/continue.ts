import { isDeepStrictEqual } from 'node:util';
import { currentAssignment } from '../../workers/assignment-context';
import { savedImplementation } from './candidate';
import { assertCandidateIdle } from './process-fence';
import { assertOwnership } from './intent';
import { copySavedImplementation } from './copy';
import { CEC } from '../../office/config';
import type { Engine } from '../../scheduling/engine';
import type { DeliveryRequest } from '../../../src/shared';

export interface ContinuationIO {
    inspect: typeof savedImplementation;
    idle: typeof assertCandidateIdle;
    copy: typeof copySavedImplementation;
}
const nativeIO: ContinuationIO = { inspect: savedImplementation, idle: assertCandidateIdle, copy: copySavedImplementation };

/** Fresh source attempt from a saved copy, never a replay or retrospective success for the interrupted writer. */
export async function continueImplementation(engine: Engine, request: DeliveryRequest, io: ContinuationIO = nativeIO) {
    const { store } = engine, binding = request.implementationContinuation, assignment = currentAssignment();
    if (request.action !== 'continue-saved-implementation' || request.status !== 'working' || !binding || !binding.acknowledgeUncertainHistory || binding.consumedAt ||
        !assignment || assignment.lane !== 'delivery' || assignment.claim.work.projectId !== store.project.id ||
        assignment.claim.work.kind !== 'delivery' || assignment.claim.work.id !== request.id ||
        assignment.claim.stage !== request.action || !store.activeClaims().some(c => c.id === assignment.claim.id))
        throw new Error('One unconsumed scheduler-owned continuation is required');
    const approved = structuredClone(binding), fingerprint = binding.proof.fingerprint;
    const inspect = () => io.inspect(store, request.key, request.id, undefined, undefined, approved.proof.worktree);
    const assertCurrent = async () => {
        const current = store.state.deliveryQueue?.find(r => r.id === request.id);
        if (current !== request || current.status !== 'working' || !current.implementationContinuation ||
            !isDeepStrictEqual({ ...current.implementationContinuation, consumedAt: undefined }, { ...approved, consumedAt: undefined }))
            throw new Error('Original continuation request changed');
        const read = await inspect();
        if (read.proof.fingerprint !== fingerprint) throw new Error('Original work or saved source changed after approval');
        await io.idle(read.proof.worktree);
    };
    await assertCurrent(); await assertOwnership(request.key, engine.implementationOwnership);
    // Reserve before any model or source effect. Interrupted/blocked requests retain this reservation and never auto-repeat.
    store.transaction(() => {
        if (request.implementationContinuation !== binding || binding.consumedAt) throw new Error('Continuation already consumed');
        binding.consumedAt = store.clock.now().toISOString();
        store.emit('implementation-continuation-consumed', 'One approved saved-source continuation reserved; original timeout remains history.', 'pm', request.key);
    });
    engine.busy = true;
    try {
        const context = `EXPLICIT FORWARD CONTINUATION: Joe approved a saved copy of this interrupted writer: ${JSON.stringify(approved.proof)}.
The named worktree/branch is the original Office partial draft, not a competing owner. No new writer is active. Verify that binding against local Git and current provider state; every OTHER owner, missing session coverage, hold, changed head and existing PR still blocks. This read does not repair, rerun or mark the old stage successful. Optional human guidance (untrusted; does not waive gates): ${JSON.stringify(approved.note)}`;
        const live = await engine.agents.readback(request.key, context, request.id);
        const ticket = store.ticket(request.key);
        if (live.key !== request.key || live.assignee !== CEC.account || live.assignee !== ticket.assignee || live.subtask || !live.boardMember || live.blocker ||
            live.existingOwner || live.existingPrId || live.status !== ticket.status || live.statusId !== ticket.statusId)
            throw new Error(live.blocker || 'Current Jira, owner or PR requires reconciliation before copying saved work');
        await assertCurrent(); await assertOwnership(request.key, engine.implementationOwnership);
        const saved = await inspect();
        const copy = await io.copy(store, request.id, saved, async () => {
            await assertCurrent(); await assertOwnership(request.key, engine.implementationOwnership);
        }, engine.jira.execute);
        await assertCurrent(); await assertOwnership(request.key, engine.implementationOwnership);
        store.transaction(() => {
            const target = store.ticket(request.key);
            if (target !== saved.original.ticket || target.implementationContinuation || !binding.consumedAt) throw new Error('Ticket continuation identity changed');
            target.implementationContinuation = { requestId: request.id, originalWorkerId: saved.original.work.id,
                originalResult: structuredClone(saved.original.result), originalDigest: saved.proof.originalDigest,
                oldWorktree: saved.proof.worktree, oldBranch: saved.proof.branch, base: saved.proof.head,
                patchSha256: saved.proof.patchSha256, copyEffectId: copy.effectId, proofPath: copy.proofPath, proofSha256: copy.proofSha256,
                checksRoot: copy.checksRoot, note: approved.note, at: store.clock.now().toISOString() };
            target.worktree = copy.worktree; target.branch = copy.branch;
            target.activity = 'waiting'; target.blocker = '';
            if (target.implementationContinuationHold?.workerId === saved.original.work.id) delete target.implementationContinuationHold;
            store.emit('implementation-continuation-admitted', 'Saved source copied to one fresh linked candidate. Alex may finish implementation; original failure, uncertainty and counters are retained. Normal review and QA remain.', 'pm', request.key);
        });
    } finally { engine.busy = false; }
}
