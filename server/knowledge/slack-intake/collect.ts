import { randomUUID } from 'node:crypto';
import { IntakeLedger } from './ledger';
import { configDigest, type Config } from './config';
import type { Observation, ReadTask, SourceUnit } from './contracts';
export function newTask(config: Config, channel: string, kind: ReadTask['kind'], resource: string, oldest: string, latest: string, week: string, at: string): ReadTask {
    return { id: randomUUID(), channel, kind, resource, oldest, latest, week, status: 'pending', failures: 0, nextAt: '', createdAt: at, attempt: '', ownerClaim: '', error: '', configHash: configDigest(config) };
}
export function recordObservation(ledger: IntakeLedger, taskId: string, observation: Observation): void {
    ledger.transaction(() => {
        const task = ledger.get<ReadTask>('task', taskId);
        if (!task || task.status !== 'running' || task.attempt !== observation.attempt || observation.task !== task.id) throw Error('stale-intake-observation');
        if (ledger.get('observation', `${observation.attempt}:${observation.id}`)) return;
        ledger.put('observation', `${observation.attempt}:${observation.id}`, observation);
        for (const unit of observation.units) {
            const key = `${unit.id}:${unit.version}`, prior = ledger.get<SourceUnit>('unit', key);
            if (!prior) ledger.put('unit', key, { ...unit, week: task.week });
        }
    });
}
/** Checkpoints advance only after every observed identity has been durably queued. */
export function settlePage(ledger: IntakeLedger, config: Config, task: ReadTask, observation: Observation): void {
    ledger.transaction(() => {
        const current = ledger.get<ReadTask>('task', task.id);
        if (!current || current.attempt !== task.attempt || current.status !== 'running') throw Error('stale-intake-result');
        if (!ledger.get('observation', `${observation.attempt}:${observation.id}`)) throw Error('missing-intake-observation');
        const tasks = ledger.all<ReadTask>('task');
        const enqueue = (kind: ReadTask['kind'], resource: string, sourceUrl?: string) => {
            if (!tasks.some(t => t.channel === task.channel && t.kind === kind && t.resource === resource && t.latest === task.latest)) {
                const next = newTask(config, task.channel, kind, resource, task.oldest, task.latest, task.week, observation.at);
                if (sourceUrl) next.sourceUrl = sourceUrl; ledger.put('task', next.id, next); tasks.push(next);
            }
        };
        for (const unit of observation.units) {
            if ((unit.replies || 0) > 0 || task.kind === 'search' && unit.parent && unit.parent !== unit.ts) enqueue('thread', unit.parent || unit.resource);
            // Public reads serve only reconsideration of deferred versions; classified sources never spend the launch budget.
            const deferred = ledger.get<SourceUnit>('unit', `${unit.id}:${unit.version}`)?.state === 'deferred';
            for (const ref of unit.references) {
                // A linked canvas keeps its own permalink; message attachments fall back to the message.
                if (ref.kind === 'file' || ref.kind === 'canvas') enqueue(ref.kind, ref.id, ref.url ?? unit.url);
                // Internal workspace links stay explicit gaps on the unit; the public reader never receives them.
                else if (ref.kind === 'link' && deferred && !ledger.get('link', ref.id)) ledger.put('link', ref.id, { url: ref.id, source: `${unit.id}:${unit.version}`, state: 'pending', week: task.week, depth: 0, failures: 0, nextAt: '' });
            }
        }
        if (task.kind === 'lookup') ledger.put('identity', task.channel, { configHash: task.configHash, at: observation.at, observation: `${observation.attempt}:${observation.id}` });
        if (observation.complete) { current.status = 'complete'; delete current.cursor; }
        else {
            if (!observation.cursor || observation.cursor === current.cursor) throw Error('pagination-did-not-advance');
            // Native cursors are expiring hints, never a timestamp or a completed window.
            // Retain immutable bounds; cursor expiry restarts that window and durable units deduplicate it.
            current.cursor = observation.cursor; current.status = 'pending';
        }
        // A replayed first page of an incomplete window must not erase its continuation failures.
        current.attempt = ''; current.ownerClaim = ''; current.nextAt = ''; if (observation.complete) { current.failures = 0; current.error = ''; }
        ledger.put('task', current.id, current);
    });
}
