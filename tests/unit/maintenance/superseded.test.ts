import { expect, test } from 'vitest';
import { checkpointSuperseded, maintenanceSuperseded } from '../../../server/maintenance/superseded';

const checkpoint = (date: string, status: string) => ({ id: date, date, dueAt: '', requestedAt: '', startedAt: '', endedAt: '', status, runId: '', detail: '' }) as any;
const run = (requestedAt: string, status: string, stage = 'complete') => ({ id: requestedAt, requestedAt, status, stage }) as any;
test('a failed checkpoint is superseded only by a later completed checkpoint', () => {
    const failed = checkpoint('2026-10-30', 'blocked');
    expect(checkpointSuperseded({ coordination: { checkpoints: [failed] } } as any, failed)).toBe(false);
    expect(checkpointSuperseded({ coordination: { checkpoints: [failed, checkpoint('2026-10-31', 'working')] } } as any, failed)).toBe(false);
    expect(checkpointSuperseded({ coordination: { checkpoints: [checkpoint('2026-10-29', 'completed'), failed] } } as any, failed)).toBe(false);
    expect(checkpointSuperseded({ coordination: { checkpoints: [failed, checkpoint('2026-10-31', 'completed')] } } as any, failed)).toBe(true);
});
test('a blocked maintenance run is superseded only by a later run that completed every stage', () => {
    const blocked = run('2026-10-30T19:10:00Z', 'blocked', 'follow-up');
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T19:00:00Z', 'reconciled', 'follow-up')] } } as any, blocked)).toBe(false);
    expect(maintenanceSuperseded({ maintenance: { runs: [run('2026-10-29T19:00:00Z', 'completed'), blocked] } } as any, blocked)).toBe(false);
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T19:00:00Z', 'completed')] } } as any, blocked)).toBe(true);
});
test('Brain clears a blocked run only on a completed nightly; gate skips re-checked nothing', () => {
    const blocked = run('2026-10-30T23:26:00Z', 'blocked', 'brain-maintenance');
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T21:00:00Z', 'completed', 'brain-completed')] } } as any, blocked)).toBe(true);
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T21:00:00Z', 'completed', 'skipped: completed')] } } as any, blocked)).toBe(false);
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T21:00:00Z', 'completed', 'skipped: backoff')] } } as any, blocked)).toBe(false);
    expect(maintenanceSuperseded({ maintenance: { runs: [blocked, run('2026-10-31T21:00:00Z', 'completed', 'skipped: daily-retry-limit')] } } as any, blocked)).toBe(false);
});
