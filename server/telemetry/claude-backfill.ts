import type { RunAccounting } from '../../src/contracts/telemetry';
import { readOwnedSessionArtifact, type OwnedArtifact } from '../store/owned-artifact';
import type { Store } from '../store/store';
import { claudeAccounting } from './run-accounting';

export const COMPLETION_MAX_BYTES = 2 * 1024 * 1024;
export type CompletionReader = (dataRoot: string, workId: string) => OwnedArtifact;
const defaultReader: CompletionReader = (dataRoot, workId) => readOwnedSessionArtifact(dataRoot, workId, 'provider-completion.json', COMPLETION_MAX_BYTES);

/**
 * Imports the CLI's cost estimate for finished Claude runs recorded before live capture existed.
 * Each saved `provider-completion.json` is validated against the run it claims to describe; the
 * wrapper's descriptive `costBasis` text is ignored in favour of the per-model basis in the result.
 * Repeats are no-ops, and an unusable artifact leaves the run explicitly unpriced with a reason.
 */
export function backfillClaudeCost(store: Store, reader: CompletionReader = defaultReader): { imported: number; unpriced: number; skipped: number } {
    const counts = { imported: 0, unpriced: 0, skipped: 0 };
    const at = store.clock.now().toISOString();
    // One transaction: a single save for the whole import.
    return store.transaction(() => {
        for (const work of store.state.workLog || []) {
            // Helper rows (feature reviews) are priced from their own call output, not a worker completion.
            if (work.provider !== 'claude' || work.accounting || ['running', 'stopping'].includes(work.status) || work.stage.startsWith('feature-review:')) { counts.skipped++; continue; }
            const accounting = importedAccounting(work.id, reader(store.dataRoot, work.id), at);
            const outcome = store.recordRunEvidence(work.id, accounting);
            if (outcome !== 'accepted') counts.skipped++;
            else if (accounting.cost.completeness === 'unpriced') counts.unpriced++;
            else counts.imported++;
        }
        return counts;
    });
}

function importedAccounting(workId: string, artifact: OwnedArtifact, at: string): RunAccounting {
    if ('reason' in artifact) return unpriced(workId, `completion-${artifact.reason}`, at);
    let parsed: any;
    try { parsed = JSON.parse(artifact.text); } catch { parsed = null; }
    const result = parsed?.result;
    const valid = parsed && typeof parsed === 'object' && parsed.expectedSession === workId && result && typeof result === 'object' && result.type === 'result' && result.session_id === workId;
    return valid
        ? claudeAccounting(result, { evidenceId: `claude:${workId}`, sourcePath: artifact.path, sourceSha256: artifact.sha256, at, provenance: 'historical-import' })
        : unpriced(workId, 'completion-session-mismatch', at, artifact.path, artifact.sha256);
}

function unpriced(workId: string, reason: string, at: string, sourcePath: string | null = null, sourceSha256: string | null = null): RunAccounting {
    const accounting = claudeAccounting(null, { evidenceId: `claude:${workId}`, sourcePath, sourceSha256, at, provenance: 'historical-import' });
    accounting.usage.reasons = [reason];
    accounting.cost.reasons = [reason];
    return accounting;
}
