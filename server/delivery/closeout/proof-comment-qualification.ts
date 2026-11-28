import type { WriteQualification } from '../../../src/contracts/write-identity';
import { canonicalDigest } from '../../github/identity/route-entry';
import { readRepo } from '../intake/dependabot/qualify';
import type { Execute } from '../board/project-graphql';
import type { Store } from '../../store/store';
import type { CommentReceipt, ProofComment } from './proof-comment';

const conversationUrl = (store: Store, c: ProofComment) => `https://github.com/${store.project.repository}/${c.kind === 'pull' ? 'pull' : 'issues'}/${c.number}`;
/**
 * The one Effect operation whose trial can qualify a comment on this kind of conversation: the issue comment adapter on
 * an issue, and the pull request comment adapter on a pull request. A PR conversation comment saved under the issue
 * comment operation (a harness proof comment) supplies no evidence.
 */
const qualifyingOperation = (c: ProofComment) => c.kind === 'pull' ? 'github-pr-comment' : 'github-issue-comment';
/** GitHub records comment creation times to the second. */
const dispatchSecond = (iso: string) => Math.floor(Date.parse(iso) / 1000) * 1000;

/**
 * A designated App create trial, on an issue or a pull request conversation, must bind an absent marker and retain the POST receipt to attribute the comment
 * to its dispatch. A marker-discovered receipt can settle delivery. Qualification also requires the exact ID read
 * and the complete issue listing to agree on the body, with a unique marker and the bound bot confirmed by ID.
 * An incomplete read throws so the attempted write can be read back again under its saved writer.
 */
export async function proofCommentQualification(store: Store, execute: Execute, c: ProofComment, id: string, receipt: CommentReceipt): Promise<WriteQualification | undefined> {
    const intent = store.getEffect(id), writer = intent?.writer, target = conversationUrl(store, c), operation = qualifyingOperation(c);
    if (!intent || !writer || writer.principal !== 'app' || writer.grant.kind !== 'trial' || writer.botId === undefined) return;
    if (!['dispatching', 'uncertain'].includes(intent.status) || !intent.dispatchedAt || intent.notLandedAt) return;
    if (intent.operation !== operation || intent.target !== target || writer.binding.adapter !== intent.operation || writer.binding.target !== target) return;
    const payload = intent.payload as { number?: unknown; marker?: unknown; body?: unknown };
    if (payload?.number !== c.number || payload.marker !== c.marker || payload.body !== c.body || !c.body.startsWith(c.marker)) return;
    if (!Number.isSafeInteger(receipt?.id) || receipt.id <= 0 || receipt.url !== `${target}#issuecomment-${receipt.id}`) return;
    const saved = intent.receipt as CommentReceipt | null;
    if (writer.binding.beforeDigest !== canonicalDigest(null) || saved?.id !== receipt.id || saved.url !== receipt.url) return;
    const found = await readRepo(store, execute, `issues/comments/${receipt.id}`);
    if (found?.id !== receipt.id || found.html_url !== receipt.url || found.issue_url !== `https://api.github.com/repos/${store.project.repository}/issues/${c.number}` ||
        found.body !== c.body || found.user?.login !== writer.login || found.user?.id !== writer.botId ||
        typeof found.created_at !== 'string' || !(Date.parse(found.created_at) >= dispatchSecond(intent.dispatchedAt))) return;
    const comments = await readRepo(store, execute, `issues/${c.number}/comments?per_page=100`, true);
    if (comments.some((item: any) => typeof item?.body !== 'string'))
        throw new Error('Complete issue comment bodies are required to qualify the proof comment');
    if (!comments.some((item: any) => item.id === receipt.id))
        throw new Error('The issue conversation does not yet show the comment read by its ID');
    const marked = comments.filter((item: any) => item.body.startsWith(c.marker));
    if (marked.length !== 1 || marked[0].id !== receipt.id || marked[0].body !== c.body) return;
    return { record: receipt.url, target, transition: c.kind === 'pull' ? 'pull request comment created' : 'issue comment created', actor: { login: found.user.login, id: found.user.id }, observedAt: store.clock.now().toISOString() };
}
