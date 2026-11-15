import type { StageResult, Ticket, TicketJob } from '../shared';
export const QA_STAGES = ['qa', 'retest', 'staging-qa', 'validate'];
export function qaResults(ticket: Ticket, job?: TicketJob) {
    const entries: { stage: string; result: StageResult; at: string }[] = [];
    for (const entry of ticket.qaHistory || []) if (!Object.values(ticket.results).some(r => JSON.stringify(r) === JSON.stringify(entry.result))) entries.push({ ...entry, at: '' });
    for (const stage of ['qa', 'retest', 'staging-qa'] as const) {
        const result = ticket.results[stage];
        if (result && !entries.some(e => e.result === result || JSON.stringify(e.result) === JSON.stringify(result))) entries.push({ stage, result, at: result.evidence.map(e => e.observedAt).sort().at(-1) || '' });
    }
    for (const step of job?.steps || []) if (step.stage === 'validate') entries.push({ stage: step.stage, result: step.result, at: '' });
    return entries;
}
export function qaStatus(result: StageResult, currentHead: string, blocker = '') {
    if (result.commit !== currentHead) return 'Earlier build';
    if (blocker || result.outcome === 'blocked') return result.qa?.setup.status === 'blocked' ? 'Setup needed' : 'Blocked';
    return result.outcome === 'passed' ? 'Passed' : result.outcome === 'failed' ? 'Failed' : 'Route changed';
}
