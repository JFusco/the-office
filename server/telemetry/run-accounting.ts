import type { ImportProvenance, RunAccounting } from '../../src/contracts/telemetry';
import type { Role } from '../../src/shared';
import { readOwnedSessionArtifact, type BoundedRead } from '../store/owned-artifact';
import type { Store } from '../store/store';
import { parseCodexRollout, type CodexRollout } from './codex-rollout';
import { codexHome, readCodexRollout, scanCodexRollouts } from './codex-rollout-file';
import { claudeCost, codexCost } from './run-cost';
import { claudeUsage, codexUsage } from './run-usage';

interface Source { evidenceId: string; sourcePath: string | null; sourceSha256: string | null; at: string; provenance?: ImportProvenance }
export const COMPLETION_MAX_BYTES = 2 * 1024 * 1024;

/** Accounting for a Claude invocation from its `result` event (success or error result alike). */
export function claudeAccounting(result: Record<string, any> | null, source: Source): RunAccounting {
    return { usage: claudeUsage(result), cost: claudeCost(result), provenance: source.provenance ?? 'live', evidenceId: source.evidenceId, sourcePath: source.sourcePath, sourceSha256: source.sourceSha256, acceptedAt: source.at };
}

/** Replaces the generic reason with the specific one that explains the missing evidence. */
export function withReason(accounting: RunAccounting, reason: string): RunAccounting {
    accounting.usage.reasons = [reason];
    accounting.cost.reasons = [reason];
    return accounting;
}

/**
 * Accounting from a saved worker `provider-completion.json`, validated against the run it claims
 * to describe. The wrapper's descriptive `costBasis` text is ignored in favour of the per-model
 * basis inside the result. Every failure names its own reason.
 */
export function completionAccounting(workId: string, artifact: BoundedRead, at: string, provenance: ImportProvenance): RunAccounting {
    const source = { evidenceId: `claude:${workId}`, sourcePath: null as string | null, sourceSha256: null as string | null, at, provenance };
    if ('reason' in artifact) return withReason(claudeAccounting(null, source), `completion-${artifact.reason}`);
    Object.assign(source, { sourcePath: artifact.path, sourceSha256: artifact.sha256 });
    let parsed: any;
    try { parsed = JSON.parse(artifact.text); } catch { return withReason(claudeAccounting(null, source), 'completion-unparseable'); }
    const result = parsed?.result;
    if (!parsed || typeof parsed !== 'object' || !result || typeof result !== 'object' || result.type !== 'result') return withReason(claudeAccounting(null, source), 'completion-malformed');
    if (parsed.expectedSession !== workId || result.session_id !== workId) return withReason(claudeAccounting(null, source), 'completion-session-mismatch');
    return claudeAccounting(result, source);
}

export function readCompletion(dataRoot: string, workId: string): BoundedRead {
    return readOwnedSessionArtifact(dataRoot, workId, 'provider-completion.json', COMPLETION_MAX_BYTES);
}

/**
 * Accounting for a terminated Codex invocation, read from its rollout plus every thread Codex
 * started on its behalf. Call only after the process has exited: before then the rollout grows.
 */
export async function codexAccounting(home: string, threadId: string, startedAt: string, at: string): Promise<RunAccounting> {
    const unpriced = (reason: string, path: string | null = null): RunAccounting => ({ usage: codexUsage(null, reason), cost: { ...codexCost(null), reasons: [reason] }, provenance: 'live', evidenceId: `codex:${threadId || 'no-thread'}`, sourcePath: path, sourceSha256: null, acceptedAt: at });
    if (!threadId) return unpriced('no-thread-started');
    const scan = await scanCodexRollouts(home, threadId, startedAt);
    if (!scan.root) return unpriced('rollout-not-found');
    const read = await readCodexRollout(scan.root);
    if ('reason' in read) return unpriced(`rollout-${read.reason}`, scan.root);
    const rollout = parseCodexRollout(read.text, threadId);
    for (const child of scan.descendants) merge(rollout, await readCodexRollout(child.path), child.threadId);
    return { usage: codexUsage(rollout), cost: codexCost(rollout), provenance: 'live', evidenceId: `codex:${threadId}`, sourcePath: scan.root, sourceSha256: read.sha256, acceptedAt: at };
}

/** A descendant thread is a separate invocation, counted once with the run. */
function merge(into: CodexRollout, read: BoundedRead, childId: string): void {
    if ('reason' in read) { into.gaps.push(`child-rollout-${read.reason}`); return; }
    const child = parseCodexRollout(read.text, childId);
    into.requests.push(...child.requests);
    for (const model of child.models) if (!into.models.includes(model)) into.models.push(model);
    for (const effort of child.efforts) if (!into.efforts.includes(effort)) into.efforts.push(effort);
    into.gaps.push(...child.gaps.map(gap => `child-${gap}`));
}

type TerminalWork = { id: string; provider: string; sessionId: string; startedAt: string; role: Role; ticket?: string };

/**
 * Records accounting once the provider process has terminated: Codex from its rollouts, Claude
 * from its saved completion. Missing evidence is recorded as unpriced with its reason. Accounting
 * never fails a run: any error becomes an event.
 */
export async function recordTerminalAccounting(store: Store, work: TerminalWork, home = codexHome()): Promise<void> {
    try {
        const at = store.clock.now().toISOString();
        if (work.provider === 'codex') store.recordRunEvidence(work.id, await codexAccounting(home, work.sessionId, work.startedAt, at));
        else if (work.provider === 'claude') store.recordRunEvidence(work.id, completionAccounting(work.id, readCompletion(store.dataRoot, work.id), at, 'live'));
    }
    catch (error) {
        try { store.emit('accounting-unavailable', `Usage evidence could not be recorded: ${String(error).slice(0, 300)}`, work.role, work.ticket); } catch { /* the store itself is failing */ }
    }
}

/** Runs finished outside the worker (restart recovery, a dead process) are reconciled here. */
export const RECONCILE_GRACE_MS = 60_000;
const reconciling = new WeakSet<Store>();

/** Marks when capture began; set once per store and never reset, so earlier runs stay uncaptured. */
export function markCaptureStart(store: Store): string {
    if (!store.state.telemetryCaptureStartedAt) {
        store.state.telemetryCaptureStartedAt = store.clock.now().toISOString();
        store.save();
    }
    return store.state.telemetryCaptureStartedAt;
}

export async function reconcileUncapturedRuns(store: Store, home = codexHome()): Promise<number> {
    const since = store.state.telemetryCaptureStartedAt;
    if (!since || reconciling.has(store)) return 0;
    reconciling.add(store);
    try {
        const now = store.clock.now().getTime();
        const pending = (store.state.workLog || []).filter(work => !work.accounting && (work.provider === 'claude' || work.provider === 'codex')
            && !['running', 'stopping'].includes(work.status) && !work.stage.startsWith('feature-review:')
            && work.startedAt >= since && now - Date.parse(work.endedAt || work.startedAt) >= RECONCILE_GRACE_MS);
        for (const work of pending) await recordTerminalAccounting(store, work, home);
        return pending.length;
    }
    finally { reconciling.delete(store); }
}
