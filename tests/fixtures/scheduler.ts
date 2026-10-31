import { systemClock } from '../../server/clock';
import { Scheduler } from '../../server/scheduler';
import { officeCapacity } from '../../server/projects';
import type { Offices } from '../../server/offices';
import type { Engine } from '../../server/engine';
import type { GitHubMaintenance } from '../../server/maintenance';
export function initializeLanes(office: Offices) { office.operationsCapacity = officeCapacity(); office.operationsScheduler = new Scheduler(office.operationsCapacity, systemClock, 'operations'); office.ctoCapacity = officeCapacity(); office.itCapacity = officeCapacity(); office.scheduler = new Scheduler(office.capacity); office.ctoScheduler = new Scheduler(office.ctoCapacity, systemClock, 'cto'); office.itScheduler = new Scheduler(office.itCapacity, systemClock, 'it'); office.control = { summaries: () => [] } as any; office.dailyCTO = { pending: () => undefined } as any; office.serviceInstanceId = crypto.randomUUID(); office.snapshotSequence = 0; }
export async function drainStages(engine: Engine, key: string) {
    engine.jira.qaComment = async (ticket, stage, attempt, result) => { result.receipts.push({ id: attempt, action: 'jira-comment', target: ticket.key, verified: true, uncertain: false, detail: `Synthetic harness ${stage} comment fixture` }); };
    for (let i = 0; i < 60; i++) {
        const ticket = engine.store.ticket(key);
        if (i > 0 && ticket.activity === 'blocked' || ticket.stage === 'complete' || ticket.stage === 'ci' || ticket.stage === 'ready-for-staging' && ticket.results['ready-for-staging'])
            return;
        await engine.run(key);
    }
    throw new Error('Fixture exceeded stage limit');
}
export async function drainMaintenance(maintenance: GitHubMaintenance) {
    for (let i = 0; i < 100; i++) {
        await maintenance.pump();
        if (!maintenance.store.state.maintenance?.runs.some(run => run.status === 'queued'))
            return;
    }
    throw new Error('Fixture exceeded maintenance stage limit');
}
