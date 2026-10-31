import { afterEach } from 'vitest';
import { Store } from '../../../../server/store/store';
import { projectById } from '../../../../server/office/projects';
import { CEC } from '../../../../server/office/config';
import type { StageResult, Ticket } from '../../../../src/shared';

const stores: Store[] = [];
afterEach(() => stores.splice(0).forEach(store => store.close()));
export function cecStore() {
    let now = Date.parse('2026-10-31T20:00:00Z');
    const clock = { now: () => new Date(now), monotonic: () => now, advance: (ms: number) => { now += ms; } };
    const store = new Store(':memory:', projectById('cec'), undefined, clock);
    stores.push(store);
    return { store, clock };
}
export function ticket(status = 'In Progress'): Ticket {
    return { key: 'CEC-900', summary: 'Synthetic parking fixture', type: 'Bug', status, statusId: '', assignee: CEC.account, subtask: false, boardMember: true, url: '', updated: '', stage: 'code-review', activity: 'working', blocker: '', runId: 'run-900', attempt: 0, commit: 'a'.repeat(40), branch: 'fixture', worktree: '', previewUrl: '', prId: 9, results: {}, findings: [], evidence: [], pilot: true, observedAt: '' };
}
export function decision(kind: string, extra: Partial<StageResult> = {}): StageResult {
    return { outcome: 'blocked', summary: 'Needs a product decision', blocker: 'Which locale should own the fallback copy?', resolution: { kind: kind as any, findingIds: [], evidenceIds: [] }, commit: 'a'.repeat(40), evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 9, qaRunDir: '', paidRuns: null, ...extra };
}
