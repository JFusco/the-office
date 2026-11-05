import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import type { StageResult, Ticket, TicketJob } from '../../src/shared';
import type { Store } from '../store/store';
import { approvedDelivery } from './delivery-binding';
import { completedExecution } from '../workers/worker-completion';
/** Bind a normal feature review verdict to one actual completed Lead execution. */
export function acceptFeatureReview(store: Store, record: Ticket | TicketJob, result: StageResult, stage: string, before: Set<string>) {
    if (!record.featureBinding) return;
    approvedDelivery(store, record.featureBinding);
    if (!['review', 'code-review', 'repair-review'].includes(stage)) return;
    const request = 'runId' in record ? record.key : record.id;
    const workerStage = 'runId' in record ? stage : 'github-' + stage;
    const workers = (store.state.workLog || []).filter(w => !before.has(w.id) && w.role === 'lead' && ('runId' in record ? w.ticket === record.key : w.requestId === request) && w.stage === workerStage);
    if (workers.length !== 1 || !completedExecution(store, workers[0])) throw new Error('Feature review requires one completed independent Lead assignment');
    const saved = JSON.parse(readFileSync(resolve(store.dataRoot, 'sessions', workers[0].id, 'result.json'), 'utf8'));
    if (!isDeepStrictEqual(saved.result, result)) throw new Error('Feature review differs from the independent saved verdict');
}
