import type { OfficeProject, OfficeSnapshot, Prerequisite } from '../../src/shared';
import { PROJECTS } from '../office/projects';
export const STATE_VERSION = 1;
export function resolveProjectLabel(label: string): OfficeProject | undefined {
    const value = label.trim().toLowerCase();
    return PROJECTS.find(project => project.id.toLowerCase() === value || project.name.toLowerCase() === value);
}
/** Add fields without guessing evidence, moving goals, or replaying work. */
export function migrateSnapshot(state: OfficeSnapshot, project: OfficeProject): void {
    state.workLog ??= [];
    state.ciHistory ??= [];
    state.outbox ??= [];
    state.messages ??= [];
    state.projectNotes ??= [];
    state.slackDeliveries ??= [];
    state.goals ??= [];
    state.leadershipReports ??= [];
    state.scheduler ??= { noticeClaims: 0, lastClaimAt: '', lastProgressAt: '', undispatchedCycles: 0 };
    state.draining ??= false;
    for (const goal of state.goals) {
        goal.projectId = project.id;
        goal.mapping = resolveProjectLabel(goal.project)?.id === project.id ? 'mapped' : 'unmapped';
        goal.progress ??= { note: '', blockers: [], linkedWork: [], evidence: [], lastReviewId: '', reviewedAt: '' };
    }
    const coordination = state.coordination;
    if (!coordination)
        return;
    coordination.continuations ??= [];
    coordination.requests ??= [];
    if (project.id === 'cms-field-vocabulary')
        for (const job of coordination.jobs || [])
            if (['GH-91', 'GH-100'].includes(job.key) && ['blocked', 'interrupted'].includes(job.status) && job.stage === 'implement' && !coordination.requests.some(request => request.action === 'adopt-candidate' && request.key === job.key))
                coordination.requests.push({ id: crypto.randomUUID(), action: 'adopt-candidate', key: job.key, head: '', lane: 'delivery', status: 'queued', requestedAt: state.serverTime, detail: 'Read-only saved-candidate reconciliation required before new source work.' });
    coordination.jobs ??= [];
    const provenance = { evidence: 'Migrated explicit persisted dependency', observedAt: state.serverTime };
    for (const job of coordination.jobs) {
        job.prerequisites ??= [];
        const add = (dependency: Prerequisite) => {
            if (!job.prerequisites!.some(p => p.condition === dependency.condition && p.target.projectId === dependency.target.projectId && p.target.id === dependency.target.id))
                job.prerequisites!.push(dependency);
        };
        if (job.dependsOnPR) {
            const parent = coordination.jobs.find(candidate => candidate.pr === job.dependsOnPR);
            add({ target: { projectId: project.id, kind: parent ? 'delivery' : 'pr', id: parent?.id || String(job.dependsOnPR) }, condition: parent ? 'job-completed' : 'pr-merged', ...provenance });
        }
        if (job.ciFollowupKey) {
            const repair = coordination.jobs.find(candidate => candidate.key === job.ciFollowupKey);
            add({ target: { projectId: project.id, kind: 'delivery', id: repair?.id || job.ciFollowupKey }, condition: 'job-completed', ...provenance });
        }
    }
    const latest = new Set([...new Map(coordination.listener.reviews.map(review => [review.key, review])).values()].map(review => review.id));
    for (const review of coordination.listener.reviews) {
        if (review.prerequisites === undefined && latest.has(review.id) && review.status === 'held' && review.workRequested)
            review.legacyDependencyReviewPending = true;
        review.prerequisites ??= [];
        review.timing ??= [];
    }
    for (const job of coordination.jobs)
        job.timing ??= [];
    for (const run of state.maintenance?.runs || [])
        run.timing ??= [];
    if (coordination.time) {
        coordination.time.publications ??= [];
        for (const entry of coordination.time.entries)
            entry.revision ??= 1;
    }
}
