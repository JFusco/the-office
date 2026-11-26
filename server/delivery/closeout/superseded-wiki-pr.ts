import { Effects } from '../../store/effects';
import { likePrefix } from '../../store/like-prefix';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { assertDeliveryMayMutate } from '../harness/guards';
import { assessDeliveryEligibility } from '../harness/delivery-authority';
import { readBackOrThrow } from '../harness/read-retry';
import { harnessStageResult, receipt } from '../harness/stage-result';
import { moveLane } from '../board/move-lane';
import { readRepo } from '../intake/dependabot/qualify';
import { ownTracking } from '../intake/dependabot/tracking-issue';
import { closesIssue, linkedBody } from '../intake/dependabot/link-pr';
import { wikiSync } from '../intake/dependency-bots/wiki-sync';
import { assertAutomationAuthority } from '../readiness/automation-authority';
import { assertAutomationEffects } from '../readiness/automation-effects';
import { adoptionFor, redoFor } from '../repairs/bot-redo/ledger';
import { reportStop, waitOnBot } from '../repairs/bot-redo/report';
import { postProofComment, readProofComment, type ProofComment } from './proof-comment';
import { proveContainment, targetTip } from './wiki-containment';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { BotRedo, DependabotAdoption, Receipt, SupersededWikiClose, TicketJob } from '../../../src/shared';

type Guard = (activeEffectId?: string) => Promise<void>;
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
const ownsIssue = (issue: any, close: SupersededWikiClose) =>
    issue?.number === close.issue && issue.html_url === issueUrl(close) && ownTracking(issue, close.pr, 'wiki-sync');

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
        'pr-close': async () => { const p = await pull(); return p.state === 'closed' && !p.merged_at && !p.merged && p.head?.sha === close.head ? { state: 'closed', head: close.head, target: await targetTip(store, execute) } : null; },
        'issue-close': async () => { const i = await readRepo(store, execute, `issues/${close.issue}`); return i.state === 'closed' && i.state_reason === 'not_planned' ? { state: 'closed', reason: 'not_planned' } : null; },
    };
}

/** Every write this close sent earlier is read back against its original intent first; the first one still unread is named. */
async function readBackSent(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose): Promise<string | null> {
    const { store, execute } = delivery, reads = readBacks(delivery, close);
    for (const step of STEPS) {
        const sent = intent(delivery, job, close, step);
        if (!sent || !['dispatching', 'uncertain'].includes(sent.status)) continue;
        const verified = await new Effects(store).reconcile(sent.id, async original => {
            const found = step === 'pr-comment' || step === 'issue-comment'
                ? await readProofComment(store, execute, comment(close, step === 'pr-comment' ? 'pull' : 'issue'), original)
                : await reads[step]();
            return { verified: found !== null, receipt: found };
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
        if (!ownsIssue(issue, close) || issue.state !== 'open') throw new Error('The wiki PR’s own tracking issue is not open');
        bound(activeEffectId);
        return p;
    };
    const closedIssue = async (activeEffectId?: string) => {
        bound(activeEffectId);
        const p = await readRepo(store, execute, `pulls/${close.pr}`);
        if (p.number !== close.pr || p.html_url !== prUrl(close) || p.state !== 'closed' || p.merged_at || p.merged ||
            p.head?.sha !== close.head || p.head.ref !== close.branch) throw new Error('The superseded wiki PR is not the exact closed, unmerged PR at its proven head');
        const issue = await readRepo(store, execute, `issues/${close.issue}`);
        if (!ownsIssue(issue, close)) throw new Error('The wiki PR’s own tracking issue no longer matches');
        return issue;
    };
    const open = (strictLink: boolean): Guard => async activeEffectId => { await qualifyOpen(strictLink, activeEffectId); };
    const closed: Guard = async activeEffectId => { await closedIssue(activeEffectId); bound(activeEffectId); };
    return { assertBound, bound, qualifyOpen, open, closedIssue, closed };
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
    if (!ownTracking(issue, job.pr, 'wiki-sync') || issue.state !== 'open') throw new Error('The wiki PR’s own tracking issue is not open');
    const result = await proveContainment(store, execute, job.pr, h);
    assertDeliveryMayMutate(store, delivery.jobs, job, h);
    if (adoptionFor(store, job) !== record || redoFor(record, job.pr, h) !== redo) throw new Error('The wiki PR adoption changed during its containment check');
    if ('refusal' in result) {
        redo.sameHead!.proof = result.refusal;
        reportStop(store, job, redo, `Numbered wiki PR #${job.pr} stays open: run ${redo.run!.url} left it at ${short(h)} and ${result.refusal}.`);
        return false;
    }
    const { proof } = result, m = short(proof.target), target = store.project.target, exempt = proof.paths.filter(p => p.result === 'exempt').map(p => p.path);
    const scope = `${proof.paths.length} paths compared${exempt.length ? `; ${exempt.join(' and ')} exempt as generated by build-graph.cjs ${short(proof.generator)}` : ''}`;
    const close: SupersededWikiClose = { job: job.id, adoption: record.id, repository: store.project.repository, pr: job.pr, parent, issue: record.issue, branch: pr.head.ref,
        head: h, target: proof.target, run: { id: redo.run!.id, url: redo.run!.url }, redoEffect: redo.effectId!, proof, operation: `superseded:${job.pr}:${h}:${redo.run!.id}`, at: store.clock.now().toISOString(),
        comments: {
            pr: `${marker(job.pr, h)}\nThe Office closes this wiki PR as superseded. Wiki run ${redo.run!.url} regenerated it for merged PR #${parent} and left it at ${short(h)}, and \`${target}\` at ${m} already holds every substantive change it makes (${scope}). Tracking issue #${record.issue} is closed as not planned. Proof: Office delivery job ${job.id}.`,
            issue: `${marker(job.pr, h)}\nWiki PR #${job.pr} is closed as superseded: \`${target}\` at ${m} already holds every substantive change it makes at ${short(h)} (wiki run ${redo.run!.url}). Nothing is left to merge, so this issue is closed as not planned. Proof: Office delivery job ${job.id}.`,
        } };
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
        const verified = await new Effects(store).reconcile(id, async original => {
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
            guard: async activeEffectId => {
                await g.qualifyOpen(false, activeEffectId);
                const last = await readRepo(store, execute, `pulls/${close.pr}`);
                assertOpenSnapshot(last, close, store.project.target);
                if (last.body !== p.body) throw new Error('The wiki PR body changed before its link was restored');
                g.bound(activeEffectId);
            },
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

/** The PR stays open: unsent preparations are retired, sent receipts are kept as history and the close record ends. */
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
        if (staysOpen && redo?.sameHead) redo.sameHead.proof = reason;
    });
    if (staysOpen && redo) reportStop(store, job, redo, `Numbered wiki PR #${close.pr} stays open: ${reason}`);
    else waitOnBot(job, `Wiki PR #${close.pr} moved before its superseded close (${reason}); its new head is qualified again.`);
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
    if ('refusal' in again) throw new CloseRevalidationError(`${store.project.target} moved and ${again.refusal}; no close was sent`, true);
    (close.revalidated ??= []).push({ target: tip, at: store.clock.now().toISOString() }); store.save();
}

/** After the PR close: a target that moved since the last proof must still contain the changes, or the partial outcome stands. */
async function corroborate(delivery: GitHubDelivery, job: TicketJob, close: SupersededWikiClose): Promise<void> {
    const observed = (intent(delivery, job, close, 'pr-close')?.receipt as { target?: string } | null)?.target, last = close.revalidated?.at(-1)?.target ?? close.target;
    if (!observed || observed === last) return;
    const again = await proveContainment(delivery.store, delivery.execute, close.pr, close.head, observed);
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
    if (!sent) {
        const issue = await readRepo(store, execute, `issues/${close.issue}`);
        if (issue.state === 'closed') { close.issueReason = issue.state_reason || ''; store.save(); return; }
    }
    const read = readBacks(delivery, close)['issue-close'];
    await harnessEffect(store, job, { key: key(close, 'issue-close'), operation: 'github-issue-close', target: issueUrl(close), payload: { issue: close.issue, reason: 'not_planned' },
        guard: async activeEffectId => {
            await g.closed(activeEffectId);
            const issue = await readRepo(store, execute, `issues/${close.issue}`);
            if (!ownsIssue(issue, close) || issue.state !== 'open')
                throw new Error('The tracking issue is no longer the matching open issue');
            g.bound(activeEffectId);
        },
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
                guard: async activeEffectId => {
                    const qualified = await g.qualifyOpen(true, activeEffectId);
                    await revalidate(delivery, close, qualified);
                    g.bound(activeEffectId);
                },
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
    const lane = await moveLane(store, execute, job, 'Done', g.closed, close.pr, { id: close.operation });
    const liveIssue = await g.closedIssue();
    if (liveIssue.state !== 'closed' || (liveIssue.state_reason || '') !== (close.issueReason ?? 'not_planned'))
        throw new Error('The tracking issue no longer matches its recorded closure');
    g.bound();
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
export async function observeSupersededClose(delivery: GitHubDelivery, job: TicketJob): Promise<boolean> {
    const close = job.supersededWikiClose!;
    if (['queued', 'working'].includes(job.status)) return true;
    if (close.partial) { job.stage = 'merge'; job.status = 'blocked'; job.detail = `The superseded close stopped: ${close.partial}`; return true; }
    const unread = await readBackSent(delivery, job, close);
    if (unread) { job.stage = 'merge'; job.status = 'blocked'; job.detail = `The superseded close of PR #${close.pr} waits for read-back of its ${unread}; nothing is resent.`; return true; }
    if (!assessDeliveryEligibility(delivery.store, job).eligible) return true;
    job.stage = 'merge'; job.status = 'queued'; delete job.stop;
    job.detail = `The superseded close of wiki PR #${close.pr} continues from its saved proof and receipts.`;
    return true;
}
