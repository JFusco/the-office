import type { OfficeSnapshot, AssignmentReview } from '../shared';
import { deliveryLabel, shortSummary, readinessWait, maintenanceIssue } from './work-summary';
export function prerequisiteKeys(review: AssignmentReview) {
    return [...new Set((review.prerequisites || []).map(dependency => dependency.target.kind === 'issue' && /^\d+$/.test(dependency.target.id) ? `GH-${dependency.target.id}` : dependency.target.id))];
}
export interface PMQueueItem {
    id: string;
    blockedBy?: string[];
    project: string;
    projectName: string;
    key: string;
    title: string;
    phase: string;
    detail: string;
    at: string;
    pr: number;
    prUrl: string;
    paused: boolean;
    group: 'active' | 'queued' | 'waiting' | 'stopped';
}
export function pmQueueItems(snapshot: OfficeSnapshot) {
    const reviews = new Map((snapshot.pmQueue || []).map(r => [`${r.project}:${r.review.key}`, r]));
    const jobs = new Map((snapshot.teamQueue || []).filter(r => r.job.status !== 'cancelled').slice().sort((a, b) => a.job.requestedAt.localeCompare(b.job.requestedAt)).map(r => [`${r.project}:${r.job.key}`, r]));
    const rows: PMQueueItem[] = [];
    const paused = (project: string) => !!snapshot.projects?.find(p => p.id === project)?.paused;
    for (const [identity, { project, projectName, job }] of jobs) {
        if (job.status === 'completed')
            continue;
        const retry = job.retry?.nextAt, wait = job.status === 'watching' && !job.mergeCommit ? readinessWait(job) : undefined;
        rows.push({ id: `delivery:${job.id}`, project, projectName, key: job.key, title: reviews.get(identity)?.review.summary || (project === snapshot.project?.id ? snapshot.tickets.find(t => t.key === job.key)?.summary : '') || `PR #${job.pr} delivery`, phase: wait ? wait.phase : retry ? `Read retry scheduled · ${new Date(retry).toLocaleTimeString()}` : deliveryLabel(job), detail: wait ? `${wait.summary} ${wait.next}` : job.status === 'working' ? `The team is working on ${deliveryLabel(job).replace(/^Working on /, '')}.` : shortSummary(job.detail), at: job.requestedAt, pr: job.pr, prUrl: job.prUrl, paused: paused(project), blockedBy: job.ciFollowupKey ? [job.ciFollowupKey] : job.dependsOnPR ? [(snapshot.teamQueue || []).find(row => row.project === project && row.job.pr === job.dependsOnPR)?.job.key || ''].filter(Boolean) : [], group: (job.prerequisites || []).some(dependency => !(snapshot.teamQueue || []).some(row => row.project === dependency.target.projectId && (row.job.id === dependency.target.id || row.job.key === dependency.target.id) && row.job.status === 'completed')) ? 'waiting' : wait ? 'stopped' : retry ? 'queued' : ['working', 'watching'].includes(job.status) ? 'active' : job.status === 'queued' ? 'queued' : 'stopped' });
    }
    for (const [identity, { project, projectName, review: r }] of reviews) {
        // Delivery owns the current state, including completed delivery. An old intake
        // decision cannot become a second queue card for that project-qualified issue.
        const dependencies = prerequisiteKeys(r);
        if (dependencies.length && !jobs.has(identity)) {
            rows.push({ id: `intake:${r.id}`, project, projectName, key: r.key, title: r.summary, phase: `Blocked by ${dependencies.join(', ')}`, detail: shortSummary(r.detail), at: r.queuedAt, pr: 0, prUrl: '', paused: paused(project), group: 'waiting', blockedBy: dependencies });
            continue;
        }
        if (jobs.has(identity) || !['queued', 'working', 'blocked', 'interrupted'].includes(r.status) || r.status !== 'working' && !r.workRequested)
            continue;
        const retry = r.retry?.nextAt;
        rows.push({ id: `intake:${r.id}`, project, projectName, key: r.key, title: r.summary, phase: retry ? `Read retry scheduled · ${new Date(retry).toLocaleTimeString()}` : r.status === 'working' ? r.workRequested ? 'Morgan is checking ownership' : 'Morgan is reporting on this assignment' : r.status === 'queued' ? 'Queued for Morgan’s ownership check' : 'Intake stopped · needs team follow-up', detail: shortSummary(r.detail), at: r.queuedAt, pr: 0, prUrl: '', paused: paused(project), group: retry ? 'queued' : r.status === 'working' ? 'active' : r.status === 'queued' ? 'queued' : 'stopped' });
    }
    const maintenance = snapshot.maintenance?.runs.at(-1), project = snapshot.project;
    if (maintenance?.blockerFollowup && project) {
        const f = maintenance.blockerFollowup, key = maintenanceIssue(maintenance, project.repository);
        if (key && !rows.some(r => r.project === project.id && r.key === key))
            rows.push({ id: `maintenance:${maintenance.id}`, project: project.id, projectName: project.name, key, title: snapshot.github?.issues.find(i => i.key === key)?.title || 'Project maintenance', phase: f.status === 'completed' ? `Refresh waiting on GH-${f.issue}` : f.status === 'working' ? 'Morgan is routing the source repair' : f.status === 'queued' ? 'Source repair handoff queued' : 'Source repair handoff needs read-back', detail: shortSummary(f.detail, 240), at: maintenance.endedAt, pr: 0, prUrl: '', paused: paused(project.id), group: f.status === 'completed' ? 'waiting' : f.status === 'working' ? 'active' : f.status === 'queued' ? 'queued' : 'stopped', blockedBy: f.issue ? [`GH-${f.issue}`] : [] });
    }
    else if (maintenance && project && ['blocked', 'interrupted'].includes(maintenance.status)) {
        const key = maintenanceIssue(maintenance, project.repository);
        if (key && !rows.some(r => r.project === project.id && r.key === key))
            rows.push({ id: `maintenance:${maintenance.id}`, project: project.id, projectName: project.name, key, title: snapshot.github?.issues.find(i => i.key === key)?.title || 'Project maintenance', phase: maintenance.readbackRetry && !maintenance.readbackRetry.exhausted ? 'Recovery queued for Morgan' : 'Maintenance stopped', detail: shortSummary(maintenance.steps.at(-1)?.result.summary || maintenance.error, 240) + ' Next needed: Morgan reconciles source failures and catalog changes before a native-gated retry.', at: maintenance.endedAt, pr: 0, prUrl: '', paused: paused(project.id), group: maintenance.readbackRetry && !maintenance.readbackRetry.exhausted ? 'queued' : 'stopped' });
    }
    const rank = { active: 0, queued: 1, waiting: 2, stopped: 3 };
    for (const row of rows) {
        const kind = row.id.startsWith('delivery:') ? 'delivery' : row.id.startsWith('intake:') ? 'intake' : undefined;
        const item = snapshot.progression?.find(item => item.work.projectId === row.project && item.work.kind === kind && item.work.id === row.id.slice(row.id.indexOf(':') + 1));
        if (!item)
            continue;
        row.group = item.eligibility.state === 'running' ? 'active' : item.eligibility.state === 'runnable' ? 'queued' : item.eligibility.state === 'waiting' ? 'waiting' : 'stopped';
        if (['blocked', 'waiting'].includes(item.eligibility.state))
            row.detail = `${item.eligibility.reason}. Next owner: ${item.eligibility.owner}`;
    }
    return rows.sort((a, b) => rank[a.group] - rank[b.group] || (a.at || '').localeCompare(b.at || ''));
}
