import { ProjectProgress } from './project-progress';
import { initialManualStart } from './manual-start';
import { harnessParkedCard } from './harness-parked-card';
import { laneWrite, moveCardOnce, type LaneOperation } from './lane-effect';
import { cardStatus, projectCards, setCardStatus, statusField, type Execute, type StatusField } from './project-graphql';
import type { Store } from '../../store/store';
import type { BoardUpdate, TicketJob } from '../../../src/shared';

export type Lane = 'In progress' | 'In review' | 'Done' | 'Block';
/** Lanes the harness may move a card out of; anything else (Backlog, Block, Done) is a human decision. */
const MOVABLE = new Set(['ready', 'in progress', 'in review']);

export function resolveLane(field: StatusField, lane: Lane): { id: string; name: string } {
    const matches = field.options.filter(option => lane === 'Block' ? /^block(ed)?$/i.test(option.name.trim()) : option.name.trim().toLowerCase() === lane.toLowerCase());
    if (matches.length !== 1)
        throw new Error(`Project board needs exactly one "${lane === 'Block' ? 'Block or Blocked' : lane}" Status option; found ${matches.length}`);
    return matches[0];
}

/**
 * Moves the issue card (required) and any existing PR card, with persisted pending attempts and read-back.
 * With `operation`, each actual card move is a harness Effect under that stable identity (`lane-effect.ts`).
 */
export async function moveLane(store: Store, execute: Execute, job: TicketJob, lane: Lane, guard: () => void, prNumber = job.pr, operation?: LaneOperation): Promise<string> {
    if (!store.project.githubProject)
        return '';
    await new ProjectProgress(store, execute).reconcile(job);
    const field = await statusField(store, execute), option = resolveLane(field, lane);
    const issueNumber = Number(job.key.slice(3));
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: issueNumber }, ...(prNumber ? [{ kind: 'PullRequest' as const, number: prNumber }] : [])]);
    if (!cards.some(card => card.kind === 'Issue'))
        throw new Error('Issue has no existing card on its configured board; no card was created');
    for (const card of cards) {
        const current = await cardStatus(store, execute, card.id, field.fieldId);
        const update: BoardUpdate = { stage: job.stage, head: job.head, project: field.projectId, item: card.id, field: field.fieldId, option: option.id, target: option.name, at: new Date().toISOString(), status: 'verified', detail: `${option.name} already verified.` };
        // An operation's write sent earlier is reconciled by reading, even when the card already shows the lane.
        const written = operation && laneWrite(store, job, operation, card.id);
        if (current === option.id && written !== 'unread') { (job.boardUpdates ??= []).push(update); continue; }
        if (written === 'verified')
            throw new Error(`${card.kind} card left ${option.name} after this operation's verified move; the harness will not move it again`);
        const currentName = field.options.find(o => o.id === current)?.name?.trim().toLowerCase() || '';
        // Project automation adds new PR cards in its default lane; that is not a human decision.
        const prDefault = card.kind === 'PullRequest' && (!currentName || currentName === 'backlog');
        const manualStart = card.kind === 'Issue' && currentName === 'backlog' && lane === 'In progress' && initialManualStart(store.project.id, job);
        if (written !== 'unread' && !MOVABLE.has(currentName) && !prDefault && !manualStart && !harnessParkedCard(job, card, current || '', currentName))
            throw new Error(`${card.kind} card is in "${currentName || 'no status'}", a human lane; the harness will not move it to ${option.name}`);
        if (operation) { await moveCardOnce(store, execute, job, card.id, field, option, operation, guard, update); continue; }
        guard();
        update.status = 'pending';
        update.detail = 'Harness board transition started; outcome requires read-back.';
        (job.boardUpdates ??= []).push(update);
        store.save();
        try {
            await setCardStatus(store, execute, field.projectId, card.id, field.fieldId, option.id);
            if (await cardStatus(store, execute, card.id, field.fieldId) !== option.id)
                throw new Error(`${option.name} lane could not be verified`);
            update.status = 'verified';
            update.detail = `${option.name} verified by read-back.`;
        }
        catch (error) {
            update.status = 'uncertain';
            update.detail = String(error);
            store.save();
            throw new Error(`Board transition needs read-back: ${String(error)}`);
        }
    }
    const cached = store.state.github?.board?.items.find(item => item.number === issueNumber && item.repository === store.project.repository);
    if (cached) cached.status = option.name;
    store.emit('board-lane', `${job.key}: ${option.name} verified on the board.`, 'pm', job.key);
    store.save();
    return option.name;
}
