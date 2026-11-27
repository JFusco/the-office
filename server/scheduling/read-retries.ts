import { defaultPickupStatus } from '../delivery/intake/default-pickup';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { PrerequisitesSchema } from '../delivery/pipeline/dependencies';
import { ATTEMPT_DELAYS_MS } from '../delivery/attempts/attempt-backoff';
import { deliveryRetryDecision, readOnlyStageJob } from '../delivery/attempts/delivery-retry';
import { planDeliveryRetry } from '../delivery/attempts/plan-delivery-retry';
import { unsettledEffects } from '../operations/unsettled-effects';
import { incompleteReadOutput, temporaryReadFailure } from './temporary-read';
import type { Store } from '../store/store';
import type { ReadRetry, TicketJob } from '../../src/shared';
export { incompleteReadOutput, temporaryReadFailure, readOnlyStageJob };
const MAX_READ_RETRIES = 3;
/** How long a retryable stop may wait for the planner's timer before it is shown to a person: the slower tick is about a minute. */
export const RETRY_PLAN_GRACE_MS = 120000;
export const IntakeResult = z.object({ outcome: z.enum(['ready', 'owned', 'blocked', 'held']), ownershipChecked: z.boolean(), owner: z.string(), summary: z.string(), evidence: z.array(z.string()).min(1), prerequisites: PrerequisitesSchema, existingWork: z.object({ projectId: z.string(), kind: z.enum(['pr', 'native-session', 'native-run', 'maintenance']), id: z.string(), evidence: z.string() }).strict().nullable() }).strict();
/**
 * True while the Office will retry this job's stop by itself: a temporary read failure at a read-only
 * review stage, with retries left, whether or not the next one has been scheduled yet. The retries are
 * planned on a timer, so for a moment after such a stop none is recorded; the job is not a person's to
 * act on in that moment either. That moment is bounded: a stop with no retry scheduled within the grace
 * period was not picked up by the planner (it is not running, or it skipped the job) and is a person's.
 */
export function readRetryPending(job: Pick<TicketJob, 'status' | 'detail' | 'stage' | 'mergeAttempt' | 'steps' | 'retry' | 'stop'>, now: Date): boolean {
    if (!['blocked', 'interrupted'].includes(job.status) || !readOnlyStageJob(job) || job.retry?.exhausted) return false;
    if (job.retry?.nextAt) return true;
    const stopped = Date.parse(job.stop?.at || ''), age = now.getTime() - stopped;
    if (!Number.isFinite(stopped) || age < 0 || age > RETRY_PLAN_GRACE_MS) return false;
    return (job.retry?.attempts ?? 0) < MAX_READ_RETRIES && (temporaryReadFailure(job.detail) || incompleteReadOutput(job.detail));
}
export function planReadRetry(item: {
    status: string;
    detail: string;
    retry?: ReadRetry;
}, now: Date) {
    if (!['blocked', 'interrupted'].includes(item.status) || !temporaryReadFailure(item.detail) && !incompleteReadOutput(item.detail))
        return false;
    const r = item.retry ??= { attempts: 0, nextAt: '', history: [], exhausted: false };
    if (r.exhausted)
        return false;
    if (!r.nextAt) {
        if (r.attempts >= MAX_READ_RETRIES) {
            r.exhausted = true;
            return true;
        }
        r.history.push({ at: now.toISOString(), detail: item.detail });
        r.nextAt = new Date(now.getTime() + ATTEMPT_DELAYS_MS[r.attempts]).toISOString();
        return true;
    }
    if (now.getTime() < Date.parse(r.nextAt))
        return false;
    r.attempts++;
    r.nextAt = '';
    item.status = 'queued';
    item.detail = `Automatic read-only retry ${r.attempts}/3 queued. Original failure retained in retry history.`;
    return true;
}
export function reconcileReadRetries(store: Store, now = new Date()) {
    const c = store.state.coordination;
    if (!c || store.state.paused)
        return;
    let changed = false;
    const latest = [...new Map(c.listener.reviews.map(r => [r.key, r])).values()];
    for (const r of latest) {
        const work = store.state.workLog?.filter(w => w.requestId === r.id && w.stage === 'assignment-review').at(-1);
        if (work?.status === 'running')
            continue;
        if (r.status === 'interrupted' && work) {
            try {
                const dir = resolve(store.dataRoot, 'sessions', work.id), provider = JSON.parse(readFileSync(resolve(dir, 'provider.json'), 'utf8')), saved = JSON.parse(readFileSync(resolve(dir, 'result.json'), 'utf8'));
                if (provider.readOnly !== true || provider.project !== store.project.id || saved.session !== work.sessionId)
                    continue;
                const result = IntakeResult.parse({ prerequisites: null, existingWork: null, ...saved.result });
                r.retry ??= { attempts: 0, nextAt: '', history: [], exhausted: false };
                r.retry.history.push({ at: now.toISOString(), detail: r.detail });
                r.status = result.outcome === 'held' ? 'held' : !result.ownershipChecked || result.outcome === 'owned' && !result.owner.trim() ? 'blocked' : result.outcome;
                r.detail = `${result.summary}\n${result.evidence.join('\n')}`;
                r.owner = result.owner;
                changed = true;
                store.emit('intake-result-recovered', `${r.key}: saved read-only intake result restored; no worker or external write replayed.`, 'pm', r.key);
            }
            catch { /* Missing or invalid saved output is not proof of completion. */ }
        }
        const assigned = c.listener.assigned.find(i => i.key === r.key), pickup = c.pickup?.status || defaultPickupStatus(store.project);
        if (r.workRequested !== 'manual' && (!assigned || (assigned.pickupStatus ?? assigned.status) !== pickup))
            continue;
        if (planReadRetry(r, now)) {
            changed = true;
            store.emit('read-retry', `${r.key}: ${r.retry?.exhausted ? 'read retries exhausted; team follow-up required' : r.status === 'queued' ? 'safe read retry queued' : `read retry scheduled for ${r.retry?.nextAt}`}.`, 'pm', r.key);
        }
    }
    // Delivery jobs alone get the delivery policy: the counted 5xx tail, the uncounted quota wait and draft retries
    // (`server/delivery/attempts/`). Intake above and offline activation keep the three short attempts.
    let ledger: ReturnType<typeof unsettledEffects> | undefined;
    const unsettled = () => ledger ??= unsettledEffects(store);
    for (const j of c.jobs || []) {
        if (store.state.workLog?.some(w => w.requestId === j.id && w.status === 'running'))
            continue;
        const event = planDeliveryRetry(j, deliveryRetryDecision(store, j, now, unsettled), now);
        if (event) {
            changed = true;
            store.emit('read-retry', `${j.key}: ${j.stage} ${event}.`, 'lead', j.key);
        }
    }
    if (changed)
        store.save();
}
