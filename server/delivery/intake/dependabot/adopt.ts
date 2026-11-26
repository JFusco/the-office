import { adoptDependencyBot } from '../dependency-bots/adopt';
import { openDependabotPulls, refusal } from './qualify';
import type { Execute } from '../../board/project-graphql';
import type { PullInventory } from '../shared-pr-inventory';
import type { Store } from '../../../store/store';
import type { PickupPolicy, TicketJob } from '../../../../src/shared';

export function adoptDependabot(store: Store, execute: Execute, jobs: TicketJob[], pickup: PickupPolicy, inventory?: PullInventory) {
    return adoptDependencyBot(store, execute, jobs, pickup, { id: 'dependabot', label: 'Dependabot', openPulls: openDependabotPulls, refusal }, inventory);
}
