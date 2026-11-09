import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { z } from 'zod';
import { completedExecution, offlineNativeEvidence } from '../../workers/worker-completion';
import { artifact, digest } from '../../store/readback-evidence';
import { continuationWorkerProof, assertContinuationWorker } from '../recovery/implementation/continuation-evidence';
import { assertMayMutate } from '../harness/guards';
import { containedFile } from '../../cec/workflow';
import { currentAssignment } from '../../workers/assignment-context';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';

const Audit = z.object({ outcome: z.enum(['passed', 'blocked']), originalWorkerId: z.string(), nativeSha256: z.string(),
    completeNativeExecution: z.boolean(), noExternalWrites: z.boolean(), summary: z.string(),
    calls: z.array(z.object({ id: z.string(), inputSha256: z.string(), classification: z.enum(['read-only', 'owned-diagnostic', 'external', 'unknown']) }).strict()) }).strict();

/** A prior needs-human diagnosis is settled only by an actual full native no-external-write audit. */
export async function reconcileCIDiagnosis(delivery: GitHubDelivery, job: TicketJob, roots?: Parameters<typeof offlineNativeEvidence>[3]) {
    const { store } = delivery, attemptAt = job.ciRecoveryAttemptAt, head = job.head, merged = job.mergeCommit;
    if (!attemptAt) return false;
    const writer = store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'ci-recovery' && w.role === 'pm' && w.startedAt >= attemptAt)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))[0];
    const saved = job.ciRecoveryNoWriteProof;
    if (!writer) {
        if (saved) throw new Error('Saved CI diagnosis predecessor is missing');
        return false; // The existing read-back-only recovery must resolve an unknown predecessor.
    }
    let original: ReturnType<typeof continuationWorkerProof>;
    try {
        original = continuationWorkerProof(store, job, writer, false, store.project.repo);
        if (!completedExecution(store, writer)) throw new Error('Original CI diagnosis completion is unverified');
    } catch (error) {
        if (saved) throw error;
        return false; // Failure to qualify for a no-write shortcut never waives ordinary effect read-back.
    }
    const diagnostic = original.result as unknown as { outcome: string; issue: number };
    if (diagnostic.outcome !== 'needs-human' || diagnostic.issue !== 0) {
        if (saved) throw new Error('Saved CI diagnosis outcome changed');
        return false;
    }
    const native = offlineNativeEvidence(store, writer, store.project.repo, roots), root = resolve(store.dataRoot, 'ticket-work', job.id);
    const assertCurrent = () => {
        assertMayMutate(store, delivery.jobs, job, head);
        if (store.state.draining || job.status !== 'working' || job.stage !== 'ci-recovery' || job.mergeCommit !== merged ||
            job.ciRecoveryAttemptAt !== attemptAt || job.ciFollowupKey) throw new Error('Original CI diagnosis reconciliation changed');
    };
    assertCurrent();
    let audit: z.infer<typeof Audit>, readerId: string, savedReaderFiles: typeof original.files | undefined;
    if (saved) {
        if (saved.attemptAt !== attemptAt || saved.originalWorkerId !== writer.id || !containedFile(saved.evidencePath, root) || artifact(store, saved.evidencePath).sha256 !== saved.sha256)
            throw new Error('Saved CI diagnosis reconciliation identity changed');
        const proof = JSON.parse(readFileSync(saved.evidencePath, 'utf8'));
        if (!isDeepStrictEqual(proof.originalFiles, original.files) || !isDeepStrictEqual(proof.nativeFile, native.file)) throw new Error('Original CI diagnosis evidence changed');
        audit = Audit.parse(proof.audit); readerId = saved.readerWorkerId; savedReaderFiles = proof.readerFiles;
    } else {
        const before = new Set(store.state.workLog?.map(w => w.id));
        audit = await delivery.engine.agents.run('pm', `READ-BACK ONLY. Reconcile the original completed CI diagnosis ${writer.id} for ${job.prUrl}, merge ${merged}, attempt marker ${attemptAt}. It returned needs-human and issue=0; that statement alone does not prove no effects. Audit EVERY paired call and result in the complete retained native session ${JSON.stringify(native.file)} (${native.recordCount} records), including arbitrary shell/Python/subprocess bodies, nested tool orchestration and approval rejections. Bind each actual call id and SHA256 of its full original input: ${JSON.stringify(native.calls.map(c => ({ id: c.id, name: c.name, inputSha256: digest(c.input) })))}. Read the owning native file and original assignment/result artifacts ${JSON.stringify(original.files)}. Classify read-only, owned-diagnostic, external or unknown. Owned diagnostics are permitted only in ${root} or that original worker's own completed-output.json. Any source/Git/config write, external mutation attempt, unpaired/unknown effect or incomplete audit blocks noExternalWrites. An empty provider search is never proof that a write did not happen. Do not create/adopt issues or cards, retry CI, change source or resolve uncertain effects by assertion. Return passed only with complete positive no-external-write proof; otherwise blocked with the original uncertainty and next owner. This audit does not certify current CI or delivery closeout.`, Audit,
            { cwd: store.project.repo, readOnly: true, ticket: job.key, requestId: job.id, stage: 'ci-recovery-original-readback', timeout: 15 * 60 * 1000 });
        const readers = store.state.workLog?.filter(w => !before.has(w.id) && w.requestId === job.id && w.stage === 'ci-recovery-original-readback') || [];
        if (readers.length !== 1) throw new Error('One actual CI diagnosis read-back worker required');
        readerId = readers[0].id;
    }
    const reader = store.state.workLog?.find(w => w.id === readerId);
    if (!reader || reader.role !== 'pm' || reader.stage !== 'ci-recovery-original-readback' || !completedExecution(store, reader) ||
        !saved && currentAssignment() && reader.claimId !== currentAssignment()!.claim.id) throw new Error('CI diagnosis read-back completion missing');
    const proof = continuationWorkerProof(store, job, reader, true, store.project.repo);
    if (saved && !isDeepStrictEqual(proof.files, savedReaderFiles) || !isDeepStrictEqual(proof.result, audit) || audit.originalWorkerId !== writer.id || audit.nativeSha256 !== native.file.sha256 ||
        !audit.completeNativeExecution || audit.calls.length !== native.calls.length || new Set(audit.calls.map(c => c.id)).size !== native.calls.length ||
        native.calls.some(c => !audit.calls.some(a => a.id === c.id && a.inputSha256 === digest(c.input))))
        throw new Error('Complete original CI diagnosis audit identity required');
    assertContinuationWorker(store, original, job); assertContinuationWorker(store, proof, job);
    if (!isDeepStrictEqual(offlineNativeEvidence(store, writer, store.project.repo, roots), native)) throw new Error('Original native CI diagnosis changed during audit');
    assertCurrent();
    if (audit.outcome !== 'passed' || !audit.noExternalWrites || audit.calls.some(c => !['read-only', 'owned-diagnostic'].includes(c.classification))) {
        if (saved) throw new Error('Saved CI diagnosis no-external-write proof changed');
        return false; // A bound blocked/external audit leaves the existing READ-BACK ONLY route available.
    }
    if (!saved) {
        mkdirSync(root, { recursive: true }); const path = resolve(root, `ci-diagnosis-readback-${crypto.randomUUID()}.json`);
        writeFileSync(path, JSON.stringify({ audit, originalFiles: original.files, nativeFile: native.file, readerFiles: proof.files }, null, 2), { mode: 0o600, flag: 'wx' });
        job.ciRecoveryNoWriteProof = { attemptAt, originalWorkerId: writer.id, readerWorkerId: readerId, evidencePath: path, sha256: artifact(store, path).sha256 };
        store.emit('merge-ci-original-reconciled', 'Original completed CI diagnosis independently verified as no external writes; original result and full native evidence retained.', 'pm', job.key);
    }
    return true;
}
