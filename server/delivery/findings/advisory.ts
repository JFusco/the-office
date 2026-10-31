import { handsOff } from '../harness/scope';
import type { Store } from '../../store';
import type { Finding } from '../../../src/shared';

/**
 * In hands-off projects a model's outcome decides; open findings on a passed result are advisory.
 * Elsewhere the original finding gate applies unchanged.
 */
export function findingsBlock(store: Pick<Store, 'project'>, findings: Finding[], isBlocking: (finding: Finding) => boolean): boolean {
    return !handsOff(store) && findings.some(isBlocking);
}
