import type { Store } from '../../store/store';
import type { SourceRegistry } from '../sources/registry';
import { IntakeLedger } from './ledger';
import type { ReadTask, Proposal } from './contracts';
import type { LinkRecord } from './read-links';
export function retrySlackIntake(store: Store, id: string, registry: SourceRegistry, sourceId: string): { accepted: true } {
    const source = registry.get(sourceId); if (!source || source.homeProjectId !== store.project.id) throw Error('Unknown source');
    const ledger = new IntakeLedger(store, source), task = ledger.get<ReadTask>('task', id);
    if (!task) {
        const link = ledger.get<LinkRecord>('link', id);
        if (!link || link.state !== 'needs-attention' || store.activeClaims().some(c => c.work.id === `source:${sourceId}`)) throw Error('Intake batch is not available for reset');
        ledger.put('retry-history', ledger.id(), { link: id, failures: link.failures || 0, reason: link.reason || '', at: store.clock.now().toISOString() });
        ledger.put('link', id, { ...link, state: 'pending', failures: 0, nextAt: '', reason: '' }); return { accepted: true };
    }
    if (task.status !== 'needs-attention' || task.ownerClaim || store.activeClaims().some(c => c.work.id === `source:${sourceId}`)) throw Error('Intake batch is not available for reset');
    if (ledger.all<Proposal>('proposal').some(p => p.task === id && p.status === 'unresolved')) throw Error('Uncertain capture requires receipt reconciliation');
    ledger.put('retry-history', ledger.id(), { task: id, failures: task.failures, error: task.error, at: store.clock.now().toISOString() });
    task.failures = 0; task.nextAt = ''; task.status = 'pending'; task.error = ''; ledger.put('task', id, task); return { accepted: true };
}
