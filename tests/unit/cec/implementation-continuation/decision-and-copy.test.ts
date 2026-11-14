import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, vi } from 'vitest';
import { fixture } from './fixtures';
import { decideImplementation } from '../../../../server/cec/implementation-continuation/intent';
import { continueImplementation } from '../../../../server/cec/implementation-continuation/continue';
import { copySavedImplementation } from '../../../../server/cec/implementation-continuation/copy';
import { withAssignment } from '../../../../server/workers/assignment-context';
import { implementationWorkerContext } from '../../../../server/cec/implementation-continuation/worker-context';
import { verifyContinuationPreservation } from '../../../../server/cec/implementation-continuation/preservation';
const clear = async () => ({ complete: true, fresh: true, ownership: { status: 'clear' } });
async function approved(f: ReturnType<typeof fixture>) {
    const saved = await f.inspect();
    const input = { workerId: f.work.id, fingerprint: saved.proof.fingerprint, decision: 'continue', acknowledgeUncertainHistory: true, note: 'Keep the accepted plan.' };
    const value = await decideImplementation(f.store, f.t.key, input, clear, async () => saved.proof);
    return { saved, input, request: value.request! };
}
function executor(f: ReturnType<typeof fixture>, failApply = false) {
    return vi.fn(async (program: string, args: string[], opts: any) => {
        if (args[0] === 'ls-remote') return `${f.base}\trefs/heads/staging\n`;
        if (failApply && args[0] === 'apply') throw new Error('Injected source apply failure');
        return execFileSync(program, args, { cwd: opts.cwd, input: opts.input, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
    });
}

test('requires explicit acknowledgment and current ownership; keeping paused saves guidance without a worker', async () => {
    const f = fixture(); try {
        const saved = await f.inspect(), input = { workerId: f.work.id, fingerprint: saved.proof.fingerprint, decision: 'continue', acknowledgeUncertainHistory: false, note: 'Pause for now' };
        await expect(decideImplementation(f.store, f.t.key, input, clear, async () => saved.proof)).rejects.toThrow('explicitly');
        await expect(decideImplementation(f.store, f.t.key, { ...input, acknowledgeUncertainHistory: true }, async () => ({ complete: false, fresh: true }), async () => saved.proof)).rejects.toThrow('ownership');
        await expect(decideImplementation(f.store, f.t.key, { ...input, acknowledgeUncertainHistory: true, fingerprint: '0'.repeat(64) }, clear, async () => saved.proof)).rejects.toThrow('changed');
        expect(await decideImplementation(f.store, f.t.key, { ...input, decision: 'hold' }, clear, async () => saved.proof)).toMatchObject({ held: true });
        expect(f.store.ticket(f.t.key).implementationContinuationHold?.note).toBe('Pause for now');
        expect(f.store.state.deliveryQueue || []).toHaveLength(0); expect(f.store.state.workLog).toHaveLength(1);
    } finally { f.close(); }
});
test('one decision stays bound to its original request even after a blocked outcome', async () => {
    const f = fixture(); try {
        const { input, request } = await approved(f); request.status = 'blocked';
        const value = await decideImplementation(f.store, f.t.key, input, clear, async () => { throw new Error('must not re-inspect or re-enqueue'); });
        expect(value.request?.id).toBe(request.id); expect(value.request?.status).toBe('blocked'); expect(f.store.state.deliveryQueue).toHaveLength(1);
    } finally { f.close(); }
});
test('scheduler consumes once before readback, copies exact source separately, retains history/counters and requires new checks', async () => {
    const f = fixture(); try {
        const { request, saved } = await approved(f), before = JSON.stringify(f.result), privateBytes = readFileSync(resolve(f.worktree, '.env.local'));
        request.status = 'working';
        const claim = f.store.claimWork({ projectId: 'cec', kind: 'delivery', id: request.id }, 'scheduler', request.action)!;
        const execute = executor(f);
        const engine: any = { store: f.store, busy: false, implementationOwnership: clear, jira: { execute }, agents: { readback: vi.fn(async () => {
            expect(request.implementationContinuation?.consumedAt).toBeTruthy();
            expect(execute).not.toHaveBeenCalled();
            return { key: f.t.key, assignee: f.t.assignee, subtask: false, boardMember: true, blocker: '', existingOwner: '', existingPrId: 0, status: f.t.status, statusId: f.t.statusId };
        }) } };
        const io: any = { inspect: () => f.inspect(request.id), idle: async () => {}, copy: copySavedImplementation };
        await expect(continueImplementation(engine, request, io)).rejects.toThrow('scheduler');
        await withAssignment(claim, 'delivery', () => continueImplementation(engine, request, io));
        const target = f.store.ticket(f.t.key), binding = target.implementationContinuation!;
        expect(target.activity).toBe('waiting'); expect(target.worktree).not.toBe(f.worktree);
        expect(target.results.implement).toEqual(JSON.parse(before)); expect(binding.originalResult).toEqual(JSON.parse(before));
        expect(target.attempt).toBe(3); expect(target.repairAttempts).toEqual({ plan: 2 });
        expect(readFileSync(resolve(f.worktree, '.env.local'))).toEqual(privateBytes);
        expect(readFileSync(resolve(target.worktree, 'source.ts'))).toEqual(readFileSync(resolve(f.worktree, 'source.ts')));
        expect(f.store.getEffect(binding.copyEffectId)?.status).toBe('verified');
        await verifyContinuationPreservation(f.store, target);
        const context = implementationWorkerContext(target, 'implement')!;
        expect(context.originalWorkId).toBe(f.work.id); expect(context.prompt).toContain('selected approach');
        expect(implementationWorkerContext(target, 'qa')).toBeUndefined();
        f.git(target.worktree, 'commit', '-qm', 'Synthetic finished draft');
        const commit = f.git(target.worktree, 'rev-parse', 'HEAD'), path = resolve(binding.checksRoot, 'new-checks.txt'); writeFileSync(path, 'new exact-commit checks');
        await verifyContinuationPreservation(f.store, target, { ...f.result, outcome: 'passed', worktree: target.worktree, branch: target.branch, commit, evidence: [{ kind: 'checks', commit, path }] } as any);
        await expect(verifyContinuationPreservation(f.store, target, { ...f.result, outcome: 'passed', worktree: target.worktree, branch: target.branch, commit, evidence: [] })).rejects.toThrow('checks');
        writeFileSync(resolve(f.worktree, 'source.ts'), 'original modified');
        await expect(verifyContinuationPreservation(f.store, target)).rejects.toThrow('Original partial');
        await expect(withAssignment(claim, 'delivery', () => continueImplementation(engine, request, io))).rejects.toThrow('unconsumed');
        expect(engine.agents.readback).toHaveBeenCalledTimes(1); expect(saved.proof.patchSha256).toBe(binding.patchSha256);
    } finally { f.close(); }
});
test('a fresh readback blocker consumes the approved attempt but never creates a source effect or retries', async () => {
    const f = fixture(); try {
        const { request } = await approved(f); request.status = 'working';
        const claim = f.store.claimWork({ projectId: 'cec', kind: 'delivery', id: request.id }, 'scheduler', request.action)!;
        const copy = vi.fn(), readback = vi.fn(async () => ({ blocker: 'Another provider owner appeared' }));
        const engine: any = { store: f.store, implementationOwnership: clear, agents: { readback }, jira: {}, busy: false };
        const io: any = { inspect: () => f.inspect(request.id), idle: async () => {}, copy };
        await expect(withAssignment(claim, 'delivery', () => continueImplementation(engine, request, io))).rejects.toThrow('owner');
        expect(request.implementationContinuation?.consumedAt).toBeTruthy(); expect(copy).not.toHaveBeenCalled(); expect(engine.busy).toBe(false);
        await expect(withAssignment(claim, 'delivery', () => continueImplementation(engine, request, io))).rejects.toThrow('unconsumed');
        expect(readback).toHaveBeenCalledTimes(1); expect(f.t.activity).toBe('blocked');
    } finally { f.close(); }
});
test('a failed fresh source effect remains uncertain, preserves the original and cannot be dispatched twice', async () => {
    const f = fixture(); try {
        const saved = await f.inspect(), id = randomUUID(), execute = executor(f, true), bytes = readFileSync(resolve(f.worktree, 'source.ts'));
        await expect(copySavedImplementation(f.store, id, saved, async () => {}, execute)).rejects.toThrow('Injected');
        expect(f.store.getEffect(`cec-implementation-copy:${id}`)?.status).toBe('uncertain');
        const count = execute.mock.calls.length;
        await expect(copySavedImplementation(f.store, id, saved, async () => {}, execute)).rejects.toThrow('previous continuation');
        expect(execute.mock.calls).toHaveLength(count); expect(readFileSync(resolve(f.worktree, 'source.ts'))).toEqual(bytes);
        expect(f.t.attempt).toBe(3); expect(f.t.implementationContinuation).toBeUndefined();
    } finally { f.close(); }
});
