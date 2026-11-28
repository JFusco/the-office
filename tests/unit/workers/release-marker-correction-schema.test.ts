import { afterEach, expect, test, vi } from 'vitest';
import { z } from 'zod';
import { Agents, CurrentResultSchema, ReleaseMarkerCorrectionResultSchema, ResultSchema } from '../../../server/workers/agents';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { assertStrictOutputSchema } from '../../../server/workers/structured-output';
import { cleanupFakes, fakeGitHub } from '../delivery/support/fake-github';
afterEach(() => { vi.restoreAllMocks(); cleanupFakes(); });

const base = { outcome: 'passed', prerequisites: [], approach: null, summary: 'Reworded', commit: 'a'.repeat(40), evidence: [], findings: [], receipts: [], previewUrl: '', worktree: '/w', branch: 'b', prId: 0, qaRunDir: '', paidRuns: 0, blocker: '', resolution: null };

test('the messages-only correction is a strict extension of the current result, at most 100 full-SHA proposals', () => {
    assertStrictOutputSchema(z.toJSONSchema(ReleaseMarkerCorrectionResultSchema, { target: 'draft-7' }));
    for (const key of Object.keys(CurrentResultSchema.shape)) expect(ReleaseMarkerCorrectionResultSchema.shape).toHaveProperty(key);
    const message = { sha: 'b'.repeat(40), message: 'docs(readme): reword' };
    expect(ReleaseMarkerCorrectionResultSchema.parse({ ...base, messages: [message] }).messages).toEqual([message]);
    // An empty list parses: whether a passing correction proposed anything is the harness's check.
    expect(ReleaseMarkerCorrectionResultSchema.safeParse({ ...base, messages: [] }).success).toBe(true);
    for (const bad of [[{ sha: 'B'.repeat(40), message: 'x' }], [{ sha: 'b'.repeat(7), message: 'x' }], [{ sha: 'b'.repeat(40), message: '' }], [{ ...message, extra: 1 }], Array(101).fill(message)])
        expect(ReleaseMarkerCorrectionResultSchema.safeParse({ ...base, messages: bad }).success).toBe(false);
    expect(ReleaseMarkerCorrectionResultSchema.safeParse(base).success).toBe(false);
});

test('a saved correction still parses through the retained result union; an ordinary result does not gain messages', () => {
    const saved = { ...base, messages: [{ sha: 'b'.repeat(40), message: 'docs(readme): reword' }] };
    expect(ResultSchema.parse(saved)).toEqual(saved);
    expect(Object.hasOwn(ResultSchema.parse(base), 'messages')).toBe(false);
});

test('a correction is dispatched with its own schema; ordinary fresh workers keep the current one', async () => {
    const f = fakeGitHub(), run = vi.spyOn(WorkerRuntime.prototype, 'run').mockResolvedValue({} as any);
    await new Agents(f.store).run('developer', 'task', ReleaseMarkerCorrectionResultSchema, { readOnly: true, stage: 'github-implement' });
    await new Agents(f.store).run('developer', 'task', ResultSchema as any, { stage: 'github-implement' });
    expect(run.mock.calls[0][2]).toBe(ReleaseMarkerCorrectionResultSchema);
    expect(run.mock.calls[0][1]).toBe('task');
    expect(run.mock.calls[1][2]).toBe(CurrentResultSchema);
});
