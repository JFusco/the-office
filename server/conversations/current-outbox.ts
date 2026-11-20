import type { HumanAction, OfficeSnapshot } from '../../src/shared';
import { freezeReads } from '../incidents/repair/freeze-reads';
import type { Store } from '../store/store';
import { projectOutbox } from './outbox';

/**
 * A project's outbox as it reads now, for every place it is saved or served. One sampled time
 * decides both whether a repair wait is still in effect and what the project's prerequisites
 * read as, and the project's current writes are read from its own store. `state` is given when
 * the caller serves a scoped copy of the project's state.
 */
export function currentOutbox(store: Pick<Store, 'db' | 'project' | 'state' | 'clock'>, state: OfficeSnapshot = store.state): HumanAction[] {
    const at = store.clock.now();
    return projectOutbox(state, at, freezeReads(store, at));
}
