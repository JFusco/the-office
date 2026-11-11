import { isDeepStrictEqual } from 'node:util';
import { projectGraphql } from '../board/project-graphql';
import { pinCourierIdentityRefusal, pinCourierVerifiedCommit } from '../intake/dependency-bots/pin-courier';
import type { GitHubDelivery } from '../pipeline/github-delivery';
import type { TicketJob } from '../../../src/shared';
import { digest } from '../../store/readback-evidence';
import { readValidationProviderContext, validationProviderVersion } from './validation/validation-provider-context';

const SHA = /^[a-f0-9]{40}$/;
const MAX_CONTEXT_BYTES = 1024 * 1024;

function pullIdentity(delivery: GitHubDelivery, job: TicketJob, pull: any) {
    const { project } = delivery.store;
    const url = `https://github.com/${project.repository}/pull/${job.pr}`;
    if (!pull || !Number.isSafeInteger(pull.id) || pull.id < 1 || pull.number !== job.pr || pull.html_url !== url ||
        pull.state !== 'open' || pull.merged_at || !SHA.test(pull.head?.sha) || !SHA.test(pull.base?.sha) ||
        pull.base?.repo?.full_name !== project.repository || typeof pull.title !== 'string' ||
        typeof pull.body !== 'string' && pull.body !== null || !Number.isFinite(Date.parse(pull.updated_at)) ||
        !Number.isSafeInteger(pull.commits) || pull.commits < 1 || pull.commits > 300)
        throw new Error('Current stopped PR identity or commit coverage is unavailable');
    const refusal = pinCourierIdentityRefusal(delivery.store, pull);
    if (refusal) throw new Error(`Current stopped PR cannot be reassessed: ${refusal}`);
    return {
        id: pull.id, number: pull.number, url, head: pull.head.sha as string, branch: pull.head.ref as string,
        base: pull.base.sha as string, target: pull.base.ref as string, count: pull.commits as number,
        title: pull.title as string, body: pull.body as string | null, updatedAt: pull.updated_at as string,
    };
}

async function pages<T extends { id: string | number }>(delivery: GitHubDelivery, path: string, project: (row: any) => T, limit = 10): Promise<T[]> {
    const rows: T[] = [], seen = new Set<string | number>();
    let bytes = 0;
    for (let page = 1; page <= limit; page++) {
        const list = await delivery.api(`${path}?per_page=100&page=${page}`);
        if (!Array.isArray(list) || list.length > 100) throw new Error(`Incomplete GitHub coverage for ${path}`);
        for (const item of list) {
            const row = project(item);
            if (seen.has(row.id)) throw new Error(`Duplicate GitHub evidence in ${path}`);
            seen.add(row.id);
            bytes += Buffer.byteLength(JSON.stringify(row), 'utf8');
            if (bytes > MAX_CONTEXT_BYTES) throw new Error(`GitHub context exceeds the bound for ${path}`);
            rows.push(row);
        }
        if (list.length < 100) return rows;
    }
    throw new Error(`Incomplete GitHub pagination for ${path}`);
}

function discussion(row: any, urlPrefix: string) {
    if (!row || !Number.isSafeInteger(row.id) || row.id < 1 || typeof row.node_id !== 'string' || !row.node_id ||
        typeof row.html_url !== 'string' || !row.html_url.startsWith(urlPrefix) || typeof row.body !== 'string' ||
        row.user !== null && (!Number.isSafeInteger(row.user?.id) || typeof row.user.login !== 'string'))
        throw new Error('Stopped PR discussion identity is unavailable');
    return { id: row.id as number, nodeId: row.node_id as string, url: row.html_url as string, body: row.body as string,
        author: row.user && { id: row.user.id, login: row.user.login }, association: row.author_association,
        createdAt: row.created_at, updatedAt: row.updated_at };
}

const threadQuery = `query($owner:String!,$name:String!,$number:Int!,$after:String){repository(owner:$owner,name:$name){pullRequest(number:$number){number headRefOid baseRefOid reviewDecision reviewThreads(first:50,after:$after){nodes{id isResolved isOutdated comments(first:50){nodes{id} pageInfo{hasNextPage}}} pageInfo{hasNextPage endCursor}}}}}`;

async function reviewThreads(delivery: GitHubDelivery, pr: ReturnType<typeof pullIdentity>, inlineIds: string[]) {
    const [owner, name] = delivery.store.project.repository.split('/');
    const seen = new Set<string>(), covered = new Set<string>(), cursors = new Set<string>();
    const threads: { id: string; resolved: boolean; outdated: boolean; commentIds: string[] }[] = [];
    let after = '';
    for (let page = 0; page < 10; page++) {
        const data = await projectGraphql(delivery.store, delivery.execute, threadQuery,
            { owner, name, number: pr.number, ...(after ? { after } : {}) });
        const pull = data?.repository?.pullRequest, connection = pull?.reviewThreads;
        if (pull?.number !== pr.number || pull.headRefOid !== pr.head || pull.baseRefOid !== pr.base ||
            !Array.isArray(connection?.nodes) || connection.nodes.length > 50 || typeof connection.pageInfo?.hasNextPage !== 'boolean')
            throw new Error('Stopped PR thread coverage or provider head changed');
        for (const thread of connection.nodes) {
            if (typeof thread?.id !== 'string' || !thread.id || seen.has(thread.id) || typeof thread.isResolved !== 'boolean' ||
                typeof thread.isOutdated !== 'boolean' || !Array.isArray(thread.comments?.nodes) || !thread.comments.nodes.length ||
                thread.comments.nodes.length > 50 || thread.comments.pageInfo?.hasNextPage !== false)
                throw new Error('Incomplete stopped PR thread comments');
            seen.add(thread.id);
            const commentIds = thread.comments.nodes.map((node: any) => {
                if (typeof node?.id !== 'string' || !node.id || covered.has(node.id)) throw new Error('Duplicate or missing thread comment identity');
                covered.add(node.id);
                return node.id as string;
            });
            threads.push({ id: thread.id, resolved: thread.isResolved, outdated: thread.isOutdated, commentIds });
        }
        if (!connection.pageInfo.hasNextPage) {
            if (covered.size !== inlineIds.length || inlineIds.some(id => !covered.has(id))) throw new Error('Inline comments and review threads disagree');
            return { decision: pull.reviewDecision ?? null, threads };
        }
        after = connection.pageInfo.endCursor;
        if (typeof after !== 'string' || !after || cursors.has(after)) throw new Error('Stopped PR thread pagination did not advance');
        cursors.add(after);
    }
    throw new Error('Stopped PR thread pagination is incomplete');
}

/** Bind the prospective provider head without changing the original candidate or accepting source. */
export async function readStoppedBaseProviderContext(delivery: GitHubDelivery, job: TicketJob) {
    if (delivery.store.project.id !== 'cms-field-vocabulary' || !job.existingPR || !Number.isSafeInteger(job.pr) || job.pr < 1)
        throw new Error('An existing CMS delivery PR is required');
    const issue = await readValidationProviderContext(delivery, job.key);
    const pr = pullIdentity(delivery, job, await delivery.verifyPR(job, true));
    const commits = await pages(delivery, `pulls/${pr.number}/commits`, row => {
        if (!row || !SHA.test(row.sha) || !pinCourierVerifiedCommit(row)) throw new Error('Stopped PR has a commit without verified Pin Courier provenance');
        return { id: row.sha as string, authorId: row.author.id as number, committer: row.committer.login as string, verified: true };
    }, 4);
    if (commits.length !== pr.count || commits.at(-1)?.id !== pr.head) throw new Error('Signed commits do not cover the exact stopped PR head');
    const comments = await pages(delivery, `issues/${pr.number}/comments`, row => discussion(row, `${pr.url}#issuecomment-`));
    const inline = await pages(delivery, `pulls/${pr.number}/comments`, row => ({ ...discussion(row, `${pr.url}#discussion_`),
        commit: row.commit_id, originalCommit: row.original_commit_id, path: row.path }));
    const reviews = await pages(delivery, `pulls/${pr.number}/reviews`, row => ({ ...discussion(row, `${pr.url}#pullrequestreview-`),
        commit: row.commit_id, state: row.state, submittedAt: row.submitted_at }));
    const threads = await reviewThreads(delivery, pr, inline.map(comment => comment.nodeId));
    const { observedAt: _observedAt, ...policy } = await delivery.readinessPolicy(pr.head);
    if (!isDeepStrictEqual(pr, pullIdentity(delivery, job, await delivery.verifyPR(job, true))))
        throw new Error('Stopped PR changed during provider readback');
    const material = { issueVersion: validationProviderVersion(issue), pr, commits, comments, inline, reviews, threads, policy };
    if (Buffer.byteLength(JSON.stringify(material), 'utf8') > MAX_CONTEXT_BYTES)
        throw new Error('Stopped PR provider context exceeds its bound');
    return { issue, ...material, version: digest(material) };
}
