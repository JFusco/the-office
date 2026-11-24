import { Effects } from '../../store/effects';
import { likePrefix } from '../../store/like-prefix';
import { activeEffectId } from '../harness/effect';
import { cardStatus, type Execute } from '../board/project-graphql';
import { assertCommentIntent, commentAuthor, parkCommentBody, parkCommentKey, readParkComment, type ParkComment } from './park-comment';
import type { Store } from '../../store/store';
import type { BoardUpdate, EffectIntent, TicketJob } from '../../../src/shared';

/** A write of the park sent and not yet read back, said plainly, with the provider error its attempt left. */
export interface UnconfirmedWrite { write: string; error: string }
type Intent = EffectIntent<Record<string, unknown>>;
type LanePayload = { project: string; item: string; field: string; option: string };

/** The park's lane operation: the existing `moveLane` identity, keyed to the job's step count when it parked. */
export const parkLaneOperation = (job: Pick<TicketJob, 'id' | 'steps'>) => ({ id: `park:${job.id}:${job.steps.length}` });
const laneBase = (job: TicketJob, item: string) => `harness:${job.id}:${parkLaneOperation(job).id}:lane:${item}`;
const attempted = (intent: Intent) => ['dispatching', 'uncertain'].includes(intent.status);

/** Every saved intent of the park, settled or not, under any attempt id: its decision comment and its card moves. */
export function parkIntents(store: Store, job: TicketJob): Intent[] {
    const comment = `harness:${job.id}:${parkCommentKey(job)}`, lanes = `harness:${job.id}:${parkLaneOperation(job).id}:lane:`;
    return (store.db.prepare("SELECT body FROM effects WHERE id=? OR id LIKE ? ESCAPE '\\' OR id LIKE ? ESCAPE '\\'").all(comment, likePrefix(`${comment}:`), likePrefix(lanes)) as { body: string }[])
        .map(row => JSON.parse(row.body));
}

/** The board updates that are the park's: those after its recorded start, or, for a park saved before it kept one, those of its head and stage since it parked. */
export function parkUpdates(job: TicketJob): BoardUpdate[] {
    const parked = job.parked!, updates = job.boardUpdates || [];
    return parked.metadata ? updates.slice(parked.metadata.boardStart)
        : updates.filter(update => update.stage === 'lead-pr' && update.head === job.head && Date.parse(update.at) >= Date.parse(parked.at));
}

function describe(job: TicketJob, intent: Intent): string {
    if (intent.operation === 'github-issue-comment') return `the decision comment on issue #${job.key.slice(3)}`;
    const item = String(intent.payload?.item || ''), route = job.parked?.metadata?.route;
    return `the move of ${route?.issue === item ? 'the issue card' : route?.prs.includes(item) ? "the pull request's card" : `card ${item}`} to Block`;
}

/** The park's writes sent and not yet read back, from the store alone, each with the provider error its attempt left. */
export function unconfirmedWrites(store: Store, job: TicketJob): UnconfirmedWrite[] {
    const updates = job.boardUpdates || [];
    return parkIntents(store, job).filter(attempted).map(intent => ({ write: describe(job, intent),
        error: intent.error || updates.filter(update => update.item === intent.payload?.item && update.status !== 'verified').at(-1)?.detail || 'no provider response was saved' }));
}

/** Why a pass stops while writes of the park are unread: each write and its error, and that it is read back, never sent again. */
export function unreadStopWords(unread: UnconfirmedWrite[]): string {
    const many = unread.length > 1;
    return `The park's ${unread.map(write => write.write).join(' and ')} ${many ? 'were' : 'was'} sent and ${many ? 'are' : 'is'} still uncertain; ${many ? 'they need' : 'it needs'} read-back: ${unread.map(write => write.error).join('; ')}. The Office reads ${many ? 'them' : 'it'} back against the original request on each pass and never sends ${many ? 'them' : 'it'} again.`;
}

/** The comment a saved comment intent of the park was sent as. A new intent carries its body and author; one saved as `{ marker }` before that is the park's stored words by the Office's account. */
async function intendedComment(store: Store, execute: Execute, job: TicketJob, intent: Intent): Promise<ParkComment> {
    const parked = job.parked!, issue = Number(job.key.slice(3)), marker = parked.marker!, body = parkCommentBody(parked), author = intent.payload?.author;
    if (!parked.metadata) {
        assertCommentIntent(store, job, intent, issue, { marker });
        return { issue, marker, body, author: await commentAuthor(store, execute) };
    }
    if (typeof author !== 'string' || !author) throw new Error(`The saved decision comment intent ${intent.id} names no author; it needs reconciliation`);
    assertCommentIntent(store, job, intent, issue, { marker, issue, body, author });
    return { issue, marker, body, author };
}

/** The saved target of a card-move intent of the park, after checking it is this park's: the job's work, a status write to the target it names, and for a recorded park its route's field and Block lane. */
function lanePayload(store: Store, job: TicketJob, intent: Intent): LanePayload {
    const p = intent.payload as Partial<LanePayload>, route = job.parked?.metadata?.route;
    if (intent.work.projectId !== store.project.id || intent.work.kind !== 'delivery' || intent.work.id !== job.id || intent.attemptId !== job.id || intent.operation !== 'github-project-status' ||
        ![p.project, p.item, p.field, p.option].every(value => typeof value === 'string' && value) || intent.target !== `${p.project}:${p.item}` ||
        route && (p.project !== route.project || p.field !== route.field || p.option !== route.block.id))
        throw new Error(`The saved card move intent ${intent.id} is not this park's; it needs reconciliation`);
    return p as LanePayload;
}

/** Reads one attempted or verified write of the park back against its own saved intent: its receipt when it is observable now, otherwise null. Read-only. */
export async function readParkWrite(store: Store, execute: Execute, job: TicketJob, intent: Intent): Promise<unknown | null> {
    if (intent.operation === 'github-issue-comment') return readParkComment(store, execute, await intendedComment(store, execute, job, intent), intent.receipt);
    const p = lanePayload(store, job, intent);
    return await cardStatus(store, execute, p.item, p.field) === p.option ? { item: p.item, option: p.option } : null;
}

/**
 * Settles each write of the park that was sent and reads back now, its Effect and its board update together, and
 * any of the park's board updates a verified Effect of the same write already proves. Returns the writes still
 * unread. Never sends anything; a failed read throws and leaves every record as it was.
 */
export async function settleParkWrites(store: Store, execute: Execute, job: TicketJob): Promise<UnconfirmedWrite[]> {
    const effects = new Effects(store);
    for (const intent of parkIntents(store, job).filter(attempted)) {
        const receipt = await readParkWrite(store, execute, job, intent);
        if (receipt !== null) await effects.reconcile(intent.id, async () => ({ verified: true, receipt }));
    }
    for (const update of parkUpdates(job).filter(update => update.status !== 'verified')) {
        const intent = store.getEffect<Partial<LanePayload>>(activeEffectId(store, laneBase(job, update.item)));
        const proved = intent?.status === 'verified' && intent.payload.project === update.project && intent.payload.item === update.item && intent.payload.field === update.field && intent.payload.option === update.option;
        if (!proved && await cardStatus(store, execute, update.item, update.field) !== update.option) continue;
        update.status = 'verified';
        update.detail = 'Original board transition verified by read-back; no mutation repeated.';
        store.save();
    }
    return unconfirmedWrites(store, job);
}
