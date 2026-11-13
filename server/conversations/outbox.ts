import { supersedingDelivery, slackRequestSettled } from './slack/supersession-proof';
import { deferredPickup } from '../../src/work/pickup-state';
import { checkpointSuperseded } from '../maintenance/superseded';
import { checkpointHasMaintenanceAlert, maintenanceNeedsHumanFollowup } from '../maintenance/follow-up-alerts';
import { parkedProviderWait, readinessNeedsFollowup, readinessWait } from '../../src/work/work-summary';
import { HOLDS } from '../office/config';
import { knowledgeOutbox } from '../knowledge/knowledge-outbox';
import { ROLE_NAMES, STAGE_ROLE, type OfficeSnapshot, type HumanAction, type Role, type TeamMessage } from '../../src/shared';
import { ctoInputRecovered } from './cto-input-resolution';
export function conversationResolved(state: OfficeSnapshot, message: TeamMessage): boolean {
    return !!message.resolvedBy || ctoInputRecovered(state, message) || state.messages.some(reply => reply.actionId === `message:${message.id}` && reply.from === 'pm' && reply.status === 'answered' &&
        reply.receipts.every(receipt => receipt.verified && !receipt.uncertain) &&
        reply.receipts.some(receipt => receipt.action === 'conversation-readback' && receipt.target === message.id && receipt.verified && !receipt.uncertain));
}
// Reconcile a durable tray against observable work, never against an acknowledgement.
export function projectOutbox(state: OfficeSnapshot, at = new Date()): HumanAction[] {
    const outbox = (state.outbox || []).map(a => ({ ...a }));
    const now = at.toISOString(), current = new Set<string>();
    function item(id: string, title: string, detail: string, role: Role, ticket = '', url = '') {
        current.add(id);
        const old = outbox.find(a => a.id === id);
        if (old) {
            if (old.detail !== detail || old.title !== title || old.status !== 'open')
                Object.assign(old, { title, detail, role, ticket, url, status: 'open', updatedAt: now });
        }
        else
            outbox.unshift({ id, title, detail, role, ticket, url, status: 'open', createdAt: now, updatedAt: now });
    }
    const itFollowUps = state.it?.reports.at(-1)?.followUps.filter(f => f.owner === 'You') || [];
    const teamOwnsIT = (id: string) => state.it?.reports.at(-1)?.followUps.some(f => f.id === id && f.owner !== 'You');
    if (itFollowUps.length)
        item('it-followup', 'Ellis needs your help', itFollowUps.map(f => f.detail).join('\n'), 'pm');
    for (const decision of knowledgeOutbox(state))
        item(decision.id, decision.title, decision.detail, 'knowledge');
    if (state.coordination?.listener.error && !teamOwnsIT('assignment-listener'))
        item('assignment-listener', 'Restore assignment listening', state.coordination.listener.error, 'pm');
    for (const n of state.coordination?.notices?.entries || []) {
        if (!slackRequestSettled(state, n.id) && ['blocked', 'uncertain'].includes(n.status) && !((n.kind === 'goal' || n.kind === 'maintenance') && state.slackDeliveries?.some(d => d.requestId === n.id && d.status === 'uncertain')))
            item(`merge-notice:${n.id}`, n.kind === 'goal' ? `Resolve “${n.goalTitle}” completion DM` : n.kind === 'maintenance' ? 'Resolve maintenance completion DM' : `Resolve ${n.key} Slack notice`, n.detail, 'pm', n.key, n.prUrl);
    }
    for (const t of state.coordination?.time?.entries || [])
        if (t.status === 'uncertain')
            item(`time:${t.id}`, `Reconcile ${t.key} hours`, t.detail, 'pm', t.key, t.url);
    for (const c of state.coordination?.checkpoints || [])
        if (!state.maintenance?.runs.some(run => run.id === c.runId && run.retirement) && ['blocked', 'interrupted'].includes(c.status) && (c.repairResume?.needsFollowup || !state.maintenance?.runs.some(r => r.id === c.runId && (r.blockerFollowup || r.readbackRetry && !r.readbackRetry.exhausted && ['blocked', 'interrupted'].includes(r.status)))))
            if (!checkpointSuperseded(state, c) && !checkpointHasMaintenanceAlert(state, c))
                item(`checkpoint:${c.id}`, 'Daily checkpoint needs follow-up', c.detail, 'pm');
    for (const a of state.coordination?.adoptions || [])
        if (['refused', 'blocked'].includes(a.status))
            item(`dependabot:${a.pr}`, `${a.bot || 'Dependabot'} PR #${a.pr} was not adopted`, a.detail, 'pm', a.issue ? `GH-${a.issue}` : '', a.url);
    for (const run of state.maintenance?.runs || [])
        if (run.blockerFollowup && ['blocked', 'interrupted'].includes(run.blockerFollowup.status))
            item(`maintenance-blocker:${run.id}`, 'Read back the source repair handoff', run.blockerFollowup.detail, 'pm');
    const latest = [...new Map((state.coordination?.listener.reviews || []).map(r => [r.key, r])).values()];
    const capabilityBlocked = latest.filter(r => r.status === 'blocked' && !r.retry?.nextAt && !state.coordination?.jobs?.some(j => j.key === r.key && j.pr && j.status !== 'cancelled') && /session.*(?:inventory|read|visibility)|task.claim/i.test(r.detail) && /unavailable|missing|lacks|not available/i.test(r.detail));
    if (capabilityBlocked.length)
        item('ownership-capability', 'Office cannot check other active sessions', `New development is paused for ${capabilityBlocked.map(r => r.key).join(', ')} because the Office worker cannot read current Codex/Claude session ownership. This is an Office capability blocker, not a request for merge approval. Existing linked PRs continue through Sam.\n${capabilityBlocked.map(r => `${r.key}: ${r.detail}`).join('\n')}`, 'pm');
    for (const r of latest)
        if (!HOLDS[r.key] && ['blocked', 'interrupted'].includes(r.status) && !r.retry?.nextAt && !capabilityBlocked.includes(r) && !state.coordination?.jobs?.some(j => j.key === r.key && j.pr && j.status !== 'cancelled'))
            item(`assignment:${r.id}`, `${r.key} intake needs follow-up`, r.detail, 'pm', r.key, r.url);
    if (state.intake.status === 'blocked' && state.intake.error)
        item('intake', 'Help Morgan check the mailbox', state.intake.error, 'pm');
    if (state.azure.status === 'blocked' && state.azure.error && !teamOwnsIT('project-progress'))
        item('azure', 'Restore the Azure connection', state.azure.error, 'pm');
    if (state.github?.status === 'blocked' && state.github.error && !teamOwnsIT('project-progress'))
        item('github', 'Restore the GitHub connection', state.github.error, 'pm');
    for (const run of state.maintenance?.runs || [])
        if (maintenanceNeedsHumanFollowup(state, run))
            item(`maintenance:${run.id}`, `Read back ${state.project?.name || 'project'} maintenance`, `${run.stage}: ${run.error}`, 'pm');
    for (const t of state.tickets) {
        if (t.activity === 'blocked' && t.blocker)
            item(`ticket:${t.key}:${t.stage}`, t.stage === 'plan' && (t.blocker === 'Saved implementation plan is required' || t.savedPlanRecoveryFailure) ? `${t.key} needs Office follow-up` : `${t.key} needs your help`, t.blocker, STAGE_ROLE[t.stage], t.key, t.url);
        if (t.stage === 'ready-for-staging' && t.results['ready-for-staging']?.outcome === 'passed') {
            const pr = state.azure.prs.find(p => p.id === t.prId);
            if (pr?.status === 'completed') {
                const failed = state.azure.builds.find(b => b.commit === pr.mergeCommit && b.result === 'failed');
                if (failed)
                    item(`deployment:${t.key}`, `Check the failed rollout for ${t.key}`, `Azure build ${failed.id} failed for merged commit ${pr.mergeCommit}. Review its logs and arrange the pipeline/deployment handoff in Azure.`, 'pm', t.key, failed.url);
            }
            if (pr?.status === 'active') {
                const fresh = state.azure.observedAt && at.getTime() - Date.parse(state.azure.observedAt) < 150000;
                item(`merge:${t.key}`, pr.commit === t.commit && fresh ? `Review and merge ${t.key}` : `Recheck the PR for ${t.key}`, pr.commit === t.commit && fresh ? `The office completed its checks for ${t.commit.slice(0, 10)}. Review current PR ${t.prId} and its Azure policies before merging. The team will watch the deployment and test staging.` : `The PR head or Azure observation has changed since the office checks. Verify the current commit and policies before deciding whether to merge.`, 'pm', t.key, pr.url);
            }
        }
    }
    for (const j of state.coordination?.jobs || [])
        if (j.mergeApprovalRequired)
            item(`merge-approval:${j.id}`, `Approve PR #${j.pr} merge`, `${j.key}: Sam’s review passed for ${j.head}. Approve this specific head to queue the merge; the Office will recheck live GitHub requirements first.`, 'pm', j.key, j.prUrl);
    for (const j of state.coordination?.jobs || []) {
        if (parkedProviderWait(j)) continue;
        if (j.status === 'blocked' && j.parked?.published && j.detail.startsWith('Decision needed'))
            item(`ticket-job:${j.id}`, `${j.key} needs a decision on the board`, `${j.parked.reason}\nMove the card back to Ready to resume ${j.parked.stage}.`, 'pm', j.key, j.prUrl);
        else if (['blocked', 'interrupted'].includes(j.status) && !j.retry?.nextAt)
            item(`ticket-job:${j.id}`, `Read back ${j.key} delivery`, j.detail, 'pm', j.key, j.prUrl);
    }
    for (const j of state.coordination?.jobs || [])
        if (j.candidateCleanup?.status === 'pending')
            item(`candidate-cleanup:${j.id}`, `Clean up ${j.key} worktree and branches`, `${j.candidateCleanup.detail}\nThe Office retries on each poll and never removes uncommitted work or a branch with an open PR. A refusal recorded as uncertain is only read back, never resent.`, 'pm', j.key, j.prUrl);
    for (const j of state.coordination?.jobs || [])
        if (readinessNeedsFollowup(j) && !j.retry?.nextAt) {
            const wait = readinessWait(j);
            item(`ticket-job:${j.id}`, `${j.key} needs team follow-up`, `${wait.summary}\n${wait.next}`, 'pm', j.key, j.prUrl);
        }
    for (const m of state.messages) {
        const reconciledSlackReadback = /Slack delivery could not be confirmed|Slack read-back did not match/.test(m.error) && slackRequestSettled(state, m.actionId.startsWith('message:') ? m.actionId.slice(8) : m.id);
        if (m.question && !deferredPickup(state, m.ticket) && !state.messages.some(reply => reply.from === 'human' && reply.actionId === `question:${m.id}` && reply.status === 'answered'))
            item(`question:${m.id}`, `${m.from === 'human' ? 'Morgan' : ROLE_NAMES[m.from]} has a question`, m.question, m.from === 'human' ? 'pm' : m.from, m.ticket);
        if (m.from === 'human' && !conversationResolved(state, m) && !reconciledSlackReadback && ['failed', 'interrupted'].includes(m.status)) {
            const ctoInput = m.to === 'cto' && m.error.includes('"input_error_code":"input_too_large"');
            item(`message:${m.id}`, ctoInput ? 'Avery’s reply needs Office recovery' : 'Follow up on an interrupted conversation', ctoInput ? 'Your message is saved. Avery’s Office context exceeded the input limit; open this item to recover the original request safely.' : m.error || 'The team could not complete this reply.', ctoInput ? 'cto' : 'pm', m.ticket);
        }
    }
    for (const d of state.slackDeliveries || [])
        if (d.status === 'uncertain' && !supersedingDelivery(state, d))
            item(`message:${d.requestId}`, 'Read back a Slack delivery', `Message to ${d.targetName} could not be confirmed. ${d.error} Reply here to read it back; the office will not resend it.`, 'pm', state.messages.find(m => m.id === d.requestId)?.ticket || state.coordination?.notices?.entries.find(n => n.id === d.requestId)?.key || '');
    for (const old of outbox)
        if (!current.has(old.id) && old.status !== 'resolved') {
            const retired = state.maintenance?.runs.find(run => run.retirement && (old.id === `maintenance:${run.id}` || old.id === `checkpoint:${run.checkpointId}`));
            if (retired?.retirement) {
                old.title = 'Maintenance retired as incomplete history';
                old.detail = `${retired.retirement.reason} Original run remains ${retired.status}; no completion or retry was claimed. Original error: ${retired.error}`;
            }
            old.status = 'resolved';
            old.updatedAt = now;
        }
    return outbox;
}
export function syncOutbox(state: OfficeSnapshot) { state.outbox = projectOutbox(state); }
export function openActions(state: OfficeSnapshot): HumanAction[] { return state.outbox.filter(a => a.status === 'open'); }
