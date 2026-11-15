import { resolve } from 'node:path';
import type { Stage, StageResult, Ticket } from '../../../src/shared';

export function qaRunDirectory(ticket: Ticket, stage: Stage, artifactRoot: string): string {
    const original = resolve(artifactRoot, '.qa', 'runs', `qa-${stage}-${ticket.attempt}`);
    const continuation = ticket.qaPlanContinuations?.find(item => item.stage === stage && item.attempt === ticket.attempt);
    if (!continuation) return original;
    const next = `${original}-acceptance`;
    if (continuation.commit !== ticket.commit || continuation.fromRunDir !== original || continuation.toRunDir !== next)
        throw new Error('QA plan continuation identity changed; reconcile its retained history');
    return next;
}

/** A passed result may not reuse the retained access-only report. */
export function qaPlanEvidenceGap(ticket: Ticket, stage: Stage, result: StageResult, artifactRoot: string): string {
    if (!ticket.qaPlanContinuations?.some(item => item.stage === stage && item.attempt === ticket.attempt)) return '';
    try {
        return result.qaRunDir === qaRunDirectory(ticket, stage, artifactRoot) ? '' : 'The bound QA acceptance plan report is required; the old access probe cannot pass this stage';
    } catch { return 'QA plan continuation identity requires reconciliation'; }
}
