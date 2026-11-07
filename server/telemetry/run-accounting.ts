import type { ImportProvenance, RunAccounting } from '../../src/contracts/telemetry';
import type { Store } from '../store/store';
import { codexHome } from './codex-rollout-file';
import { parseCodexRollout, type CodexRollout } from './codex-rollout';
import { findCodexChildRollouts, findCodexRollout, readCodexRollout } from './codex-rollout-file';
import { claudeCost, codexCost } from './run-cost';
import { claudeUsage, codexUsage } from './run-usage';

interface Source { evidenceId: string; sourcePath: string | null; sourceSha256: string | null; at: string; provenance?: ImportProvenance }

/** Accounting for a Claude invocation from its `result` event (success or error result alike). */
export function claudeAccounting(result: Record<string, any> | null, source: Source): RunAccounting {
    return { usage: claudeUsage(result), cost: claudeCost(result), provenance: source.provenance ?? 'live', evidenceId: source.evidenceId, sourcePath: source.sourcePath, sourceSha256: source.sourceSha256, acceptedAt: source.at };
}

/**
 * Accounting for a terminated Codex invocation, read from its rollout. Call only after the
 * process has exited: before then the rollout may still be growing.
 */
export function codexAccounting(home: string, threadId: string, startedAt: string, at: string): RunAccounting {
    const unpriced = (reason: string, path: string | null = null): RunAccounting => ({ usage: codexUsage(null, reason), cost: { ...codexCost(null), reasons: [reason] }, provenance: 'live', evidenceId: `codex:${threadId || 'no-thread'}`, sourcePath: path, sourceSha256: null, acceptedAt: at });
    if (!threadId) return unpriced('no-thread-started');
    const path = findCodexRollout(home, threadId, startedAt);
    if (!path) return unpriced('rollout-not-found');
    const read = readCodexRollout(path);
    if ('reason' in read) return unpriced(read.reason, path);
    const rollout = withChildren(parseCodexRollout(read.text, threadId), home, threadId, startedAt);
    return { usage: codexUsage(rollout), cost: codexCost(rollout), provenance: 'live', evidenceId: `codex:${threadId}`, sourcePath: path, sourceSha256: read.sha256, acceptedAt: at };
}

/** Child threads (for example the approval guardian) are separate invocations counted once with the run. */
function withChildren(parent: CodexRollout, home: string, threadId: string, startedAt: string): CodexRollout {
    const merged: CodexRollout = { ...parent, requests: [...parent.requests], models: [...parent.models], efforts: [...parent.efforts], gaps: [...parent.gaps] };
    for (const { path, threadId: childId } of findCodexChildRollouts(home, threadId, startedAt)) {
        const read = readCodexRollout(path);
        if ('reason' in read) { merged.gaps.push(`child-${read.reason}`); continue; }
        const child = parseCodexRollout(read.text, childId);
        merged.requests.push(...child.requests);
        for (const model of child.models) if (!merged.models.includes(model)) merged.models.push(model);
        for (const effort of child.efforts) if (!merged.efforts.includes(effort)) merged.efforts.push(effort);
        merged.gaps.push(...child.gaps.map(gap => `child-${gap}`));
    }
    return merged;
}

/**
 * Records accounting once the provider process has terminated. Codex is read from its rollout;
 * a Claude run that never produced a usable result is recorded explicitly unpriced. Accounting
 * never fails a run: any error becomes an event.
 */
export function recordTerminalAccounting(store: Store, work: { id: string; provider: 'claude' | 'codex'; session: string; startedAt: string; role: import('../../src/shared').Role; ticket?: string }, home = codexHome()): void {
    try {
        const at = store.clock.now().toISOString();
        if (work.provider === 'codex') store.recordRunEvidence(work.id, codexAccounting(home, work.session, work.startedAt, at));
        else if (!store.state.workLog?.find(item => item.id === work.id)?.accounting) store.recordRunEvidence(work.id, claudeAccounting(null, { evidenceId: `claude:${work.id}`, sourcePath: null, sourceSha256: null, at }));
    }
    catch (error) {
        try { store.emit('accounting-unavailable', `Usage evidence could not be recorded: ${String(error).slice(0, 300)}`, work.role, work.ticket); } catch { /* the store itself is failing */ }
    }
}
