import { isNotice } from '../incidents/incident-notices';
import type { HumanAction } from '../../src/shared';

/**
 * A project's outbox as it is served: the office-wide notices once, ahead of the project's own
 * items. A saved copy of a notice in the project's outbox is dropped, so each notice appears
 * exactly once while it holds and not at all once it clears. Only serving uses this; saves and
 * replies keep the project's own projection.
 */
export function servedOutbox(outbox: readonly HumanAction[], notices: readonly HumanAction[]): HumanAction[] {
    return [...notices, ...outbox.filter(item => !isNotice(item.id))];
}
