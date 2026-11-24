import type { TicketJob } from '../../src/shared';

/**
 * The outbox item of a stopped harness-worded park, in place of the generic one. A published park shows its reason
 * and the full instruction its comment gives, which names the actual pickup lane. An unpublished park with a write
 * sent and not read back, or a known route or historical-proof stop, says what edit the pull request needs, that the
 * Office has not confirmed its decision comment and a card may already be in Block, each unconfirmed write with the
 * provider error its attempt left, the stop itself, and that moving a card cannot resume the job until the comment
 * is confirmed. Model parks, and anything else, keep the default item: undefined.
 */
export function metadataParkAction(job: TicketJob): { title: string; detail: string } | undefined {
    const parked = job.parked;
    if (!parked?.instruction || !parked.marker) return undefined;
    if (parked.published)
        return job.status === 'blocked' && job.detail.startsWith('Decision needed') ? { title: `${job.key} needs a decision on the board`, detail: `${parked.reason}\n\n${parked.instruction}` } : undefined;
    if (!['blocked', 'interrupted'].includes(job.status) || !parked.unconfirmed?.length && !parked.stopped) return undefined;
    // A park saved before its reason named the edit says it in the first part of its instruction.
    const edit = parked.metadata ? parked.reason : `${parked.reason} ${parked.instruction.split('\n\n')[0]}`;
    return { title: `${job.key} decision comment is not confirmed`, detail: [
        edit,
        'The Office has not confirmed its decision comment on the issue, and a card may already be in Block.',
        ...(parked.unconfirmed || []).map(write => `Not yet read back: ${write.write}. ${write.error}`),
        ...(parked.stopped ? [parked.stopped] : []),
        `Last stop: ${job.detail}`,
        'Moving a card cannot resume this job until the comment is confirmed. The Office reads each write it sent back against its original request and never sends it again.',
    ].join('\n') };
}
