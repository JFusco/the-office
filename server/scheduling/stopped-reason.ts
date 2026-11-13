import type { BlockedCause } from '../../src/contracts/work';

const LABELS: Partial<Record<string, { cause: BlockedCause; label: string }>> = {
    failed: { cause: 'failed', label: 'Failed, not retried' },
    uncertain: { cause: 'unconfirmed', label: 'Effect unconfirmed; read back, never resent' },
    interrupted: { cause: 'interrupted', label: 'Interrupted, waiting for recovery' },
    blocked: { cause: 'needs-decision', label: 'Blocked, needs a decision' },
};

/** The record's own first line of explanation, without a leading "Error:". */
function explanation(record: { detail?: unknown; error?: unknown }) {
    const text = [record.error, record.detail].find(value => typeof value === 'string' && value.trim()) as string | undefined;
    if (!text) return '';
    const line = text.trim().split('\n')[0].replace(/^Error:\s*/, '');
    return line.length > 240 ? `${line.slice(0, 240)}…` : line;
}

/**
 * Why a retained record with a stopped status is not running: a cause for counting and a reason a person can act on.
 * Pure; the record's own `error` or `detail` explains it, so readers never see a bare status.
 */
export function stoppedReason(status: string, record: { detail?: unknown; error?: unknown }): { cause: BlockedCause; reason: string } {
    const known = LABELS[status], label = known?.label || `Stopped (${status})`, why = explanation(record);
    return { cause: known?.cause || 'needs-decision', reason: why ? `${label}: ${why}` : label };
}
