import { resolve } from 'node:path';
import type { Stage, StageResult, Ticket } from '../../../src/shared';

export function qaRunDirectory(ticket: Ticket, stage: Stage, artifactRoot: string): string {
    const original = resolve(artifactRoot, '.qa', 'runs', `qa-${stage}-${ticket.attempt}`);
    const retry = ticket.qaPlanRetries?.find(item => item.stage === stage && item.attempt + 1 === ticket.attempt);
    if (retry && (retry.commit !== ticket.commit || retry.toRunDir !== original))
        throw new Error('Explicit QA retry identity changed; preserve its original history');
    const continuation = ticket.qaPlanContinuations?.find(item => item.stage === stage && item.attempt === ticket.attempt);
    if (!continuation) return original;
    const next = `${original}-acceptance`;
    if (continuation.commit !== ticket.commit || continuation.fromRunDir !== original || continuation.toRunDir !== next)
        throw new Error('QA plan continuation identity changed; reconcile its retained history');
    return next;
}

/** A passed result may not reuse the retained access-only report. */
export function qaPlanEvidenceGap(ticket: Ticket, stage: Stage, result: StageResult, artifactRoot: string): string {
    const handoff = ticket.officeQAHandoffs?.find(h => h.stage === stage && h.attempt === ticket.attempt && h.commit === ticket.commit);
    if (handoff) {
        const prefix = resolve(artifactRoot, 'office-qa', `${stage}-${ticket.attempt}-`);
        return ticket.qaProtocol?.[stage] === 'office-v1' && !!result.qa && result.qaRunDir.startsWith(prefix) &&
            !result.qaRunDir.slice(prefix.length).includes('/') ? '' : 'Fresh independent Office QA evidence is required; the legacy setup cannot pass';
    }
    if (ticket.qaPlanRetries?.some(item => item.stage === stage && item.attempt + 1 === ticket.attempt)) {
        try { return result.qaRunDir === qaRunDirectory(ticket, stage, artifactRoot) ? '' : 'The new bound QA plan report is required; incomplete history cannot pass'; }
        catch { return 'Explicit QA retry identity requires reconciliation'; }
    }
    if (!ticket.qaPlanContinuations?.some(item => item.stage === stage && item.attempt === ticket.attempt)) return '';
    try {
        return result.qaRunDir === qaRunDirectory(ticket, stage, artifactRoot) ? '' : 'The bound QA acceptance plan report is required; the old access probe cannot pass this stage';
    } catch { return 'QA plan continuation identity requires reconciliation'; }
}
