import { HOLDS } from '../../office/config';
import { deliveryInputSha256 } from '../../github/github-context';
import { digest } from '../../store/readback-evidence';
import { currentAssignment } from '../../workers/assignment-context';
import { harnessDelivers } from '../harness/scope';
import { cardStatus, projectCards, statusField } from '../board/project-graphql';
import { resolveLane } from '../board/move-lane';
import { hasUncertainEffects, type GitHubDelivery } from '../pipeline/github-delivery';
import type { Store } from '../../store/store';
import { workKey, type HarnessRequest, type TicketJob } from '../../../src/shared';

type Ownership = () => Promise<{ complete: boolean; fresh: boolean; project: string; key: string; ownership?: { status: string } }>;

/** Only a failed board preflight before ANY source worker/result may admit this readback. */
export function boardPreflightCandidate(store: Store, job: TicketJob): { id: string; head: string } | undefined {
    if (!harnessDelivers(store, job) || store.state.paused || store.state.draining || !store.state.coordination?.enabled || HOLDS[job.key] || HOLDS[`GH-${job.pr}`] ||
        job.status !== 'blocked' || job.stage !== 'update-base' || !job.pr || !/^[a-f0-9]{40}$/.test(job.head) || !job.branch || !job.worktree || job.parked ||
        !/^Error: Board transition needs read-back:/.test(job.detail) || job.mergeAttempt || job.mergeCommit || job.mergeIntentId || job.mergeApprovalRequired || job.prerequisites?.length ||
        job.steps.some(step => step.stage === 'update-base' || hasUncertainEffects(step.stage, step.result)) ||
        store.state.workLog?.some(work => work.requestId === job.id && (work.stage === 'github-update-base' || ['running', 'stopping'].includes(work.status))) ||
        store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id)) return;
    const pending = job.boardUpdates?.filter(update => update.status !== 'verified') || [];
    if (!pending.length || pending.some(update => update.status !== 'uncertain' || update.stage !== 'update-base' || update.head !== job.head ||
        update.target !== 'In progress' || !Number.isFinite(Date.parse(update.at)))) return;
    const effects = (store.db.prepare('SELECT body FROM effects WHERE work_key=?').all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body));
    if (effects.some(effect => effect.status !== 'verified' && !(effect.status === 'rejected' && !effect.dispatchedAt))) return;
    return { id: `board-preflight:${job.id}:${digest(pending.map(({ project, item, field, option, head, at }) => ({ project, item, field, option, head, at })))}`, head: job.head };
}

/** Settle the original landed transitions by GET only, then queue the same first source stage. */
export async function reconcileBoardPreflight(delivery: GitHubDelivery, request: Pick<HarnessRequest, 'id' | 'key' | 'head'>, ownership: Ownership): Promise<boolean> {
    const { store, execute } = delivery, job = delivery.jobs.find(job => job.key === request.key && job.status !== 'cancelled');
    const admission = job && boardPreflightCandidate(store, job);
    if (!job || !admission) return false;
    if (request.head !== admission.head) throw new Error('Original board-preflight head lease is required');
    const registered = store.state.coordination?.requests?.find(current => current.id === request.id), claim = currentAssignment()?.claim;
    if (!registered || registered !== request || registered.status !== 'working' || registered.action !== 'reconcile-base-update' ||
        !claim || claim.status !== 'running' || claim.work.projectId !== store.project.id || claim.work.kind !== 'reconciliation' ||
        claim.work.id !== request.id || claim.stage !== registered.action)
        throw new Error('Original working board-preflight request and running reconciliation claim are required');
    const requestJson = JSON.stringify(registered), claimJson = JSON.stringify(claim);
    const saved = JSON.stringify(job), project = JSON.stringify(store.project), inputs = deliveryInputSha256(store, job.key);
    const pending = job.boardUpdates!.filter(update => update.status !== 'verified');
    const assertCurrent = () => {
        if (store.state.coordination?.requests?.find(current => current.id === request.id) !== registered || JSON.stringify(registered) !== requestJson ||
            currentAssignment()?.claim !== claim || JSON.stringify(claim) !== claimJson || !store.activeClaims().some(current => current.id === claim.id && JSON.stringify(current) === claimJson))
            throw new Error('Original board-preflight request or reconciliation claim changed');
        if (delivery.jobs.filter(candidate => candidate.id === job.id).length !== 1 || delivery.jobs.find(candidate => candidate.id === job.id) !== job ||
            JSON.stringify(job) !== saved || JSON.stringify(store.project) !== project || deliveryInputSha256(store, job.key) !== inputs ||
            boardPreflightCandidate(store, job)?.id !== admission.id) throw new Error('Original pre-worker board attempt, identity or controls changed');
    };
    const ownerGuard = async () => {
        const current = await ownership(); assertCurrent();
        if (!current.complete || !current.fresh || current.project !== store.project.id || current.key !== job.key || current.ownership?.status !== 'clear')
            throw new Error('Complete fresh clear original-issue ownership is required');
    };
    const providerGuard = async () => {
        const pr = await delivery.verifyPR(job, true); assertCurrent();
        const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`); assertCurrent();
        if (pr.number !== job.pr || pr.html_url !== job.prUrl || pr.state !== 'open' || pr.merged_at || pr.head?.sha !== job.head || pr.head?.ref !== job.branch ||
            pr.head?.repo?.full_name !== store.project.repository || pr.head.ref === store.project.target || pr.base?.ref !== store.project.target ||
            issue.number !== Number(job.key.slice(3)) || issue.pull_request || issue.state !== 'open' ||
            issue.html_url !== `https://github.com/${store.project.repository}/issues/${issue.number}` || !issue.assignees?.some((user: any) => user.login === 'JFusco'))
            throw new Error('Original native PR, issue or candidate head changed');
    };
    assertCurrent(); await ownerGuard(); await providerGuard();
    const field = await statusField(store, execute); assertCurrent();
    const progress = resolveLane(field, 'In progress');
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: Number(job.key.slice(3)) }, { kind: 'PullRequest', number: job.pr }]); assertCurrent();
    if (cards.filter(card => card.kind === 'Issue').length !== 1 || cards.filter(card => card.kind === 'PullRequest').length > 1)
        throw new Error('Exact configured board card coverage is unavailable');
    const readBack = async () => {
        const issueCard = cards.find(card => card.kind === 'Issue')!;
        const issueStatus = await cardStatus(store, execute, issueCard.id, field.fieldId); assertCurrent();
        const issueLane = field.options.find(option => option.id === issueStatus)?.name.trim().toLowerCase();
        if (!issueLane || !['ready', 'in progress', 'in review'].includes(issueLane))
            throw new Error('Original issue card is in a human or unknown lane');
        for (const update of pending) {
            if (update.project !== field.projectId || update.field !== field.fieldId || update.option !== progress.id || !cards.some(card => card.id === update.item))
                throw new Error('Original board item, project, field or intended lane changed');
            const current = await cardStatus(store, execute, update.item, update.field); assertCurrent();
            if (current !== update.option) throw new Error('Original board transition remains uncertain; it will not be resent');
        }
    };
    await readBack(); await providerGuard(); await ownerGuard(); await readBack();
    store.transition('board-preflight-reconciled', `${job.key}: original board transition read back; same first repair stage queued without repeating a write.`, () => {
        assertCurrent();
        for (const update of pending) {
            update.status = 'verified';
            update.detail = `Original board transition verified by read-back; no mutation repeated. Prior failure retained: ${update.detail}`;
        }
        job.status = 'queued';
        job.detail = 'Original In progress board transition read back before any source worker started. Same update-base stage queued; original head, candidate, failures and repair budget retained.';
    }, 'pm', job.key);
    return true;
}
