import { afterEach, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { Agents, CurrentResultSchema, FreshResultSchema, ResultSchema } from '../../../server/workers/agents';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { RESOLUTION_GUIDANCE, HANDS_OFF_RESOLUTION_GUIDANCE } from '../../../server/delivery/harness/resolution-guidance';
import { cleanupFakes, fakeGitHub } from '../delivery/support/fake-github';
afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });
import { assertStrictOutputSchema } from '../../../server/workers/structured-output';

const base = { outcome: 'blocked', prerequisites: null, approach: null, summary: 'Waiting', commit: '', evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '', branch: '', prId: 0, qaRunDir: '', paidRuns: null, blocker: 'Needs stable 3.1' } as Record<string, unknown>;
const resolution = { kind: 'provider-wait', findingIds: [], evidenceIds: ['e1'] };

test('the worker output schema is strict and carries a nullable release wait', () => {
    assertStrictOutputSchema(z.toJSONSchema(CurrentResultSchema, { target: 'draft-7' }));
    const shape = Object.keys(FreshResultSchema.shape);
    for (const key of shape) expect(CurrentResultSchema.shape).toHaveProperty(key);
    const release = { registry: 'npm', package: '@optimizely/cms-sdk', minimum: '3.1.0' };
    expect(FreshResultSchema.safeParse({ ...base, resolution }).success).toBe(true);
    expect(CurrentResultSchema.safeParse({ ...base, resolution }).success).toBe(false);
    expect(CurrentResultSchema.parse({ ...base, resolution: { ...resolution, release: null } }).resolution?.release).toBeNull();
    expect(CurrentResultSchema.parse({ ...base, resolution: { ...resolution, release } }).resolution?.release).toEqual(release);
    expect(CurrentResultSchema.safeParse({ ...base, resolution: { ...resolution, release: { ...release, minimum: '3.1' } } }).success).toBe(false);
    expect(CurrentResultSchema.safeParse({ ...base, resolution: { ...resolution, release: { ...release, package: 'Bad Name' } } }).success).toBe(false);
});

test('results saved before release waits existed still parse unchanged', () => {
    const saved = { ...base, resolution };
    const parsed = ResultSchema.parse(saved) as any;
    expect(parsed.resolution).toEqual(resolution);
    expect(Object.hasOwn(parsed.resolution, 'release')).toBe(false);
});

test('delivery workers are given the current schema and told how to state a release wait', async () => {
    const f = fakeGitHub();
    const run = vi.spyOn(WorkerRuntime.prototype, 'run').mockResolvedValue({} as any);
    await new Agents(f.store).run('developer', 'task', ResultSchema as any);
    expect(run.mock.calls[0][2]).toBe(CurrentResultSchema);
    for (const guidance of [RESOLUTION_GUIDANCE, HANDS_OFF_RESOLUTION_GUIDANCE]) expect(guidance).toContain("release={registry:'npm',package,minimum}");
});
