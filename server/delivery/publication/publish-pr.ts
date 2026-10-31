import { verifyRepairCandidate } from '../repairs/delivery-repairs';
import { assertMayMutate } from '../harness/guards';
import { harnessEffect } from '../harness/effect';
import { retryRead } from '../harness/read-retry';
import { lintPRContent, prContent } from './pr-body';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';

type Execute = typeof command;
export interface Publication { pr: number; url: string; pushed: boolean; created: boolean; contentSource?: string }

type Candidate = Readonly<{ head: string; branch: string; worktree: string }>;

/** Identity captured when publication starts; every write is checked against it, not the live job. */
function assertCandidate(store: Store, jobs: TicketJob[], job: TicketJob, candidate: Candidate): void {
    assertMayMutate(store, jobs, job, candidate.head);
    if (job.branch !== candidate.branch || job.worktree !== candidate.worktree)
        throw new Error('Candidate branch or worktree changed before a harness write');
}

async function remoteHead(execute: Execute, candidate: Candidate): Promise<string> {
    const line = (await execute('git', ['ls-remote', '--heads', 'origin', `refs/heads/${candidate.branch}`], { cwd: candidate.worktree, timeout: 60000, readOnly: true })).trim();
    return line ? line.split(/\s+/)[0] : '';
}

async function pushOnce(store: Store, execute: Execute, jobs: TicketJob[], job: TicketJob, candidate: Candidate): Promise<void> {
    const { head, branch, worktree } = candidate;
    const atHead = async () => await remoteHead(execute, candidate) === head ? { head } : null;
    await harnessEffect(store, job, {
        key: `push:${head}`, operation: 'git-push', target: `${store.project.repository}:${branch}`, payload: { head, branch },
        guard: () => assertCandidate(store, jobs, job, candidate),
        dispatch: async () => {
            // Ordinary push of the recorded candidate; never forced.
            await execute('git', ['push', 'origin', `${head}:refs/heads/${branch}`], { cwd: worktree, timeout: 180000 });
            return retryRead(atHead);
        },
        readBack: atHead,
    });
}

/**
 * Publishes the reviewed candidate: pushes once and opens one draft PR, or updates the
 * existing PR's branch with a descendant head. Never force-pushes or opens a second PR.
 */
export async function publishCandidate(store: Store, execute: Execute, jobs: TicketJob[], job: TicketJob, root: string): Promise<Publication> {
    const { repository, target } = store.project, issueNumber = Number(job.key.slice(3));
    const candidate: Candidate = { head: job.head, branch: job.branch, worktree: job.worktree };
    const { head, branch, worktree } = candidate;
    assertCandidate(store, jobs, job, candidate);
    await verifyRepairCandidate(store.project, candidate, execute);
    const api = async (path: string) => JSON.parse(await execute('gh', ['api', `repos/${repository}/${path}`], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (job.pr) {
        const p = await api(`pulls/${job.pr}`);
        if (p.state !== 'open' || p.head?.ref !== branch || p.base?.ref !== target)
            throw new Error(`PR #${job.pr} is not open on ${branch} targeting ${target}; reconcile before publication`);
        let pushed = false;
        if (p.head.sha !== head) {
            await execute('git', ['merge-base', '--is-ancestor', p.head.sha, head], { cwd: worktree, timeout: 30000, readOnly: true });
            await pushOnce(store, execute, jobs, job, candidate);
            pushed = true;
        }
        const updated = await retryRead(async () => { const current = await api(`pulls/${job.pr}`); return current.head?.sha === head ? current : null; });
        if (!updated)
            throw new Error(`PR #${job.pr} head did not update to ${head}`);
        return { pr: job.pr, url: updated.html_url, pushed, created: false };
    }
    const list = async (state: string) => JSON.parse(await execute('gh', ['pr', 'list', '--repo', repository, '--head', branch, '--state', state, '--json', 'number,url,state,headRefOid,baseRefName,isDraft,closingIssuesReferences'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    const prior = await list('all');
    const adoptable = prior.filter((pr: any) => pr.state === 'OPEN' && pr.headRefOid === head && pr.baseRefName === target);
    if (prior.length && adoptable.length !== 1)
        throw new Error(`Branch ${branch} already has a different PR; reconcile before publication`);
    const remote = await remoteHead(execute, candidate);
    if (remote && remote !== head)
        throw new Error(`Remote ${branch} is at ${remote.slice(0, 7)}, not the reviewed candidate; reconcile before publication`);
    if (!remote)
        await pushOnce(store, execute, jobs, job, candidate);
    if (adoptable.length === 1)
        return { pr: adoptable[0].number, url: adoptable[0].url, pushed: !remote, created: false };
    const content = await prContent(execute, job, issueNumber, root);
    await lintPRContent(execute, worktree, content, issueNumber);
    const issueUrl = `https://github.com/${repository}/issues/${issueNumber}`;
    const readBack = async () => {
        const open = (await list('open')).filter((pr: any) => pr.headRefOid === head && pr.baseRefName === target && pr.isDraft);
        return open.length === 1 && open[0].closingIssuesReferences?.some((issue: any) => issue.url === issueUrl) ? { number: open[0].number as number, url: open[0].url as string } : null;
    };
    const created = await harnessEffect(store, job, {
        key: `pr-create:${head}`, operation: 'github-pr-create', target: `${repository}:${branch}`, payload: { head, branch, base: target },
        guard: () => assertCandidate(store, jobs, job, candidate),
        dispatch: async () => {
            await execute('gh', ['pr', 'create', '--repo', repository, '--base', target, '--head', branch, '--draft', '--title', content.title, '--body-file', '-'], { cwd: worktree, input: content.body, timeout: 120000 });
            return retryRead(readBack);
        },
        readBack,
    });
    if (!created)
        throw new Error('Created PR could not be read back');
    return { pr: created.number, url: created.url, pushed: !remote, created: true, contentSource: content.source };
}
