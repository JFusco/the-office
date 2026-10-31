import { parseBrainStatus } from './brain-status';
import { z } from 'zod';
import { GitHubMaintenance, easternDate } from './maintenance';
import { maintenancePolicies } from './github-context';
import { command } from './process';
import type { MaintenanceRun, MaintenanceResult } from '../src/shared';
export const BrainResult = z.object({ outcome: z.enum(['completed', 'skipped', 'blocked']), runId: z.string(), reason: z.string(), summary: z.string(), ledger: z.string(), receipts: z.array(z.object({ id: z.string(), action: z.string(), target: z.string(), verified: z.boolean(), uncertain: z.boolean(), detail: z.string() }).strict()) }).strict();
// Brain's own nightly runner remains the publication authority. The Office
// supplies durable dispatch, shared capacity, project chat and read-back.
export class BrainMaintenance extends GitHubMaintenance {
    async readStatus() { return parseBrainStatus(JSON.parse(await command('node', ['scripts/nightly.mjs', 'status'], { cwd: this.store.project.repo, readOnly: true, timeout: 60000 }))); }
    request(_scheduled = false, now = new Date()) {
        if (this.store.state.paused)
            throw new Error('This project is paused');
        maintenancePolicies(this.store);
        const state = this.store.state.maintenance ??= { runs: [], lastDaily: '', lastWeekly: '', ledger: '' };
        const existing = state.runs.find(r => ['queued', 'working'].includes(r.status));
        if (existing)
            return existing;
        if (state.runs.some(r => ['blocked', 'interrupted'].includes(r.status)))
            throw new Error('Prior Brain maintenance needs read-back reconciliation in the outbox');
        const run: MaintenanceRun = { id: crypto.randomUUID(), requestedAt: now.toISOString(), startedAt: '', endedAt: '', status: 'queued', weekly: false, stage: 'brain-maintenance', error: '', steps: [] };
        state.runs.push(run);
        this.store.emit('maintenance-queued', 'Brain maintenance queued for the shared office desks.', 'pm');
        return run;
    }
    async pump(selectedId?: string) {
        const state = this.store.state.maintenance, run = state?.runs.find(r => r.status === 'queued' && (!selectedId || r.id === selectedId));
        if (!state || !run || this.store.state.paused || this.agents.active.size)
            return;
        run.status = 'working';
        run.startedAt = new Date().toISOString();
        this.store.save();
        try {
            const result = await this.agents.run('pm', `Brain maintenance through the Office.
Joe requested Brain's existing scheduled task hand work to this office on 2026-10-27. Execute the retained Brain workflow below, with the current repository instructions authoritative. You are the coordinator for this Brain assignment. Delegate the required fresh independent content review using available native agent delegation; missing capability blocks changed knowledge publication. Other planning/review choices cannot remove Brain's required content review or publication gates. Do not use the CMS vendor workflow or its Dependabot exception.
IDENTITY OVERRIDE: Replace the old hard-coded --author-id 01a1421a-14c9-7162-8e37-074a60b11a41 in the retained policy with YOUR ACTUAL current agent/thread ID, and retain that identity throughout claim, review and publication. Do not impersonate the original author. Invoke the scheduled-agent claim even for a manual Office button: no forced rerun is authorized. Brain's gate owns dates, backoff, retry limits and interrupted-run reconciliation.
PRIMARY OWNERSHIP: Read the current complete Office session inventory and inspect exact candidates before changing the primary checkout. A loaded session identity alone does not prove a competing writer. Approval-review/Guardian sessions can belong to this very assignment: use authoritative thread status and parent/reviewed-session evidence to prove that relationship, never infer it from the title alone. A completed approval review of YOUR current session is not an independent checkout owner. Preserve genuine active, unrelated or unverified owners; never interrupt them. Keep open issue/PR branches intact in isolated worktrees and use clean current primary main for nightly coordination. An open PR alone does not prohibit maintenance on a separate clean main checkout.
Do not edit automations or memories. Keep private evidence under Brain's .state/nightly and this project's ${this.store.dataRoot}. Prior office ledger (historical context only): ${state.ledger}
GITHUB PROJECT COORDINATION (Joe authorized 2026-10-28): Use only ${this.store.project.githubProject?.url} for ${this.store.project.repository}. Read its current Status options, cards, relevant issue comments, PRs and exact-head checks. Do not use superseded boards #5 or #6. Move existing cards only when evidence from this assignment supports a lane change: backlog for unassessed or understood future/deferred work, ready for actionable unblocked scope, in progress only after actual work starts, in review for actual proposals awaiting checks/review, done only after issue acceptance is verified. Use actual lane names; stop board writes if these semantics cannot be matched. Preserve explicit deferrals and human holds. Blocked work stays in the lane matching its actual progress, with the blocker and next action in the issue. Update lanes at actual work start, review handoff and verified completion as they occur; reconcile existing comments/lanes after interruptions. For each substantive transition leave one focused issue comment with evidence, reason and next step; read back the saved comment and lane. Avoid duplicate comments by reading existing comments first. Record verified or uncertain project-update and issue-comment receipts in your result. A missing Projects scope blocks board coordination only; retain actual maintenance outcomes and report the board blocker without replaying publication. Board coordination does not authorize new implementation, publication, retries or merge beyond the retained policy. A queued run, passing local checks or an open PR alone never proves completion.
RETAINED POLICY:\n${maintenancePolicies(this.store)}
RESULT: completed requires successful nightly complete and all required capture/cleanup follow-up, with runId equal to that completed Brain run. A gate refusal is skipped only for completed, backoff or daily-retry-limit, after required original-run follow-up. Active/uncertain work, missing reviewer, failed checks and incomplete follow-up are blocked. Return the actual reason, compact ledger and every attempted external write receipt. Never claim completion from a queued request, summary or merge alone.`, BrainResult, { cwd: this.store.project.repo, stage: 'brain-maintenance', requestId: run.id, enqueuedAt: run.requestedAt, timeout: 8 * 60 * 60 * 1000 });
            run.nativeRunId = result.runId;
            const saved: MaintenanceResult = { outcome: result.outcome === 'blocked' ? 'blocked' : 'passed', summary: result.summary, ledger: result.ledger, blocker: result.reason, receipts: result.receipts, candidates: [] };
            run.steps.push({ role: 'pm', stage: 'brain-maintenance', result: saved, at: new Date().toISOString() });
            state.ledger = result.ledger;
            this.store.save();
            if (result.outcome === 'blocked' || result.receipts.some(r => !r.verified || r.uncertain))
                throw new Error(result.reason || 'Uncertain Brain effects require read-back');
            const status = await this.readStatus();
            if (result.outcome === 'completed') {
                if (!result.runId || status.active || status.completed?.id !== result.runId || status.completed?.phase !== 'completed')
                    throw new Error('Brain completion was not independently confirmed by its nightly gate');
                state.lastDaily = easternDate();
                const continuation = this.store.state.coordination?.continuations?.find(item => item.runId === run.id);
                const work = this.store.state.workLog?.filter(work => work.requestId === run.id && work.stage === 'brain-maintenance').at(-1);
                if (continuation && work?.sessionId && status.completed?.authorId === work.sessionId) {
                    continuation.nativeRunId = result.runId;
                    continuation.nativeAuthorId = work.sessionId;
                    continuation.nativeSlot = status.completed.slotDate;
                    continuation.status = 'completed';
                    continuation.detail = 'Native author, run and completed slot independently verified.';
                }
            }
            else {
                const valid = result.reason === 'completed' ? !!status.completed && !status.active : result.reason === 'backoff' ? Date.parse(status.retryAfter || '') > Date.now() && !status.active : result.reason === 'daily-retry-limit' ? status.attempts >= 3 && !status.active : false;
                if (!valid)
                    throw new Error('Brain gate refusal could not be independently confirmed');
            }
            run.status = 'completed';
            run.stage = result.outcome === 'skipped' ? `skipped: ${result.reason}` : 'brain-completed';
            run.error = '';
            this.store.emit('maintenance-completed', result.summary, 'pm');
        }
        catch (e) {
            run.status = this.store.state.paused ? 'interrupted' : 'blocked';
            run.error = String(e);
            this.store.emit('maintenance-blocked', run.error, 'pm');
        }
        finally {
            run.endedAt = new Date().toISOString();
            this.store.save();
        }
    }
}
