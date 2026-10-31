import { expect, test, vi } from 'vitest';
import { assertWorkerLane } from '../../server/worker-lanes';
import type { ExecutionLane, Role, WorkClaim } from '../../src/shared';
const assignment = (lane: ExecutionLane, kind: WorkClaim['work']['kind'] = 'conversation') => ({ lane, claim: { lane, work: { projectId: 'brain', kind, id: 'request' } } as WorkClaim });
test.each(['cto', 'it'] as const)('%s cannot take delivery discovery, even when read-only', role => {
    expect(() => assertWorkerLane(role, 'discovery-readback', true, assignment(role, 'reconciliation'))).toThrow();
    expect(() => assertWorkerLane(role, 'github-implement', false, assignment('delivery', 'delivery'))).toThrow();
    expect(() => assertWorkerLane(role, 'conversation', true, assignment('delivery'))).toThrow();
});
test('CTO daily review and human advice retain separate capacity and ticket context', () => {
    expect(() => assertWorkerLane('cto', 'daily-cto', true, assignment('cto', 'daily-cto'))).not.toThrow();
    expect(() => assertWorkerLane('cto', 'conversation', true, assignment('cto'))).not.toThrow();
    expect(() => assertWorkerLane('it', 'conversation', true, assignment('it'))).not.toThrow();
});
test.each(['pm', 'developer', 'lead', 'qa'] as Role[])('%s cannot use leadership capacity', role => {
    expect(() => assertWorkerLane(role, 'conversation', true, assignment('cto'))).toThrow();
    expect(() => assertWorkerLane(role, 'github-review', true, assignment('it'))).toThrow();
    expect(() => assertWorkerLane(role, 'github-review', true, assignment('delivery', 'delivery'))).not.toThrow();
});
test('a mismatched persisted claim and deterministic operations lane cannot launch workers', () => {
    expect(() => assertWorkerLane('lead', 'github-review', true, { ...assignment('delivery'), claim: assignment('cto').claim })).toThrow();
    expect(() => assertWorkerLane('lead', 'conversation', true, assignment('operations'))).toThrow();
});

test('the worker runtime rejects a misrouted CTO delivery call before transport or session creation', async () => {
    const { WorkerRuntime } = await import('../../server/worker-runtime');
    const { Store } = await import('../../server/store');
    const { projectById } = await import('../../server/projects');
    const { z } = await import('zod');
    const { mkdtempSync, rmSync, existsSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { resolve } = await import('node:path');
    const root = mkdtempSync(resolve(tmpdir(), 'office-lane-denial-'));
    const store = new Store(':memory:', projectById('brain'), root);
    let transports = 0;
    try {
        const runtime = new WorkerRuntime(store, (async () => { transports++; return ''; }) as any);
        await expect(runtime.run('cto', 'Misrouted delivery research', z.object({ ok: z.boolean() }).strict(), { stage: 'github-review', readOnly: true, ticket: 'GH-67' })).rejects.toThrow('CTO capacity');
        expect(transports).toBe(0); expect(store.state.workLog).toHaveLength(0); expect(existsSync(resolve(root, 'sessions'))).toBe(false);
    } finally { store.close(); rmSync(root, { recursive: true, force: true }); }
});

test('the active CTO conversation prompt queues ticket implementation and discovery research for Morgan', async () => {
    const { Agents } = await import('../../server/agents');
    const { Store } = await import('../../server/store');
    const { projectById } = await import('../../server/projects');
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { tmpdir } = await import('node:os');
    const { resolve } = await import('node:path');
    const root = mkdtempSync(resolve(tmpdir(), 'office-cto-handoff-'));
    const store = new Store(':memory:', projectById('brain'), root);
    const agents = new Agents(store), run = vi.spyOn(agents, 'run').mockResolvedValue({} as any);
    try {
        await agents.followup('cto', { body: 'Research official documentation for GH-67 implementation', ticket: 'GH-67', requestId: 'human-request', createdAt: '' } as any);
        expect(run).toHaveBeenCalledTimes(1);
        const [role, task, , options] = run.mock.calls[0];
        expect(role).toBe('cto'); expect(options).toMatchObject({ stage: 'conversation', readOnly: true, ticket: 'GH-67' });
        expect(task).toContain('Ticket implementation and discovery research belong to the Delivery Team');
        expect(task).toContain('hand direction to Morgan with notifyRoles=["pm"] and the exact configured handoffProject');
        expect(task).toContain('this queues delivery work');
        expect(task).toContain('read-only human advice, technical discussion and daily assessments');
    } finally { run.mockRestore(); store.close(); rmSync(root, { recursive: true, force: true }); }
});
