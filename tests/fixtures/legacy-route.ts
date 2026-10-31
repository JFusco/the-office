import { onTestFinished, vi } from 'vitest';
import * as harnessScope from '../../server/delivery/harness/scope';
import type { Store } from '../../server/store/store';

const pinned = new Set<string>();

/**
 * Exercises the model-performed delivery route (still used by legacy-recovery jobs) for one project,
 * now that every GitHub project is hands-off. Other projects keep their real scope. Both functions are
 * pinned because harnessDelivers calls handsOff inside its own module. Restored when the test finishes.
 */
export function pinLegacyRoute(projectId = 'brain') {
    if (!pinned.size) {
        const { handsOff, harnessDelivers } = harnessScope;
        const spies = [
            vi.spyOn(harnessScope, 'handsOff').mockImplementation((store: Pick<Store, 'project'>) => !pinned.has(store.project.id) && handsOff(store)),
            vi.spyOn(harnessScope, 'harnessDelivers').mockImplementation((store, job) => !pinned.has(store.project.id) && harnessDelivers(store, job)),
        ];
        onTestFinished(() => { spies.forEach(spy => spy.mockRestore()); pinned.clear(); });
    }
    pinned.add(projectId);
}
