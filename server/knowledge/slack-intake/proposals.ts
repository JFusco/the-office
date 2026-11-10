import { randomUUID } from 'node:crypto';
import { digest } from './config';
import type { CollectionPolicy } from '../sources/collection-policy';
import { IntakeLedger } from './ledger';
import type { IntakeResultValue, Proposal, ReadTask, SourceUnit } from './contracts';
import { assertProposalScope } from './proposal-scope';
/** Every returned item may be reported; only still-pending versions require an outcome and receive one. */
export function acceptProposals(ledger: IntakeLedger, config: CollectionPolicy, task: ReadTask, result: IntakeResultValue, observed: SourceUnit[]): void {
    if (config.destination !== 'technical-brain' || ledger.store.project.id !== 'brain' || ledger.source?.id !== config.sourceId || task.sourceDigest !== config.sourceDigest || task.sourceId !== config.sourceId) throw Error('Technical capture requires its registered Brain source');
    const returned = new Map(observed.map(unit => [unit.id, unit]));
    const required = new Map(observed.filter(unit => { const saved = ledger.get<SourceUnit>('unit', `${unit.id}:${unit.version}`); return saved && saved.state === 'pending' && !saved.requests.length; }).map(unit => [unit.id, unit]));
    const reported = new Map(result.units.map(unit => [unit.id, unit]));
    if (reported.size !== result.units.length || [...reported.keys()].some(id => !returned.has(id)) || [...required.keys()].some(id => !reported.has(id))) throw Error('intake-unit-coverage-mismatch');
    const pending: Proposal[] = [];
    for (const proposal of result.proposals) {
        assertProposalScope(config,proposal,returned,reported);
        // Replayed, already-accounted sources never re-propose.
        if (!proposal.units.some(id => required.has(id))) continue;
        const provenance = proposal.units.map(id => returned.get(id)!);
        if (provenance.some(unit => unit.url && !proposal.body.includes(unit.url))) throw Error('intake-provenance-missing');
        pending.push({ id: randomUUID(), task: task.id, domain: proposal.domain, body: proposal.body, hash: digest(proposal.body), units: provenance.map(u => `${u.id}:${u.version}`), sourceVersions: provenance.map(u => u.version), status: 'pending', configHash: '', sourceId: config.sourceId, sourceDigest: config.sourceDigest });
    }
    for (const [id, unit] of required) {
        const outcome = reported.get(id)!;
        if (outcome.outcome === 'proposed' && !pending.some(p => p.units.includes(`${id}:${unit.version}`))) throw Error('intake-proposal-missing');
        if (outcome.outcome !== 'proposed' && !outcome.reason.trim()) throw Error('intake-outcome-reason-missing');
    }
    ledger.transaction(() => {
        const current = ledger.get<ReadTask>('task', task.id);
        if (!current || current.attempt !== task.attempt || current.status !== 'running') throw Error('stale-intake-result');
        for (const proposal of pending) ledger.put('proposal', proposal.id, proposal);
        for (const [id, observedUnit] of required) {
            const outcome = reported.get(id)!, key = `${id}:${observedUnit.version}`, unit = ledger.get<SourceUnit>('unit', key)!;
            if (unit.state === 'captured' || unit.state === 'no-reusable-lesson' || unit.requests.length) continue;
            unit.state = outcome.outcome === 'proposed' ? 'pending' : outcome.outcome;
            unit.reason = outcome.reason.slice(0, 500); unit.requests = pending.filter(p => p.units.includes(key)).map(p => p.id);
            ledger.put('unit', key, unit);
        }
    });
}
