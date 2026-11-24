import { afterEach, expect, test } from 'vitest';
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { claimedDelivery } from '../../../fixtures/delivery-claim';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
import { publishCandidate } from '../../../../server/delivery/publication/publish-pr';
import { retireBacklogged } from '../../../../server/delivery/parking/retire-backlogged';

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

test.each(['retired', 'changed-artifact', 'nested-push', 'remote-ref', 'late-remote-ref', 'old-pr', 'dirty', 'advanced'])('Backlog resolves a rejected draft push conservatively: %s', async scenario => {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    f.state.localBranches.add(job.branch);
    let pushes = 0, remoteReads = 0;
    const execute: typeof f.execute = async (program, args, options) => {
        if (program === 'git' && args[0] === 'update-ref' && args[1] === '-d') {
            expect(args.slice(2)).toEqual([`refs/heads/${job.branch}`, job.head]);
            f.state.localBranches.delete(job.branch);
            return '';
        }
        if (program === 'git' && args[0] === 'ls-remote' && ++remoteReads === 3 && scenario === 'late-remote-ref')
            f.state.remote[job.branch] = job.head;
        if (program !== 'git' || args[0] !== 'push') return f.execute(program, args, options);
        pushes++;
        options.onSpawn(87767);
        const rows = trace(87767, realpathSync(job.worktree), args[2]).trim().split('\n').map(line => JSON.parse(line));
        rows[3].argv = ['.husky/_/pre-push', 'origin', `https://github.com/${f.store.project.repository}.git`];
        const sid = rows[0].sid + '/hook-child';
        const nested = scenario === 'nested-push' ? ['push', 'origin', args[2]] : ['commit', '--allow-empty', '-q', '-m', 'chore: fixture'];
        rows.splice(4, 0, { event: 'start', sid, argv: ['git', ...nested] }, { event: 'cmd_name', sid, name: nested[0] }, { event: 'exit', sid, code: 0 });
        writeFileSync(options.env.GIT_TRACE2_EVENT, rows.map(row => JSON.stringify(row)).join('\n') + '\n');
        options.onLifecycle(diagnostic(87767));
        throw new Error('Original hook failure');
    };
    await expect(claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root))).rejects.toThrow('Original hook failure');
    Object.assign(job, { status: 'blocked', stop: { kind: 'uncertain-effect' } });
    if (scenario === 'changed-artifact') writeFileSync(resolve(root, `push-${job.head}`, 'spawn.json'), '{}');
    if (scenario === 'remote-ref') f.state.remote[job.branch] = job.head;
    if (scenario === 'old-pr') f.state.prs.push({ number: 1, state: 'closed', head: { ref: job.branch }, base: { ref: 'main' } });
    if (scenario === 'dirty') f.state.local.dirty = true;
    if (scenario === 'advanced') f.state.local.head = 'f'.repeat(40);

    const retired = await retireBacklogged(f.store, execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Backlog' }] as any);
    const effect = f.store.getEffect(`harness:${job.id}:push:${job.head}`);
    expect(pushes).toBe(1);
    expect(f.state.calls.some(call => call.startsWith('gh api -X DELETE'))).toBe(false);
    if (scenario === 'retired') {
        expect(retired).toEqual([job.key]);
        expect(job.status).toBe('cancelled');
        expect(existsSync(job.worktree)).toBe(false);
        expect(f.state.localBranches.has(job.branch)).toBe(false);
        expect(effect).toMatchObject({ status: 'rejected', receipt: { kind: 'rejected-draft-push', head: job.head } });
    } else {
        expect(retired).toEqual([]);
        expect(job.status).toBe('blocked');
        expect(existsSync(job.worktree)).toBe(true);
        expect(effect?.status).toBe(scenario === 'late-remote-ref' ? 'rejected' : 'uncertain');
    }
});
