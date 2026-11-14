import type { OfficeSnapshot, Ticket } from '../shared';

/** Display eligibility only; the server independently verifies native evidence and source. */
export function savedImplementationFollowup(snapshot: OfficeSnapshot, actionId: string): Ticket | undefined {
    if (snapshot.project?.id !== 'cec') return;
    return snapshot.tickets.find(t => {
        const result = t.results.implement;
        const writers = (snapshot.workLog || []).filter(w => w.ticket === t.key && w.stage === 'implement');
        const writer = writers[0];
        return actionId === `ticket:${t.key}:implement` && t.pilot && t.stage === 'implement' && t.activity === 'blocked' &&
            !t.implementationContinuation && !t.commit && !t.branch && !t.worktree && !t.prId &&
            result?.outcome === 'blocked' && result.receipts.length === 1 && result.receipts[0].action === 'implement' &&
            result.receipts[0].uncertain && !result.receipts[0].verified && writers.length === 1 &&
            writer.status === 'failed' && writer.provider === 'claude' && writer.failure?.category === 'uncertain-effect';
    });
}
