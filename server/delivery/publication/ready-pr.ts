import { assertMayMutate } from '../harness/guards';
import { harnessEffect } from '../harness/effect';
import { retryRead } from '../harness/read-retry';
import type { command } from '../../process';
import type { Store } from '../../store';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;

/** Promotes the job's draft PR once; an already-ready PR is verified without a write. */
export async function promoteReady(store: Store, execute: Execute, jobs: TicketJob[], job: TicketJob): Promise<'promoted' | 'already-ready'> {
    const api = async () => JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/pulls/${job.pr}`], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    const head = job.head, current = await api();
    if (current.head?.sha !== head)
        throw new Error('PR head changed before promotion');
    if (!current.draft)
        return 'already-ready';
    const readBack = async () => { const p = await api(); return !p.draft && p.head?.sha === head ? { ready: true } : null; };
    await harnessEffect(store, job, {
        key: `pr-ready:${head}`, operation: 'github-pr-ready', target: current.html_url, payload: { pr: job.pr, head },
        guard: () => assertMayMutate(store, jobs, job, head),
        dispatch: async () => {
            await execute('gh', ['pr', 'ready', String(job.pr), '--repo', store.project.repository], { cwd: store.project.repo, timeout: 60000 });
            return retryRead(readBack);
        },
        readBack,
    });
    return 'promoted';
}
