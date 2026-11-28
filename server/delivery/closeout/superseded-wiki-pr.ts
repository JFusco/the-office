import { reconcileGitHubWrite } from '../../github/identity/write-boundary';
import { OPERATOR_LOGIN } from '../../github/identity/office-authors';
import type { Store } from '../../store/store';
import { likePrefix } from '../../store/like-prefix';
import { activeEffectId, effectIdGuard, harnessEffect } from '../harness/effect';
import { assertDeliveryMayMutate } from '../harness/guards';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { readBackOrThrow } from '../harness/read-retry';
import { harnessStageResult, receipt } from '../harness/stage-result';
import { moveLane } from '../board/move-lane';
import { readRepo } from '../intake/dependabot/qualify';
import { ownTracking, trackingIssueAuthor } from '../intake/dependabot/tracking-issue';
import { closesIssue, linkedBody } from '../intake/dependabot/link-pr';
import { wikiSync } from '../intake/dependency-bots/wiki-sync';
import { assertAutomationAuthority } from '../readiness/automation-authority';
import { assertAutomationEffects } from '../readiness/automation-effects';
import { adoptionFor, redoFor } from '../repairs/bot-redo/ledger';
import { reportContainmentStop, waitOnBot } from '../repairs/bot-redo/report';
import { postProofComment, readProofComment, type CommentReceipt, type ProofComment } from './proof-comment';
import { proofCommentQualification } from './proof-comment-qualification';
import { proveContainment, targetTip } from './wiki-containment';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { BotRedo, DependabotAdoption, Receipt, SupersededWikiClose, TicketJob } from '../../../src/shared';

type Guard = () => void | Promise<void>;
const STEPS = ['relink', 'pr-comment', 'pr-close', 'issue-comment', 'issue-close'] as const;
type CommentStep = 'pr-comment' | 'issue-comment';
const short = (sha: string) => sha.slice(0, 7);
const marker = (pr: number, head: string) => `<!-- office-wiki-superseded:${pr}:${head} -->`;
const comment = (close: SupersededWikiClose, kind: 'pull' | 'issue'): ProofComment =>
    ({ number: kind === 'pull' ? close.pr : close.issue, kind, marker: marker(close.pr, close.head), body: kind === 'pull' ? close.comments.pr : close.comments.issue });
const key = (close: SupersededWikiClose, step: string) => `${close.operation}:${step}`;
const intent = (delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose, step: string) =>
    delivery.store.getEffect(activeEffectId(delivery.store, `harness:${job.id}:${key(close, step)}`));
const prUrl = (close: SupersededWikiClose) => `https://github.com/${close.repository}/pull/${close.pr}`;
const issueUrl = (close: SupersededWikiClose) => `https://github.com/${close.repository}/issues/${close.issue}`;
const ownsIssue = (store: Store, issue: any, close: Pick<SupersededWikiClose, 'issue' | 'repository' | 'pr'>) =>
    issue?.number === close.issue && ownTracking(issue, close.pr, 'wiki-sync',
        [trackingIssueAuthor(store, close.issue, close.pr, 'wiki-sync') ?? OPERATOR_LOGIN], close.repository);
const matchesClosedPR = (p: any, close: SupersededWikiClose) =>
    p.number === close.pr && p.html_url === prUrl(close) && p.state === 'closed' && !p.merged_at && !p.merged &&
    p.head?.sha === close.head && p.head.ref === close.branch;
const matchesClosedIssue = (store: Store, issue: any, close: SupersededWikiClose) =>
    ownsIssue(store, issue, close) && issue.state === 'closed' && (issue.state_reason || '') === (close.issueReason ?? 'not_planned');
const PR_REOPENED = 'The superseded wiki PR is not the exact closed, unmerged PR at its proven head';
const ISSUE_REOPENED = 'The tracking issue no longer matches its recorded closure';

class CloseRevalidationError extends Error {
    constructor(reason: string, readonly staysOpen: boolean) { super(reason); }
}

/** A moved head returns to qualification, and an observed merge follows ordinary merged observation. */
function assertOpenSnapshot(p: any, close: SupersededWikiClose, target: string): void {
    if (p.merged_at || p.merged) throw new Error(`Wiki PR #${close.pr} was merged; ordinary merged observation takes it from here`);
    if (p.state !== 'open' || p.head?.sha !== close.head)
        throw new CloseRevalidationError(`the PR is ${p.state} at ${short(p.head?.sha || '')}`, false);
    if (p.number !== close.pr || p.html_url !== prUrl(close) || p.draft || p.head.ref !== close.branch ||
        p.head.repo?.full_name !== close.repository || p.base?.ref !== target || p.base.repo?.full_name !== close.repository)
        throw new Error('The wiki PR is no longer eligible at its proven head');
}

/** The successful numbered wiki replay on this job's unchanged head that awaits its first containment check. */
export function awaitingContainment(delivery: GitHubDelivery, job: TicketJob): { record: DependabotAdoption; redo: BotRedo } | null {
    const record = adoptionFor(delivery.store, job), redo = record && redoFor(record, job.pr, job.head);
    if (!record || !redo || redo.bot !== 'wiki-sync' || redo.route !== 'wiki-sync.yml' || redo.sameHead?.kind !== 'numbered' || redo.sameHead.proof ||
        redo.run?.conclusion !== 'success' || redo.settled || redo.closed || !redo.effectId || delivery.store.getEffect(redo.effectId)?.status !== 'verified') return null;
    return { record, redo };
}

/** Read-only evidence for each close write, used to settle a write sent earlier; never a reason to resend it. */
function readBacks(delivery: GitHubDelivery, close: SupersededWikiClose): Record<Exclude<typeof STEPS[number], CommentStep>, () => Promise<unknown | null>> {
    const { store, execute } = delivery, pull = () => readRepo(store, execute, `pulls/${close.pr}`);
    return {
        relink: async () => { const p = await pull(); return p.head?.sha === close.head && closesIssue(p.body || '', close.issue) ? { head: close.head } : null; },
        'pr-close': async () => {
            const p = await pull(), head = p.head?.sha;
            if (p.number !== close.pr || p.html_url !== prUrl(close) || p.state !== 'closed' || p.merged_at || p.merged || !/^[a-f0-9]{40}$/.test(head || '')) return null;
            if (head === close.head) return { state: 'closed', head, target: await targetTip(store, execute) };
            close.observedPRClose = { state: 'closed', head };
            close.partial = `PR #${close.pr} was closed unmerged at ${short(head)} after proof at ${short(close.head)}; the tracking issue and cards are left as they are`;
            store.save();
            return null;
        },
        'issue-close': async () => {
            const issue = await readRepo(store, execute, `issues/${close.issue}`);
            return ownsIssue(store, issue, close) && issue.state === 'closed' && issue.state_reason === 'not_planned'
                ? { state: 'closed', reason: 'not_planned' } : null;
        },
    };
}

/** Every write this close sent earlier is read back against its original intent first; the first one still unread is named. */
async function readBackSent(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose): Promise<string | null> {
    const { store, execute } = delivery, reads = readBacks(delivery, close);
    for (const step of STEPS) {
        const sent = intent(delivery, job, close, step);
        if (!sent || !['dispatching', 'uncertain'].includes(sent.status)) continue;
        const verified = await reconcileGitHubWrite(store, sent.id, async original => {
            const found = step === 'pr-comment' || step === 'issue-comment'
                ? await readProofComment(store, execute, comment(close, step === 'pr-comment' ? 'pull' : 'issue'), original)
                : await reads[step]();
            // Only the issue comment can carry a designated App trial's evidence; the PR comment and the other steps supply none.
            const qualification = step === 'issue-comment' && found ? await proofCommentQualification(store, execute, comment(close, 'issue'), sent.id, found as CommentReceipt) : undefined;
            return { verified: found !== null, receipt: found, ...(qualification ? { qualification } : {}) };
        }).catch(() => false);
        if (!verified) return step;
    }
    return null;
}

/** Open phase: the open, unmerged, qualified PR at its proven head with its open owned issue. Closed phase: the exact closed, unmerged PR. */
function guards(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose, record: DependabotAdoption) {
    const { store, execute } = delivery;
    const assertBound = () => {
        assertAutomationAuthority(store, delivery.jobs, job, close.head, { adoption: close.adoption, bot: 'wiki-sync', pr: close.pr, issue: close.issue });
        if (adoptionFor(store, job) !== record || job.supersededWikiClose !== close || job.id !== close.job ||
            job.branch !== close.branch || store.project.repository !== close.repository) throw new Error('The superseded close binding changed before a write');
    };
    const bound = (activeEffectId?: string) => {
        assertBound();
        assertAutomationEffects(store, job, false, activeEffectId);
    };
    const qualifyOpen = async (strictLink: boolean, activeEffectId?: string) => {
        bound(activeEffectId);
        const p = strictLink ? await delivery.verifyPR(job, true) : await readRepo(store, execute, `pulls/${close.pr}`);
        assertOpenSnapshot(p, close, store.project.target);
        const refused = await wikiSync.refusal(store, execute, p);
        if (refused) throw new Error(`The wiki PR no longer qualifies: ${refused}`);
        const issue = await readRepo(store, execute, `issues/${close.issue}`);
        if (!ownsIssue(store, issue, close) || issue.state !== 'open') throw new Error('The wiki PR’s own tracking issue is not open');
        bound(activeEffectId);
        return p;
    };
    const closedIssue = async (activeEffectId?: string) => {
        bound(activeEffectId);
        const p = await readRepo(store, execute, `pulls/${close.pr}`);
        if (!matchesClosedPR(p, close)) throw new Error(PR_REOPENED);
        const issue = await readRepo(store, execute, `issues/${close.issue}`);
        if (!ownsIssue(store, issue, close)) throw new Error('The wiki PR’s own tracking issue no longer matches');
        return issue;
    };
    const open = (strictLink: boolean): Guard => effectIdGuard(async activeEffectId => { await qualifyOpen(strictLink, activeEffectId); });
    const closed: Guard = effectIdGuard(async activeEffectId => { await closedIssue(activeEffectId); bound(activeEffectId); });
    const bothClosed: Guard = effectIdGuard(async activeEffectId => {
        const issue = await closedIssue(activeEffectId);
        if (!matchesClosedIssue(store, issue, close)) throw new Error(ISSUE_REOPENED);
        bound(activeEffectId);
    });
    return { assertBound, bound, qualifyOpen, open, closedIssue, closed, bothClosed };
}

/** The first claimed check: re-verify the pair, prove containment, and save the close before any write. False when the PR stays open. */
async function firstCheck(delivery: GitHubDelivery, job: TicketJob, record: DependabotAdoption, redo: BotRedo): Promise<boolean> {
    const { store, execute } = delivery, h = job.head;
    assertDeliveryMayMutate(store, delivery.jobs, job, h);
    const pr = await readRepo(store, execute, `pulls/${job.pr}`), parent = Number(/^bot\/wiki-sync\/([1-9]\d*)$/.exec(pr.head?.ref || '')?.[1] || 0);
    if (pr.state !== 'open' || pr.merged_at || pr.head?.sha !== h || pr.head.ref !== redo.branch || pr.head.ref !== job.branch || !parent) throw new Error('The numbered wiki PR moved before its containment check');
    const refused = await wikiSync.refusal(store, execute, pr);
    if (refused) throw new Error(`The numbered wiki PR no longer qualifies: ${refused}`);
    const issue = await readRepo(store, execute, `issues/${record.issue}`);
    if (!ownsIssue(store, issue, { issue: record.issue, repository: store.project.repository, pr: job.pr }) || issue.state !== 'open')
        throw new Error('The wiki PR’s own tracking issue is not open');
    const result = await proveContainment(store, execute, job.pr, h);
    assertDeliveryMayMutate(store, delivery.jobs, job, h);
    if (adoptionFor(store, job) !== record || redoFor(record, job.pr, h) !== redo) throw new Error('The wiki PR adoption changed during its containment check');
    if ('refusal' in result) {
        if (result.retry) throw new Error(result.refusal);
        redo.sameHead!.proof = result.refusal;
        reportContainmentStop(store, job, redo, result.refusal);
        return false;
    }
    const { proof } = result, m = short(proof.target), target = store.project.target, exempt = proof.paths.filter(p => p.result === 'exempt').map(p => p.path);
    const scope = `${proof.paths.length} paths compared${exempt.length ? `; ${exempt.join(' and ')} exempt as generated by build-graph.cjs ${short(proof.generator)}` : ''}`;
    const close: SupersededWikiClose = { job: job.id, adoption: record.id, repository: store.project.repository, pr: job.pr, parent, issue: record.issue, branch: pr.head.ref,
        head: h, target: proof.target, run: { id: redo.run!.id, url: redo.run!.url }, redoEffect: redo.effectId!, proof, operation: `superseded:${job.pr}:${h}:${redo.run!.id}`, at: store.clock.now().toISOString(),
        comments: {
            pr: `${marker(job.pr, h)}\nWiki run ${redo.run!.url} regenerated this wiki PR for merged PR #${parent} and left it at ${short(h)}. \`${target}\` at ${m} already holds every substantive change it makes (${scope}). The Office plans to close this PR as superseded and tracking issue #${record.issue} as not planned if the issue is still open. Proof: Office delivery job ${job.id}.`,
            issue: `${marker(job.pr, h)}\nWiki PR #${job.pr} is closed as superseded: \`${target}\` at ${m} already holds every substantive change it makes at ${short(h)} (wiki run ${redo.run!.url}). The Office plans to close this issue as not planned if it is still open. Proof: Office delivery job ${job.id}.`,
        } };
    const priorComment = intent(delivery, job, close, 'pr-comment');
    if (priorComment?.status === 'verified') {
        const body = (priorComment.payload as Partial<ProofComment>).body;
        if (typeof body === 'string') close.comments.pr = body;
    }
    store.transition('wiki-pr-contained', `${job.key}: ${target} at ${m} contains wiki PR #${job.pr} at ${short(h)} (${scope}); closing it as superseded.`, () => {
        job.supersededWikiClose = close; redo.sameHead!.proof = 'contained';
    }, 'pm', job.key);
    return true;
}

async function nativeLink(delivery: GitHubDelivery, close: SupersededWikiClose): Promise<boolean> {
    const { store, execute } = delivery;
    const links = JSON.parse(await execute('gh', ['pr', 'view', String(close.pr), '--repo', close.repository, '--json', 'closingIssuesReferences'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    return !!links.closingIssuesReferences?.some((i: any) => i.url === issueUrl(close));
}

/** Adoption owned the original link attempts. Verify their original head and issue before using the live link. */
async function reconcilePriorLinks(delivery: GitHubDelivery, close: SupersededWikiClose): Promise<void> {
    const { store, execute } = delivery, prefix = `harness:${close.adoption}:pr-body:${close.pr}:`;
    const rows = (store.db.prepare("SELECT body FROM effects WHERE id LIKE ? ESCAPE '\\' AND status IN ('dispatching', 'uncertain')").all(likePrefix(prefix)) as { body: string }[]);
    for (const row of rows) {
        const { id } = JSON.parse(row.body);
        const verified = await reconcileGitHubWrite(store, id, async original => {
            const head = /^([a-f0-9]{40})(?::retry-[1-9]\d*)?$/.exec(original.id.slice(prefix.length))?.[1];
            const key = (original.expectedState as { key?: string } | null)?.key, issue = (original.payload as { issue?: number } | null)?.issue;
            if (!head || key !== `pr-body:${close.pr}:${head}` || issue !== close.issue || original.operation !== 'github-pr-body' ||
                original.target !== prUrl(close) || original.work.projectId !== store.project.id || original.work.kind !== 'delivery' ||
                original.work.id !== close.adoption || original.attemptId !== close.adoption) return { verified: false, receipt: null };
            const p = await readRepo(store, execute, `pulls/${close.pr}`);
            return { verified: p.number === close.pr && p.html_url === original.target && p.head?.sha === head &&
                closesIssue(p.body || '', issue) && await nativeLink(delivery, close), receipt: { head } };
        });
        if (!verified) throw new Error(`An earlier link write on PR #${close.pr} needs read-back before the superseded close; it will not be resent`);
    }
}

/** One guarded restoration of the lost `Closes` directive, then GitHub's native link. False while the native link propagates. */
async function restoreLink(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose, g: ReturnType<typeof guards>): Promise<boolean> {
    const { store, execute } = delivery;
    if (await nativeLink(delivery, close)) return true;
    const p = await readRepo(store, execute, `pulls/${close.pr}`), linked = readBacks(delivery, close).relink;
    if (intent(delivery, job, close, 'relink')?.status !== 'verified' && !closesIssue(p.body || '', close.issue)) {
        const body = linkedBody(p.body || '', close.issue);
        if (body.length > 65_000) throw new Error(`PR #${close.pr} body is too long to restore "Closes #${close.issue}"`);
        await harnessEffect(store, job, { key: key(close, 'relink'), operation: 'github-pr-body', target: prUrl(close), payload: { issue: close.issue, head: close.head, run: close.run.id },
            guard: effectIdGuard(async activeEffectId => {
                await g.qualifyOpen(false, activeEffectId);
                const last = await readRepo(store, execute, `pulls/${close.pr}`);
                assertOpenSnapshot(last, close, store.project.target);
                if (last.body !== p.body) throw new Error('The wiki PR body changed before its link was restored');
                g.bound(activeEffectId);
            }),
            dispatch: async () => {
                await execute('gh', ['api', `repos/${close.repository}/pulls/${close.pr}`, '-X', 'PATCH', '-f', `body=${body}`], { cwd: store.project.repo, timeout: 60000 });
                return readBackOrThrow(linked, `Closes #${close.issue} on PR #${close.pr}`);
            },
            readBack: linked });
    }
    if (await nativeLink(delivery, close)) return true;
    waitOnBot(job, `Wiki PR #${close.pr} carries "Closes #${close.issue}" again; the superseded close waits for GitHub's native link.`);
    return false;
}

/** A close that ended before dispatch retires its unsent preparations and retains its sent receipts. */
function abandon(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose, root: string, reason: string, staysOpen: boolean): void {
    const { store } = delivery, record = adoptionFor(store, job), redo = record && redoFor(record, close.pr, close.head);
    for (const step of STEPS) {
        const prepared = intent(delivery, job, close, step);
        if (prepared?.status === 'prepared' && !prepared.dispatchedAt) store.updateEffect(prepared.id, 'prepared', e => { if (!e.dispatchedAt) { e.status = 'rejected'; e.error = 'Superseded close abandoned before dispatch'; } });
    }
    const result = harnessStageResult(job, root, { stage: 'superseded-close-abandoned', summary: `The superseded close of wiki PR #${close.pr} ended before the PR close: ${reason}.`, commit: close.head, receipts: sentReceipts(delivery, job, close), evidence: { close, reason } });
    store.transaction(() => {
        job.steps.push({ stage: 'superseded-close-abandoned', result });
        delete job.supersededWikiClose;
        if (redo?.sameHead) {
            if (staysOpen) redo.sameHead.proof = reason;
            else delete redo.sameHead.proof;
        }
    });
    if (staysOpen && redo) reportContainmentStop(store, job, redo, reason);
    else waitOnBot(job, `Wiki PR #${close.pr} changed before its superseded close (${reason}); waiting for the next PR observation.`);
}

/** Immediately before the PR close: the PR is unchanged and a moved target still contains every change. */
async function revalidate(delivery: GitHubDelivery, close: SupersededWikiClose, qualified: any): Promise<void> {
    const { store, execute } = delivery;
    const refs = async () => {
        const p = await readRepo(store, execute, `pulls/${close.pr}`);
        assertOpenSnapshot(p, close, store.project.target);
        if (p.title !== qualified.title || p.body !== qualified.body || p.user?.login !== qualified.user?.login || p.user?.id !== qualified.user?.id)
            throw new Error('The wiki PR changed after its close qualification');
        return targetTip(store, execute);
    };
    const tip = await refs(), last = close.revalidated?.at(-1)?.target ?? close.target;
    if (tip === last) return;
    const again = await proveContainment(store, execute, close.pr, close.head, tip);
    if (await refs() !== tip) throw new Error(`${store.project.target} is still moving; the superseded close waits for its next claim`);
    if ('refusal' in again) {
        if (again.retry) throw new Error(again.refusal);
        throw new CloseRevalidationError(`${store.project.target} moved and ${again.refusal}; no close was sent`, true);
    }
    (close.revalidated ??= []).push({ target: tip, at: store.clock.now().toISOString() }); store.save();
}

/** After the PR close: a target that moved since the last proof must still contain the changes, or the partial outcome stands. */
async function corroborate(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose): Promise<void> {
    const observed = (intent(delivery, job, close, 'pr-close')?.receipt as { target?: string } | null)?.target, last = close.revalidated?.at(-1)?.target ?? close.target;
    if (!observed || observed === last) return;
    const again = await proveContainment(delivery.store, delivery.execute, close.pr, close.head, observed);
    if ('refusal' in again && again.retry) throw new Error(`The superseded close's corroboration waits: ${again.refusal}`);
    if ('refusal' in again) {
        close.partial = `PR #${close.pr} was closed at ${short(close.head)}, then ${delivery.store.project.target} moved and ${again.refusal}; the tracking issue and cards are left as they are`;
        delivery.store.save();
        throw new Error(close.partial);
    }
    (close.revalidated ??= []).push({ target: observed, at: delivery.store.clock.now().toISOString() }); delivery.store.save();
}

function sentReceipts(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose): Receipt[] {
    const names = { relink: 'Restore the PR’s link to its tracking issue', 'pr-comment': 'Post the superseded proof on the PR', 'pr-close': 'Close the PR as superseded', 'issue-comment': 'Post the superseded proof on the tracking issue', 'issue-close': 'Close the tracking issue as not planned' };
    return STEPS.flatMap(step => {
        const e = intent(delivery, job, close, step);
        if (e?.status !== 'verified') return [];
        const url = (e.receipt as any)?.url || (step.startsWith('issue') ? issueUrl(close) : prUrl(close));
        return [receipt(step, names[step], url, `${names[step]}: read back`)];
    });
}

/** The tracking issue is closed as not planned once; one someone already closed keeps its own reason. */
async function closeIssue(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose, g: ReturnType<typeof guards>): Promise<void> {
    const { store, execute } = delivery, sent = intent(delivery, job, close, 'issue-close');
    if (sent?.status === 'verified' || close.issueReason !== undefined) return;
    if (!sent || sent.status === 'prepared' && !sent.dispatchedAt) {
        const issue = await g.closedIssue(sent?.id);
        if (issue.state === 'closed') {
            g.bound(sent?.id);
            store.transaction(() => {
                if (sent) {
                    const retired = store.updateEffect(sent.id, 'prepared', current => {
                        if (!current.dispatchedAt) {
                            current.status = 'rejected';
                            current.error = 'Tracking issue already closed before dispatch';
                        }
                    });
                    if (retired?.status !== 'rejected') throw new Error('The tracking issue close Effect changed during read-back');
                } else if (intent(delivery, job, close, 'issue-close')) {
                    throw new Error('The tracking issue close Effect changed during read-back');
                }
                close.issueReason = issue.state_reason || '';
            });
            return;
        }
    }
    const read = readBacks(delivery, close)['issue-close'];
    await harnessEffect(store, job, { key: key(close, 'issue-close'), operation: 'github-issue-close', target: issueUrl(close), payload: { issue: close.issue, reason: 'not_planned' },
        guard: effectIdGuard(async activeEffectId => {
            await g.closedIssue(activeEffectId); g.bound(activeEffectId);
            const issue = await readRepo(store, execute, `issues/${close.issue}`);
            if (!ownsIssue(store, issue, close) || issue.state !== 'open')
                throw new Error('The tracking issue is no longer the matching open issue');
            g.bound(activeEffectId);
        }),
        dispatch: async () => {
            await execute('gh', ['api', `repos/${close.repository}/issues/${close.issue}`, '-X', 'PATCH', '-f', 'state=closed', '-f', 'state_reason=not_planned'], { cwd: store.project.repo, timeout: 60000 });
            return readBackOrThrow(read, `Issue #${close.issue} closed as not planned`);
        },
        readBack: read });
}

/** Every write in order, each verified before the next; a write sent earlier is read back first and never resent. */
async function closeSuperseded(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<void> {
    const { store, execute } = delivery, close = job.supersededWikiClose!;
    if (close.partial) throw new Error(`The superseded close stopped: ${close.partial}`);
    const record = adoptionFor(store, job);
    if (!record || record.id !== close.adoption || record.issue !== close.issue || job.id !== close.job || job.pr !== close.pr || job.head !== close.head) throw new Error('The superseded close binding changed');
    const unread = await readBackSent(delivery, job, close);
    if (close.partial) throw new Error(`The superseded close stopped: ${close.partial}`);
    if (unread) throw new Error(`The superseded close's ${unread} is unverified after read-back; it will not be resent`);
    await reconcilePriorLinks(delivery, close);
    const done = (step: string) => intent(delivery, job, close, step)?.status === 'verified', g = guards(delivery, job, close, record);
    if (!done('pr-close')) {
        try {
            assertOpenSnapshot(await readRepo(store, execute, `pulls/${close.pr}`), close, store.project.target);
            if (!await restoreLink(delivery, job, close, g)) return;
            if (!done('pr-comment')) await postProofComment(store, execute, job, key(close, 'pr-comment'), comment(close, 'pull'), g.open(true));
            const read = readBacks(delivery, close)['pr-close'];
            await harnessEffect(store, job, { key: key(close, 'pr-close'), operation: 'github-pr-close', target: prUrl(close), payload: { pr: close.pr, head: close.head },
                guard: effectIdGuard(async activeEffectId => {
                    const qualified = await g.qualifyOpen(true, activeEffectId);
                    await revalidate(delivery, close, qualified);
                    g.bound(activeEffectId);
                }),
                dispatch: async () => {
                    await execute('gh', ['api', `repos/${close.repository}/pulls/${close.pr}`, '-X', 'PATCH', '-f', 'state=closed'], { cwd: store.project.repo, timeout: 60000 });
                    return readBackOrThrow(read, `PR #${close.pr} closed unmerged at ${short(close.head)}`);
                },
                readBack: read });
        }
        catch (error) {
            if (!(error instanceof CloseRevalidationError)) throw error;
            g.assertBound();
            abandon(delivery, job, close, root, error.message, error.staysOpen);
            return;
        }
    }
    await corroborate(delivery, job, close);
    if (!done('issue-comment')) await postProofComment(store, execute, job, key(close, 'issue-comment'), comment(close, 'issue'), g.closed);
    await closeIssue(delivery, job, close, g);
    const lane = await moveLane(store, execute, job, 'Done', g.bothClosed, close.pr, { id: close.operation });
    await g.bothClosed();
    const issue = close.issueReason === undefined ? 'closed as not planned' : `was already closed (${close.issueReason || 'no reason given'})`;
    const summary = `Wiki PR #${close.pr} closed as superseded: ${store.project.target} at ${short(close.revalidated?.at(-1)?.target ?? close.target)} holds its changes at ${short(close.head)}; #${close.issue} ${issue}; cards ${lane || 'unchanged (no board)'}.`;
    const receipts = [...sentReceipts(delivery, job, close), ...(lane ? [receipt('board-status', 'Verify existing board card status', store.project.githubProject?.url || '', `${lane} read back`)] : [])];
    const result = harnessStageResult(job, root, { stage: 'superseded-closeout', summary, commit: close.head, receipts, evidence: { close, lane } });
    store.transition('wiki-pr-superseded', `${job.key}: ${summary}`, () => {
        job.steps.push({ stage: 'superseded-closeout', result });
        job.status = 'cancelled'; job.detail = summary; delete job.stop;
        Object.assign(record, { status: 'withdrawn', detail: summary, at: store.clock.now().toISOString() });
    }, 'pm', job.key);
}

/**
 * In the merge stage, under its claim and before any other merge routing: a saved superseded close continues, and an
 * identified successful numbered replay on its unchanged head gets its first containment check. False otherwise.
 */
export async function continueSupersededWikiPR(delivery: GitHubDelivery, job: TicketJob, root: string): Promise<boolean> {
    if (job.stage !== 'merge') return false;
    if (!job.supersededWikiClose) {
        const found = awaitingContainment(delivery, job);
        if (!found) return false;
        if (!await firstCheck(delivery, job, found.record, found.redo)) return true;
    }
    await closeSuperseded(delivery, job, root);
    return true;
}

/** Observation of a saved close: what it sent is read back first, then one claimed continuation is queued. */
export async function observeSupersededClose(delivery: GitHubDelivery, job: TicketJob, pr: any): Promise<boolean> {
    const { store, execute } = delivery, close = job.supersededWikiClose!;
    const current = () => job.stage === 'merge' && ['blocked', 'interrupted', 'watching'].includes(job.status) &&
        job.supersededWikiClose === close && delivery.jobs.includes(job);
    if (!current()) return true;
    const unread = close.partial ? null : await readBackSent(delivery, job, close);
    if (!current()) return true;
    if (close.partial) { job.stage = 'merge'; job.status = 'blocked'; job.detail = `The superseded close stopped: ${close.partial}`; return true; }
    if (unread) { job.stage = 'merge'; job.status = 'blocked'; job.detail = `The superseded close of PR #${close.pr} waits for read-back of its ${unread}; nothing is resent.`; return true; }
    let refusal = '';
    if (intent(delivery, job, close, 'pr-close')?.status === 'verified' && !matchesClosedPR(pr, close)) refusal = PR_REOPENED;
    else if (close.issueReason !== undefined || intent(delivery, job, close, 'issue-close')?.status === 'verified') {
        const issue = await readRepo(store, execute, `issues/${close.issue}`);
        if (!matchesClosedIssue(store, issue, close)) refusal = ISSUE_REOPENED;
    }
    if (!current()) return true;
    if (refusal) { job.status = 'blocked'; job.detail = String(new Error(refusal)); return true; }
    if (!assessDeliveryEligibility(store, job).eligible) return true;
    job.stage = 'merge'; job.status = 'queued'; delete job.stop;
    job.detail = `The superseded close of wiki PR #${close.pr} continues from its saved proof and receipts.`;
    return true;
}
