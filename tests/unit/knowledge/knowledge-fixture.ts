import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { coordination } from '../../../server/scheduling/coordination';
import type { StageResult, TicketJob } from '../../../src/shared';

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
