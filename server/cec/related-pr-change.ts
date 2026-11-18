export interface ObservedPR { id: number; title: string; source: string; description: string; [field: string]: unknown }

/** The ticket key as its own token, in any case: CEC-15 is not a mention of CEC-154. */
const mentions = (text: string, key: string) => new RegExp(`(?<![A-Za-z0-9])${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![0-9])`, 'i').test(text);

/** A pull request that could concern the ticket: it names the key, uses the ticket's branch, or is the ticket's own. */
function concerns(pr: ObservedPR, ticket: { key: string; branch?: string; prId?: number }): boolean {
    const branch = ticket.branch?.replace(/^refs\/heads\//, '');
    return pr.id === ticket.prId || !!branch && pr.source === `refs/heads/${branch}` ||
        [pr.title, pr.source, pr.description].some(text => mentions(String(text || ''), ticket.key));
}

/**
 * The pull requests that were added, removed or modified between two complete inventories, split by whether
 * one could concern the ticket. A modified pull request counts as related if either version does, so an edit
 * that adds or removes the key is not missed. The text compared is the sanitised observation the model was
 * shown, so a key on a line the sanitiser redacts is not seen.
 */
export function prChanges(before: readonly ObservedPR[], after: readonly ObservedPR[], ticket: { key: string; branch?: string; prId?: number }): { related: number[]; unrelated: number[] } {
    const earlier = new Map(before.map(pr => [pr.id, pr])), later = new Map(after.map(pr => [pr.id, pr]));
    const related: number[] = [], unrelated: number[] = [];
    for (const id of [...new Set([...earlier.keys(), ...later.keys()])].sort((a, b) => a - b)) {
        const was = earlier.get(id), is = later.get(id);
        if (was && is && JSON.stringify(was) === JSON.stringify(is)) continue;
        ([was, is].some(pr => pr && concerns(pr, ticket)) ? related : unrelated).push(id);
    }
    return { related, unrelated };
}
