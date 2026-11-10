import type { Store } from '../../store/store';
import { Effects } from '../../store/effects';
import { command } from '../../workers/process';
import { IntakeLedger } from './ledger';
import { digest } from './config';
import { collectionAllowed, type CollectionPolicy } from '../sources/collection-policy';
import type { SourceRegistry } from '../sources/registry';
import type { CaptureReceipt, Proposal, SourceUnit } from './contracts';
const effectId = (id: string) => `slack-capture:${id}`;
const authorization = 'configured-private-slack-intake';
export async function captureProposal(store: Store, config: CollectionPolicy, proposalId: string, registry: SourceRegistry, execute = command): Promise<void> {
    const source = registry.get(config.sourceId);
    if (!source || source.homeProjectId !== store.project.id || source.destination !== 'technical-brain' || store.project.id !== 'brain' || store.state.paused || store.state.draining) return;
    const ledger = new IntakeLedger(store, source), effects = new Effects(store), proposal = ledger.get<Proposal>('proposal', proposalId);
    if (!proposal || proposal.status === 'captured' || proposal.status === 'rejected') return;
    if (proposal.sourceId !== source.id) return;
    const eligible = () => collectionAllowed(registry, store, config) && proposal.sourceDigest === source.sourceDigest && config.domains.includes(proposal.domain);
    const receipt = async (): Promise<CaptureReceipt> => {
        try { return JSON.parse(await execute('node', ['scripts/brain.mjs', 'capture', 'receipt', '--request-id', proposal.id], { cwd: store.project.repo, readOnly: true, timeout: 30000 })); }
        catch { throw Error('intake-receipt-unavailable'); }
    };
    const matches = (r: CaptureReceipt) => r.found === true && r.requestId === proposal.id && r.inputSha256 === proposal.hash && r.domain === proposal.domain && typeof r.id === 'string';
    const finish = (r: CaptureReceipt) => ledger.transaction(() => {
        proposal.status = 'captured'; proposal.receipt = r; ledger.put('proposal', proposal.id, proposal);
        for (const id of proposal.units) {
            const unit = ledger.get<SourceUnit>('unit', id);
            // Provenance may cite an already-accounted version; only units this proposal settles change state.
            if (unit && unit.requests.includes(proposal.id) && unit.requests.every(request => ledger.get<Proposal>('proposal', request)?.status === 'captured')) { unit.state = 'captured'; ledger.put('unit', id, unit); }
        }
    });
    const unresolved = () => { proposal.status = 'unresolved'; proposal.nextAt = new Date(store.clock.now().getTime() + 3600000).toISOString(); ledger.put('proposal', proposal.id, proposal); };
    // The independent receipt is the settlement authority; dispatch stdout is only the effect's saved response.
    const settle = async () => { const observed = await receipt(); if (!matches(observed)) throw Error('intake-capture-receipt-conflict'); finish(observed); };
    const existing = store.getEffect(effectId(proposal.id));
    if (existing?.status === 'verified') { try { await settle(); } catch { unresolved(); } return; }
    if (existing && ['dispatching', 'uncertain'].includes(existing.status)) {
        try {
            const settled = await effects.reconcile(effectId(proposal.id), async () => { const r = await receipt(); return { verified: matches(r), receipt: r }; });
            if (settled) finish(store.getEffect(effectId(proposal.id))!.receipt as CaptureReceipt);
            else unresolved();
        } catch { unresolved(); }
        return;
    }
    if (!eligible()) return;
    if (existing?.status === 'rejected') {
        if (existing.dispatchedAt) throw Error('intake-rejection-ambiguous');
        const replacement = { ...proposal, id: ledger.id(), predecessor: proposal.id, status: 'pending' as const };
        ledger.transaction(() => {
            proposal.status = 'rejected'; ledger.put('proposal', proposal.id, proposal); ledger.put('proposal', replacement.id, replacement);
            for (const id of proposal.units) { const unit = ledger.get<SourceUnit>('unit', id)!; unit.requests = unit.requests.map(request => request === proposal.id ? replacement.id : request); ledger.put('unit', id, unit); }
        });
        return;
    }
    try {
        await effects.execute({ id: effectId(proposal.id), work: { projectId: 'brain', kind: 'knowledge-slack-intake', id: proposal.id }, attemptId: proposal.id,
            operation: 'brain-inbox-capture', target: proposal.id, authorization, payload: { draft: proposal.id, hash: proposal.hash }, expectedState: { domain: proposal.domain, config: proposal.configHash || proposal.sourceDigest },
            preflight: async () => { if (!eligible() || config.sourceDigest !== proposal.sourceDigest || digest(proposal.body) !== proposal.hash) throw Error('intake-capture-preflight'); },
            dispatch: async () => {
                try { return JSON.parse(await execute('node', ['scripts/brain.mjs', 'capture', '--stdin', '--request-id', proposal.id, '--domain', proposal.domain], { cwd: store.project.repo, input: proposal.body, timeout: 300000 })) as CaptureReceipt; }
                catch { throw Error('intake-capture-response-unavailable'); }
            }, verify: async () => matches(await receipt()),
        });
        // Re-read even when execute returned a saved effect receipt.
        await settle();
    } catch { proposal.status = store.getEffect(effectId(proposal.id))?.status === 'rejected' ? 'pending' : 'unresolved'; proposal.nextAt = new Date(store.clock.now().getTime() + 3600000).toISOString(); ledger.put('proposal', proposal.id, proposal); }
}
