import { continuationWorktree } from './implementation/continuation-evidence';
import { isDeepStrictEqual } from 'node:util';
import { readFileSync } from 'node:fs';
import { artifact, digest, rootArtifact } from '../../store/readback-evidence';
import { deliveryInputSha256 } from '../../github/github-context';
import { assertDeliveryMayMutate } from '../harness/guards';
import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { readStoppedBaseProviderContext } from './stopped-base-provider';
import { stoppedBaseUpdateResolved } from './stopped-base-disposition';
import { workKey } from '../../../src/shared';
import type { TicketJob } from '../../../src/shared';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { dirname } from 'node:path';

/** The audit grants reassessment only while its material inputs remain unchanged. */
export async function stoppedBaseReviewContext(delivery: GitHubDelivery, job: TicketJob) {
    const { store } = delivery, r = job.stoppedBaseUpdate!, beforeHead = job.head;
    const assertCurrent = () => {
        assertDeliveryMayMutate(store, delivery.jobs, job, beforeHead);
        if (!r || job.stoppedBaseUpdate !== r || !stoppedBaseUpdateResolved(store, { key: job.key, head: r.originalWorkId }))
            throw new Error('Positive original stopped-base disposition is required');
        const inputFile = artifact(store, r.input.path), input = JSON.parse(readFileSync(inputFile.path, 'utf8'));
        if (inputFile.sha256 !== r.input.sha256 || digest(input) !== r.input.inputSha256 ||
            deliveryInputSha256(store, job.key) !== input.context.scopeSha256 ||
            !isDeepStrictEqual(continuationWorktree(r.preservedCandidate!.worktree), input.context.originalCandidate) ||
            !isDeepStrictEqual(rootArtifact(dirname(dirname(r.nativePath)), r.nativePath), input.context.nativeFile) ||
            input.originalArtifacts.some((file: { path: string; sha256: string }) => !isDeepStrictEqual(artifact(store, file.path), file)))
            throw new Error('Original audit source, native evidence or human scope changed');
        const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[])
            .map(row => JSON.parse(row.body));
        const expected = input.rows.filter((row: { kind: string }) => row.kind === 'durable-effect');
        if (effects.length !== expected.length || effects.some(effect => !expected.some((row: { id: string; sha256: string }) => row.id === `effect:${effect.id}` && row.sha256 === digest(effect))))
            throw new Error('Original delivery effects changed since the audit');
        if(r.handoff && (artifact(store,r.handoff.resultPath).sha256!==r.handoff.resultSha256 ||
            rootArtifact(dirname(r.handoff.nativePath),r.handoff.nativePath).sha256!==r.handoff.nativeSha256))
            throw new Error('Stopped-base handoff artifacts changed');
        return input;
    };
    assertCurrent();
    const original = r.preservedCandidate!;
    await verifyRepairCandidate(store.project, { head: original.head, branch: original.branch, worktree: original.worktree }, delivery.execute);
    const provider = await readStoppedBaseProviderContext(delivery, job);
    const input = assertCurrent();
    if (provider.version !== r.providerVersion || provider.pr.head !== input.context.provider.pr.head)
        throw new Error('Audit-bound prospective head or provider context changed; reassessment remains stopped');
    return { provider, input, assertCurrent };
}
