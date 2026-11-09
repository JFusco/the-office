import type { Store } from '../store/store';
import type { KnowledgeImprovement } from '../../src/contracts/knowledge';
import type { FeatureManifest } from '../../src/contracts/features';
import type { PublicationReceipt } from '../features/publication';
import { Effects } from '../store/effects';
import { HOLDS } from '../office/config';
import { improvementDigest, IMPROVEMENT_POLICY } from './propose-improvements';
import { improvementManifest, improvementMarker, improvementProvider } from './improvement-publication';
import { retryDelay } from './run-retrospective';
import { linkedRepairGap } from './linked-repair-gate';
import { improvementIncidentKey } from './improvement-incident';

/** `controls: false` ignores only the temporary office controls (learning disabled, pause, drain). */
export function improvementEligible(store: Store, item: KnowledgeImprovement, controls = true): boolean {
    const grant = store.state.knowledge?.improvementGrant;
    const incidents = item.incidents.map(id => improvementIncidentKey(store, id));
    return (!controls || !!store.state.knowledge?.enabled && !store.state.paused && !store.state.draining) && !!grant?.enabled && grant.policy === IMPROVEMENT_POLICY && grant.projectId === store.project.id && !!grant.source &&
        item.destination === store.project.id && item.origin === 'work' && incidents.every(Boolean) && new Set(incidents).size >= 2 &&
        !!item.evidence.length && !!item.cause && !!item.change && !!item.regression && !!item.acceptance.length &&
        item.digest === improvementDigest(item) &&
        !item.incidents.some(id => store.state.knowledge?.followups?.some(followup => followup.id === id && HOLDS[followup.key]) || store.state.coordination?.jobs?.some(job => id === `job:${job.id}` && HOLDS[job.key]) || store.state.tickets.some(ticket => id === `ticket:${ticket.runId}` && HOLDS[ticket.key]));
}
/** Independent create/assign/queue grant. Feature approvals are never invented or invoked. */
export async function admitImprovement(store: Store, id: string, provider: import('../features/publication').FeaturePublisher & { closed?(key: string): Promise<boolean>; openItems(): Promise<{ key: string; text: string; url: string }[]>; verifyFinal: NonNullable<import('../features/publication').FeaturePublisher['verifyFinal']> } = improvementProvider(store, id)): Promise<void> {
    let item = store.state.knowledge?.improvements?.find(item => item.id === id);
    if (!item || item.status === 'closed') return;
    if (item.status === 'open') {
        if (store.state.paused || store.state.draining) return;
        item.nextCheckAt = new Date(store.clock.now().getTime() + 86400000).toISOString(); store.save();
        try { if (item.providerId && await provider.closed?.(item.providerId)) { item.status = 'closed'; item.detail = 'Owning provider confirms this improvement is closed; original incident outcomes remain separate.'; store.save(); } } catch { /* Unavailable read preserves externally-open capacity. */ }
        return;
    }
    const digest = item.digest, grant = JSON.stringify(store.state.knowledge?.improvementGrant);
    // Set only when the sole failed check is a temporary office control; authorization or source changes leave it false.
    let controlOnly = false;
    const current = () => {
        const value = store.state.knowledge?.improvements?.find(item => item.id === id);
        controlOnly = false;
        if (!value || value.digest !== digest || grant !== JSON.stringify(store.state.knowledge?.improvementGrant) || !improvementEligible(store, value)) {
            controlOnly = !!value && value.digest === digest && grant === JSON.stringify(store.state.knowledge?.improvementGrant) && improvementEligible(store, value, false);
            throw new Error('Improvement authorization, specification or source controls changed');
        }
        return value;
    };
    try {
        // Read-back settles the original effect even after authority is revoked. It grants no new write.
        const effects = new Effects(store);
        for (const effectId of item.effectIds) {
            const prior = store.getEffect(effectId);
            if (prior && ['uncertain', 'dispatching'].includes(prior.status)) {
                if (!await effects.reconcile(effectId, intent => provider.readBack(intent))) throw new Error('Original publication remains uncertain; never resend');
                const receipt = store.getEffect(effectId)!.receipt as PublicationReceipt;
                if (!receipt.key || !receipt.url || item.providerId && item.providerId !== receipt.key) throw new Error('Improvement identity changed');
                item.providerId = receipt.key; item.url = receipt.url; store.save();
            }
        }
        current();
        if (item.status === 'proposed' && (store.state.knowledge!.improvements || []).filter(other => other.id !== id && ['reserved', 'publishing', 'uncertain', 'open'].includes(other.status)).length >= 3) return;
        const savedManifest = item.manifest;
        if (!savedManifest) {
            const open = await provider.openItems();
            const linked = await linkedRepairGap(store, item.incidents.map(id => improvementIncidentKey(store, id)!).filter(Boolean), open, provider.closed?.bind(provider));
            if (linked) throw new Error(linked);
            if (open.some(other => other.text.includes(item!.problemKey) || other.text.toLowerCase().includes(item!.cause.toLowerCase()))) throw new Error('An open provider item may already address this cause; Morgan must link the existing work');
            const manifest = await improvementManifest(store, item, provider);
            await provider.validate(manifest); current();
            store.transaction(() => { const value = current(); if ((store.state.knowledge!.improvements || []).filter(other => other.id !== id && ['reserved', 'publishing', 'uncertain', 'open'].includes(other.status)).length >= 3) throw new Error('Improvement capacity changed before reservation'); Object.assign(value, { manifest, grant: IMPROVEMENT_POLICY, status: 'reserved' }); });
        }
        const manifest = current().manifest!, row = manifest.items[0];
        for (const operation of row.operations) {
            item = current();
            const effectId = `improvement:${id}:${operation.id}`, marker = improvementMarker(id);
            const prior = store.getEffect(effectId);
            if (prior && ['uncertain', 'dispatching'].includes(prior.status) && !await effects.reconcile(effectId, intent => provider.readBack(intent))) throw new Error('Original publication remains uncertain; never resend');
            const verified = store.getEffect(effectId);
            let receipt: PublicationReceipt;
            if (verified?.status === 'verified') receipt = verified.receipt as PublicationReceipt;
            else {
                const key = item.providerId || '';
                store.transaction(() => { const value = current(); value.status = 'publishing'; if (!value.effectIds.includes(effectId)) value.effectIds.push(effectId); });
                receipt = await effects.execute({ id: effectId, work: { projectId: store.project.id, kind: 'issue', id }, attemptId: digest, operation: `improvement-${operation.kind}`, target: store.project.repository,
                    authorization: IMPROVEMENT_POLICY, payload: { item: row, operation, key, marker }, expectedState: { digest, grant },
                    preflight: async () => { await provider.preflight(row, operation, key); current(); },
                    dispatch: () => { current(); return provider.dispatch(row, operation, key, marker); },
                    verify: receipt => provider.verify(receipt, operation) });
            }
            store.transaction(() => { const value = current(); if (!receipt.key || !receipt.url || value.providerId && value.providerId !== receipt.key) throw new Error('Improvement identity changed'); value.providerId = receipt.key; value.url = receipt.url; });
        }
        item = current();
        if (!await provider.verifyFinal(row, { key: item.providerId!, url: item.url! })) throw new Error('Final content, assignment or pickup visibility is unverified');
        store.transaction(() => { const value = current(); value.status = 'open'; value.detail = 'Publication verified; normal project intake and delivery gates apply.'; delete value.reconcileAttempts; });
    } catch (error) {
        item = store.state.knowledge?.improvements?.find(item => item.id === id);
        if (item) {
            const unsettled = item.effectIds.some(effect => ['dispatching', 'uncertain'].includes(store.getEffect(effect)?.status || ''));
            // A pause, drain or disable that lands while the request waits defers an unreserved, undispatched proposal; queueImprovements re-admits it.
            if (controlOnly && item.status === 'proposed' && !item.manifest && !item.providerId && !unsettled && (store.state.paused || store.state.draining || !store.state.knowledge?.enabled)) {
                item.detail = 'Admission deferred before any write: the project was paused, draining or had learning disabled. It is queued again when those controls clear.';
                store.save();
                return;
            }
            item.status = unsettled || item.providerId ? 'uncertain' : 'needs-input'; item.detail = String(error).slice(0, 600);
            // queueImprovements schedules the next read-back at this deadline; the request itself completes.
            item.reconcileAttempts = (item.reconcileAttempts || 0) + 1;
            item.nextCheckAt = new Date(store.clock.now().getTime() + retryDelay(item.reconcileAttempts)).toISOString();
            store.save();
        }
    }
}
