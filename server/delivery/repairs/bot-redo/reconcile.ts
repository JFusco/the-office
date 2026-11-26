import { savedAuthor } from '../../../github/identity/office-authors';
import { reconcileGitHubWrite } from '../../../github/identity/write-boundary';
import { assessDeliveryEligibility } from '../../harness/delivery-authority';
import { readRepo } from '../../intake/dependabot/qualify';
import { MISSING_NATIVE_LINK } from '../../intake/dependency-bots/resume-linked-delivery';
import { automationMergePolicy } from '../../readiness/automation-merge';
import { adoptionFor, matchesRedo, redoEffects, restoreRedos, retirePreparation, type RedoPayload } from './ledger';
import { readBackRedo } from './read-back';
import { nativeLinked } from './recovery-reader';
import { reportContainmentStop, reportStop, UNAVAILABLE, waitingDetail, waitOnBot } from './report';
import { dispatchedRun, type WikiRun } from './wiki-regenerate';
import type { GitHubDelivery } from '../../pipeline/github-delivery';
import type { BotRedo, DependabotAdoption, TicketJob } from '../../../../src/shared';

const HOUR = 3_600_000;
/** Reporting clocks only: an overdue bot is reported once, and polling for a later qualifying head continues. */
const OVERDUE = { wiki: 6 * HOUR, dependabot: 24 * HOUR, renovate: 13 * HOUR, weekly: 8 * 24 * HOUR };
const BOT_LOGIN: Partial<Record<BotRedo['bot'], string>> = { dependabot: 'dependabot[bot]', 'pin-courier': 'pin-courier[bot]' };
const wiki = (redo: BotRedo) => redo.route === 'wiki-sync.yml' || redo.route === 'wiki-issue-sync.yml';
const short = (sha: string) => sha.slice(0, 7);

/** An executor still running this PR's delivery finishes before observation reads its request back. */
function executorActive(delivery: GitHubDelivery, pr: number, exceptClaimId?: string): boolean {
    const ids = new Set(delivery.jobs.filter(j => j.pr === pr).map(j => j.id));
    for (const row of redoEffects(delivery.store, pr)) if (row.work.kind === 'delivery') ids.add(row.work.id);
    return delivery.store.activeClaims().some(c => c.id !== exceptClaimId && c.work.kind === 'delivery' && ids.has(c.work.id)) ||
        !!delivery.store.state.workLog?.some(w => (!exceptClaimId || w.claimId !== exceptClaimId) && ids.has(w.requestId) && ['running', 'stopping'].includes(w.status));
}

/** Attempted requests with no settled outcome are read back against their original intent; nothing is resent. */
export async function readBackRequests(delivery: GitHubDelivery, record: DependabotAdoption, redos: BotRedo[], claimId?: string): Promise<void> {
    for (const redo of redos.filter(r => r.effectId && !r.settled)) {
        if (executorActive(delivery, record.pr, claimId)) return;
        const effect = delivery.store.getEffect<RedoPayload>(redo.effectId!);
        if (!effect || !matchesRedo(delivery.store, record, redo, effect) || !['dispatching', 'uncertain'].includes(effect.status)) continue;
        redo.failure ||= effect.error || 'Request dispatch was interrupted';
        let observedRun: WikiRun | undefined;
        try {
            await reconcileGitHubWrite(delivery.store, effect.id, async intent => {
                const evidence = await readBackRedo(delivery, intent.payload as RedoPayload, intent.receipt, intent.dispatchedAt, savedAuthor(intent));
                if (evidence && 'conclusion' in evidence) observedRun = evidence;
                return { verified: !!evidence && !executorActive(delivery, record.pr, claimId), receipt: intent.receipt ?? evidence };
            });
        }
        catch { /* An unreadable provider keeps the request uncertain until a later read or a settled outcome. */ }
        const verified = delivery.store.getEffect<RedoPayload>(effect.id);
        if (verified?.status === 'verified' && observedRun) redo.run = observedRun;
    }
}

/** The PR closed without merge while a redo was open: one closure outcome, the closer named only on provider evidence. */
async function closedWithRedo(delivery: GitHubDelivery, job: TicketJob, pr: any, redos: BotRedo[]): Promise<boolean> {
    const head = pr.head?.sha || '', closedAt = pr.closed_at || '';
    const outstanding = redos.filter(r => !r.settled && !r.closed);
    const redo = redos.find(r => r.closed?.head === head && r.closed?.closedAt === closedAt) ??
        outstanding.find(r => r.sha === head) ?? outstanding.at(-1);
    if (!redo) return false;
    if (!redo.closed) {
        const events = await readRepo(delivery.store, delivery.execute, `issues/${pr.number}/events?per_page=100`, true).catch(() => []);
        const matches = events.filter((e: any) => e?.event === 'closed' && Date.parse(e.created_at) === Date.parse(closedAt));
        const close = matches.length === 1 ? matches[0] : undefined, login = BOT_LOGIN[redo.bot];
        const requested = redo.effectId && delivery.store.getEffect(redo.effectId)?.dispatchedAt || redo.firstSeenAt;
        redo.closed = { at: requested, closedAt, head, closer: close?.actor?.login || 'unknown', attributed: !!login && close?.actor?.login === login && close.actor.type === 'Bot' };
    }
    reportStop(delivery.store, job, redo, `PR #${pr.number} closed without merge${redo.closed.attributed ? ` by ${redo.closed.closer}` : ''} after its redo at ${short(redo.sha)}; the tracking issue and cards are left for reconciliation.`);
    return true;
}

function requeue(delivery: GitHubDelivery, job: TicketJob, redo: BotRedo, detail: string): void {
    const { store } = delivery, approval = job.mergeAuthorization;
    if (job.stage !== 'merge' || !['blocked', 'interrupted', 'watching'].includes(job.status) ||
        job.mergeApprovalRequired || approval && approval.head !== redo.sha ||
        !store.state.coordination?.merges?.enabled && approval?.head !== redo.sha ||
        !assessDeliveryEligibility(store, job).eligible) return;
    job.stage = 'merge'; job.status = 'queued'; job.detail = detail; delete job.stop;
}

/** The PR is still at the conflicted head: report on the request and on the bot's progress, by each bot's clock. */
async function awaitOutcome(delivery: GitHubDelivery, job: TicketJob, pr: any, record: DependabotAdoption, redo: BotRedo): Promise<boolean> {
    const { store } = delivery, now = store.clock.now().getTime(), effect = redo.effectId ? store.getEffect<RedoPayload>(redo.effectId) : undefined;
    if (redo.route === 'renovate-unavailable') { reportStop(store, job, redo, UNAVAILABLE(job, redo)); return true; }
    if (redo.route === 'renovate-requested' || effect?.status === 'verified' && redo.route === 'renovate-checkbox') {
        if (now - Date.parse(redo.firstSeenAt) > OVERDUE.renovate) reportStop(store, job, redo, `Pin Courier has not rebased PR #${job.pr} since ${redo.firstSeenAt} (13-hour reporting clock); still observing for its new head.`);
        else waitOnBot(job, waitingDetail(job, redo));
        return true;
    }
    if (!effect || effect.status === 'prepared' || effect.status === 'rejected' && !effect.dispatchedAt) {
        if (pr.mergeable !== false) {
            if (!executorActive(delivery, job.pr)) retirePreparation(store, record, redo, effect, 'Redo preparation retired: the head no longer conflicts');
            return false;
        }
        if (job.status !== 'blocked' || redo.dispatchRefRefusal?.jobId !== job.id || redo.dispatchRefRefusal.detail !== job.detail)
            requeue(delivery, job, redo, `PR #${job.pr} still conflicts at ${short(redo.sha)}; the merge stage asks ${redo.bot} once for this head.`);
        return true;
    }
    const sentAt = Date.parse(redo.bot === 'pin-courier' ? redo.firstSeenAt : effect.dispatchedAt), limit = wiki(redo) ? OVERDUE.wiki : redo.bot === 'dependabot' ? OVERDUE.dependabot : OVERDUE.renovate;
    if (effect.status !== 'verified') {
        // The step's own stop names the unread request; this adds the bot's clock once, never a resend.
        if (now - sentAt > limit) reportStop(store, job, redo, `The ${redo.bot} redo request for PR #${job.pr} at ${short(redo.sha)} has no verified receipt after ${Math.round(limit / HOUR)} hours: ${redo.failure || effect.error}. It will not be resent.`);
        return true;
    }
    if (!wiki(redo)) {
        if (now - sentAt > limit) reportStop(store, job, redo, `${redo.bot} has not replaced PR #${job.pr} at ${short(redo.sha)} within ${Math.round(limit / HOUR)} hours of its verified request; still observing for its new head.`);
        else waitOnBot(job, waitingDetail(job, redo));
        return true;
    }
    const run = await dispatchedRun(delivery, effect.payload, effect.receipt, effect.dispatchedAt);
    if (!run) { reportStop(store, job, redo, `The wiki run for PR #${job.pr} no longer reads back as the dispatched run; its request receipt is kept.`); return true; }
    redo.run = { ...run, attempt: run.attempt ?? redo.run?.attempt };
    if (run.status !== 'completed') {
        if (now - sentAt > OVERDUE.wiki) reportStop(store, job, redo, `Wiki run ${run.url} for PR #${job.pr} has not finished within 6 hours; still observing.`);
        else waitOnBot(job, waitingDetail(job, redo));
        return true;
    }
    if (run.conclusion !== 'success') { reportStop(store, job, redo, `Wiki run ${run.url} for PR #${job.pr} ended ${run.conclusion || 'without a conclusion'}; the head stays ${short(redo.sha)} and no second run is requested.`); return true; }
    const numbered = job.branch.startsWith('bot/wiki-sync/');
    redo.sameHead ??= { kind: numbered ? 'numbered' : 'maintenance', at: run.completedAt || store.clock.now().toISOString() };
    if (redo.sameHead.kind === 'maintenance') {
        if (now - Date.parse(redo.sameHead.at) > OVERDUE.weekly) reportStop(store, job, redo, `Wiki maintenance PR #${job.pr} is still at ${short(redo.sha)} eight days after run ${run.url}; the weekly refresh has not replaced it.`);
        else waitOnBot(job, `Wiki run ${run.url} left maintenance PR #${job.pr} at ${short(redo.sha)}; it stays open for the next weekly refresh to replace.`);
        return true;
    }
    if (redo.sameHead.proof && redo.sameHead.proof !== 'contained') reportContainmentStop(store, job, redo, redo.sameHead.proof);
    else if (!redo.sameHead.proof) requeue(delivery, job, redo, `Wiki run ${run.url} left numbered PR #${job.pr} at ${short(redo.sha)}; the Office checks whether ${store.project.target} already contains it.`);
    return true;
}

/** A distinct head on the original PR and branch: qualified and natively linked, it settles every open redo before it. */
async function replacement(delivery: GitHubDelivery, job: TicketJob, pr: any, record: DependabotAdoption, open: BotRedo[], linked: boolean): Promise<boolean> {
    const { store } = delivery, last = open.at(-1)!;
    if (executorActive(delivery, job.pr)) return true;
    if (pr.head?.ref !== last.branch) throw new Error(`Bot PR #${job.pr} branch changed after its redo request`);
    if (!linked) {
        if (last.bot === 'pin-courier') { job.stage = 'merge'; job.status = 'blocked'; job.detail = MISSING_NATIVE_LINK; return true; }
        waitOnBot(job, `Replacement head ${short(pr.head.sha)} on PR #${job.pr} waits for adoption to restore its native link to #${record.issue}.`);
        return true;
    }
    const bot = await automationMergePolicy(delivery, { ...job, head: pr.head.sha }, pr);
    const sameCandidate = (p: any) => p.number === pr.number && p.html_url === pr.html_url && p.state === 'open' && !p.draft &&
        !p.merged_at && !p.merged && p.head?.sha === pr.head.sha && p.head.ref === pr.head.ref &&
        p.head.repo?.full_name === pr.head.repo?.full_name && p.base?.ref === store.project.target && p.base.repo?.full_name === store.project.repository &&
        (bot !== 'wiki-sync' || p.title === pr.title && p.body === pr.body);
    const current = await delivery.verifyPR(job, true);
    if (!sameCandidate(current) || !nativeLinked(current) || !sameCandidate(await delivery.api(`pulls/${job.pr}`))) return true;
    if (executorActive(delivery, job.pr)) return true;
    if (adoptionFor(store, job) !== record || !delivery.jobs.includes(job) || bot !== last.bot ||
        open.some(r => r.settled || r.closed || r.branch !== pr.head.ref || r.bot !== bot || !record.redos?.includes(r)))
        throw new Error('Bot redo binding changed while its replacement was qualified');
    if (open.some(r => r.effectId && store.getEffect(r.effectId)?.status === 'dispatching')) return true;
    const at = store.clock.now().toISOString();
    store.transition('bot-redo-settled', `${job.key}: ${bot} replaced PR #${job.pr} with ${short(pr.head.sha)}; it is checked and merged on that head.`, () => {
        for (const redo of open) {
            const effect = redo.effectId ? store.getEffect<RedoPayload>(redo.effectId) : undefined;
            retirePreparation(store, record, redo, effect, 'Redo preparation retired: head replaced before dispatch');
            redo.settled = { effectId: redo.effectId || '', project: store.project.id, repository: store.project.repository, pr: job.pr, adoption: record.id, bot, sha: redo.sha,
                replacement: pr.head.sha, at, evidence: `${bot} qualification passed and the native link to #${record.issue} read back at ${pr.head.sha}`, cause: effect?.status === 'verified' ? 'attributed' : 'unknown' };
        }
    }, 'pm', job.key);
    return false;
}

/**
 * Observation of this PR's recorded redos. True when it consumed the observation; false hands the PR to ordinary
 * automation observation, which qualifies and checks a settled replacement or admits a new conflicted head.
 */
export async function observeRedos(delivery: GitHubDelivery, job: TicketJob, pr: any, record: DependabotAdoption, linked: boolean): Promise<boolean> {
    restoreRedos(delivery.store, record);
    const redos = (record.redos || []).filter(r => r.pr === job.pr && r.issue === record.issue);
    if (!redos.length) return false;
    await readBackRequests(delivery, record, redos);
    if (pr.merged_at) return false;
    if (pr.state !== 'open') return closedWithRedo(delivery, job, pr, redos);
    const open = redos.filter(r => !r.settled && !r.closed);
    const earlier = open.filter(r => r.sha !== pr.head?.sha);
    if (earlier.length && await replacement(delivery, job, pr, record, earlier, linked)) return true;
    const current = open.find(r => r.sha === pr.head?.sha);
    return current ? awaitOutcome(delivery, job, pr, record, current) : false;
}
