import type { TicketJob } from './shared';
/** One projection for continuation priority and truthful delivery ownership, distinct from an active worker. */
export function deliveryRepairProjection(job: TicketJob) {
    const continuation=job.implementationContinuation,config=continuation?.sourceConfig;
    if(config&&!['completed','cancelled'].includes(job.status)&&(continuation!.phase==='activation'||!config.reviewedSha256&&['repair','technical-review'].includes(continuation!.phase)))return {
        rank:1,owner:continuation!.phase==='technical-review'?'Sam':'Alex',
        phase:continuation!.phase==='activation'?'Reviewed input repair awaits native activation':continuation!.phase==='technical-review'?'Sam reviews exact offline source-input proposal':'Alex prepares offline source-input proposal',
        next:config.reservation?'Original offline worker/reservation requires provider and effect readback; no replay.':config.readRetry?.nextAt?`Confirmed no-write reader retry waits until ${config.readRetry.nextAt}.`:continuation!.phase==='activation'?`Native retry eligibility ${config.retryAt}; original source findings remain open.`:'No capture or source acceptance before independent proposal review.',
        retryAt:continuation!.phase==='activation'?config.retryAt:config.readRetry?.nextAt
    };

    if (!job.repairCycle || ['completed', 'cancelled'].includes(job.status)) return undefined;
    const cycle = job.repairCycle;
    if (cycle.phase !== 'diagnosis' && !(job.stage === 'update-base' && cycle.phase === 'repair') &&
        !(cycle.pendingFindingIds.length && (job.stage === 'review' && cycle.phase === 'review' || job.stage === 'validate' && cycle.phase === 'verify'))) return undefined;
    const phase = job.stage === 'update-base' && job.repairCycle.phase === 'repair' ? 'Alex repairs the issue fix'
        : job.stage === 'review' && job.repairCycle.phase === 'diagnosis' ? 'Sam assesses a revised approach' : undefined;
    const next = job.repairCycle.phase === 'diagnosis' ? job.status === 'queued' || job.status === 'working'
        ? 'Sam assesses a scoped revised approach; Ellis checks Office operations separately.'
        : 'Morgan owns the diagnosed restriction; original repair evidence and developer ownership remain visible.'
        : job.stage === 'update-base' ? 'Independent review and verification of the repaired head follow.' : undefined;
    return { rank: 1, owner: 'Alex', phase, next } as const;
}
