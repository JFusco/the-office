import type { CostEntry } from '../../src/contracts/telemetry';
import { EffectUncertainError, Effects } from '../store/effects';
import type { Store } from '../store/store';
import { boardItem, githubGraphql, numberField, numberValue, readNumber, type Graphql } from '../time/board-number-field';
import { command } from '../workers/process';
import { costCoverageSummary, costLedger } from './cost-entries';
import { boardUsd } from './cost-totals';

export const COST_FIELD = 'Est. Cost (USD)';
export const COST_OPERATION = 'github-cost-field';
const publishing = new WeakSet<Store>();
export const costPublishingInProgress = (store: Store) => publishing.has(store);

/** Publishing needs the current scope (so hours and cost cover the same work) and both switches on. */
export function costPublishingEnabled(store: Store): boolean {
    const time = store.state.coordination?.time;
    return store.project.provider === 'github' && !!store.project.githubProject && !!time?.enabled && time.scopePolicy === 'model-work-v1' && !!time.cost?.githubField;
}

const effectId = (store: Store, entry: CostEntry) => `cost:${store.project.id}:${entry.key}:r${entry.revision}:a${entry.attempt}`;
const mutation = `mutation($project:ID!,$item:ID!,$field:ID!,$usd:Float!){updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,value:{number:$usd}}){projectV2Item{id}}}`;

/**
 * Publishes one pending ticket's estimated cost through Effects: durable intent, preflight, one
 * claimed dispatch, independent read-back. An attempt whose outcome is unknown is never resent;
 * it is settled by observation (cost-readback). A board value edited outside the Office blocks.
 */
export async function publishCost(store: Store, execute: typeof command = command): Promise<void> {
    if (publishing.has(store) || !costPublishingEnabled(store)) return;
    const ledger = costLedger(store)!, entry = ledger.entries.find(item => item.status === 'pending');
    if (!entry) return;
    publishing.add(store);
    const graphql: Graphql = githubGraphql(store, execute), config = store.project.githubProject!;
    try {
        const { projectId, fieldId } = await numberField(graphql, config.owner, config.number, COST_FIELD);
        const item = await boardItem(graphql, projectId, Number(entry.key.slice(3)), store.project.repository);
        const current = numberValue(item, fieldId), saved = ledger.baselines[entry.key];
        // After an abandoned attempt, the board may hold that attempt's value; that is the Office's own write.
        if (saved && saved.abandonedUsd !== undefined && current === saved.abandonedUsd)
            store.transaction(() => { saved.lastWritten = current; delete saved.abandonedUsd; });
        if (saved && (saved.itemId !== item.id || saved.fieldId !== fieldId || current !== saved.lastWritten))
            throw new OutsideEdit();
        // The first write freezes whatever the board held as the baseline, so manual values are preserved.
        const baseline = saved?.baseline ?? current ?? 0, usd = boardUsd(baseline, entry.microUsd);
        store.transaction(() => { ledger.baselines[entry.key] ??= { baseline, lastWritten: current, itemId: item.id, fieldId }; });
        if (current === usd) { settle(store, entry, usd, 'already on the board; nothing written', false); return; }
        const id = effectId(store, entry);
        store.transaction(() => { Object.assign(entry, { status: 'posting', effectId: id, intendedUsd: usd, updatedAt: store.clock.now().toISOString() }); });
        await new Effects(store).execute({
            id, work: { projectId: store.project.id, kind: 'reconciliation', id: `cost:${entry.key}` }, attemptId: `r${entry.revision}`,
            operation: COST_OPERATION, target: entry.key, authorization: 'cost-field-enabled',
            payload: { project: projectId, item: item.id, field: fieldId, usd }, expectedState: { previous: current },
            preflight: async () => {
                if (!costPublishingEnabled(store)) throw new Error('Cost publishing was turned off before dispatch');
                if (await readNumber(graphql, item.id, fieldId) !== current) throw new Error('Board cost changed before dispatch');
            },
            dispatch: payload => graphql(mutation, payload),
            verify: async () => await readNumber(graphql, item.id, fieldId) === usd,
        });
        settle(store, entry, usd, 'verified by read-back');
    }
    catch (error) {
        const uncertain = error instanceof EffectUncertainError, outside = error instanceof OutsideEdit, now = store.clock.now();
        store.transaction(() => {
            entry.status = uncertain ? 'uncertain' : 'blocked';
            entry.updatedAt = now.toISOString();
            if (uncertain) entry.detail = `Cost write needs read-back; never resent: ${String(error.message)}`;
            else if (outside) Object.assign(entry, { needsDecision: 'outside-edit', retryAt: undefined, detail: 'Board cost was changed outside the Office. Reconcile cost with accept-board to keep the edit as a baseline adjustment.' });
            else {
                // Never dispatched (preflight, discovery or a rejected effect): a new attempt may follow, with backoff.
                entry.attempt++;
                entry.retryAt = new Date(now.getTime() + Math.min(60, 5 * 2 ** Math.min(entry.attempt - 1, 4)) * 60_000).toISOString();
                entry.detail = `Not published (retrying at ${entry.retryAt}): ${String((error as Error)?.message ?? error)}`;
            }
            store.emit(uncertain ? 'cost-uncertain' : 'cost-blocked', `${entry.key}: ${entry.detail}`, 'pm', entry.key);
        });
    }
    finally { publishing.delete(store); }
}

class OutsideEdit extends Error { constructor() { super('Board cost changed outside the Office'); } }

/** Marks the revision posted and advances the verified baseline; idempotent. */
export function settle(store: Store, entry: CostEntry, usd: number, how: string, wrote = true): void {
    const ledger = costLedger(store)!;
    store.transaction(() => {
        const baseline = ledger.baselines[entry.key];
        if (baseline) baseline.lastWritten = usd;
        Object.assign(entry, { status: 'posted', intendedUsd: usd, retryAt: undefined, needsDecision: undefined, detail: `$${usd.toFixed(2)} est. on the board, ${how}. ${costCoverageSummary(entry)}`, updatedAt: store.clock.now().toISOString() });
        if (wrote) store.emit('cost-posted', `${entry.key}: est. cost $${usd.toFixed(2)} on the project board (${how}).`, 'pm', entry.key);
    });
}
