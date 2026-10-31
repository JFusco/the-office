import { writeFileSync } from 'node:fs';
import { containedFile } from './workflow';
import { command } from './process';
import { resolve } from 'node:path';
import type { DeliveryRepairCycle, StageResult, TicketJob, Ticket, Stage, WorkApproach } from '../src/shared';
import type { Store } from './store';
import { namedRepairIds } from './delivery/findings/repair-scope';

/** Models describe defects; the harness restricts which stages, identities and effects can repair. */
/** `named`: hands-off projects repair the findings the reviewer names (see namedRepairIds). */
export function repairFindingIds(result: StageResult, named = false): string[] | null {
    if (named) return namedRepairIds(result);
    const resolution = result.resolution;
    if (!resolution || resolution.kind !== 'source-repair' || !['failed', 'blocked'].includes(result.outcome) || result.prerequisites?.length || result.receipts.some(r => r.uncertain || !r.verified)) return null;
    const ids = result.findings.filter(f => f.status !== 'verified').map(f => f.id);
    if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !id.trim()) || resolution.findingIds.length !== ids.length || new Set(resolution.findingIds).size !== ids.length || ids.some(id => !resolution.findingIds.includes(id))) return null;
    if (!resolution.evidenceIds.length || resolution.evidenceIds.some(id => !result.evidence.some(e => e.id === id && !!e.path && e.commit === result.commit))) return null;
    return ids;
}
export function reserveRepair(prior: DeliveryRepairCycle | undefined, ids: string[], stage: string, head: string): DeliveryRepairCycle {
    const findingAttempts = { ...(prior?.findingAttempts || {}) };
    const attempts = (prior?.attempts || 0) + 1;
    const revised = prior?.approachRevision === 1;
    const exhausted = attempts > (revised ? 10 : 6) || ids.some(id => (findingAttempts[id] || 0) >= (revised ? 4 : 2));
    if (!exhausted) for (const id of ids) findingAttempts[id] = (findingAttempts[id] || 0) + 1;
    return { ...prior, owner: 'developer', findingAttempts, attempts: exhausted ? prior?.attempts || 0 : attempts, pendingFindingIds: ids, sourceStage: stage, sourceHead: head, phase: exhausted ? 'diagnosis' : 'repair' };
}
export function repairDispositions(cycle: DeliveryRepairCycle, result: StageResult, independent = false) {
    return cycle.pendingFindingIds.every(id => result.findings.some(f => f.id === id && (independent ? f.status === 'verified' : f.status !== 'open')));
}
export function enqueueRepairDiagnosis(store: Store, job: Pick<TicketJob, 'id' | 'key' | 'head' | 'steps' | 'repairCycle'>) {
    const cycle = job.repairCycle!;
    if (cycle.diagnosisRequestId) return;
    const id = crypto.randomUUID();
    cycle.diagnosisRequestId = id;
    store.state.messages.push({ id, requestId: id, from: 'pm', to: 'it', ticket: job.key, actionId: '', body: `Bounded delivery repair window exhausted for ${job.key}, original delivery ${job.id}, exact head ${job.head}. Inspect retained stage evidence and provider health; report a concrete operational cause and supported next action to Morgan. Do not implement ticket code, reset budgets, change scope, replay effects or dispatch delivery. Findings: ${JSON.stringify(cycle.pendingFindingIds)}. Repair history: ${JSON.stringify(cycle.findingAttempts)}.`, status: 'queued', createdAt: store.clock.now().toISOString(), sessionId: '', recheck: false, error: '', recipients: [], receipts: [] });
}
export function githubRepairEligible(job: TicketJob, result: StageResult, named = false) {
    const ids = repairFindingIds(result, named);
    if (!ids || !['implement', 'scope-repair', 'review', 'validate', 'update-base', 'lead-pr'].includes(job.stage) || job.mergeAttempt || job.mergeIntentId || job.mergeApprovalRequired || result.prId !== job.pr || !/^[a-f0-9]{40}$/i.test(result.commit)) return null;
    if (job.head && job.head !== result.commit && !(job.stage === 'update-base' && job.repairCycle?.phase === 'repair') || !result.worktree || !result.branch || job.worktree && job.worktree !== result.worktree || job.branch && job.branch !== result.branch) return null;
    return ids;
}
/** Legacy failed Jira results retain their existing bounded route; blocked results need typed evidence. */
export function jiraRepairable(stage: Stage, result: StageResult) {
    if (!['plan-review', 'code-review', 'repair-review', 'qa', 'retest', 'ci-diagnose'].includes(stage) || result.receipts.some(r => r.uncertain || !r.verified) || result.prerequisites?.length) return false;
    if (result.resolution && result.resolution.kind !== 'source-repair') return false;
    return result.outcome === 'failed' || !!repairFindingIds(result);
}

export function approachFingerprint(approach: WorkApproach | undefined | null) {
    return JSON.stringify(approach ? { plan: approach.plan, review: approach.review, validation: approach.validation, checks: approach.checks } : null);
}
/** One changed, independently assessed approach may extend the window; no counters are reset. */
export function revisedRepair(cycle: DeliveryRepairCycle, result: StageResult, named = false): DeliveryRepairCycle | null {
    const ids = repairFindingIds(result, named);
    if (cycle.phase !== 'diagnosis' || cycle.approachRevision || !result.approach || result.commit !== cycle.sourceHead || !ids || cycle.pendingFindingIds.some(id => !result.findings.some(f => f.id === id)) || approachFingerprint(result.approach) === cycle.exhaustedApproach) return null;
    return reserveRepair({ ...cycle, approachRevision: 1 }, ids, cycle.sourceStage, cycle.sourceHead);
}
export const REPAIR_DIAGNOSIS = `The bounded source-repair window is exhausted. As Sam, independently diagnose the retained exact-head failures and propose ONE concrete revised technical approach within the same ticket scope. This is read-only ticket diagnosis, not source acceptance or a passed code review. Inspect existing diagnostics instead of repeating implementation. Return outcome=blocked, resolution.kind=source-repair only if the remaining defects are scoped technical work; preserve every unresolved ID and current-head diagnostic evidence. Return an explicit changed approach/check strategy with a reason; changing prose alone does not extend the window. Actual permission/service/scope/hold/uncertain-effect restrictions must remain their correct classification. Do not change source, publish, dispatch work or reset counters. The harness may allow one additional bounded repair window; it alone owns dispatch.`;

export async function verifyRepairCandidate(project: { repo: string; repository: string }, candidate: { head: string; branch: string; worktree: string }, execute: typeof command) {
    if (!/^[a-f0-9]{40}$/i.test(candidate.head) || !candidate.branch || !candidate.worktree || resolve(candidate.worktree) === resolve(project.repo)) throw new Error('An isolated exact repair candidate is required');
    const options = { cwd: candidate.worktree, timeout: 10000, readOnly: true };
    const origin = (await execute('git', ['remote', 'get-url', 'origin'], options)).trim();
    const repo = origin.replace(/^https:\/\/github\.com\//, '').replace(/^git@github\.com:/, '').replace(/^ssh:\/\/git@github\.com\//, '').replace(/\.git$/, '');
    if (repo.toLowerCase() !== project.repository.toLowerCase()) throw new Error('Repair worktree origin does not match this project');
    const head = (await execute('git', ['rev-parse', 'HEAD'], options)).trim();
    const branch = (await execute('git', ['branch', '--show-current'], options)).trim();
    const dirty = (await execute('git', ['status', '--porcelain'], options)).trim();
    if (head !== candidate.head || branch !== candidate.branch || dirty) throw new Error('Repair candidate changed or is dirty; preserve original work for reconciliation');
}

/** Read-only reviewers return analysis; the harness owns its durable diagnostic artifact. */
export function retainRepairEvidence(result: StageResult, stage: string, root: string, worktree: string, named = false) {
    if (!repairFindingIds(result, named)) return false;
    const inputs = result.resolution!.evidenceIds.map(id => result.evidence.find(e => e.id === id)!);
    if (inputs.every(e => containedFile(e.path, root))) return true;
    if (!['review', 'lead-pr', 'repair-diagnosis', 'code-review'].includes(stage) || !worktree || inputs.some(e => !containedFile(e.path, root) && !containedFile(e.path, worktree))) return false;
    const id = crypto.randomUUID(), path = resolve(root, `repair-assessment-${id}.json`);
    writeFileSync(path, JSON.stringify({ stage, head: result.commit, reportedAssessment: result }, null, 2), { mode: 0o600, flag: 'wx' });
    result.evidence.push({ id: `repair-assessment:${id}`, kind: 'review', summary: 'Harness saved the independently reported source assessment and its original locators; acceptance remains unverified.', path, commit: result.commit, environment: 'Office read-only assessment', url: '', observedAt: new Date().toISOString() });
    return true;
}
