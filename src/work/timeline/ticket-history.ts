import { ROLE_NAMES, STAGE_LABELS, type OfficeSnapshot, type Ticket, type TicketJob, type StageResult } from '../../shared';
import { shortSummary } from '../work-summary';

export interface TimelineEntry {
    id: string;
    at?: string;
    label: string;
    detail?: string;
    mark: 'start' | 'passed' | 'repair' | 'blocked' | 'skipped';
}
const stageLabel = (stage: string) => STAGE_LABELS[stage as keyof typeof STAGE_LABELS] || stage.replaceAll('-', ' ');
const eventMarks: Record<string, TimelineEntry['mark']> = {
    'stage-started': 'start', 'stage-passed': 'passed', 'stage-blocked': 'blocked',
    'fix-requested': 'repair', 'delivery-repair-diagnosis': 'repair', 'delivery-repair-requested': 'repair',
    'delivery-queued': 'start', 'production-done': 'passed',
};

export function ticketHistory(snapshot: OfficeSnapshot, ticket: Pick<Ticket, 'key'> & Partial<Ticket>, job?: TicketJob): TimelineEntry[] {
    const rows: TimelineEntry[] = [];
    for (const review of snapshot.coordination?.listener.reviews.filter(r => r.key === ticket.key) || []) {
        if (review.queuedAt) rows.push({id: review.id + ':queued', at: review.queuedAt, label: 'Queued for intake', mark: 'start'});
        if (review.startedAt) rows.push({id: review.id + ':started', at: review.startedAt, label: ROLE_NAMES.pm + ' started intake', mark: 'start'});
        if (review.endedAt) rows.push({id: review.id + ':ended', at: review.endedAt, label: 'Intake · ' + review.status,
            detail: shortSummary(review.detail), mark: ['ready','owned'].includes(review.status) ? 'passed' : 'blocked'});
    }
    const starts = job ? [] : (snapshot.deliveryQueue || []).filter(r => r.key === ticket.key && r.action === 'start-pilot');
    for (const request of starts)
        rows.push({id: 'request:' + request.id, at: request.requestedAt, label: 'Delivery requested', mark: 'start'});
    const events = snapshot.events.filter(e => {
        if (e.ticket !== ticket.key) return false;
        if (e.kind === 'delivery-queued')
            return !job && !starts.length && e.message === ticket.key + ' queued for implementation.';
        if (e.kind === 'production-done') return !job && !ticket.production?.doneAt;
        return eventMarks[e.kind] || e.kind === 'github-delivery-stage';
    });
    if (snapshot.lastHandoff?.ticket === ticket.key) {
        const handoff = snapshot.lastHandoff;
        if (!events.some(e => e.kind === 'stage-started' && e.role === handoff.to && e.at === handoff.at))
            rows.push({id: 'handoff:' + handoff.at, at: handoff.at, label: ROLE_NAMES[handoff.from] + ' handed off to ' + ROLE_NAMES[handoff.to], mark: 'start'});
    }
    for (const event of events) {
        const queued = event.kind === 'github-delivery-stage';
        const label = queued ? 'Delivery · ' + stageLabel(event.message.replace(ticket.key + ' · ', '')) : shortSummary(event.message);
        const repair = event.kind === 'stage-started' && event.message === STAGE_LABELS.repair;
        rows.push({id: 'event:' + event.id, at: event.at, label: (!queued && event.role ? ROLE_NAMES[event.role] + ' · ' : '') + label,
            mark: repair ? 'repair' : eventMarks[event.kind] || 'start'});
    }
    function result(id: string, stage: string, value: StageResult, at?: string) {
        rows.push({id, at, label: stageLabel(stage) + ' · ' + value.outcome, detail: shortSummary(value.summary),
            mark: value.outcome === 'passed' ? 'passed' : value.outcome === 'reroute' ? 'repair' : 'blocked'});
    }
    if (job) {
        for (const [i, step] of (job.steps || []).entries()) {
            const work = step.workerId ? snapshot.workLog?.find(w => w.id === step.workerId && w.ticket === ticket.key) : undefined;
            const id = job.id + ':' + i;
            if (step.stage === 'validate' && job.qaGateRefusal?.step === i)
                rows.push({id, at: job.qaGateRefusal.at || work?.endedAt, label: 'Validation · QA evidence gate refused',
                    detail: shortSummary(step.result.summary), mark: 'blocked'});
            else
                result(id, step.stage, step.result, work?.endedAt);
        }
        if (job.mergeCommit) rows.push({id: 'merged:' + job.mergeCommit, at: snapshot.github?.prs.find(p => p.number === job.pr)?.mergedAt,
            label: 'PR #' + job.pr + ' merged', mark: 'passed'});
    } else {
        // Retained events preserve repeated visits. Older snapshots may only have the last result of a stage.
        const history = ticket.qaHistory || [];
        const results = [...history, ...Object.entries(ticket.results || {}).filter(([stage, value]) =>
            !history.some(h => h.stage === stage && h.result.summary === value.summary && h.result.commit === value.commit && h.result.outcome === value.outcome))
            .map(([stage, value]) => ({stage, result: value}))];
        const matched = new Set<number>();
        results.forEach((step, index) => {
            const event = events.find(e => !matched.has(e.id) && e.kind === 'stage-passed' && step.result.outcome === 'passed' && e.message === step.result.summary);
            if (event) matched.add(event.id);
            else result('result:' + index, step.stage, step.result,
                step.result.evidence.map(e => e.observedAt).filter(Boolean).sort((a,b) => Date.parse(a) - Date.parse(b)).at(-1));
        });
        const production = ticket.production;
        if (production?.prAt) rows.push({id: 'promotion', at: production.prAt, label: 'Promotion PR #' + production.pr, mark: 'start'});
        if (production?.deployedAt) rows.push({id: 'deployed', at: production.deployedAt, label: 'Verified production deployment', mark: 'passed'});
        if (production?.doneAt) rows.push({id: 'production-done', at: production.doneAt, label: 'Verified Jira closeout', mark: 'passed'});
    }
    const decisionAt = (job?.decisions || ticket.decisions)?.at(-1)?.at;
    for (const [stage, reason] of Object.entries(job?.skippedStages || ticket.skippedStages || {}))
        rows.push({id: 'skipped:' + stage, at: decisionAt, label: stageLabel(stage) + ' · skipped', detail: reason, mark: 'skipped'});
    // Keep undated records together in source order; never assign them an observation timestamp.
    const dated = rows.filter(row => row.at).sort((a,b) => Date.parse(a.at!) - Date.parse(b.at!));
    return [...dated, ...rows.filter(row => !row.at)];
}
