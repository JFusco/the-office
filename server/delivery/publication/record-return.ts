import type { ReleaseMarkerReturn } from '../../../src/contracts/release-marker';
import type { StageResult, TicketJob } from '../../../src/shared';
import type { Store } from '../../store/store';
import { correctionIdentity, MAX_RELEASE_MARKER_RETURNS, releaseMarkerReturns } from './release-marker-returns';
import { packageChange } from './release-marker-stop';

const short = (sha: string) => sha.slice(0, 12);

/**
 * Spend one developer return in a single transaction, after `guard` repeats the caller's ownership, claim, input and
 * checkout proof. The prior accepted head, approach and gates are left exactly as they were; the original result and
 * its evidence are kept as a `release-marker-return` step, and `implement` is queued for a messages-only correction.
 * A replay of the same work ID spends nothing further. A third proven refusal blocks instead, with commit and paths.
 */
export function recordReturn(store: Store, job: TicketJob, entry: Omit<ReleaseMarkerReturn, 'step'>, result: StageResult, guard: () => void): 'returned' | 'replayed' {
    return store.transaction(() => {
        guard();
        if (job.releaseMarkerReturns && Object.hasOwn(job.releaseMarkerReturns, entry.workId)) return 'replayed';
        const spent = releaseMarkerReturns(job);
        if (spent.length >= MAX_RELEASE_MARKER_RETURNS) {
            const current = spent.find(item => item.status === 'pending');
            throw packageChange(entry.offending, 'return-cap', current ? { correction: { ...correctionIdentity(current), refusedHead: entry.refusedHead } } : {});
        }
        for (const item of spent) if (item.status === 'pending') item.status = 'superseded';
        job.steps.push({ stage: 'release-marker-return', workerId: entry.workId, result: structuredClone(result) });
        (job.releaseMarkerReturns ??= {})[entry.workId] = { ...structuredClone(entry), step: job.steps.length - 1 };
        job.stage = 'implement';
        job.status = 'queued';
        delete job.stop;
        const offending = entry.offending.map(commit => `${short(commit.sha)} (${commit.paths.concat(commit.inventoryPaths).slice(0, 6).join(', ')})`).join('; ');
        job.detail = `Returned to the developer (${spent.length + 1} of ${MAX_RELEASE_MARKER_RETURNS}): [skip release] commits change shipped npm package files: ${offending}. The developer proposes replacement messages; the harness rewrites them, and the prior accepted head ${job.head ? short(job.head) : 'base'} is kept.`;
        store.emit('release-marker-returned', `${job.key}: ${job.detail}`, 'pm', job.key);
        return 'returned';
    });
}
