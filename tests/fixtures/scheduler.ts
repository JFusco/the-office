import { OFFICE_PREFERENCE_DEFAULTS } from '../../src/shared';
import { systemClock } from '../../server/office/clock';
import { Scheduler } from '../../server/scheduling/scheduler';
import { officeCapacity } from '../../server/office/projects';
import type { Offices } from '../../server/scheduling/offices';
import type { Engine } from '../../server/scheduling/engine';
import type { GitHubMaintenance } from '../../server/maintenance/maintenance';
import { DatabaseSync } from 'node:sqlite';
import { afterEach } from 'vitest';
import { SourceRegistry } from '../../server/knowledge/sources/registry';
const registries: DatabaseSync[] = [];
afterEach(() => registries.splice(0).forEach(db => db.close()));
export function initializeLanes(office: Offices) { const db = new DatabaseSync(':memory:'); registries.push(db); office.sources = new SourceRegistry(db); office.operationsCapacity = officeCapacity(); office.operationsScheduler = new Scheduler(office.operationsCapacity, systemClock, 'operations'); office.ctoCapacity = officeCapacity(); office.itCapacity = officeCapacity(); office.scheduler = new Scheduler(office.capacity); office.ctoScheduler = new Scheduler(office.ctoCapacity, systemClock, 'cto'); office.itScheduler = new Scheduler(office.itCapacity, systemClock, 'it'); office.knowledgeCapacity = officeCapacity(); /* Harper's lane has its own tests with injected runners; office-level tests must never start a real model. */ office.knowledgeScheduler = { pump: async () => undefined } as unknown as Scheduler; office.control = { summaries: () => [], knowledge: () => ({ proposals: [], lessons: [] }) } as any; office.preferences = { read: () => ({ ...OFFICE_PREFERENCE_DEFAULTS }), subscribe: () => () => { } } as any; office.dailyCTO = { pending: () => undefined } as any; office.serviceInstanceId = crypto.randomUUID(); office.snapshotSequence = 0; }
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
