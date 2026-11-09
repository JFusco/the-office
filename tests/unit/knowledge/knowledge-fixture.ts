import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import type { MaintenanceResult, MaintenanceRun, StageResult, TicketJob } from '../../../src/shared';

/** Isolated store with a mutable clock; never touches live data or providers. */
export function knowledgeStore(projectId = 'brain', start = '2026-11-06T15:00:00Z') {
    const root = mkdtempSync(resolve(tmpdir(), 'office-knowledge-'));
    let at = Date.parse(start);
    const clock = { now: () => new Date(at), monotonic: () => 0 };
    const store = new Store(':memory:', projectById(projectId), root, clock);
    store.state.coordination = coordination();
    store.state.coordination.jobs = [];
    return { store, advance: (ms: number) => { at += ms; }, close: () => { store.close(); rmSync(root, { recursive: true, force: true }); } };
}

export function result(stage: string, overrides: Partial<StageResult> = {}): StageResult {
    return { outcome: 'passed', prerequisites: [], approach: null, summary: `${stage} summary`, commit: 'a'.repeat(40), evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '', resolution: null, ...overrides } as StageResult;
}

export function job(overrides: Partial<TicketJob> = {}): TicketJob {
    return { id: crypto.randomUUID(), key: 'GH-12', requestedAt: '2026-11-05T10:00:00Z', status: 'queued', stage: 'implement', detail: 'Working', head: 'b'.repeat(40), worktree: '', branch: '', pr: 0, prUrl: '', steps: [], ...overrides } as TicketJob;
}

export function maintenanceResult(overrides: Partial<MaintenanceResult> = {}): MaintenanceResult {
    return { outcome: 'passed', summary: 'Stage summary', ledger: 'ledger', receipts: [], candidates: [], blocker: '', ...overrides };
}

/** A CMS maintenance run as the store keeps it; status and steps come from the caller. */
export function maintenanceRun(overrides: Partial<MaintenanceRun> = {}): MaintenanceRun {
    return { id: crypto.randomUUID(), requestedAt: '2026-11-06T09:00:00Z', startedAt: '2026-11-06T09:01:00Z', endedAt: '', status: 'queued', weekly: true, stage: 'follow-up', error: '', steps: [], ...overrides };
}

export function learningLesson(id = 'L1', overrides: Partial<import('../../../src/shared').Lesson> = {}): import('../../../src/shared').Lesson {
    return { id, scope: 'project', tier: 'guidance', revision: 1, kind: 'process', statement: `Guidance ${id}`, detail: '', stages: ['review'], paths: [], status: 'active', evidence: [], sourceRetrospectiveId: 'origin:completed', sourceSubject: { kind: 'job', id: 'origin' }, recurrences: [], createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', ...overrides };
}
export function opportunity(id = 'event:one', overrides: Partial<import('../../../src/shared').LearningOpportunity> = {}): import('../../../src/shared').LearningOpportunity {
    return { id, subject: { kind: 'feature', id: 'feature:with:colons' }, key: 'GH-1', stage: 'feature-research', at: '2026-11-06T15:00:00Z', disposition: 'accepted', summary: 'Accepted discovery', digest: id, evidence: [{ kind: 'learning', ref: id, url: '', detail: 'Verified accepted content' }], origin: 'work', phaseBoundary: true, ...overrides };
}
