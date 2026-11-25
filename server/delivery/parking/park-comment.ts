import { isDeepStrictEqual } from 'node:util';
import { activeEffectId, harnessEffect } from '../harness/effect';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { EffectIntent, TicketJob } from '../../../src/shared';

/** The decision comment of a harness-worded park: its issue, the marker it starts with, the full body, and the account that posts it. */
export interface ParkComment { issue: number; marker: string; body: string; author: string }
export interface CommentReceipt { id: number; url: string }

/** The park's comment Effect key: the job's step count when it parked, as its marker has it. */
export const parkCommentKey = (job: Pick<TicketJob, 'steps' | 'parked'>) =>
    `park-comment:${job.parked?.metadata ? job.parked.metadata.step + 1 : job.steps.length}`;
/** The full body a harness-worded park posts: the marker and reason, a blank line, the instruction. */
export const parkCommentBody = (parked: Pick<NonNullable<TicketJob['parked']>, 'marker' | 'reason' | 'instruction'>) => `${parked.marker}: ${parked.reason}\n\n${parked.instruction}`;
const issueUrl = (store: Store, issue: number) => `https://github.com/${store.project.repository}/issues/${issue}`;

/** The account the Office posts as, read from GitHub. */
export async function commentAuthor(store: Store, execute: Execute): Promise<string> {
    const viewer = JSON.parse(await execute('gh', ['api', 'user'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (typeof viewer?.login !== 'string' || !viewer.login) throw new Error('Authenticated comment author is unavailable');
    return viewer.login;
}

/**
 * The park's one decision comment, read across every page of the issue's comments. Null only when no comment starts
 * with the marker: a quotation or another step's marker is not a match. One that does must be the whole stored body,
 * by the expected author, with a positive id, the canonical issue-comment anchor and the saved receipt when there is
 * one. Anything else, or two of them, needs reconciliation and throws.
 */
export async function readParkComment(store: Store, execute: Execute, comment: ParkComment, receipt?: unknown): Promise<CommentReceipt | null> {
    const pages = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/issues/${comment.issue}/comments?per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (!Array.isArray(pages) || !pages.length || pages.some(page => !Array.isArray(page) || page.length > 100))
        throw new Error('Complete issue comment pages are required to read the decision comment');
    const comments = pages.flat();
    if (comments.some((item: any) => typeof item?.body !== 'string'))
        throw new Error('Complete issue comment bodies are required to read the decision comment');
    const marked = comments.filter((item: any) => item.body.startsWith(`${comment.marker}:`));
    if (!marked.length) return null;
    if (marked.length > 1) throw new Error(`${marked.length} comments start with ${comment.marker}; the decision comment needs reconciliation`);
    const found = marked[0], url = issueUrl(store, comment.issue);
    if (!Number.isSafeInteger(found.id) || found.id <= 0 || found.html_url !== `${url}#issuecomment-${found.id}` || found.user?.login !== comment.author || found.body !== comment.body)
        throw new Error(`The comment that starts with ${comment.marker} is not the Office's exact decision comment; it needs reconciliation`);
    const read: CommentReceipt = { id: found.id, url: found.html_url };
    if (receipt != null && !isDeepStrictEqual(receipt, read)) throw new Error(`The decision comment ${read.url} does not match its saved receipt; it needs reconciliation`);
    return read;
}

/** Throws unless a saved comment intent is this park's: the job's work and attempt, the comment operation, the issue, the key and `payload` exactly. */
export function assertCommentIntent(store: Store, job: TicketJob, intent: EffectIntent, issue: number, payload: Record<string, unknown>): void {
    const key = parkCommentKey(job), base = `harness:${job.id}:${key}`;
    const retry = intent.id.startsWith(`${base}:retry-`) && /^[1-9][0-9]*$/.test(intent.id.slice(base.length + 7));
    if (intent.id !== base && !retry || intent.work.projectId !== store.project.id || intent.work.kind !== 'delivery' || intent.work.id !== job.id || intent.attemptId !== job.id || intent.operation !== 'github-issue-comment' ||
        intent.target !== issueUrl(store, issue) || JSON.stringify(intent.payload) !== JSON.stringify(payload) || JSON.stringify(intent.expectedState) !== JSON.stringify({ key }))
        throw new Error(`The saved decision comment intent ${intent.id} is not this park's; it needs reconciliation`);
}

/**
 * The park's decision comment as one stable Effect under its original key and `payload`. A comment sent earlier is
 * read back against that intent and never sent again; a verified one is read again before it counts; one already on
 * the issue is adopted with no POST. Only a conclusively unsent comment with no match on any page is posted, when
 * `post` allows it, after `guard` passes. Returns the comment read back.
 */
export async function settleParkComment(store: Store, execute: Execute, job: TicketJob, comment: ParkComment, options: { payload: Record<string, unknown>; guard: () => void | Promise<void>; post: boolean }): Promise<CommentReceipt> {
    const key = parkCommentKey(job), id = activeEffectId(store, `harness:${job.id}:${key}`), prior = store.getEffect(id);
    if (prior) assertCommentIntent(store, job, prior, comment.issue, options.payload);
    const read = () => readParkComment(store, execute, comment, store.getEffect(id)?.receipt);
    if (prior?.status === 'verified') {
        const found = await read();
        if (!found) throw new Error('The decision comment the Office verified is no longer on the issue; it needs reconciliation');
        return found;
    }
    const sent = !!prior && ['dispatching', 'uncertain'].includes(prior.status);
    const existing = sent ? null : await read();
    if (!sent && !existing && !options.post) throw new Error('No decision comment is on the issue, and this park may not post one');
    return harnessEffect(store, job, { key, operation: 'github-issue-comment', target: issueUrl(store, comment.issue), payload: options.payload, guard: options.guard,
        dispatch: async () => {
            if (!existing) await execute('gh', ['api', `repos/${store.project.repository}/issues/${comment.issue}/comments`, '--method', 'POST', '-f', `body=${comment.body}`], { cwd: store.project.repo, timeout: 60000 });
            const found = await read();
            if (!found) throw new Error('The decision comment could not be read back after it was sent');
            return found;
        },
        readBack: read });
}
