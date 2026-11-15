import type { Store } from '../store/store';
import type { Stage, Ticket } from '../../src/shared';
import { isQAStage, legacyQA, officeQADirectory } from './assignment';
/** Bind the actual new dispatch before provider work; old artifacts are never converted. */
export function prepareCECQA(store: Store, ticket: Ticket, stage: Stage, root: string) {
    const officeQA = isQAStage(stage) && !legacyQA(ticket, stage);
    const directory = officeQADirectory(root, stage, ticket.attempt, crypto.randomUUID());
    if (officeQA) {
        const prior = ticket.results[stage];
        if (prior && !(ticket.qaHistory || []).some(h => JSON.stringify(h.result) === JSON.stringify(prior)))
            ticket.qaHistory = [...(ticket.qaHistory || []), { stage, result: structuredClone(prior) }].slice(-6);
        (ticket.qaProtocol ??= {})[stage] = 'office-v1'; store.save();
    }
    return { officeQA, directory };
}
export function bindGitHubQA(store: Store, opts: { officeQA?: boolean; stage?: string; requestId?: string; ticket?: string }) {
    if (!opts.officeQA || opts.stage !== 'github-validate') return;
    const job = store.state.coordination?.jobs?.find(j => j.id === opts.requestId && j.key === opts.ticket);
    if (!job) throw new Error('Office QA requires its registered delivery assignment');
    job.qaProtocol = 'office-v1'; store.save();
}
