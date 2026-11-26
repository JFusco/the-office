import { activeEffectId, harnessEffect } from '../harness/effect';
import { readRepo } from '../intake/dependabot/qualify';
import { commentAuthor } from '../parking/park-comment';
import { savedAuthor } from '../../github/identity/office-authors';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { EffectIntent, TicketJob } from '../../../src/shared';

/** One Office comment, bound to its conversation (an issue or a PR), the marker it starts with and its complete body. */
export interface ProofComment { number: number; kind: 'issue' | 'pull'; marker: string; body: string }
export interface CommentReceipt { id: number; url: string }
type CommentIntent = EffectIntent<{ number: number; marker: string; author?: string; body?: string }>;

const conversation = (store: Store, c: ProofComment) => `https://github.com/${store.project.repository}/${c.kind === 'pull' ? 'pull' : 'issues'}/${c.number}`;
const commentId = (id: unknown): id is number => typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
const exact = (store: Store, c: ProofComment, author: string, found: any) => commentId(found?.id) &&
    found.html_url === `${conversation(store, c)}#issuecomment-${found.id}` && found.issue_url === `https://api.github.com/repos/${store.project.repository}/issues/${c.number}` &&
    found.user?.login === author && found.body === c.body;

function matchesProofComment(store: Store, c: ProofComment, intent: Readonly<EffectIntent>): boolean {
    const payload = intent.payload as CommentIntent['payload'];
    return intent.operation === 'github-issue-comment' && intent.target === conversation(store, c) && payload?.number === c.number &&
        payload.marker === c.marker && (payload.body === undefined || payload.body === c.body);
}

/** After a lost response: the one comment across every page of the intended conversation that starts with the marker and is exactly this comment. */
async function findProofComment(store: Store, execute: Execute, c: ProofComment, author: string): Promise<CommentReceipt | null> {
    const comments = await readRepo(store, execute, `issues/${c.number}/comments?per_page=100`, true);
    const marked = comments.filter((item: any) => typeof item?.body === 'string' && item.body.startsWith(c.marker));
    if (!marked.length) return null;
    if (marked.length > 1 || !exact(store, c, author, marked[0])) throw new Error(`The comment marked ${c.marker} on ${conversation(store, c)} is not the Office's exact comment; it needs reconciliation`);
    return { id: marked[0].id, url: marked[0].html_url };
}

async function readCommentId(store: Store, execute: Execute, c: ProofComment, author: string, receipt: unknown): Promise<CommentReceipt | null> {
    const saved = receipt as CommentReceipt;
    if (!commentId(saved?.id) || saved.url !== `${conversation(store, c)}#issuecomment-${saved.id}`) return null;
    const found = await readRepo(store, execute, `issues/comments/${saved.id}`);
    return found?.id === saved.id && exact(store, c, author, found) ? saved : null;
}

/** A known POST receipt is tied to its exact ID. A lost response can only be recovered by a unique exact marker. */
export async function readProofComment(store: Store, execute: Execute, c: ProofComment, sent: Readonly<EffectIntent>): Promise<CommentReceipt | null> {
    if (!matchesProofComment(store, c, sent)) return null;
    const author = (sent.payload as CommentIntent['payload']).author ?? savedAuthor(sent);
    return sent.receipt == null ? findProofComment(store, execute, c, author) : readCommentId(store, execute, c, author, sent.receipt);
}

/** Posts the comment once; the returned ID is read back on its conversation with its author and complete body. */
export async function postProofComment(store: Store, execute: Execute, job: TicketJob, key: string, c: ProofComment, guard: () => void | Promise<void>): Promise<CommentReceipt> {
    const id = activeEffectId(store, `harness:${job.id}:${key}`), prior = store.getEffect<CommentIntent['payload']>(id);
    const author = commentAuthor(store, id);
    if (prior && (!matchesProofComment(store, c, prior) || prior.payload.author !== undefined && prior.payload.author !== author))
        throw new Error('The saved proof comment or its author changed before dispatch');
    return harnessEffect(store, job, { key, operation: 'github-issue-comment', target: conversation(store, c),
        payload: prior?.payload ?? { number: c.number, marker: c.marker, body: c.body, author }, guard,
        dispatch: async () => {
            const posted = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/issues/${c.number}/comments`, '--method', 'POST', '-f', `body=${c.body}`], { cwd: store.project.repo, timeout: 60000 }));
            if (!commentId(posted?.id)) throw new Error(`The comment on ${conversation(store, c)} returned no valid ID`);
            return { id: posted.id, url: `${conversation(store, c)}#issuecomment-${posted.id}` };
        },
        verify: async receipt => !!await readCommentId(store, execute, c, author, receipt),
        readBack: () => readProofComment(store, execute, c, store.getEffect<CommentIntent['payload']>(id)!) });
}
