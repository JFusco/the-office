import { cardStatus, projectCards, statusField, type Execute } from '../../board/project-graphql';
import type { Store } from '../../../store/store';
import type { OfficeProject } from '../../../../src/shared';

export const AUTO_ADOPT_BOTS = ['pin-courier', 'wiki-sync'] as const;
export type AutoAdoptBot = typeof AUTO_ADOPT_BOTS[number];

/** A project opts a dependency bot into adoption without a person moving each PR's card to the pickup lane. */
export function autoAdopts(project: Pick<OfficeProject, 'autoAdopt'>, bot: string): boolean {
    return (AUTO_ADOPT_BOTS as readonly string[]).includes(bot) && !!project.autoAdopt?.includes(bot as AutoAdoptBot);
}

/** Refusals that only mean "not yet" wait for a later poll in automatic mode; identity and commit refusals still reach Joe. */
const NOT_YET = new Set(['it is a draft', 'it does not target the configured base']);
export const waitsQuietly = (refusal: string) => NOT_YET.has(refusal);

/**
 * Open PRs automatic mode may adopt: those with no board card, or a card still in Backlog or the pickup lane.
 * Source-specific additional lanes may opt in (wiki-sync includes In review). Other lanes stay untouched.
 */
export async function autoAdoptable(store: Store, execute: Execute, pulls: any[], pickupLane: string, additionalLanes: readonly string[] = []): Promise<any[]> {
    if (!pulls.length || !store.project.githubProject) return pulls;
    const field = await statusField(store, execute), open = new Set(['backlog', pickupLane.trim().toLowerCase(), ...additionalLanes.map(lane => lane.trim().toLowerCase())]);
    const cards = await projectCards(store, execute, field.projectId, pulls.map(p => ({ kind: 'PullRequest' as const, number: p.number })));
    const adoptable: any[] = [];
    for (const p of pulls) {
        const card = cards.find(c => c.kind === 'PullRequest' && c.number === p.number);
        const status = card ? await cardStatus(store, execute, card.id, field.fieldId) : undefined;
        const lane = field.options.find(o => o.id === status)?.name.trim().toLowerCase() || '';
        if (!card || !lane || open.has(lane)) adoptable.push(p);
    }
    return adoptable;
}
