import { afterEach, expect, test } from 'vitest';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';

afterEach(cleanupFakes);
const at = '2026-11-11T19:05:00.000Z';
const diagnostic = (pid: number) => ({ version: 1, processGroup: pid, providerTerminalObserved: false,
    outcome: 'failed', failureCategory: 'uncertain-effect', probeCount: 1, omittedEvents: 0,
    events: [{ phase: 'spawn', at }, { phase: 'exit', code: 1, signal: null, at },
        { phase: 'close', code: 1, signal: null, at }, { phase: 'probe', state: 'absent', at }, { phase: 'settled', at }], snapshots: [] });
const trace = (pid: number, cwd: string, ref: string) => {
    const sid = `20261111T190500.000000Z-H097376ef-P${pid.toString(16).padStart(8, '0')}`;
    return [{ event: 'start', argv: ['git', 'push', 'origin', ref] }, { event: 'def_repo', worktree: cwd },
        { event: 'cmd_name', name: 'push' }, { event: 'child_start', child_id: 1, child_class: 'hook', hook_name: 'pre-push' },
        { event: 'child_exit', child_id: 1, code: 7 }, { event: 'exit', code: 1 }, { event: 'atexit', code: 1 }]
        .map(event => JSON.stringify({ ...event, sid })).join('\n') + '\n';
};

test('a normal publication retains its native capture without adding another push or changing acceptance', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    await claimedDelivery(f.store, job, () => publishCandidate(f.store, f.execute as any, f.delivery.jobs, job, root));
    const capture = JSON.parse(readFileSync(resolve(root, `push-${job.head}`, 'completion.json'), 'utf8'));
    expect(capture.disposition).toBe('command-completed');
    expect(capture.boundary).toBeUndefined(); // Fake transport supplied no native launch evidence.
    expect(f.state.calls.filter(call => call.startsWith('git push'))).toHaveLength(1);
    expect(f.state.prs).toHaveLength(1);
});

test('native pre-push evidence is bound to the actual launch and settlement but never clears or retries an Effect', async () => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    let pushes = 0;
    const execute = async (program: string, args: string[], options: any) => {
        if (program !== 'git' || args[0] !== 'push') return f.execute(program, args, options);
        pushes++;
        options.onSpawn(87767);
        writeFileSync(options.env.GIT_TRACE2_EVENT, trace(87767, realpathSync(job.worktree), args[2]));
        options.onLifecycle(diagnostic(87767));
        throw new Error('Synthetic original hook failure');
    };
    const invoke = () => claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root));
    await expect(invoke()).rejects.toThrow('Synthetic original hook failure');
    const capture = JSON.parse(readFileSync(resolve(root, `push-${job.head}`, 'completion.json'), 'utf8'));
    expect(capture).toMatchObject({ pid: 87767, disposition: 'command-failed',
        boundary: { refUpdateNotAttempted: true, hookSideEffectsReconciled: false } });
    const effect = f.store.getEffect(`harness:${job.id}:push:${job.head}`)!;
    expect(effect.status).toBe('uncertain');
    expect(effect.error).toContain('Synthetic original hook failure');
    await expect(invoke()).rejects.toThrow('will not be resent');
    expect(pushes).toBe(1);
    expect(f.state.prs).toHaveLength(0);
});

test.each(['missing-launch', 'wrong-launch-pid', 'surviving-helper', 'unknown-settlement', 'missing-trace', 'truncated-lifecycle'])('%s leaves the failure unqualified', async scenario => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    const execute = async (program: string, args: string[], options: any) => {
        if (program !== 'git' || args[0] !== 'push') return f.execute(program, args, options);
        if (scenario !== 'missing-launch') options.onSpawn(scenario === 'wrong-launch-pid' ? 87768 : 87767);
        if (scenario !== 'missing-trace') writeFileSync(options.env.GIT_TRACE2_EVENT, trace(87767, realpathSync(job.worktree), args[2]));
        const lifecycle: any = diagnostic(87767);
        if (scenario === 'surviving-helper') lifecycle.events.splice(3, 0, { phase: 'term', at });
        if (scenario === 'unknown-settlement') lifecycle.events[3].state = 'unknown';
        if (scenario === 'truncated-lifecycle') lifecycle.omittedEvents = 1;
        options.onLifecycle(lifecycle);
        throw new Error('Original failure stays failed');
    };
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow('Original failure stays failed');
    const capture = JSON.parse(readFileSync(resolve(root, `push-${job.head}`, 'completion.json'), 'utf8'));
    expect(capture.boundary).toBeUndefined();
    expect(f.store.getEffect(`harness:${job.id}:push:${job.head}`)!.status).toBe('uncertain');
    expect(f.state.prs).toHaveLength(0);
});

test.each(['spawn.json', 'lifecycle.json'])('changed native %s cannot become a boundary receipt', async file => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    const execute = async (program: string, args: string[], options: any) => {
        if (program !== 'git' || args[0] !== 'push') return f.execute(program, args, options);
        options.onSpawn(87767);
        writeFileSync(options.env.GIT_TRACE2_EVENT, trace(87767, realpathSync(job.worktree), args[2]));
        options.onLifecycle(diagnostic(87767));
        writeFileSync(resolve(dirname(options.env.GIT_TRACE2_EVENT), file), '{}');
        throw new Error('Original hook failure retained');
    };
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow('Original hook failure retained');
    expect(existsSync(resolve(root, `push-${job.head}`, 'completion.json'))).toBe(false);
    const effect = f.store.getEffect(`harness:${job.id}:push:${job.head}`)!;
    expect(effect.status).toBe('uncertain');
    expect(effect.error).toContain('capture identity changed');
});
