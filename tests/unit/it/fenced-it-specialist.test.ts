import { expect, test, vi } from 'vitest';
import { ITSpecialist } from '../../../server/it/it-specialist';

test('a forced IT check does nothing while a deployment holds the fence, and runs once it is released', async () => {
    let fenced = true;
    const report = vi.fn(async () => ({ services: [], checkedAt: '', context: '' }));
    const offices = { entries: new Map(), fenced: () => fenced };
    const it = new ITSpecialist(offices as any, { report } as any);
    await it.tick(new Date('2026-11-19T20:00:00Z'), true);
    expect(report).not.toHaveBeenCalled();
    expect(it.running).toBe(false);
    fenced = false;
    await it.tick(new Date('2026-11-19T20:00:01Z'), true);
    expect(report).toHaveBeenCalledTimes(1);
});
