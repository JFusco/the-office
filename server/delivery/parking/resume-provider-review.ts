import { deliveryInputSha256, deliveryResearchContext, deliveryResearchSha256 } from '../../github/github-context';
import { HOLDS } from '../../office/config';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { harnessDelivers } from '../harness/scope';
import { cardStatus, projectCards, setCardStatus, statusField } from '../board/project-graphql';
import { resolveLane } from '../board/move-lane';
import { hasUncertainEffects, type GitHubDelivery } from '../pipeline/github-delivery';
import { workKey, type EffectIntent, type TicketJob } from '../../../src/shared';

/** An old harness-created provider wait may return to review; research does not approve its merge. */
export async function resumeProviderReviews(delivery: GitHubDelivery): Promise<void> {
    for (const job of delivery.jobs.filter(job => job.status === 'blocked' && job.stage === 'lead-pr' && job.parked?.published && !job.parked.release)) {
        try { await resume(delivery, job); }
        catch (error) {
            const detail = `Provider-wait reassessment unavailable: ${String(error)}`;
            if (job.detail !== detail) {
                job.detail = detail;
                delivery.store.emit('provider-review-held', `${job.key}: ${detail}`, 'pm', job.key);
            }
        }
    }
}

async function resume(delivery: GitHubDelivery, job: TicketJob): Promise<void> {
    const { store, execute } = delivery, parked = job.parked!, step = job.steps.at(-1), head = job.head, key = job.key, branch = job.branch, worktree = job.worktree, prNumber = job.pr;
    if (!harnessDelivers(store, job) || parked.stage !== 'lead-pr' || step?.stage !== 'lead-pr' || step.result.outcome !== 'blocked' ||
        step.result.resolution?.kind !== 'provider-wait' || step.result.resolution.release || step.result.commit !== head ||
        step.result.prId !== job.pr || parked.reason !== (step.result.blocker || step.result.summary).trim() || !Number.isFinite(Date.parse(parked.at))) return;
    const research = deliveryResearchContext(store, job.key);
    if (!research.some(item => Date.parse(item.observedAt) > Date.parse(parked.at))) return;
    const researchSha256 = deliveryResearchSha256(store, job.key), inputSha256 = deliveryInputSha256(store, job.key), parkJson = JSON.stringify(parked), stepJson = JSON.stringify(step), count = job.steps.length, projectJson = JSON.stringify(store.project);
    const base = `harness:${job.id}:provider-review:${parked.at}:${head}:`;
    const effects = () => (store.db.prepare('SELECT body FROM effects WHERE work_key=?')
        .all(workKey({ projectId: store.project.id, kind: 'delivery', id: job.id })) as { body: string }[]).map(row => JSON.parse(row.body) as EffectIntent<Record<string, unknown>>);
    const ownReturn = (effect: EffectIntent<Record<string, unknown>>) => effect.id.startsWith(base) && effect.operation === 'github-project-status' &&
        effect.payload?.head === head && effect.payload?.parkAt === parked.at && JSON.stringify(effect.payload?.originalPark) === parkJson;
    const assertCurrent = () => {
        if (delivery.jobs.filter(candidate => candidate.id === job.id).length !== 1 || delivery.jobs.find(candidate => candidate.id === job.id) !== job || JSON.stringify(store.project) !== projectJson || !harnessDelivers(store, job) || job.status !== 'blocked' || job.stage !== 'lead-pr' || job.head !== head || job.key !== key || job.pr !== prNumber || job.branch !== branch || job.worktree !== worktree ||
            job.parked !== parked || JSON.stringify(parked) !== parkJson || job.steps.length !== count || JSON.stringify(job.steps.at(-1)) !== stepJson ||
            store.state.paused || store.state.draining || store.state.coordination?.pickup?.enabled === false || HOLDS[job.key] || HOLDS[`GH-${prNumber}`] ||
            job.mergeAttempt || job.mergeCommit || job.mergeIntentId || job.mergeApprovalRequired || job.prerequisites?.length ||
            store.activeClaims().some(claim => claim.work.kind === 'delivery' && claim.work.id === job.id) ||
            store.state.workLog?.some(worker => worker.requestId === job.id && ['running', 'stopping'].includes(worker.status)) ||
            job.boardUpdates?.some(update => update.status !== 'verified') || job.steps.some(saved => hasUncertainEffects(saved.stage, saved.result)) ||
            deliveryInputSha256(store, job.key) !== inputSha256 || deliveryResearchSha256(store, job.key) !== researchSha256 || effects().some(effect => !ownReturn(effect) && effect.status !== 'verified' && !(effect.status === 'rejected' && !effect.dispatchedAt)))
            throw new Error('Original provider wait, ownership, controls, research or effects changed');
    };
    const providerGuard = async () => {
        assertCurrent();
        const pr = await delivery.verifyPR(job, true); assertCurrent();
        const issue = await delivery.api(`issues/${Number(job.key.slice(3))}`); assertCurrent();
        if (pr.number !== job.pr || pr.html_url !== `https://github.com/${store.project.repository}/pull/${prNumber}` || pr.state !== 'open' || pr.merged_at || pr.head?.sha !== head || pr.head?.ref !== job.branch ||
            pr.head?.repo?.full_name !== store.project.repository || pr.head.ref === store.project.target ||
            pr.base?.ref !== store.project.target || issue.number !== Number(job.key.slice(3)) || issue.pull_request || issue.state !== 'open' ||
            issue.html_url !== `https://github.com/${store.project.repository}/issues/${issue.number}` || !issue.assignees?.some((user: any) => user.login === 'JFusco'))
            throw new Error('Original native issue, PR or head changed');
        const ownership = JSON.parse(await execute('curl', ['--fail', '--silent', '--show-error',
            `http://127.0.0.1:${process.env.OFFICE_PORT || 4318}/api/sessions?project=${encodeURIComponent(store.project.id)}&ticket=${encodeURIComponent(job.key)}&requestId=${encodeURIComponent(job.id)}`],
            { cwd: store.project.repo, timeout: 60000, readOnly: true }));
        assertCurrent();
        if (!ownership.complete || !ownership.fresh || ownership.project !== store.project.id || ownership.key !== job.key || ownership.ownership?.status !== 'clear')
            throw new Error('Fresh clear exact-issue session ownership is required');
    };
    assertCurrent();
    const field = await statusField(store, execute); assertCurrent();
    const block = resolveLane(field, 'Block'), review = resolveLane(field, 'In review');
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: Number(job.key.slice(3)) }, { kind: 'PullRequest', number: job.pr }]);
    assertCurrent();
    if (cards.filter(card => card.kind === 'Issue').length !== 1 || cards.filter(card => card.kind === 'PullRequest').length > 1)
        throw new Error('Original configured issue/PR card coverage is unavailable');
    // A missing PR card must not discard the positive Office-owned park recorded for it.
    const parkedUpdates = (job.boardUpdates || []).filter(update => update.head === head && update.stage === 'lead-pr' && Date.parse(update.at) >= Date.parse(parked.at) && update.target.match(/^block(ed)?$/i) && update.detail !== `${block.name} already verified.`);
    if (parkedUpdates.some(update => !cards.some(card => card.id === update.item))) throw new Error('An original parked card is missing');
    const intents = new Map(cards.map(card => [card.id, `${base}${card.id}`]));
    if (effects().some(effect => ownReturn(effect) && !cards.some(card => effect.target === `${field.projectId}:${card.id}` && effect.payload?.option === review.id)))
        throw new Error('Prior return effect does not match the exact original cards');
    const lanes = async () => {
        for (const card of cards) {
            const latest = job.boardUpdates?.filter(update => update.item === card.id).at(-1);
            if (!latest || latest.status !== 'verified' || latest.head !== head || latest.stage !== 'lead-pr' || latest.project !== field.projectId ||
                latest.field !== field.fieldId || latest.option !== block.id || latest.detail === `${block.name} already verified.` || !Number.isFinite(Date.parse(latest.at)) || Date.parse(latest.at) < Date.parse(parked.at))
                throw new Error('The latest Block transition is not the original Office-owned park');
            const current = await cardStatus(store, execute, card.id, field.fieldId); assertCurrent();
            const intent = store.getEffect<Record<string, unknown>>(activeEffectId(store, intents.get(card.id)!));
            if (intent && (!ownReturn(intent) || intent.target !== `${field.projectId}:${card.id}` || intent.payload?.option !== review.id))
                throw new Error('Original provider-review return intent changed');
            if (current === review.id && intent && ['dispatching', 'uncertain', 'verified'].includes(intent.status)) continue;
            if (current === block.id && (!intent || intent.status === 'prepared' || intent.status === 'rejected' && !intent.dispatchedAt)) continue;
            throw new Error('Card left its original Office park or a prior return still needs read-back');
        }
    };
    await providerGuard(); await lanes();
    for (const card of cards) {
        const readBack = async () => await cardStatus(store, execute, card.id, field.fieldId) === review.id ? { lane: review.name, head } : null;
        await harnessEffect(store, job, {
            key: intents.get(card.id)!.slice(`harness:${job.id}:`.length), operation: 'github-project-status', target: `${field.projectId}:${card.id}`,
            payload: { option: review.id, head, parkAt: parked.at, originalPark: { ...parked } },
            guard: async () => { await providerGuard(); await lanes(); assertCurrent(); },
            dispatch: async () => { await setCardStatus(store, execute, field.projectId, card.id, field.fieldId, review.id); return readBack(); },
            readBack,
        });
    }
    await providerGuard(); await lanes(); assertCurrent();
    for (const card of cards) {
        if (await cardStatus(store, execute, card.id, field.fieldId) !== review.id) throw new Error('Restored review lane changed before queueing');
        assertCurrent();
    }
    const at = store.clock.now().toISOString();
    for (const card of cards) (job.boardUpdates ??= []).push({ stage: 'lead-pr', head, project: field.projectId, item: card.id, field: field.fieldId,
        option: review.id, target: review.name, at, status: 'verified', detail: `Original Office provider-wait park at ${parked.at} returned for fresh read-only reassessment.` });
    delete job.parked;
    job.status = 'queued';
    job.detail = 'New completed delivery research returned the original Office provider-wait park to read-only PR reassessment; no merge readiness or source acceptance was granted.';
    store.emit('provider-review-resumed', `${job.key}: ${job.detail} Original park: ${parkJson}; research: ${researchSha256}`, 'lead', job.key);
    store.save();
}
