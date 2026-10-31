import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { PrerequisitesSchema } from '../delivery/pipeline/dependencies';
import type { Store } from '../store/store';
import type { ReadRetry } from '../../src/shared';
export const IntakeResult = z.object({ outcome: z.enum(['ready', 'owned', 'blocked', 'held']), ownershipChecked: z.boolean(), owner: z.string(), summary: z.string(), evidence: z.array(z.string()).min(1), prerequisites: PrerequisitesSchema, existingWork: z.object({ projectId: z.string(), kind: z.enum(['pr', 'native-session', 'native-run', 'maintenance']), id: z.string(), evidence: z.string() }).strict().nullable() }).strict();
/** A read-only worker cut off by the model's output limit produced no effects; re-running the read is safe. */
export function incompleteReadOutput(text: string) {
    return /codex exited 1: Incomplete response returned, reason: max_output_tokens/i.test(text);
}
export function temporaryReadFailure(text: string) {
    return !/(?:hold|backlog|prerequisite|permission|denied|forbidden|unauthorized|oauth|token|ownership|active owner|uncertain|mutation|must be reconciled|external effects)/i.test(text) && /(?:timed? out|timeout|ECONNRESET|ECONNREFUSED|EAI_AGAIN|connection (?:reset|closed|failed)|error connecting|HTTP 50[234]|rate.limit|(?:Error: )?codex exited 1: Selected model is at capacity\. Please try a different model\.)/i.test(text);
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
        if (r.attempts >= 3) {
            r.exhausted = true;
            return true;
        }
        r.history.push({ at: now.toISOString(), detail: item.detail });
        r.nextAt = new Date(now.getTime() + [30000, 120000, 300000][r.attempts]).toISOString();
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
        const assigned = c.listener.assigned.find(i => i.key === r.key), pickup = c.pickup?.status || (store.project.provider === 'github' ? 'Ready' : 'To Do');
        if (r.workRequested !== 'manual' && (!assigned || (assigned.pickupStatus ?? assigned.status) !== pickup))
            continue;
        if (planReadRetry(r, now)) {
            changed = true;
            store.emit('read-retry', `${r.key}: ${r.retry?.exhausted ? 'read retries exhausted; team follow-up required' : r.status === 'queued' ? 'safe read retry queued' : `read retry scheduled for ${r.retry?.nextAt}`}.`, 'pm', r.key);
        }
    }
    for (const j of c.jobs || []) {
        if (!['review', 'lead-pr'].includes(j.stage) || j.mergeAttempt || j.steps.some(s => s.result.receipts.some(r => r.uncertain || !r.verified && !/^(?:get|read|query|inspect)\b/i.test(r.action))) || store.state.workLog?.some(w => w.requestId === j.id && w.status === 'running'))
            continue;
        if (planReadRetry(j, now)) {
            changed = true;
            store.emit('read-retry', `${j.key}: read-only review ${j.retry?.exhausted ? 'retries exhausted' : j.status === 'queued' ? 'retry queued' : `retry scheduled for ${j.retry?.nextAt}`}.`, 'lead', j.key);
        }
    }
    if (changed)
        store.save();
}
