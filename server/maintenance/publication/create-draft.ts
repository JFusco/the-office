import { activeEffectId } from '../../delivery/harness/effect';
import { retryRead } from '../../delivery/harness/read-retry';
import { createdContentSha256 } from '../../delivery/publication/created-content';
import { exactRemoteHead } from '../../delivery/publication/remote-head';
import { dispatchDraftCreate } from '../../delivery/publication/pr-create-dispatch';
import { expectedAuthor } from '../../github/identity/office-authors';
import { digest } from '../../store/readback-evidence';
import { matchingDraft, type DraftExpectation, type VerifiedDraft } from './pr-lookup';
import { MaintenanceStop } from './maintenance-stop';
import { maintenanceEffect, maintenanceEffectBase, type MaintenanceOwner } from './maintenance-effect';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';

type Execute = typeof command;
/** What a create's receipt carries: the head, and the digest of what that invocation published only when its printed URL proves it. */
export interface DraftReceipt { number: number; url: string; head: string; contentSha256?: string }
export interface DraftOutcome { effectId: string; number: number; url: string; adopted: boolean }

/**
 * The receipt a read-back settles an attempted create with: the PR's state, keeping a valid original proof the
 * dispatch already saved (Effects.reconcile replaces the receipt) only while it names this PR and head and the live
 * bytes are the ones it digested.
 */
export function settledReceipt(saved: unknown, found: VerifiedDraft): DraftReceipt {
    const prior = saved as Partial<DraftReceipt> | null, live = digest({ title: found.title, body: found.body });
    const proof = prior && prior.number === found.number && prior.url === found.url && prior.head === found.head && prior.contentSha256 === live ? { contentSha256: live } : {};
    return { number: found.number, url: found.url, head: found.head, ...proof };
}

/**
 * Whether saved draft content is exactly what an attempted create dispatched: its bytes digest to the create's
 * `intendedSha256`, and the target and issue it was bound to are the create's saved `base` and `issue`.
 */
export function originalDraft(intent: { payload: unknown }, draft: { title: string; body: string; target?: string }, issueUrl: string | undefined): boolean {
    const payload = intent.payload as { intendedSha256?: string; base?: string; issue?: string };
    return digest({ title: draft.title, body: draft.body }) === payload.intendedSha256 && (draft.target === undefined || draft.target === payload.base) && !!issueUrl && issueUrl === payload.issue;
}

/**
 * Opens the one draft PR for a maintenance candidate through Effects (#612): the explicit-head `gh pr create
 * --draft` delivery uses, with the approved body on stdin. An attempted create is read back under its saved writer
 * and never resent. With no attempt, every page and state of the branch is read first: one fully verified draft by
 * the expected Office author is adopted and recorded as adopted, anything else stops. An original create records
 * `contentSha256` only when the URL it printed is the draft read back with exactly the approved bytes; a lost
 * response settles with the state alone.
 */
export async function createMaintenanceDraft(store: Store, execute: Execute, owner: MaintenanceOwner, expected: DraftExpectation & { worktree: string }): Promise<DraftOutcome> {
    const key = `pr-create:${expected.head}`, base = maintenanceEffectBase(owner.run.id, owner.subject, key), effectId = activeEffectId(store, base);
    const prior = store.getEffect(effectId), author = expectedAuthor(store, effectId, 'github-pr-create');
    if (!prior || prior.status === 'prepared') {
        const existing = await matchingDraft(store, execute, expected);
        if (existing) {
            if (existing.author !== author) throw new Error(`PR #${existing.number} was not opened by the Office's expected author; reconcile it`);
            return { effectId: '', number: existing.number, url: existing.url, adopted: true };
        }
    }
    // An attempted create is read back against its own saved bytes, base and issue, never the current project target.
    const read = async () => {
        const saved = store.getEffect(effectId);
        if (saved && !originalDraft(saved, { title: expected.title, body: expected.body }, expected.issueUrl)) return null;
        const found = await matchingDraft(store, execute, { ...expected, base: (saved?.payload as { base?: string } | undefined)?.base ?? store.project.target });
        return found && found.author === expectedAuthor(store, effectId, 'github-pr-create') ? found : null;
    };
    const receipt = await maintenanceEffect<DraftReceipt | null>(store, owner, {
        key, operation: 'github-pr-create', target: `${store.project.repository}:${expected.branch}`,
        payload: { head: expected.head, branch: expected.branch, base: store.project.target, issue: expected.issueUrl, intendedSha256: digest({ title: expected.title, body: expected.body }) },
        guard: async () => {
            if (prior?.status === 'verified') return;
            const remote = await exactRemoteHead(execute, { branch: expected.branch, worktree: store.project.repo });
            if (remote !== expected.head)
                throw new MaintenanceStop('authority', `Remote ${expected.branch} is at ${remote || 'no published head'}; draft creation requires the reviewed head ${expected.head}`);
        },
        dispatch: async () => {
            const printed = await dispatchDraftCreate(execute, { repository: store.project.repository, base: store.project.target, branch: expected.branch, title: expected.title, body: expected.body, cwd: expected.worktree });
            const found = await retryRead(read), contentSha256 = found ? createdContentSha256(printed, found, expected) : undefined;
            return found ? { number: found.number, url: found.url, head: found.head, ...(contentSha256 ? { contentSha256 } : {}) } : null;
        },
        verify: async created => !!created && (await read())?.number === created.number,
        readBack: async () => { const found = await read(); return found ? settledReceipt(store.getEffect(activeEffectId(store, base))?.receipt, found) : null; },
    });
    if (!receipt) throw new Error('The created draft could not be read back');
    return { effectId: activeEffectId(store, base), number: receipt.number, url: receipt.url, adopted: false };
}
