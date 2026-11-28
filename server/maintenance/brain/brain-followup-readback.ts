import { reconcileGitHubWrite } from '../../github/identity/write-boundary';
import { savedAuthor } from '../../github/identity/office-authors';
import { readRepo } from '../../delivery/intake/dependabot/qualify';
import { cardStatus, projectCards, statusField } from '../../delivery/board/project-graphql';
import { assertFollowupReadbackAuthority } from '../publication/reconcile-authority';
import { allIssues, type GitHubIssue } from '../publication/issue-search';
import { settlingIssue, type CreatePayload } from '../publication/create-issue';
import { runEffects, unsettled } from '../publication/reconcile-publication';
import { routedRepairMismatch } from './brain-repair-issue';
import type { command } from '../../workers/process';
import type { Store } from '../../store/store';
import type { EffectIntent, MaintenanceRun } from '../../../src/shared';

type Execute = typeof command;
type Board = () => Promise<{ error?: string; items: { repository: string; number: number; status: string }[] } | null | undefined>;

/** A stopped follow-up the outbox or IT may queue a read-back for: versioned, on a reconciled parent. */
export const stoppedVersionedFollowup = (run: MaintenanceRun | undefined) =>
    !!run && run.status === 'reconciled' && run.blockerFollowup?.publicationVersion === 1 && ['blocked', 'interrupted'].includes(run.blockerFollowup.status);

/**
 * The follow-up's attempted writes: its own maintenance-kind Effects, and an older delivery-kind card Effect only when
 * it is bound to this follow-up (`harness:<run>:card...` from the shared pickup-card helper).
 */
export function followupEffects(store: Store, run: MaintenanceRun): EffectIntent[] {
    const own = runEffects(store, run.id);
    const prefix = `harness:${run.id}:card`;
    const legacy = (store.db.prepare('SELECT body FROM effects WHERE substr(id,1,?)=?').all(prefix.length, prefix) as { body: string }[])
        .map(row => JSON.parse(row.body) as EffectIntent).filter(intent => intent.work.kind === 'delivery' && intent.work.id === run.id && ['github-project-add', 'github-project-status'].includes(intent.operation));
    return [...own, ...legacy];
}

async function readBack(store: Store, execute: Execute, intent: Readonly<EffectIntent>): Promise<{ verified: boolean; receipt: unknown }> {
    const payload = intent.payload as Record<string, any>;
    if (intent.operation === 'github-issue-create') {
        const issue = settlingIssue(store, await allIssues(store, execute), payload as CreatePayload, savedAuthor(intent), intent.receipt);
        return { verified: !!issue, receipt: issue };
    }
    if (intent.operation === 'github-issue-assign') {
        const issue = await readRepo(store, execute, `issues/${Number(intent.target.split('/').at(-1))}`) as GitHubIssue, now = issue.assignees.map(owner => owner.login);
        const ok = issue.html_url === intent.target && [...payload.add, ...payload.keep].every((login: string) => now.includes(login));
        return { verified: ok, receipt: ok ? { assignees: now.sort() } : null };
    }
    const field = await statusField(store, execute);
    if (intent.operation === 'github-project-add') {
        const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: payload.issue }]);
        return { verified: intent.target === `${field.projectId}:issue-${payload.issue}` && cards.length === 1, receipt: cards[0] ?? null };
    }
    if (intent.operation === 'github-project-status') {
        // A bound status write settles only against the project, field, option and item IDs it saved, never a
        // replacement with the same display name. An older write that saved only the lane keeps its name-based read.
        if (payload.project !== undefined || payload.field !== undefined || payload.option !== undefined) {
            const same = field.projectId === payload.project && field.fieldId === payload.field && field.options.some(option => option.id === payload.option) && intent.target === payload.item;
            return { verified: same && await cardStatus(store, execute, intent.target, payload.field) === payload.option, receipt: { lane: payload.lane } };
        }
        const options = field.options.filter(option => option.name === payload.lane);
        return { verified: options.length === 1 && await cardStatus(store, execute, intent.target, field.fieldId) === options[0].id, receipt: { lane: payload.lane } };
    }
    return { verified: false, receipt: null };
}

/** Whether a diagnosis worker of this run ever started a process: a refused launch never did. */
const diagnosisSpawned = (store: Store, run: MaintenanceRun) => (store.state.workLog || []).some(work => work.requestId === run.id && work.stage === 'maintenance-blocker' && !!work.processId);

/**
 * The read-back a `reconcile-maintenance` request runs for a stopped versioned Brain follow-up (#612, FIND-008):
 * bound to its running request for this project and run, rechecked against the persisted claim on entry, after
 * each provider read before its settlement is saved, and after the final board read before the follow-up is
 * updated (`reconcile-authority.ts`), it settles every attempted issue, assignment and card write under its saved
 * writer and sends nothing. It completes the follow-up only on the final issue and pickup verification; with an
 * approved phase still unsent it queues the follow-up so its continuation sends only that phase. A diagnosis whose
 * launch was refused before any worker started is queued to run once; a diagnosis worker that ran without a saved
 * diagnosis, a saved blocked decision or a remaining unsettled write keeps it stopped. A stale duplicate returns
 * the current state.
 */
export async function readBackFollowup(store: Store, execute: Execute, run: MaintenanceRun, board: Board): Promise<MaintenanceRun> {
    const followup = run.blockerFollowup!;
    if (!stoppedVersionedFollowup(run)) return run;
    const authorize = () => assertFollowupReadbackAuthority(store, run.id);
    authorize();
    const remaining: string[] = [];
    for (const intent of followupEffects(store, run).filter(unsettled)) {
        if (!await reconcileGitHubWrite(store, intent.id, async saved => { const read = await readBack(store, execute, saved); authorize(); return read; })) remaining.push(`${intent.operation} ${intent.target}`);
    }
    const issue = followup.routing?.issue;
    const mismatch = !remaining.length && followup.diagnosis && followup.diagnosis.decision !== 'blocked' && issue
        ? await routedRepairMismatch(store, execute, run, board, followup.routing?.card?.lane || store.state.coordination?.pickup?.status || 'Ready')
        : undefined;
    authorize();
    const at = store.clock.now().toISOString();
    if (remaining.length) {
        followup.detail = `Repair routing read-back is incomplete: ${remaining.join('; ')}. Nothing was resent.`;
        store.emit('maintenance-blocker-followup', followup.detail, 'pm');
    } else if (!followup.diagnosis && !diagnosisSpawned(store, run)) {
        // The launch was refused before any worker started (for example, no qualification record yet): nothing ran, so the diagnosis runs once.
        followup.status = 'queued';
        followup.detail = 'The read-only diagnosis never started (its launch was refused before any worker ran); the follow-up is queued to run it once.';
        store.emit('maintenance-blocker-queued', followup.detail, 'pm');
    } else if (!followup.diagnosis) {
        followup.detail = 'The follow-up has no persisted diagnosis; read back its original worker session before routing again.';
    } else if (followup.diagnosis.decision === 'blocked') {
        // A blocked decision has no approved phase to continue: it stays stopped, with its reason, until a person decides anew.
        followup.detail = `The saved diagnosis is blocked: ${followup.diagnosis.summary || 'a decision is needed'}. It stays stopped until a person makes a new decision; nothing was queued.`;
    } else if (followup.routing?.issue && !mismatch) {
        followup.issue = followup.routing.issue.number;
        followup.routing.verifiedAt = at;
        followup.status = 'completed';
        followup.detail = `Source blocker routing read back: GH-${followup.issue} is assigned in the pickup lane. Nightly refresh is still incomplete; its gate and failures are preserved.`;
        store.emit('maintenance-blocker-routed', followup.detail, 'pm');
    } else if (followup.routing?.issue && followup.routing.assigned && followup.routing.card) {
        followup.detail = `Routing for GH-${followup.routing.issue.number} is already recorded. ${mismatch}. The follow-up remains stopped.`;
        store.emit('maintenance-blocker-followup', followup.detail, 'pm');
    } else {
        // Every attempted write is settled. Continue only when a routing phase is still missing.
        followup.status = 'queued';
        followup.detail = 'Attempted routing writes are settled by read-back; the follow-up continues with its unsent phase only.';
        store.emit('maintenance-blocker-queued', followup.detail, 'pm');
    }
    store.save();
    return run;
}
