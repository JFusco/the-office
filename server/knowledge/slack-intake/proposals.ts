import { randomUUID } from 'node:crypto';
import { configDigest, digest, type Config } from './config';
import { IntakeLedger } from './ledger';
import type { IntakeResultValue, Proposal, ReadTask, SourceUnit } from './contracts';
/** Every returned item may be reported; only still-pending versions require an outcome and receive one. */
export function acceptProposals(ledger: IntakeLedger, config: Config, task: ReadTask, result: IntakeResultValue, observed: SourceUnit[]): void {
    const returned = new Map(observed.map(unit => [unit.id, unit]));
    const required = new Map(observed.filter(unit => { const saved = ledger.get<SourceUnit>('unit', `${unit.id}:${unit.version}`); return saved && saved.state === 'pending' && !saved.requests.length; }).map(unit => [unit.id, unit]));
    const reported = new Map(result.units.map(unit => [unit.id, unit]));
    if (reported.size !== result.units.length || [...reported.keys()].some(id => !returned.has(id)) || [...required.keys()].some(id => !reported.has(id))) throw Error('intake-unit-coverage-mismatch');
    const pending: Proposal[] = [];
    for (const proposal of result.proposals) {
        if (!config.domains.includes(proposal.domain) || !proposal.body.trim() || Buffer.byteLength(proposal.body) > 16384 || !proposal.units.length || new Set(proposal.units).size !== proposal.units.length) throw Error('invalid-intake-proposal');
        if (proposal.units.some(id => !returned.has(id) || reported.get(id)?.outcome !== 'proposed')) throw Error('unobserved-intake-proposal');
        // Replayed, already-accounted sources never re-propose.
        if (!proposal.units.some(id => required.has(id))) continue;
        const provenance = proposal.units.map(id => returned.get(id)!);
        if (provenance.some(unit => unit.url && !proposal.body.includes(unit.url))) throw Error('intake-provenance-missing');
        pending.push({ id: randomUUID(), task: task.id, domain: proposal.domain, body: proposal.body, hash: digest(proposal.body), units: provenance.map(u => `${u.id}:${u.version}`), sourceVersions: provenance.map(u => u.version), status: 'pending', configHash: configDigest(config) });
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
