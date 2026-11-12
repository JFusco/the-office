import { z } from 'zod';
import { digest } from '../store/readback-evidence';
import { processGroupAlive } from '../workers/process';
import { HOLDS } from '../office/config';
import type { Store } from '../store/store';
import type { HarnessRequest } from '../../src/shared';
import type { HistoryRetirementIntent } from '../../src/contracts/history-retirement';

const Intent = z.object({ acceptIncompleteHistory: z.literal(true), reason: z.string().trim().min(20).max(1000),
    targets: z.array(z.object({ kind: z.enum(['maintenance', 'investigation']), id: z.string().min(1).max(240),
        sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict()).min(1).max(7)
        .refine(rows => new Set(rows.map(row => `${row.kind}:${row.id}`)).size === rows.length, 'Duplicate historical target'),
}).strict();
/** Hash the original record only; the separate disposition never rewrites its evidence. */
export function historicalRecordDigest(record: object) {
    const { retirement: _retirement, ...original } = record as object & { retirement?: unknown };
    return digest(original);
}
function records(store: Store, intent: HistoryRetirementIntent, alive: typeof processGroupAlive) {
    if (store.state.paused || store.state.draining) throw Error('Project must be running for historical retirement');
    return intent.targets.map(target => {
        const rows = target.kind === 'maintenance' ? store.state.maintenance?.runs.filter(run => run.id === target.id) : store.state.it?.investigations?.filter(entry => entry.id === target.id);
        const record = rows?.[0];
        if (rows?.length !== 1 || !record || historicalRecordDigest(record) !== target.sha256 || !['blocked', 'interrupted'].includes(record.status))
            throw Error('Exact blocked historical record changed or is unavailable');
        const run = target.kind === 'maintenance' ? store.state.maintenance!.runs.find(run => run.id === target.id)! : undefined;
        const entry = target.kind === 'investigation' ? store.state.it!.investigations!.find(entry => entry.id === target.id)! : undefined;
        if (run && (store.project.id !== 'brain' || run.stage !== 'brain-maintenance' || run.blockerFollowup || run.nativeRunId ||
            run.steps.some(step => step.result.candidates.length) || !run.readbackRetry?.exhausted ||
            store.state.coordination?.checkpoints.some(checkpoint => checkpoint.runId === run.id &&
                (!['blocked', 'interrupted'].includes(checkpoint.status) || checkpoint.repairResume || checkpoint.continuationId))))
            throw Error('Only exhausted inactive Brain history without an unfinished handoff may retire');
        if (run?.checkpointId && store.state.coordination?.checkpoints.filter(checkpoint => checkpoint.id === run.checkpointId && checkpoint.runId === run.id).length !== 1)
            throw Error('Exact original checkpoint required');
        if (entry && (entry.source.kind !== 'worker' || entry.source.failureKind !== 'surviving-subprocesses' ||
            entry.report?.officeFix?.status !== 'blocked' || entry.attempts < 1 || HOLDS[entry.source.ticket]))
            throw Error('Only a blocked worker diagnosis with no human hold may be acknowledged');
        const ids = new Set([target.id, ...(entry ? [entry.source.id, entry.source.requestId, ...entry.source.workerIds] : [])]);
        const work = store.state.workLog?.filter(work => ids.has(work.id) || ids.has(work.requestId || '')) || [];
        if (!work.length || work.some(work => !work.endedAt || !['completed', 'failed', 'blocked', 'interrupted'].includes(work.status) ||
            !work.processId || !Number.isSafeInteger(work.processId) || work.processId < 1 || alive(work.processId)) ||
            store.activeClaims().some(claim => ids.has(claim.work.id) || work.some(work => work.id === claim.work.id)))
            throw Error('Original workers and related claims must be positively settled');
        for (const worker of work) ids.add(worker.id);
        const writes = store.db.prepare("SELECT work_key FROM effects WHERE status IN ('dispatching','uncertain')").all() as { work_key: string }[];
        if (writes.some(row => row.work_key.startsWith(`${store.project.id}:`) && [...ids].some(id => row.work_key.endsWith(`:${id}`))))
            throw Error('Unsettled original external writes prevent historical retirement');
        return record;
    });
}
/** Supported operator command: durable intent first, exact-record validation again at execution. */
export function enqueueHistoryRetirement(store: Store, input: unknown, alive = processGroupAlive): HarnessRequest {
    const intent = Intent.parse(input), coordination = store.state.coordination;
    if (!coordination) throw Error('Project coordination required');
    const requests = coordination.requests || [];
    const prior = requests.find(request => request.action === 'retire-incomplete-history' && digest(request.historyRetirement) === digest(intent));
    if (prior) return prior;
    const selected = records(store, intent, alive);
    if (selected.some(record => record.retirement)) throw Error('A historical disposition already exists');
    return store.transaction(() => {
        const request: HarnessRequest = { id: crypto.randomUUID(), action: 'retire-incomplete-history', key: '', head: digest(intent),
            requestedAt: store.clock.now().toISOString(), status: 'queued', lane: 'operations', historyRetirement: intent,
            detail: 'Joe authorized retirement as incomplete history. Original outcomes and unresolved evidence will be preserved.' };
        (coordination.requests ??= []).push(request); store.emit('history-retirement-queued', request.detail, 'pm'); return request;
    });
}
export function retireIncompleteHistory(store: Store, request: HarnessRequest, alive = processGroupAlive) {
    const intent = Intent.parse(request.historyRetirement);
    if (request.action !== 'retire-incomplete-history' || request.lane !== 'operations' || request.status !== 'working' || request.head !== digest(intent))
        throw Error('Bound historical retirement intent required');
    const selected = records(store, intent, alive);
    if (selected.some(record => record.retirement)) throw Error('Historical disposition already applied; do not replay');
    store.transaction(() => {
        selected.forEach((record, index) => { record.retirement = { kind: 'incomplete-history', at: store.clock.now().toISOString(),
            requestId: request.id, recordSha256: intent.targets[index].sha256, reason: intent.reason }; });
        store.emit('history-retired-incomplete', `${selected.length} historical records retired by Joe. Original failures and counters remain; no success, cause or maintenance completion is claimed.`, 'pm');
    });
}
