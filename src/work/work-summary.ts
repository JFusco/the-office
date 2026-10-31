import { deliveryRepairProjection } from './delivery-repair-projection';
import type { OfficeSnapshot, TicketJob, MaintenanceRun } from '../shared';
// Keep the saved record intact; only shorten its presentation.
export function shortSummary(text: string = '', limit = 240) {
    const first = text.split('\n').find(s => s.trim())?.trim() || 'No update yet.';
    const clean = first.replace(/https?:\/\/\S+/g, 'linked record').replace(/\b[a-f0-9]{40}\b/gi, 'the reviewed commit');
    if (clean.length <= limit)
        return clean;
    const end = clean.slice(0, limit - 1).lastIndexOf(' ');
    return clean.slice(0, end > limit / 2 ? end : limit - 1) + '…';
}
export function actionSummary(id: string) {
    if (id === 'it-followup')
        return 'Follow Ellis’s specific steps below, then open Service health and select Check IT again.';
    if (id.startsWith('checkpoint:'))
        return 'Morgan and IT must reconcile the previous run, then queue a retry through the native nightly gate.';
    if (id === 'ownership-capability')
        return 'Restore Office session visibility before starting new development. No approval is being requested.';
    if (id.startsWith('merge-approval:'))
        return 'Review the linked PR and approve its exact reviewed head below. This item requests merge approval.';
    if (id.startsWith('question:'))
        return 'Reply to the question below.';
    if (id.startsWith('merge:'))
        return 'Review the PR and its merge requirements.';
    if (id.startsWith('assignment:'))
        return 'Morgan must read the saved intake result and explain any remaining hold or blocker before development starts.';
    if (id.startsWith('ticket-job:'))
        return 'Ask Morgan to recheck this delivery blocker. No merge approval is being requested.';
    if (id.startsWith('time:'))
        return 'Confirm the recorded hours before another time update.';
    if (id.startsWith('merge-notice:'))
        return 'Resolve the Slack recipient or delivery problem.';
    if (id.startsWith('message:'))
        return 'Ask Morgan to read back the original conversation or delivery before retrying.';
    return 'Help resolve the blocker below. This is a follow-up, not an approval request.';
}
export function mailboxWork(state: OfficeSnapshot) {
    const reviews = state.coordination?.listener.reviews || [];
    const latest = [...new Map(reviews.map(r => [r.key, r])).values()];
    return { queued: latest.filter(r => r.status === 'queued').length, working: latest.filter(r => r.status === 'working').length, reviewed: latest.filter(r => !['queued', 'working'].includes(r.status)).length, assigned: state.coordination?.listener.assigned.length || 0 };
}
export function deliveryLabel(job: TicketJob) {
    if (job.ciFollowupKey)
        return `Waiting for CI repair ${job.ciFollowupKey}`;
    if (job.dependsOnPR)
        return `Waiting for parent PR #${job.dependsOnPR}`;
    if (job.status === 'completed')
        return 'Closed out';
    if (job.status === 'blocked' || job.status === 'interrupted')
        return 'Stopped · needs team follow-up';
    if (job.status === 'watching')
        return job.mergeCommit ? 'Merged · watching Actions' : 'Waiting for PR readiness';
    const repair = deliveryRepairProjection(job);
    if (repair?.phase) return `${job.status === 'queued' ? 'Queued' : 'Working'} · ${repair.phase}`;
    const next = { 'scope-repair': 'saved candidate repair', 'ci-recovery': 'CI failure recovery', implement: 'development', 'update-base': 'candidate base update', review: 'code review', validate: 'verification', draft: 'draft PR', 'lead-pr': 'Sam’s PR review', 'prepare-pr': 'PR dependency preparation', merge: 'Sam’s merge', closeout: 'Morgan’s closeout' }[job.stage];
    return job.status === 'queued' ? `Queued for ${next}` : `Working on ${next}`;
}
export function readinessNeedsFollowup(job: TicketJob) {
    if (job.status !== 'watching' || job.mergeCommit || job.mergeApprovalRequired || job.dependsOnPR)
        return false;
    const result = job.steps?.filter(s => s.stage === 'lead-pr').at(-1)?.result;
    if (!result || !['blocked', 'failed'].includes(result.outcome))
        return false;
    const open = result.findings.filter(f => f.status === 'open');
    const pending = (text: string) => /(?:checks?|workflows?|ci)\b/i.test(text) && /(?:running|pending|queued|in.progress)/i.test(text) && !/(?:failed|failure|permission|denied|forbidden|missing|defect)/i.test(text);
    return !((open.length ? open.every(f => f.id === 'draft-blocks-merge' || pending(`${f.summary} ${f.actual}`)) : pending(`${result.blocker} ${result.summary}`)));
}
export function readinessWait(job: TicketJob) {
    const result = (job.steps || []).filter(s => s.stage === 'lead-pr').at(-1)?.result;
    const open = result?.findings.filter(f => f.status === 'open') || [];
    const conflict = open.some(f => f.id === 'merge-conflicts');
    const draft = open.some(f => f.id === 'draft-blocks-merge');
    const blocked = readinessNeedsFollowup(job), permission = blocked && /(?:permission|403|not accessible by integration)/i.test(`${result?.blocker} ${open.map(f => f.summary).join(' ')}`);
    return { blocked, phase: job.mergeApprovalRequired ? 'Awaiting merge approval' : conflict ? 'Blocked · PR conflicts' : permission ? 'Blocked · GitHub policy inspection' : blocked ? 'Blocked · PR review needs follow-up' : draft ? 'Waiting · draft PR' : 'Waiting for PR readiness', summary: shortSummary(result?.blocker || result?.summary || job.detail, 240), next: job.mergeApprovalRequired ? 'You: approve this exact reviewed head.' : conflict ? 'Next needed: Alex resolves the branch conflicts; the team applies its selected checks to the changed head; Morgan then marks the PR ready.' : permission ? 'Next needed: Morgan and Ellis resolve GitHub policy visibility using permitted reads, then assign Sam to recheck this PR. No merge approval is being requested.' : blocked ? 'Next needed: Morgan assigns the unresolved review findings to the team. Sam is not currently reviewing this PR.' : draft ? 'Next needed: Morgan verifies the saved review and checks, then marks the PR ready. No reviewer is currently assigned.' : 'Next needed: Morgan reads the current PR requirements and assigns the remaining work.' };
}
export function maintenanceIssue(run: MaintenanceRun, repository: string) {
    for (const receipt of run.steps.flatMap(s => s.result.receipts)) {
        if (!receipt.verified || receipt.uncertain || !receipt.target.startsWith(`https://github.com/${repository}/issues/`))
            continue;
        const number = receipt.target.match(/\/issues\/(\d+)(?:#|$)/)?.[1];
        if (number)
            return `GH-${number}`;
    }
    return '';
}
