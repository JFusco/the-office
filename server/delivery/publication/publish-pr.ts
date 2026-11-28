import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { verifyCIHooks } from '../repairs/ci-checkout';
import { assertDeliveryMayMutate } from '../harness/guards';
import { activeEffectId, harnessEffect } from '../harness/effect';
import { retryRead } from '../harness/read-retry';
import { lintPRContent, prContent } from './pr-body';
import { createdContentSha256 } from './created-content';
import { assertMetadataBinding, metadataAppliesToHead } from './metadata-context';
import { publishMetadata } from './publish-metadata';
import { recordedPush } from './record-push';
import { remoteHead } from './remote-head';
import { dispatchDraftCreate } from './pr-create-dispatch';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import { readPublication } from './read-command';
import { assertExistingPublication } from './existing-publication';
import { activeRetry } from '../attempts/retry-binding';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import { assertPushCredential } from '../../github/identity/push-credentials';
import { admitMarkedPush, publicationRefs, pullRequestObservation, type MarkerObservation } from './marker-publication';

type Execute = typeof command;
export interface Publication { pr: number; url: string; pushed: boolean; created: boolean; contentSource?: string }

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;

/** Identity captured when publication starts; every write is checked against it, not the live job. */
function assertCandidate(store: Store, jobs: TicketJob[], job: TicketJob, candidate: Candidate): void {
    assertDeliveryMayMutate(store, jobs, job, candidate.head);
    if (job.branch !== candidate.branch || job.worktree !== candidate.worktree)
        throw new Error('Candidate branch or worktree changed before a harness write');
}

/** This candidate's push was sent and not yet read back: its intent is still dispatching or uncertain. */
function pushUnread(store: Store, job: TicketJob, head: string): boolean {
    const intent = store.getEffect(activeEffectId(store, `harness:${job.id}:push:${head}`));
    return !!intent && ['dispatching', 'uncertain'].includes(intent.status);
}

/** Repository pre-push hooks run full verification (Brain runs lint, format, architecture and its test suite). */
const PUSH_TIMEOUT_MS = 15 * 60 * 1000;

async function pushOnce(store: Store, execute: Execute, jobs: TicketJob[], job: TicketJob, candidate: Candidate, observation?: MarkerObservation): Promise<void> {
    const { head, branch } = candidate;
    const atHead = async () => await remoteHead(execute, candidate) === head ? { head } : null;
    // An opted-in project refuses a [skip release] package change before any new push intent (#617).
    const marked = await admitMarkedPush(store, execute, job, candidate, observation, () => assertCandidate(store, jobs, job, candidate));
    await harnessEffect(store, job, {
        key: `push:${head}`, operation: 'git-push', target: `${store.project.repository}:${branch}`, payload: { head, branch },
        guard: marked ? async () => { assertCandidate(store, jobs, job, candidate); await marked(); } : () => assertCandidate(store, jobs, job, candidate),
        // An App push proves its destination, helper and hooks before the claim, so a refusal is never sent.
        credentialCheck: () => assertPushCredential(store, execute, candidate.worktree),
        dispatch: async () => {
            // Ordinary push of the recorded candidate; never forced.
            await recordedPush(store, execute, job, candidate, () => assertCandidate(store, jobs, job, candidate), PUSH_TIMEOUT_MS);
            return retryRead(atHead);
        },
        readBack: atHead,
    });
}

/**
 * Publishes the reviewed candidate: pushes once and opens one draft PR, or updates the
 * existing PR's branch with a descendant head. Never force-pushes or opens a second PR.
 */
export async function publishCandidate(store: Store, execute: Execute, jobs: TicketJob[], job: TicketJob, root: string, delivery?: GitHubDelivery): Promise<Publication> {
    // The existing-PR head update may not silently bypass an admitted metadata handoff.
    const metadata = metadataAppliesToHead(store, job);
    if (metadata) {
        if (!delivery || delivery.store !== store || delivery.execute !== execute || delivery.jobs !== jobs)
            throw new Error('Admitted metadata requires its actual delivery owner before publication');
        assertMetadataBinding(delivery, job);
    }
    const { repository, target } = store.project, issueNumber = Number(job.key.slice(3));
    const candidate: Candidate = { head: job.head, branch: job.branch, worktree: job.worktree };
    const { head, branch, worktree } = candidate;
    assertCandidate(store, jobs, job, candidate);
    await verifyRepairCandidate(store.project, candidate, execute);
    await verifyCIHooks({ execute }, job);
    if (job.pr) {
        const p = await readPublication(store, execute, job, root, 'pull-request');
        if (p.state !== 'open' || p.head?.ref !== branch || p.base?.ref !== target)
            throw new Error(`PR #${job.pr} is not open on ${branch} targeting ${target}; reconcile before publication`);
        // An automatic retry establishes the PR's identity and native link before it pushes, edits or moves anything.
        if (activeRetry(job)?.mode === 'draft') await assertExistingPublication(store, execute, job, root, job.pr, branch, p);
        let pushed = false;
        if (p.head.sha !== head) {
            await execute('git', ['merge-base', '--is-ancestor', p.head.sha, head], { cwd: worktree, timeout: 30000, readOnly: true });
            await pushOnce(store, execute, jobs, job, candidate, pullRequestObservation(store, p, candidate));
            pushed = true;
        }
        // A push whose response was lost is settled by reading the branch under its own intent; nothing is pushed again.
        else if (pushUnread(store, job, head)) await pushOnce(store, execute, jobs, job, candidate);
        const updated = await retryRead(async () => { const current = await readPublication(store, execute, job, root, 'pull-request'); return current.head?.sha === head ? current : null; });
        if (!updated)
            throw new Error(`PR #${job.pr} head did not update to ${head}`);
        if (metadata) await publishMetadata(delivery!, job);
        return { pr: job.pr, url: updated.html_url, pushed, created: false };
    }
    const list = async (state: string) => JSON.parse(await execute('gh', ['pr', 'list', '--repo', repository, '--head', branch, '--state', state, '--json', 'number,url,state,headRefOid,baseRefName,isDraft,closingIssuesReferences,title,body'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    const prior = await list('all');
    const adoptable = prior.filter((pr: any) => pr.state === 'OPEN' && pr.headRefOid === head && pr.baseRefName === target);
    if (prior.length && adoptable.length !== 1)
        throw new Error(`Branch ${branch} already has a different PR; reconcile before publication`);
    if (adoptable.length === 1 && activeRetry(job)?.mode === 'draft') await assertExistingPublication(store, execute, job, root, adoptable[0].number, branch);
    // Where the release-marker check applies, the same probe also reads the target, each ref by its full name.
    const refs = await publicationRefs(store, execute, candidate);
    const remote = refs ? refs.tips.published : await remoteHead(execute, candidate);
    if (remote && remote !== head)
        throw new Error(`Remote ${branch} is at ${remote.slice(0, 7)}, not the reviewed candidate; reconcile before publication`);
    if (!remote || pushUnread(store, job, head))
        await pushOnce(store, execute, jobs, job, candidate, refs);
    if (adoptable.length === 1)
        return { pr: adoptable[0].number, url: adoptable[0].url, pushed: !remote, created: false };
    const content = await prContent(execute, job, issueNumber, root);
    await lintPRContent(execute, worktree, content, issueNumber);
    const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`;
    const linkedDraft = async () => {
        const open = (await list('open')).filter((pr: any) => pr.headRefOid === head && pr.baseRefName === target && pr.isDraft);
        return open.length === 1 && open[0].closingIssuesReferences?.some((issue: any) => issue.url === issueUrl) ? open[0] : null;
    };
    const readBack = async () => { const pr = await linkedDraft(); return pr ? { number: pr.number as number, url: pr.url as string } : null; };
    const created = await harnessEffect<{ number: number; url: string; contentSha256?: string } | null>(store, job, {
        key: `pr-create:${head}`, operation: 'github-pr-create', target: `${repository}:${branch}`, payload: { head, branch, base: target },
        guard: () => assertCandidate(store, jobs, job, candidate),
        dispatch: async () => {
            const printed = await dispatchDraftCreate(execute, { repository, base: target, branch, title: content.title, body: content.body, cwd: worktree });
            // Only this original create records what it published; a reconciliation reads back number and URL alone.
            const pr = await retryRead(linkedDraft), contentSha256 = createdContentSha256(printed, pr, content);
            return pr ? { number: pr.number as number, url: pr.url as string, ...(contentSha256 ? { contentSha256 } : {}) } : null;
        },
        readBack,
    });
    if (!created)
        throw new Error('Created PR could not be read back');
    return { pr: created.number, url: created.url, pushed: !remote, created: true, contentSource: content.source };
}
