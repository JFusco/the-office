import { boardPreflightCandidate } from '../delivery/recovery/board-preflight';
import { enqueueRequest } from '../scheduling/requests';
import type { ITContext } from './context';

/** The existing bounded IT ledger queues only a readback, never a source worker or provider retry. */
export async function recoverBoardPreflights(context: ITContext): Promise<void> {
    const { store, offices, recover } = context;
    for (const job of store.state.coordination?.jobs || []) {
        if (job.status === 'blocked' && job.stage === 'update-base' && job.boardUpdates?.some(update => update.status !== 'verified'))
            for (const id of Object.keys(context.it.recoveries))
                if (id.startsWith(`board-preflight:${job.id}:`)) context.current.add(id);
        const candidate = boardPreflightCandidate(store, job), owner = candidate && offices.sessions?.forProject(store, job.key);
        if (!candidate || !owner?.complete || !owner.fresh || owner.ownership?.status !== 'clear') continue;
        await recover(candidate.id, job.detail, async () => enqueueRequest(store, 'reconcile-base-update', job.key, candidate.head),
            `Morgan reads ${job.key}'s exact original board transition before its first source worker. A missing or unlanded transition stays uncertain; no write is resent.`, 'Morgan');
    }
}
