import { ITSpecialist } from '../../../../server/it/it-specialist';
import { officeCapacity } from '../../../../server/office/projects';
import { scheduledWork } from '../../../../server/scheduling/scheduled-work';
import { Scheduler } from '../../../../server/scheduling/scheduler';
import type { Store } from '../../../../server/store/store';

export function investigationScheduler(store: Store, run: () => Promise<unknown>) {
    const entry = { store, engine: { itAgents: { run }, agents: { active: new Map() } }, coordinator: {} };
    const offices = { entries: new Map([[store.project.id, entry]]) };
    const it = new ITSpecialist(offices as any, { report: async () => ({ services: [], checkedAt: '', context: '' }) } as any);
    const scheduler = new Scheduler(officeCapacity(), store.clock, 'it');
    const pump = () => scheduler.pump([{ store, items: scheduledWork(entry as any, new Map(), store.clock.now(), 'it') }]);
    return { it, pump };
}
