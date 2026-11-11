import { z } from 'zod';
import type { IntakeLedger } from '../slack-intake/ledger';
import type { ReadTask, SourceUnit } from '../slack-intake/contracts';
import type { CollectionPolicy } from './collection-policy';

export const EvidenceResult = z.object({ units: z.array(z.object({ id: z.string(), outcome: z.enum(['evidence', 'no-reusable-lesson', 'deferred', 'inaccessible', 'error']), reason: z.string().max(500) }).strict()) }).strict();
export function acceptEvidence(ledger: IntakeLedger, policy: CollectionPolicy, task: ReadTask, value: unknown, observed: SourceUnit[]): void {
    if (ledger.source?.id !== policy.sourceId || task.sourceId !== policy.sourceId || task.sourceDigest !== policy.sourceDigest) throw Error('Project evidence authority mismatch');
    const result = EvidenceResult.parse(value), returned = new Map(observed.map(u => [u.id, u]));
    const outcomes = new Map(result.units.map(u => [u.id, u]));
    const pending = observed.filter(u => ledger.get<SourceUnit>('unit', `${u.id}:${u.version}`)?.state === 'pending');
    if (outcomes.size !== result.units.length || result.units.some(u => !returned.has(u.id)) || pending.some(u => !outcomes.has(u.id))) throw Error('Evidence outcome coverage mismatch');
    ledger.transaction(() => {
        const current = ledger.get<ReadTask>('task', task.id);
        if (!current || current.status !== 'running' || current.attempt !== task.attempt) throw Error('Stale evidence result');
        for (const unit of pending) {
            const key = `${unit.id}:${unit.version}`, outcome = outcomes.get(unit.id)!;
            if (ledger.get<{ state: string }>('admission', key)?.state !== 'admitted') throw Error('Unscanned evidence');
            ledger.put('unit', key, { ...ledger.get<SourceUnit>('unit', key)!, state: outcome.outcome === 'evidence' ? 'admitted' : outcome.outcome, reason: outcome.reason });
        }
    });
}
