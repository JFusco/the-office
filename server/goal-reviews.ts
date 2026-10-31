import { z } from 'zod';
import type { DailyGoalUpdate, GoalEvidenceRef, ProjectGoal } from '../src/shared';
import type { Store } from './store';
export const EvidenceRefSchema = z.object({ projectId: z.string().max(80), kind: z.enum(['ticket', 'job', 'issue', 'pr', 'maintenance', 'blocker']), id: z.string().max(200), version: z.string().max(100), head: z.string().max(100) }).strict();
export const GoalEvidenceRequestSchema = z.object({ projectId: z.string().min(1).max(80), goals: z.array(z.object({ goalId: z.string().min(1).max(200), expectedUpdatedAt: z.string().min(1).max(100) }).strict()).min(1).max(12), inputFingerprint: z.string().regex(/^[a-f0-9]{64}$/), questions: z.array(z.string().trim().min(1).max(500)).min(1).max(6) }).strict();
export const DailyResultSchema = z.object({ evidenceRequests: z.array(GoalEvidenceRequestSchema).max(12).optional(), summary: z.string().min(1).max(12000), updates: z.array(z.object({ projectId: z.string(), goalId: z.string(), expectedUpdatedAt: z.string(), progress: z.string().max(2000), blockers: z.array(z.string().max(500)).max(10), evidence: z.array(EvidenceRefSchema).max(20), linkedWork: z.array(EvidenceRefSchema).max(20), rationale: z.string().min(1).max(4000), status: z.enum(['idea', 'planned', 'active', 'blocked', 'done']).nullable() }).strict()).max(200), unmapped: z.array(z.string().max(500)).max(200) }).strict();
export const FreshDailyResultSchema = DailyResultSchema.extend({ evidenceRequests: z.array(GoalEvidenceRequestSchema).max(12) });
export function workEvidence(store: Store, ref: GoalEvidenceRef): {
    started: boolean;
    accepted: boolean;
} | null {
    if (ref.projectId !== store.project.id)
        return null;
    const job = store.state.coordination?.jobs?.find(job => job.id === ref.id || job.key === ref.id || ref.kind === 'pr' && String(job.pr) === ref.id);
    if (job && ['job', 'issue', 'pr', 'blocker'].includes(ref.kind)) {
        if (ref.version === job.updatedAt && ref.head === (job.mergeCommit || job.head))
            return { started: !!job.steps.length, accepted: job.status === 'completed' && job.stage === 'closeout' && job.steps.some(step => step.stage === 'closeout' && step.result.outcome === 'passed' && step.result.receipts.length > 0 && step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain)) };
        if (ref.kind !== 'pr') return null;
    }
    if (ref.kind === 'ticket' || ref.kind === 'blocker') {
        const ticket = store.state.tickets.find(ticket => ticket.key === ref.id);
        if (ticket && ref.version === ticket.updated && ref.head === ticket.commit)
            return { started: ticket.pilot, accepted: ticket.stage === 'complete' && ticket.results['staging-qa']?.outcome === 'passed' };
    }
    if (ref.kind === 'maintenance') {
        const run = store.state.maintenance?.runs.find(run => run.id === ref.id);
        if (run && ref.version === (run.endedAt || run.startedAt) && !ref.head)
            return { started: !!run.startedAt, accepted: run.status === 'completed' && !run.stage.startsWith('skipped:') && run.steps.length > 0 && run.steps.every(step => step.result.outcome === 'passed' && step.result.receipts.every(receipt => receipt.verified && !receipt.uncertain)) };
    }
    if (ref.kind === 'pr') {
        const provider = store.project.provider === 'github' ? store.state.github : store.state.azure;
        if (!provider || provider.error || !provider.observedAt || ref.version !== provider.observedAt) return null;
        const pr = store.project.provider === 'github' ? store.state.github?.prs.find(pr => String(pr.number) === ref.id) : store.state.azure.prs.find(pr => String(pr.id) === ref.id);
        const head = pr && ('head' in pr ? pr.head : pr.commit);
        if (pr && head && ref.head === head) return { started: true, accepted: false };
    }
    return null;
}
function statusAllowed(goal: ProjectGoal, update: DailyGoalUpdate, evidence: {
    started: boolean;
    accepted: boolean;
}[]): boolean {
    const next = update.status || goal.status;
    if (next === goal.status)
        return true;
    if (goal.status === 'idea' || goal.status === 'done')
        return false;
    if (next === 'done')
        return ['active', 'blocked'].includes(goal.status) && evidence.length > 0 && evidence.every(item => item.accepted) && update.blockers.length === 0;
    if (next === 'blocked')
        return ['planned', 'active'].includes(goal.status) && update.blockers.length > 0;
    if (next === 'active')
        return ['planned', 'blocked'].includes(goal.status) && update.blockers.length === 0 && evidence.some(item => item.started);
    return goal.status === 'blocked' && next === 'planned' && update.blockers.length === 0;
}
/** Local goal + application receipt commit together; central acknowledgement follows. */
export function applyGoalReview(store: Store, reviewId: string, update: DailyGoalUpdate) {
    return store.transaction(() => {
        const previous = store.db.prepare('SELECT body FROM goal_review_applications WHERE review_id=? AND project_id=? AND goal_id=?').get(reviewId, store.project.id, update.goalId) as {
            body: string;
        } | undefined;
        if (previous)
            return JSON.parse(previous.body);
        const goal = store.state.goals?.find(goal => goal.id === update.goalId);
        if (!goal || update.projectId !== store.project.id || goal.projectId !== store.project.id || goal.mapping !== 'mapped')
            throw new Error('Goal has no unambiguous canonical project mapping');
        if (goal.updatedAt !== update.expectedUpdatedAt)
            throw new Error('Goal was edited after collection; a fresh assessment is required');
        const references = [...update.evidence, ...update.linkedWork];
        const facts = references.map(ref => workEvidence(store, ref));
        if (facts.some(fact => !fact))
            throw new Error('Goal evidence identity or version is stale or unsupported');
        if (goal.status === 'blocked' && update.status && update.status !== 'blocked' && (goal.progress?.linkedWork.length || 0) > 0 && !goal.progress!.linkedWork.every(old => references.some(ref => ref.projectId === old.projectId && ref.kind === old.kind && ref.id === old.id) && workEvidence(store, references.find(ref => ref.projectId === old.projectId && ref.kind === old.kind && ref.id === old.id)!)?.accepted))
            throw new Error('Previously recorded blockers lack positive resolution evidence');
        if (!statusAllowed(goal, update, facts as {
            started: boolean;
            accepted: boolean;
        }[]))
            throw new Error('Proposed status lacks scope acceptance, started work or blocker evidence');
        const before = structuredClone(goal), at = store.clock.now().toISOString();
        goal.progress = { note: update.progress, blockers: update.blockers, evidence: update.evidence, linkedWork: update.linkedWork, lastReviewId: reviewId, reviewedAt: at };
        if (update.status)
            goal.status = update.status;
        goal.updatedAt = new Date(Math.max(Date.parse(at), Date.parse(goal.updatedAt) + 1)).toISOString();
        const application = { reviewId, projectId: store.project.id, goalId: goal.id, at, proposal: update, before, after: structuredClone(goal) };
        store.db.prepare('INSERT INTO goal_review_applications VALUES(?,?,?,?,?)').run(reviewId, store.project.id, goal.id, at, JSON.stringify(application));
        store.emit('goal-review-applied', `Avery updated progress for ${goal.title}.`, 'cto');
        return application;
    });
}
export function goalHistory(store: Store, goalId = '', limit = 50, before = '') {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        throw new Error('History limit must be between 1 and 100');
    let cursor = ['', '', ''];
    if (before) {
        try {
            cursor = JSON.parse(Buffer.from(before, 'base64url').toString());
        }
        catch {
            throw new Error('Invalid history cursor');
        }
        if (!Array.isArray(cursor) || cursor.length !== 3 || cursor.some(value => typeof value !== 'string'))
            throw new Error('Invalid history cursor');
    }
    return (store.db.prepare("SELECT body FROM goal_review_applications WHERE project_id=? AND (?='' OR goal_id=?) AND (?='' OR (at,review_id,goal_id)<(?,?,?)) ORDER BY at DESC,review_id DESC,goal_id DESC LIMIT ?").all(store.project.id, goalId, goalId, before, ...cursor, limit) as {
        body: string;
    }[]).map(row => { const value = JSON.parse(row.body); return { ...value, cursor: Buffer.from(JSON.stringify([value.at, value.reviewId, value.goalId])).toString('base64url') }; });
}
