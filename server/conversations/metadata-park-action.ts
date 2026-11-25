import type { TicketJob } from '../../src/shared';

/**
 * The outbox item of a stopped harness-worded park, in place of the generic one. A published park shows its reason
 * and the full instruction its comment gives, which names the actual pickup lane. An unpublished park with a write
 * sent and not read back, a failed check of a confirmed receipt, or a known prerequisite stop shows the edit and the specific problem. Model parks, and anything else, keep the default item: undefined.
 */
export function metadataParkAction(job: TicketJob): { title: string; detail: string } | undefined {
    const parked = job.parked;
    if (!parked?.instruction || !parked.marker) return undefined;
    if (parked.published)
        return job.status === 'blocked' && job.detail.startsWith('Decision needed') ? { title: `${job.key} needs a decision on the board`, detail: `${parked.reason}\n\n${parked.instruction}` } : undefined;
    if (!['blocked', 'interrupted'].includes(job.status) || !parked.unconfirmed?.length && !parked.commentReadError && !parked.stopped) return undefined;
    // A park saved before its reason named the edit says it in the first part of its instruction.
    const edit = parked.metadata ? parked.reason : `${parked.reason} ${parked.instruction.split('\n\n')[0]}`;
    if (!parked.unconfirmed?.length && parked.stopped)
        return { title: `${job.key} metadata park needs a prerequisite restored`, detail: `${edit}\n${parked.stopped}\nMoving a card cannot resume this job while the park is unpublished.` };
    return { title: `${job.key} decision comment is not confirmed`, detail: [
        edit,
        'The Office has not confirmed its decision comment on the issue, and a card may already be in Block.',
        ...(parked.unconfirmed || []).map(write => `Not yet read back: ${write.write}. ${write.error}`),
        ...(parked.commentReadError ? [`Read-back of the decision comment on issue #${job.key.slice(3)} failed: ${parked.commentReadError}`] : []),
        ...(parked.stopped ? [parked.stopped] : []),
        `Last stop: ${job.detail}`,
        'Moving a card cannot resume this job until the comment is confirmed. The Office reads each write it sent back against its original request and never sends it again.',
    ].join('\n') };
}
