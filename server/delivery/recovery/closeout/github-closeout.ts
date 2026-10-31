import { z } from 'zod';
import { GITHUB_ISSUE_SKILL } from '../../../github/github-context';
import { ProjectProgress } from '../../board/project-progress';
import { shortSummary } from '../../../../src/work/work-summary';
import type { AssignedIssue } from '../../../../src/shared';
import { queueMergeNotice } from '../../../conversations/notifications';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Store } from '../../../store/store';
import type { Engine } from '../../../scheduling/engine';
import type { TicketJob, StageResult, Role } from '../../../../src/shared';
import { APPROACH_GUIDANCE, recordJobApproach, nextJobStage, reviewInstructions, acceptConflictRepair } from '../../pipeline/approach';
import { ResultSchema } from '../../../workers/agents';
import { command } from '../../../workers/process';
import { containedFile } from '../../../cec/workflow';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import { hasUncertainEffects, closeoutReceipt } from '../../pipeline/github-delivery';
export async function reconcileCloseout(this: GitHubDelivery, key: string) {
    const job = this.jobs.find(j => j.key === key && j.stage === 'closeout');
    let result = job?.steps.filter(s => ['closeout', 'closeout-readback'].includes(s.stage)).at(-1)?.result;
    if (!job || job.status === 'working' || !result || result.outcome !== 'passed' || result.commit !== job.mergeCommit)
        throw new Error('A saved passed closeout result is required');
    const lastWork = this.store.state.workLog?.filter(w => w.requestId === job.id && w.stage === 'github-closeout').at(-1);
    if (lastWork && lastWork.status !== 'completed')
        throw new Error('An interrupted closeout writer must be reconciled before completion');
    if (hasUncertainEffects('closeout', result)) {
        const readback = await this.engine.agents.run('pm', `READ ONLY closeout effect reconciliation for ${job.prUrl}, issue ${key}, merge ${job.mergeCommit}. No write, cleanup, comment, test rerun or original stage may be repeated. Inspect the original saved session and diagnostic artifacts under ${resolve(this.store.dataRoot, 'ticket-work', job.id)} and independently read the actual issue, closeout comment, board and original attempted effects. A schema or approval rejection BEFORE execution is a known non-execution only when its original tool evidence proves that. Record those rejection diagnostics as evidence, not failed mutation receipts. Preserve the original rejected attempts in history. Return a reconstructed closeout result with verified receipts for every actual effect, the same merge commit and current acceptance evidence. An empty search or a later successful write never proves that an earlier uncertain write did not occur. Return blocked for any unresolved effect. Never silently drop a possibly executed mutation. Original result: ${JSON.stringify(result)}`, ResultSchema, { readOnly: true, ticket: key, stage: 'closeout-readback', requestId: job.id, timeout: 10 * 60 * 1000 });
        job.steps.push({ stage: 'closeout-readback', result: readback });
        this.store.save();
        if (readback.outcome !== 'passed' || readback.commit !== job.mergeCommit || readback.prId !== job.pr || hasUncertainEffects('closeout', readback) || readback.findings.some(f => f.status === 'open') || !readback.evidence.length)
            throw new Error('Closeout effects still need read-back; no original write was repeated');
        result = readback;
    }
    return finishVerifiedCloseout.call(this,job,result);
}

/** Shared provider closeout validation; callers must establish their original-writer/effect authority first. */
export async function finishVerifiedCloseout(this:GitHubDelivery,job:TicketJob,result:StageResult,finalFence:()=>void=()=>{},beforeCommit:()=>Promise<void>=async()=>{}) {
    const key=job.key;
    const p = await this.verifyPR(job, true), issue = await this.api(`issues/${Number(key.slice(3))}`), board = await this.engine.github.board();
    if (!p.merged_at || p.merge_commit_sha !== job.mergeCommit || issue.state !== 'closed' || !board || board.error || board.items.find(i => i.number === issue.number && i.repository === this.store.project.repository)?.status !== 'Done')
        throw new Error('Closed issue, merged PR and Done lane must be verified');
    if (!['issue-close', 'issue-comment', 'board-status'].every(action => closeoutReceipt(result, action, issue.html_url, this.store.project.githubProject?.url || '')))
        throw new Error('Verified closeout receipts are incomplete');
    const receipt = closeoutReceipt(result, 'issue-comment', issue.html_url, this.store.project.githubProject?.url || '')!;
    const commentId = receipt.target.match(new RegExp(`^https://github\\.com/${this.store.project.repository}/issues/${issue.number}#issuecomment-(\\d+)$`))?.[1];
    if (!commentId)
        throw new Error('Canonical closeout comment is missing');
    const comment = await this.api(`issues/comments/${commentId}`);
    if (comment.html_url !== receipt.target || !comment.body?.trim())
        throw new Error('Closeout comment read-back failed');
    const repair = job.ciFollowupKey && this.jobs.find(j => j.key === job.ciFollowupKey && j.status === 'completed');
    const checkedCommit = repair ? repair.mergeCommit : job.mergeCommit;
    if (!checkedCommit)
        throw new Error('Verified CI recovery commit is missing');
    const runs = await this.api(`actions/runs?head_sha=${checkedCommit}&per_page=100`);
    const actual = runs.workflow_runs?.filter((r: any) => r.head_sha === checkedCommit && r.event === 'push' && r.head_branch === this.store.project.target);
    if (runs.total_count > 100 || !actual?.length || actual.some((r: any) => r.status !== 'completed' || !['success', 'skipped', 'neutral'].includes(r.conclusion)))
        throw new Error('Merge Actions are not verified');
    await beforeCommit();
    this.store.transaction(()=>{
    finalFence();
    const ticket = this.store.ticket(key);
    ticket.status = 'closed';
    ticket.stage = 'complete';
    ticket.activity = 'idle';
    if (this.store.state.github)
        this.store.state.github.board = board;
    job.status = 'completed';
    job.detail = 'PR merged, merge Actions passed, issue closed, closeout comment and Done lane verified. Original closeout was reconciled without replay.';
    job.updatedAt = new Date().toISOString();
    this.store.emit('closeout-reconciled', `${key}: completed closeout verified; no write repeated.`, 'pm', key);
    });
}
