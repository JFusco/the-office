import { createHash } from 'node:crypto';
import type { GitHubDelivery } from './github-delivery';
import type { Store } from './store';
import { workKey, type StageResult, type TicketJob } from '../src/shared';

/** Only an unstarted mirror of native Brain work can be closed without Office stage replay. */
export function nativeDeliveryReadbackCandidate(store: Store, job: TicketJob): boolean {
    return store.project.id === 'brain' && job.existingPR === true && job.pr > 0 &&
        job.stage === 'prepare-pr' && ['blocked', 'interrupted'].includes(job.status) &&
        !job.head && !job.worktree && !job.steps.length && !job.mergeAttempt && !job.mergeIntentId &&
        !job.boardUpdates?.length && !job.candidateRecovery &&
        !store.state.workLog?.some(work => work.requestId === job.id) &&
        !store.activeClaims().some(claim => claim.work.id === job.id) &&
        !store.db.prepare('SELECT id FROM effects WHERE work_key=? LIMIT 1').get(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id }));
}
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Read-only provider reconciliation. No merge, comment, board write or historical notice is sent. */
export async function reconcileNativeDelivery(this: GitHubDelivery, key: string): Promise<void> {
    const job = this.jobs.find(candidate => candidate.key === key && candidate.status !== 'cancelled');
    if (!job || this.store.state.paused || !nativeDeliveryReadbackCandidate(this.store, job))
        throw new Error('Only an inactive unstarted native Brain delivery mirror may be reconciled');
    const prior = structuredClone(job), expected = hash(job);
    const status = () => (this.engine.maintenance as import('./brain-maintenance').BrainMaintenance).readStatus();
    const gate = await status(), native = gate.completed;
    if (gate.active || !native || native.phase !== 'completed' || !native.authorId || !native.completedAt ||
        !/^[a-f0-9]{64}$/.test(native.reportSha256 || ''))
        throw new Error('Verified completed native Brain report is required');
    const wrapper = this.store.state.maintenance?.runs.find(run => run.status === 'completed' &&
        (run.nativeRunId === native.id || this.store.state.coordination?.continuations?.some(continuation =>
            continuation.runId === run.id && continuation.status === 'completed' &&
            continuation.nativeRunId === native.id && continuation.nativeAuthorId === native.authorId)));
    const publications = native.prs?.filter(pull => pull.number === job.pr);
    if (!wrapper || publications?.length !== 1 || !/^[a-f0-9]{40}$/.test(publications[0].headSha) || !/^[a-f0-9]{40}$/.test(publications[0].mergeCommit))
        throw new Error('Native report and completed Office wrapper must identify this exact publication');
    const publication = publications[0], number = Number(key.slice(3));
    const pull = await this.verifyPR(job, true), issue = await this.api(`issues/${number}`);
    const board = await this.engine.github.board();
    const cards = board?.items.filter(card => card.repository === this.store.project.repository && card.number === number);
    const issueUrl = `https://github.com/${this.store.project.repository}/issues/${number}`;
    if (pull.number !== job.pr || pull.html_url !== job.prUrl || !pull.merged_at || pull.state !== 'closed' ||
        pull.head.sha !== publication.headSha || pull.merge_commit_sha !== publication.mergeCommit ||
        issue.number !== number || issue.html_url !== issueUrl || issue.pull_request ||
        issue.state !== 'closed' || issue.state_reason !== 'completed' ||
        !board || board.error || board.url !== this.store.project.githubProject?.url ||
        cards?.length !== 1 || cards[0].state.toLowerCase() !== 'closed' || cards[0].status !== 'Done')
        throw new Error('Exact merged PR, completed issue and canonical Done card must all be read back');
    const runs = await this.api(`actions/runs?head_sha=${publication.mergeCommit}&per_page=100`);
    const actual = runs.workflow_runs?.filter((run: any) => run.head_sha === publication.mergeCommit && run.event === 'push' && run.head_branch === this.store.project.target);
    if (!Number.isInteger(runs.total_count) || runs.total_count > 100 || !Array.isArray(runs.workflow_runs) ||
        runs.workflow_runs.length !== runs.total_count || !actual?.length ||
        actual.some((run: any) => run.status !== 'completed' || !['success', 'neutral', 'skipped'].includes(run.conclusion)))
        throw new Error('Complete passing merge Actions are required');
    const fresh = await status(), currentPull = await this.verifyPR(job, true), currentIssue = await this.api(`issues/${number}`);
    if (this.store.state.paused || this.jobs.find(candidate => candidate.id === job.id) !== job ||
        hash(job) !== expected || !nativeDeliveryReadbackCandidate(this.store, job) ||
        fresh.active || hash(fresh.completed) !== hash(native) || currentPull.head.sha !== publication.headSha ||
        currentPull.merge_commit_sha !== publication.mergeCommit || !currentPull.merged_at ||
        currentIssue.state !== 'closed' || currentIssue.state_reason !== 'completed' || currentIssue.updated_at !== issue.updated_at)
        throw new Error('Native delivery identity changed during read-back; original state retained');
    const at = this.store.clock.now().toISOString();
    const detail = `Native Brain run ${native.id}, PR #${job.pr}, passing merge Actions, closed issue and Done lane verified. No work or external effect replayed.`;
    const result: StageResult = { outcome: 'passed', summary: detail, commit: publication.mergeCommit,
        evidence: [{ id: 'native-publication', kind: 'checks', summary: detail, path: '', url: job.prUrl,
            commit: publication.mergeCommit, environment: 'github', observedAt: at }], findings: [],
        receipts: [{ id: `native-delivery:${job.id}:${native.id}`, action: 'native-delivery-readback',
            target: job.prUrl, verified: true, uncertain: false,
            detail: JSON.stringify({ native, wrapperId: wrapper.id, publication, issue: { url: issueUrl, state: issue.state, stateReason: issue.state_reason },
                board: { url: board.url, item: cards[0].id, status: cards[0].status }, actions: actual, prior, verifiedAt: at }) }],
        previewUrl: '', worktree: '', branch: job.branch, prId: job.pr, qaRunDir: '', paidRuns: 0, blocker: '' };
    this.store.transaction(() => {
        job.steps.push({ stage: 'native-delivery-readback', result });
        Object.assign(job, { status: 'completed', stage: 'closeout', head: publication.headSha, mergeCommit: publication.mergeCommit, detail, updatedAt: at });
        const ticket = this.store.state.tickets.find(ticket => ticket.key === key);
        if (ticket) Object.assign(ticket, { status: 'closed', stage: 'complete', activity: 'idle', blocker: '' });
        if (this.store.state.github) this.store.state.github.board = board;
        this.store.emit('native-delivery-reconciled', detail, 'pm', key);
    });
}
