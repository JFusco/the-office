import { z } from 'zod';
import type { Role, Stage, Ticket, WorkApproach, StageResult, TicketJob } from '../../../src/shared';
export const ApproachSchema = z.object({ plan: z.enum(['none', 'brief', 'reviewed']), review: z.enum(['none', 'focused', 'full']), validation: z.enum(['developer-checks', 'independent-checks', 'browser']), checks: z.array(z.string().trim().min(1)).min(1).max(12), reason: z.string().trim().min(1).max(3000) }).strict();
export const APPROACH_GUIDANCE = `TEAM JUDGMENT: Joe explicitly delegated planning/review/test selection to the team on 2026-10-27. Blanket requirements to plan, review every plan, or browser-test every change are superseded. Make this decision within your existing assignment; do not convene extra agents just to classify routine work. Morgan proposes the approach; Alex can revise it after source inspection. Sam/Riley may challenge it when involved. Choose plan=none|brief|reviewed, review=none|focused|full (no separate source review, quick scoped review, or full implementation review), validation=developer-checks|independent-checks|browser, list the actual focused checks, and give a short reason grounded in the task and code. Small understood edits often need no separate plan or reviewer. A brief plan can help coordinate several steps without independent plan review; uncertainty, broad consequences or difficult rollback can justify a reviewed plan. Browser work is useful for changed interactions or behavior that cannot be established with relevant checks; docs, packages and backend changes often use focused checks instead. These are judgment examples, not filename or line-count rules. Preserve repository-required checks, explicit issue-specific acceptance requirements, holds and authorization. Never downgrade just to hide a failure, unavailable tool or unknown provider effect. Resolve findings before publication. Choose full for changes whose uncertainty or consequences justify a broad implementation audit; focused stays in the assigned Lead session and must not launch a full review chain. Reviews use the assigned reviewer, not an automatic Claude handoff. When a previously unneeded gate becomes useful, explain it and escalate.
Return approach=null when keeping the current decision. In understand, propose an explicit approach. To change the route BEFORE executing a stage that is no longer appropriate, return outcome=reroute with a revised approach, no write receipts, no paid runs and no implementation/remote changes. This is a decision handoff, not a passed stage. Do not execute a writer stage and then request a planning detour.`;
export function recordApproach(t: Ticket, approach: WorkApproach, role: Role, stage: string) {
    const next = ApproachSchema.parse(approach);
    const prior = t.approach || { plan: 'reviewed', review: 'focused', validation: 'browser' };
    const reducing = ['none', 'brief', 'reviewed'].indexOf(next.plan) < ['none', 'brief', 'reviewed'].indexOf(prior.plan) || ['none', 'focused', 'full'].indexOf(next.review) < ['none', 'focused', 'full'].indexOf(prior.review) || ['developer-checks', 'independent-checks', 'browser'].indexOf(next.validation) < ['developer-checks', 'independent-checks', 'browser'].indexOf(prior.validation);
    if (reducing && t.findings.some(f => f.status !== 'verified'))
        throw new Error('Resolve findings before reducing required verification or review');
    if (reducing && unresolvedVerification(t))
        throw new Error('Resolve failed or blocked verification before reducing required verification or review');
    t.approach = next;
    t.decisions ??= [];
    t.decisions.push({ role, stage, at: new Date().toISOString(), approach: next });
    const skipped: Partial<Record<Stage, string>> = {};
    for (const s of ['plan', 'plan-review', 'code-review', 'preview', 'qa'] as Stage[])
        if (!stageNeeded(t, s) && !t.results[s])
            skipped[s] = next.reason;
    t.skippedStages = skipped;
}
export function stageNeeded(t: Ticket, stage: Stage) {
    const a = t.approach;
    if (!a)
        return true;
    if (stage === 'plan')
        return a.plan !== 'none';
    if (stage === 'plan-review')
        return a.plan === 'reviewed';
    if (stage === 'code-review' || stage === 'repair-review')
        return a.review !== 'none';
    if (stage === 'preview')
        return a.validation === 'browser';
    if (stage === 'qa')
        return a.validation !== 'developer-checks';
    return true;
}
export function firstBuildStage(t: Ticket): Stage { return stageNeeded(t, 'plan') ? 'plan' : 'implement'; }
export function afterDraft(t: Ticket): Stage { return t.approach?.validation === 'developer-checks' ? 'publish' : t.approach?.validation === 'independent-checks' ? 'qa' : 'preview'; }
export function unresolvedVerification(t: Ticket): Stage | undefined {
    for (const stage of ['plan-review', 'code-review', 'repair-review', 'preview', 'qa', 'retest'] as Stage[]) {
        if (!['failed', 'blocked'].includes(t.results[stage]?.outcome || ''))
            continue;
        const retry = stage === 'qa' ? t.results.retest : stage === 'code-review' ? t.results['repair-review'] : undefined;
        if (retry?.outcome === 'passed' && retry.commit === t.commit && retry.paidRuns !== null && !retry.receipts.some(r => r.uncertain || !r.verified) && retry.findings.every(f => stage === 'code-review' ? f.status !== 'open' : f.status === 'verified'))
            continue;
        return stage;
    }
}
export function missingApproachStage(t: Ticket): Stage | undefined {
    if (stageNeeded(t, 'plan') && t.results.plan?.outcome !== 'passed')
        return 'plan';
    if (stageNeeded(t, 'plan-review') && t.results['plan-review']?.outcome !== 'passed')
        return 'plan-review';
    if (t.results.implement?.outcome === 'passed' && stageNeeded(t, 'code-review')) {
        const stage = t.results.repair?.outcome === 'passed' ? 'repair-review' : 'code-review', review = t.results[stage];
        if (review?.outcome !== 'passed' || review.commit !== t.commit)
            return stage;
    }
}
export function plannedNext(t: Ticket, stage: Stage): Stage | undefined {
    if (!t.approach)
        return;
    if (stage === 'enhance')
        return firstBuildStage(t);
    if (['plan', 'plan-review', 'code-review', 'repair-review'].includes(stage) && t.approachReturnStage)
        return missingApproachStage(t) || t.approachReturnStage;
    if (stage === 'plan')
        return stageNeeded(t, 'plan-review') ? 'plan-review' : t.approachReturnStage || 'implement';
    if (stage === 'implement')
        return stageNeeded(t, 'code-review') ? 'code-review' : 'draft-pr';
    if (stage === 'draft-pr')
        return t.results.retest?.outcome === 'passed' && t.results.retest.commit === t.commit ? 'publish' : afterDraft(t);
    if (stage === 'repair')
        return stageNeeded(t, 'repair-review') ? 'repair-review' : 'retest';
    if (stage === 'retest')
        return t.prId ? 'publish' : 'draft-pr';
}
export function reroute(t: Ticket, stage: Stage, r: StageResult, role: Role) {
    if (!r.approach)
        throw new Error('A route change needs an explicit approach and reason');
    if (r.findings.some(f => f.status !== 'verified')) {
        t.findings = [...t.findings.filter(f => !r.findings.some(next => next.id === f.id)), ...r.findings];
        throw new Error('New findings must be resolved, not dropped through a route change');
    }
    if (r.receipts.length || r.paidRuns !== 0)
        throw new Error('Reconcile effects and resolve existing findings before changing the route');
    if (!['plan', 'plan-review', 'implement', 'code-review', 'preview', 'qa', 'repair', 'repair-review', 'retest'].includes(stage))
        throw new Error('This stage must finish or reconcile before changing its route');
    recordApproach(t, r.approach, role, stage);
    let next: Stage;
    if (['plan', 'plan-review'].includes(stage))
        next = t.approachReturnStage || 'implement';
    else if (stage === 'implement')
        next = 'implement';
    else if (['code-review', 'repair-review'].includes(stage) && t.approachReturnStage)
        next = t.approachReturnStage;
    else if (stage === 'code-review')
        next = stageNeeded(t, stage) ? stage : 'draft-pr';
    else if (stage === 'repair-review')
        next = stageNeeded(t, stage) ? stage : 'retest';
    else if (stage === 'repair' || stage === 'retest')
        next = stage;
    else
        next = afterDraft(t);
    if (next === 'implement' && t.results.implement?.outcome === 'passed')
        next = t.approachReturnStage && t.approachReturnStage !== 'implement' ? t.approachReturnStage : stageNeeded(t, 'code-review') ? 'code-review' : 'draft-pr';
    const missing = missingApproachStage(t);
    if (missing && (missing !== 'code-review' && missing !== 'repair-review' || next !== 'repair')) {
        if (missing !== next)
            t.approachReturnStage = next;
        t.stage = missing;
    }
    else
        t.stage = next;
    t.activity = 'waiting';
    t.blocker = '';
}
export function reviewInstructions(mode: WorkApproach['review'] = 'full') {
    if (mode === 'none')
        return 'NO SEPARATE SOURCE REVIEW: Verify selected exact-head developer checks and any mandatory repository/issue acceptance requirements. Do not invent a passed independent review or launch a review chain. PR readiness and merge checks still apply.';
    if (mode === 'focused')
        return 'QUICK REVIEW: Inspect the exact changed code, acceptance criteria, adjacent callers and selected check evidence in this assigned session. Report concrete defects. Do not start nested models or a full implementation-review chain. Escalate to full with a reason if inspection warrants it.';
    return 'FULL IMPLEMENTATION REVIEW: Independently audit the exact implementation against requirements and repository rules, including affected callers, integration boundaries, error and recovery paths, security/data integrity and regression evidence. Trace consequential behavior beyond the edited lines. Report concrete findings with evidence; unresolved findings block publication. Use this assigned Lead session without nested model processes or automatic Claude delegation.';
}
/** `advisoryFindings`: hands-off projects let a passed outcome decide; open findings on it are not a veto. */
export function recordJobApproach(job: TicketJob, approach: WorkApproach, role: Role, workerFailure = false, advisoryFindings = false) {
    const next = ApproachSchema.parse(approach), prior = job.approach;
    // A first focused review with independent checks is a choice, not a downgrade
    // from an invented full review. Skipping review/checks still retains guards.
    const reducing = prior ? ['none', 'focused', 'full'].indexOf(next.review) < ['none', 'focused', 'full'].indexOf(prior.review) || ['developer-checks', 'independent-checks', 'browser'].indexOf(next.validation) < ['developer-checks', 'independent-checks', 'browser'].indexOf(prior.validation) : next.review === 'none' || next.validation === 'developer-checks';
    const latest = [...new Map(job.steps.map(s => [s.stage, s.result])).values()];
    if (reducing && (workerFailure || latest.some(r => ['failed', 'blocked'].includes(r.outcome) || !advisoryFindings && r.findings.some(f => f.status !== 'verified')) || job.steps.some(s => s.result.receipts.some(r => r.uncertain || !r.verified))))
        throw new Error('Reconcile failed work, findings and uncertain effects before reducing review or verification');
    job.approach = next;
    job.decisions ??= [];
    job.decisions.push({ role, stage: job.stage, at: new Date().toISOString(), approach: next });
}
export function nextJobStage(job: TicketJob): TicketJob['stage'] {
    const a = job.approach;
    if (['implement', 'scope-repair', 'update-base', 'review', 'validate'].includes(job.stage)) {
        const review = job.steps.filter(s => s.stage === 'review').at(-1)?.result;
        const reviewed = review?.outcome === 'passed' && review.commit === job.head && (a?.review !== 'full' || review.approach?.review === 'full');
        if (a?.review !== 'none' && !reviewed)
            return 'review';
        if (a?.review === 'none')
            (job.skippedStages ??= {}).review = a.reason;
        const qa = job.steps.filter(s => s.stage === 'validate').at(-1)?.result;
        if (a?.validation !== 'developer-checks' && !(qa?.outcome === 'passed' && qa.commit === job.head))
            return 'validate';
        if (a?.validation === 'developer-checks')
            (job.skippedStages ??= {}).validate = a.reason;
        return 'draft';
    }
    return job.stage === 'draft' ? 'prepare-pr' : job.stage;
}
// Joe explicitly authorized moving on after conflict repair without repeating
// source review. Keep exact-head checks and every later provider/merge gate.
export function acceptConflictRepair(job: TicketJob, result: StageResult, advisoryFindings = false) {
    if (job.repairReason !== 'conflicts' || result.outcome !== 'passed' || result.commit !== job.head || !result.evidence.some(e => e.kind === 'checks' && e.commit === job.head) || result.receipts.some(r => r.uncertain || !r.verified) || !advisoryFindings && result.findings.some(f => f.status === 'open' && f.id !== 'draft-blocks-merge'))
        throw new Error('A verified conflict repair with current-head checks is required');
    const reason = 'Joe requested no repeated source review after conflict repair. Retain prior review history and the repair’s passing exact-head developer checks; publication, readiness and merge gates still apply.';
    const approach: WorkApproach = { plan: 'none', review: 'none', validation: 'developer-checks', checks: job.approach?.checks || ['Required repository checks on the repaired head'], reason };
    job.approach = approach;
    job.decisions ??= [];
    job.decisions.push({ role: 'pm', stage: 'update-base', at: new Date().toISOString(), approach });
    job.skippedStages = { ...job.skippedStages, review: reason, validate: reason };
}
