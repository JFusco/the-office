import type { HumanAction } from '../shared';

/** Items only the owner can clear come first; every other item keeps its place. */
export function ownerStepsFirst(items: HumanAction[]): HumanAction[] {
    return [...items.filter(item => item.ownerSteps), ...items.filter(item => !item.ownerSteps)];
}
