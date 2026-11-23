import type { HumanAction } from '../shared';

const waitsOnOwner = (item: HumanAction) => !!item.ownerSteps && item.status === 'open';
/** Open items only the owner can clear come first; every other item, a resolved one included, keeps its place. */
export function ownerStepsFirst(items: HumanAction[]): HumanAction[] {
    return [...items.filter(waitsOnOwner), ...items.filter(item => !waitsOnOwner(item))];
}
