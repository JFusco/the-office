import { Effects } from '../../../store/effects';
import { requireDeliveryAuthority } from '../../harness/delivery-authority';
import { findTrackingIssue } from '../../intake/dependabot/tracking-issue';
import { assertAutomationAuthority } from '../../readiness/automation-authority';
import { assertAutomationEffects } from '../../readiness/automation-effects';
import { automationMergePolicy } from '../../readiness/automation-merge';
import { rebaseArgs } from './dependabot-rebase';
import { adoptionFor, botOf, redoBase, redoOf, retirePreparation, type RedoPayload } from './ledger';
import { checkboxArgs, renovateControl } from './pin-courier-rebase';
import { readBackRedo } from './read-back';
import { readBackRequests } from './reconcile';
import { reportStop, UNAVAILABLE, waitingDetail, waitOnBot } from './report';
import { dispatchArgs, dispatchRef, wikiWorkflow, WikiDispatchRefMismatch, type WikiRun } from './wiki-regenerate';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { Store } from '../../../store/store';
import type { EffectIntent, TicketJob } from '../../../../src/shared';

const OPERATION = { 'wiki-sync.yml': 'github-workflow-dispatch', 'wiki-issue-sync.yml': 'github-workflow-dispatch', 'dependabot-rebase': 'github-pr-comment', 'renovate-checkbox': 'github-pr-body' } as const;
type Sent = keyof typeof OPERATION;
type Route = { route: Sent; args: string[] } | { route: 'renovate-requested' | 'renovate-unavailable' };
const attempted = (e?: EffectIntent) => !!e && (!!e.dispatchedAt || ['dispatching', 'uncertain', 'verified'].includes(e.status));

/** The bot's own way back for this conflicted head: exact provider arguments, or a passive Renovate wait. */
function selectRoute(repository: string, pr: any, bot: string, target: string): Route {
    if (bot === 'dependabot') return { route: 'dependabot-rebase', args: rebaseArgs(repository, pr.number) };
    if (bot === 'pin-courier') {
        const control = renovateControl(pr.body);
        return control.route === 'renovate-checkbox' ? { route: control.route, args: checkboxArgs(repository, pr.number, control.body) } : control;
    }
    const workflow = wikiWorkflow(pr);
    if (typeof workflow === 'string') throw new Error(`No wiki workflow regenerates PR #${pr.number}: ${workflow}`);
    return { route: workflow.route, args: dispatchArgs(repository, workflow.route, target, workflow.inputs) };
}

const stillConflicted = (pr: any, sent: RedoPayload) => pr.number === sent.pr && pr.state === 'open' && !pr.draft &&
    !pr.merged_at && !pr.merged && pr.head?.sha === sent.sha && pr.head.ref === sent.branch && pr.mergeable === false &&
    pr.head.repo?.full_name === sent.repository && pr.base?.ref === sent.target && pr.base.repo?.full_name === sent.repository;

function assertRedoRoute(pr: any, sent: RedoPayload): void {
    const route = selectRoute(sent.repository, pr, sent.bot, sent.target);
    if (!('args' in route) || route.route !== sent.route || JSON.stringify(route.args) !== JSON.stringify(sent.args))
        throw new Error('The bot’s own redo control changed before the request');
}

/** A matching unsent preparation, a fresh ID after proven pre-dispatch rejections, or this head's spent allowance. */
function selectAttempt(store: Store, base: string, payload: RedoPayload): { id: string; reuse?: EffectIntent<RedoPayload> } | { spent: EffectIntent } {
    for (let n = 0; ; n++) {
        const id = n ? `${base}:retry-${n}` : base;
        let effect = store.getEffect<RedoPayload>(id);
        if (!effect) return { id };
        if (effect.status === 'prepared' && !effect.dispatchedAt) {
            if (JSON.stringify(effect.payload) === JSON.stringify(payload)) return { id, reuse: effect };
            store.updateEffect(id, 'prepared', current => { if (!current.dispatchedAt) { current.status = 'rejected'; current.error = 'Obsolete redo preparation retired before dispatch'; } });
            effect = store.getEffect<RedoPayload>(id)!;
        }
        if (attempted(effect) || effect.status !== 'rejected') return { spent: effect };
    }
}

/**
 * The merge stage of a conflicted adopted bot PR, under its running claim: one bot-owned redo per conflicted head, across
 * delivery jobs. True when the stage is done for now (requested, waiting or stopped); false leaves ordinary readiness.
 */
export async function requestBotRedo(delivery: GitHubDelivery, job: TicketJob, pr: any, bot: string): Promise<boolean> {
    const { store, execute } = delivery, record = adoptionFor(store, job);
    const redo = record && pr.head?.sha === job.head ? redoOf(store, record, job.pr, job.head) : undefined;
    if (!record || !redo || redo.settled || redo.closed || botOf(record) !== bot || redo.bot !== bot) return false;
    // A recorded wait at its original head holds even when GitHub's mergeability changes.
    if (redo.route === 'renovate-unavailable') { reportStop(store, job, redo, UNAVAILABLE(job, redo)); return true; }
    if (attempted(redo.effectId ? store.getEffect(redo.effectId) : undefined) || redo.route === 'renovate-requested') {
        if (redo.effectId) {
            const { claim } = requireDeliveryAuthority(store, job);
            await readBackRequests(delivery, record, [redo], claim?.id);
        }
        assertAutomationEffects(store, job); waitOnBot(job, waitingDetail(job, redo)); return true;
    }
    if (pr.mergeable !== false) return false;
    if (store.state.draining) { waitOnBot(job, `Office is draining; the ${bot} redo for PR #${job.pr} is requested on a later claim.`); return true; }
    requireDeliveryAuthority(store, job);
    if (pr.head.ref !== job.branch || pr.head.ref !== redo.branch || redo.issue !== record.issue || redo.issueUrl !== `https://github.com/${store.project.repository}/issues/${record.issue}`)
        throw new Error('Conflicted bot PR branch or issue binding changed');
    const adoption = record.id;
    const wikiRef = async (snapshot: any) => {
        try { return await dispatchRef(delivery, snapshot); }
        catch (error) {
            if (error instanceof WikiDispatchRefMismatch) redo.dispatchRefRefusal = { jobId: job.id, detail: String(error) };
            throw error;
        }
    };
    const target = bot === 'wiki-sync' ? await wikiRef(pr) : store.project.target;
    const route = selectRoute(store.project.repository, pr, bot, target);
    if (!('args' in route)) {
        if (redo.effectId) {
            retirePreparation(store, record, redo, store.getEffect<RedoPayload>(redo.effectId), 'Obsolete redo preparation retired before dispatch');
            const current = store.getEffect(redo.effectId);
            if (attempted(current)) {
                assertAutomationEffects(store, job);
                waitOnBot(job, waitingDetail(job, redo));
                return true;
            }
            if (current?.status === 'prepared') throw new Error('The saved redo preparation no longer matches its original request');
        }
        redo.route = route.route;
        if (route.route === 'renovate-unavailable') reportStop(store, job, redo, UNAVAILABLE(job, redo));
        else waitOnBot(job, waitingDetail(job, redo));
        return true;
    }
    const payload: RedoPayload = { project: store.project.id, repository: store.project.repository, pr: redo.pr, sha: redo.sha, adoption, issue: redo.issue, bot: redo.bot, branch: redo.branch, target, route: route.route, args: route.args };
    const attempt = selectAttempt(store, redoBase(store, job.pr, job.head), payload);
    if ('spent' in attempt) { redo.effectId ??= attempt.spent.id; assertAutomationEffects(store, job); waitOnBot(job, waitingDetail(job, redo)); return true; }
    // The gate also covers a merge intent or attempt on this job.
    assertAutomationEffects(store, job, false, attempt.reuse && attempt.id);
    assertAutomationAuthority(store, delivery.jobs, job, payload.sha, payload);
    const intent = attempt.reuse, sent = intent?.payload ?? payload;
    redo.route = sent.route; redo.effectId = attempt.id; store.save();
    let dispatchedAt = '';
    let observedRun: WikiRun | undefined;
    try {
        await new Effects(store).execute<RedoPayload, unknown>({
            id: attempt.id, work: intent?.work ?? { projectId: store.project.id, kind: 'delivery', id: job.id }, attemptId: intent?.attemptId ?? job.id,
            operation: intent?.operation ?? OPERATION[sent.route as Sent], target: intent?.target ?? pr.html_url, authorization: intent?.authorization ?? 'office-harness',
            payload: sent, expectedState: intent?.expectedState ?? { head: sent.sha, base: sent.target, branch: sent.branch },
            preflight: async () => {
                const live = await delivery.verifyPR(job, true);
                if (!stillConflicted(live, sent))
                    throw new Error('The conflicted bot PR changed before its redo request');
                if (await automationMergePolicy(delivery, job, live) !== sent.bot) throw new Error('Bot qualification changed before its redo request');
                if (sent.bot === 'wiki-sync' && await wikiRef(live) !== sent.target) throw new Error('The wiki dispatch ref changed before the request');
                assertRedoRoute(live, sent);
                if ((await findTrackingIssue(store, execute, sent.pr, sent.issue, sent.bot))?.number !== sent.issue) throw new Error('The bot PR’s own tracking issue no longer matches');
                const last = await delivery.api(`pulls/${sent.pr}`);
                if (!stillConflicted(last, sent) || last.user?.login !== live.user?.login || last.user?.id !== live.user?.id ||
                    sent.bot === 'wiki-sync' && (last.title !== live.title || last.body !== live.body))
                    throw new Error('The conflicted bot PR changed before its redo request');
                assertRedoRoute(last, sent);
                assertAutomationAuthority(store, delivery.jobs, job, sent.sha, sent);
                assertAutomationEffects(store, job, false, attempt.id);
            },
            dispatch: async value => {
                dispatchedAt = store.getEffect(attempt.id)?.dispatchedAt || '';
                const out = await execute('gh', value.args, { cwd: store.project.repo, timeout: 60000 });
                return out.trim() ? JSON.parse(out) : null;
            },
            verify: async (value, saved) => {
                const evidence = await readBackRedo(delivery, saved, value, dispatchedAt);
                if (evidence && 'conclusion' in evidence) observedRun = evidence;
                return !!evidence;
            },
        });
        if (observedRun) redo.run = observedRun;
    }
    catch (error) {
        if (!redo.failure && store.getEffect(attempt.id)?.dispatchedAt) redo.failure = String(error);
        throw error;
    }
    waitOnBot(job, waitingDetail(job, redo));
    store.emit('bot-redo-requested', `${job.key}: ${job.detail}`, 'pm', job.key);
    return true;
}
