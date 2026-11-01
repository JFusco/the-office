import { handsOff } from '../delivery/harness/scope';
import { admitReadyCards } from '../delivery/intake/admission';
import { resumeParked } from '../delivery/parking/resume';
import { retireBacklogged } from '../delivery/parking/retire-backlogged';
import { retryCandidateCleanup } from '../delivery/candidate/retry-candidate-cleanup';
import { CEC } from '../office/config';
import { noticeState, queueMergeNotice } from '../conversations/notifications';
import { GitHubDelivery } from '../delivery/pipeline/github-delivery';
import type { AssignedIssue } from '../../src/shared';
import type { Coordinator } from './coordination';

export async function readAssignments(this: Coordinator): Promise<AssignedIssue[]>  {
    if (this.store.project.provider === 'github') {
        const pages = JSON.parse(await this.execute('gh', ['api', `repos/${this.store.project.repository}/issues?state=open&assignee=JFusco&per_page=100`, '--paginate', '--slurp'], { cwd: this.store.project.repo, timeout: 60000, readOnly: true }));
        if (!Array.isArray(pages) || pages.some(p => !Array.isArray(p)))
            throw new Error('Incomplete GitHub assignment response');
        const board = await this.engine.github.board();
        if (!board || board.error)
            throw new Error(board?.error || 'Project board is unavailable');
        if (this.store.state.github)
            this.store.state.github.board = board;
        return pages.flat().filter((i: any) => !i.pull_request && i.assignees?.some((a: any) => a.login === 'JFusco')).map((i: any) => ({ key: `GH-${i.number}`, summary: i.title, url: i.html_url, assignee: 'JFusco', status: i.state, statusId: '', updated: i.updated_at, type: 'GitHub issue', subtask: false, pickupStatus: board.items.find(card => card.number === i.number && card.repository === this.store.project.repository)?.status || '' }));
    }
    const raw = JSON.parse(await this.execute('twg', ['jira', 'workitem', 'query', '--jql', `project = CEC AND assignee = "${CEC.account}" AND resolution = Unresolved ORDER BY key ASC`, '--fields', 'summary,status,assignee,updated,issuetype', '--first', '100', '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: true }));
    if (raw.error || raw.ok === false || !Array.isArray(raw.data?.issues) || raw.data.issues.length >= 100)
        throw new Error('Jira assignment query failed or pagination coverage is incomplete');
    return raw.data.issues.filter((i: any) => /^CEC-\d+$/.test(i.key) && i.assignee?.accountId === CEC.account && !i.issuetype?.subtask).map((i: any) => ({ key: i.key, summary: i.summary, url: i.url, assignee: i.assignee.accountId, status: i.status.name, statusId: i.status.id, updated: i.updated, type: i.issuetype.name, subtask: false }));
}

export async function poll(this: Coordinator, now = new Date()) {
    if (!this.state.enabled || this.store.state.paused || this.polling)
        return;
    this.polling = true;
    try {
        const assigned = await this.readAssignments(), listener = this.state.listener;
        const previous = new Map(listener.assigned.map(i => [i.key, i]));
        for (const issue of assigned) {
            const before = previous.get(issue.key), eligible = this.pickup.enabled && (issue.pickupStatus ?? issue.status) === this.pickup.status;
            const latest = listener.reviews.slice().reverse().find(r => r.key === issue.key);
            const transitioned = eligible && (!before || (before.pickupStatus ?? before.status) !== this.pickup.status);
            const ticket = this.store.state.tickets.find(t => t.key === issue.key);
            if (ticket && this.store.project.provider === 'azure' && ticket.stage === 'mailbox' && !eligible && ticket.blocker === 'No longer present in the latest eligible intake. Recheck before starting.') {
                ticket.activity = 'idle';
                ticket.blocker = '';
            }
            if (ticket)
                Object.assign(ticket, { summary: issue.summary, assignee: issue.assignee, updated: issue.updated, ...(this.store.project.provider === 'azure' ? { status: issue.status, statusId: issue.statusId } : {}) });
            else
                this.store.state.tickets.push({ ...issue, boardMember: false, stage: 'mailbox', activity: 'waiting', blocker: '', runId: '', attempt: 0, commit: '', branch: '', worktree: '', previewUrl: '', prId: 0, results: {}, findings: [], evidence: [], pilot: false, observedAt: now.toISOString() });
            // Hands-off projects admit work deterministically after PR discovery below.
            if (handsOff(this.store))
                continue;
            if (latest?.status === 'blocked' && latest.workRequested === 'automatic' && !eligible && !this.state.jobs?.some(j => j.key === issue.key && j.status !== 'cancelled')) {
                latest.status = 'held';
                latest.workRequested = undefined;
                latest.detail = `${issue.key} is now ${issue.pickupStatus ?? issue.status}; automatic new development is not requested.\nEarlier intake: ${latest.detail}`;
            }
            if (latest?.status === 'queued' && !eligible && latest.workRequested !== 'manual') {
                latest.status = 'held';
                latest.detail = `${issue.key} is in ${issue.pickupStatus ?? issue.status}; waiting for ${this.pickup.status}. No automatic work is queued.`;
                latest.workRequested = undefined;
            }
            if (latest && ['queued', 'working'].includes(latest.status)) {
                if (eligible && !latest.workRequested)
                    latest.workRequested = 'automatic';
                continue;
            }
            // Terminal work and uncertain effects require reconciliation, never polling replay.
            // Narrative mentions in a model report cannot authorize resuming a hold.
            const protectedWork = ticket?.pilot || this.state.jobs?.some(j => j.key === issue.key && j.status !== 'cancelled') || latest && ['blocked', 'interrupted'].includes(latest.status);
            if (protectedWork)
                continue;
            // A completed intake without a delivery job is an orphaned handoff.
            // Wait for any intake finalization, then recheck live ownership rather
            // than reusing the old result to dispatch.
            if (eligible && (!before || transitioned || latest?.status === 'ready' && !this.engine.busy))
                this.enqueue(issue, 'automatic');
        }
        if (this.store.project.provider === 'azure' && noticeState(this.store).policy.enabled) {
            const notices = noticeState(this.store), watched = this.store.state.azure.prs.filter(p => p.status === 'completed' && p.mergeCommit && p.closedAt && !notices.entries.some(n => n.prUrl === p.url && n.mergeCommit === p.mergeCommit)).map(pr => ({ pr, ticket: this.store.state.tickets.find(t => t.prId === pr.id) })).filter(x => x.ticket);
            if (watched.length) {
                const keys = [...new Set(watched.map(x => x.ticket!.key))];
                const raw = JSON.parse(await this.execute('twg', ['jira', 'workitem', 'get', ...keys, '--fields', 'assignee,reporter', '--site', CEC.site, '-o', 'json', '--output-summary', 'none'], { timeout: 60000, readOnly: true }));
                if (raw.error || !Array.isArray(raw.data) || raw.data.length !== keys.length)
                    throw new Error('Jira notice identity read is incomplete');
                for (const { pr, ticket } of watched) {
                    const issue = raw.data.find((i: any) => i.key === ticket!.key);
                    if (!issue)
                        throw new Error('Jira notice issue identity is missing');
                    queueMergeNotice(this.store, { key: ticket!.key, prUrl: pr.url, mergeCommit: pr.mergeCommit, mergedAt: pr.closedAt!, summary: 'Azure build and deployment results are monitored separately in the Office.', assignees: issue.assignee?.accountId ? [{ id: issue.assignee.accountId, email: issue.assignee.emailAddress }] : [], reporter: issue.reporter?.accountId ? { id: issue.reporter.accountId, email: issue.reporter.emailAddress } : undefined });
                }
            }
        }
        if (this.store.project.provider === 'github') {
            const delivery = new GitHubDelivery(this.store, this.engine, this.execute);
            await delivery.discover(assigned);
            if (handsOff(this.store)) {
                resumeParked(this.store, this.state.jobs!, assigned, this.pickup, this.dependencyStores(), now);
                await retireBacklogged(this.store, this.execute, this.state.jobs!, assigned);
                await retryCandidateCleanup(this.store, this.execute, this.state.jobs!);
                admitReadyCards(this, delivery, assigned, now);
            }
            await delivery.refreshDependencies();
            await delivery.observe();
        }
        listener.assigned = assigned;
        listener.lastCheckedAt = now.toISOString();
        listener.error = '';
    }
    catch (error) {
        this.state.listener.error = String(error);
    }
    finally {
        this.state.listener.nextCheckAt = new Date(now.getTime() + 60000).toISOString();
        this.polling = false;
        this.store.save();
    }
}
