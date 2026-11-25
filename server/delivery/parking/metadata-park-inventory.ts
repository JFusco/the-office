import { cardStatus, projectCards, statusField, type Execute, type ProjectCard, type StatusField } from '../board/project-graphql';
import { ParkNeedsRestore, ParkSuperseded } from './metadata-park-freshness';
import type { Store } from '../../store/store';
import type { TicketJob } from '../../../src/shared';
import type { MetadataParkBinding, MetadataParkRoute } from '../../../src/contracts/metadata-park';

/** The park's whole board inventory: the Status field, the issue's and the pull request's cards, and the lane each card reads in. */
export interface ParkInventory { field: StatusField; cards: ProjectCard[]; lanes: Map<string, string | undefined> }

/** Lanes the harness may move a card out of, as `move-lane.ts` has them. */
const MOVABLE = new Set(['ready', 'in progress', 'in review']);

/** Reads the park's whole board inventory and every card's lane, before anything is moved. Read-only; a board that is no longer configured names that. */
export async function readParkInventory(store: Store, execute: Execute, job: TicketJob): Promise<ParkInventory> {
    if (!store.project.githubProject) throw new ParkNeedsRestore('this project has no configured board');
    const field = await statusField(store, execute);
    const cards = await projectCards(store, execute, field.projectId, [{ kind: 'Issue', number: Number(job.key.slice(3)) }, ...(job.pr ? [{ kind: 'PullRequest' as const, number: job.pr }] : [])]);
    const lanes = new Map<string, string | undefined>();
    for (const card of cards) lanes.set(card.id, await cardStatus(store, execute, card.id, field.fieldId));
    return { field, cards, lanes };
}

/** Throws unless the inventory is on the recorded board: its project, Status field and Block lane by id and name, and the recorded issue card. */
export function assertRecordedBoard(binding: MetadataParkBinding, inventory: ParkInventory): void {
    const route = binding.route, issues = inventory.cards.filter(card => card.kind === 'Issue');
    if (inventory.field.projectId !== route.project || inventory.field.fieldId !== route.field || !inventory.field.options.some(option => option.id === route.block.id && option.name === route.block.name))
        throw new ParkNeedsRestore('the board, its Status field or its Block lane changed after the park was recorded');
    if (issues.length !== 1 || issues[0].id !== route.issue) throw new ParkNeedsRestore('the issue card changed after the park was recorded');
}

/**
 * The cards this park has on record in Block: observed there when it read the board, or read there after its own
 * move or a note that the card was already there. Only the park's own board updates count, never one from before it.
 */
export function recordedInBlock(job: TicketJob, binding: MetadataParkBinding): Set<string> {
    const items = new Set([...binding.observed, ...(binding.verified?.items ?? [])]), route = binding.route;
    for (const update of (job.boardUpdates || []).slice(binding.boardStart))
        if (update.status === 'verified' && update.project === route.project && update.field === route.field && update.option === route.block.id) items.add(update.item);
    return items;
}

/** Records each of the park's cards that reads in Block and has no record yet: where it is, not a move by the Office. */
export function observeInBlock(store: Store, job: TicketJob, binding: MetadataParkBinding, inventory: ParkInventory): void {
    const recorded = recordedInBlock(job, binding), seen = inventory.cards.filter(card => inventory.lanes.get(card.id) === binding.route.block.id && !recorded.has(card.id));
    if (!seen.length) return;
    binding.observed.push(...seen.map(card => card.id));
    store.save();
}

/**
 * Throws when a card this park had on record in Block is gone or reads elsewhere now. The issue card taken out
 * supersedes the park; the pull request's card taken out, or a recorded card gone, must be restored.
 */
export function assertRecordedInBlock(job: TicketJob, binding: MetadataParkBinding, inventory: ParkInventory): void {
    for (const item of recordedInBlock(job, binding)) {
        if (inventory.lanes.get(item) === binding.route.block.id) continue;
        const card = inventory.cards.find(card => card.id === item), name = inventory.field.options.find(option => option.id === inventory.lanes.get(item))?.name || 'no lane';
        if (!card) throw new ParkNeedsRestore(`a card this park had in ${binding.route.block.name} is no longer on the board`);
        if (card.kind === 'Issue') throw new ParkSuperseded(`a person moved the issue card from ${binding.route.block.name} to ${name}`);
        throw new ParkNeedsRestore(`the pull request's card was moved from ${binding.route.block.name} to ${name} after the park put it there; move it back to ${binding.route.block.name}`);
    }
}

/** Confirms the identities of all cards with recorded Block proof without requiring them to stay in Block. */
export function assertPresentBlockProof(job: TicketJob, binding: MetadataParkBinding, live: MetadataParkRoute): void {
    const items = new Set([live.issue, ...live.prs]);
    if ([...recordedInBlock(job, binding)].some(item => !items.has(item)))
        throw new ParkNeedsRestore(`a card this park had in ${binding.route.block.name} is no longer on the board`);
}

/** Reads the current lanes of the cards this park previously confirmed in Block. */
export async function assertStillInBlock(store: Store, execute: Execute, job: TicketJob, binding: MetadataParkBinding): Promise<void> {
    for (const item of recordedInBlock(job, binding))
        if (await cardStatus(store, execute, item, binding.route.field) !== binding.route.block.id)
            throw item === binding.route.issue ? new ParkSuperseded(`a person moved the issue card out of ${binding.route.block.name}`)
                : new ParkNeedsRestore(`the pull request's card was moved out of ${binding.route.block.name} after the park put it there; move it back`);
}

/** Throws before any first move when a card reads in a lane the mover would refuse (`move-lane.ts`): a human lane, unless it is a new pull request card's default lane. */
export function assertMovable(binding: MetadataParkBinding, inventory: ParkInventory): void {
    for (const card of inventory.cards) {
        const current = inventory.lanes.get(card.id);
        if (current === binding.route.block.id) continue;
        const name = inventory.field.options.find(option => option.id === current)?.name?.trim().toLowerCase() || '';
        if (MOVABLE.has(name) || card.kind === 'PullRequest' && (!name || name === 'backlog')) continue;
        throw new ParkNeedsRestore(`${card.kind} card is in "${name || 'no status'}", a human lane; the harness will not move it to ${binding.route.block.name}`);
    }
}

/**
 * Before the first POST: reads the whole inventory again and records, durably, that every required card reads in
 * Block: the recorded issue card and every card of the pull request on the board now, a new one included. A
 * recorded card that is gone, a replacement under the same name, or a board without the recorded lane gives no proof.
 */
export async function recordBlockCoverage(store: Store, execute: Execute, job: TicketJob, binding: MetadataParkBinding): Promise<void> {
    const inventory = await readParkInventory(store, execute, job), route = binding.route;
    assertRecordedBoard(binding, inventory);
    assertRecordedInBlock(job, binding, inventory);
    const prs = inventory.cards.filter(card => card.kind === 'PullRequest').map(card => card.id);
    if (route.prs.some(item => !prs.includes(item))) throw new ParkNeedsRestore("a pull request card the park recorded is no longer on the board");
    const items = [route.issue, ...prs], outside = items.filter(item => inventory.lanes.get(item) !== route.block.id);
    if (outside.length) throw new Error(`${outside.length} of the park's cards do not read in ${route.block.name}; its decision comment is not sent`);
    binding.verified = { items, at: store.clock.now().toISOString() };
    store.save();
}
