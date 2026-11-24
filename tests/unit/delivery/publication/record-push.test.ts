import { afterEach, expect, test } from 'vitest';
import { existsSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
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

function retirementTrace(pid: number, cwd: string, ref: string, remote: string, scenario: string): string {
    const rows = trace(pid, cwd, ref).trim().split('\n').map(line => JSON.parse(line));
    const [start, repo, command, hook, hookExit, exit, settled] = rows;
    const root = start.sid;
    const dash = `${root}/20261111T190501.000000Z-H097376ef-P000156d8`;
    const curl = `${dash}/20261111T190502.000000Z-H097376ef-P000156d9`;
    const dashArgs = ['git', 'remote-https', 'origin', remote];
    const curlArgs = ['git-remote-https', 'origin', scenario === 'wrong-transport-remote' ? 'https://github.com/other/repository.git' : remote];
    const hookRemote = scenario === 'wrong-remote' ? 'https://github.com/other/repository.git' : remote;
    const nested = scenario === 'nested-push' ? ['push', 'origin', ref] : ['commit', '--allow-empty', '-q', '-m', 'chore: fixture'];
    const local = `${root}/hook-child`;
    const extra = scenario === 'extra-transport' ? [
        { event: 'start', sid: `${root}/extra`, argv: ['git-remote-https', 'origin', 'https://github.com/other/repository.git'] },
        { event: 'cmd_name', sid: `${root}/extra`, name: 'remote-curl' },
        { event: 'exit', sid: `${root}/extra`, code: 0 },
    ] : [];
    return [start, repo, command,
        { event: 'child_start', sid: root, child_id: 0, child_class: 'remote-https', use_shell: false, argv: dashArgs },
        { event: 'start', sid: dash, argv: dashArgs }, { event: 'cmd_name', sid: dash, name: '_run_dashed_' },
        { event: 'child_start', sid: dash, child_id: 0, child_class: 'dashed', use_shell: false, argv: curlArgs },
        { event: 'start', sid: curl, argv: curlArgs }, { event: 'cmd_name', sid: curl, name: 'remote-curl' },
        ...extra, { ...hook, argv: ['.husky/_/pre-push', 'origin', hookRemote] },
        { event: 'start', sid: local, argv: ['git', ...nested] }, { event: 'cmd_name', sid: local, name: nested[0] },
        { event: 'exit', sid: local, code: 0 }, hookExit,
        { event: 'exit', sid: curl, code: 0 }, { event: 'child_exit', sid: dash, child_id: 0, pid: 87769, code: 0 },
        { event: 'exit', sid: dash, code: 0 }, { event: 'child_exit', sid: root, child_id: 0, pid: 87768, code: 0 }, exit, settled,
    ].map(row => JSON.stringify(row)).join('\n') + '\n';
}

const originalFailure = 'Error: Original hook failure';

function rejectedPublication(scenario: string) {
    const f = fakeGitHub(), job = f.candidate({ stage: 'draft' }), root = f.artifactRoot(job);
    const { head, branch, worktree } = job;
    const id = `harness:${job.id}:push:${head}`, directory = resolve(root, `push-${head}`);
    f.state.localBranches.add(job.branch);
    let pushes = 0, remoteReads = 0, listings = 0, cleanupStatuses = 0;
    const execute: typeof f.execute = async (program, args, options) => {
        if (program === 'git' && args[0] === 'update-ref' && args[1] === '-d') {
            f.state.calls.push(`${program} ${args.join(' ')}`);
            expect(args.slice(2)).toEqual([`refs/heads/${branch}`, head]);
            f.state.localBranches.delete(branch);
            return '';
        }
        if (program === 'git' && args[0] === 'worktree' && args[1] === 'list') {
            listings++;
            if (scenario === 'late-claim' && listings === 1)
                expect(f.store.claimWork({ projectId: f.store.project.id, kind: 'delivery', id: job.id }, 'competing delivery', job.stage, 'delivery')).toBeTruthy();
            const entry = (path: string, checkedOut: string) => `worktree ${path}\nHEAD ${head}\nbranch refs/heads/${checkedOut}\n\n`;
            const registered = existsSync(worktree) ? entry(realpathSync(worktree), scenario === 'switched-registration' ? 'codex/other' : branch) : '';
            const other = scenario === 'other-checkout' || scenario === 'late-other-checkout' && listings > 1;
            return registered + (other ? entry(resolve(f.repo, 'elsewhere'), branch) : '');
        }
        if (program === 'git' && args[0] === 'status' && args[1] === '--porcelain=v1' && ++cleanupStatuses === 2 && scenario === 'late-deletion')
            return ' D important.txt\n';
        if (program === 'git' && args[0] === 'ls-remote' && ++remoteReads === 3 && scenario === 'late-remote-ref')
            f.state.remote[branch] = head;
        if (program !== 'git' || args[0] !== 'push') return f.execute(program, args, options);
        pushes++;
        options.onSpawn(87767);
        const remote = `https://github.com/${f.store.project.repository}.git`;
        writeFileSync(options.env.GIT_TRACE2_EVENT, retirementTrace(87767, realpathSync(worktree), args[2], remote, scenario));
        options.onLifecycle(diagnostic(87767));
        throw new Error('Original hook failure');
    };
    const publish = () => claimedDelivery(f.store, job, () => publishCandidate(f.store, execute as any, f.delivery.jobs, job, root));
    const fail = async () => {
        await expect(publish()).rejects.toThrow('Original hook failure');
        Object.assign(job, { status: 'blocked', stop: { kind: 'uncertain-effect' } });
    };
    const retire = () => retireBacklogged(f.store, execute as any, f.delivery.jobs, [{ key: job.key, pickupStatus: 'Backlog' }] as any);
    const effect = () => f.store.getEffect(id)!;
    const completionPath = resolve(directory, 'completion.json');
    const completion = () => JSON.parse(readFileSync(completionPath, 'utf8'));
    return { ...f, job, fail, publish, retire, effect, completion, id, directory, completionPath, pushes: () => pushes };
}

test.each([
    'retired', 'changed-artifact', 'nested-push', 'remote-ref', 'late-remote-ref', 'old-pr', 'dirty', 'advanced',
    'competing-effect', 'competing-remote-delete', 'wrong-remote', 'wrong-transport-remote', 'extra-transport',
    'late-deletion', 'switched-registration', 'other-checkout', 'late-claim', 'missing-failure', 'changed-failure',
])('Backlog resolves a rejected draft push conservatively: %s', async scenario => {
    const f = rejectedPublication(scenario), { job } = f;
    await f.fail();
    if (scenario === 'changed-artifact') writeFileSync(resolve(f.directory, 'spawn.json'), '{}');
    if (scenario === 'remote-ref') f.state.remote[job.branch] = job.head;
    if (scenario === 'old-pr') f.state.prs.push({ number: 1, state: 'closed', head: { ref: job.branch }, base: { ref: 'main' } });
    if (scenario === 'dirty') f.state.local.dirty = true;
    if (scenario === 'advanced') f.state.local.head = 'f'.repeat(40);
    if (scenario === 'missing-failure' || scenario === 'changed-failure') {
        const saved = f.completion();
        saved.error = scenario === 'missing-failure' ? undefined : 'Different failure';
        writeFileSync(f.completionPath, JSON.stringify(saved));
    }
    if (scenario === 'competing-effect' || scenario === 'competing-remote-delete') {
        const deleting = scenario === 'competing-remote-delete';
        const key = deleting ? 'remove-remote:codex/another' : `pr-create:${job.head}`;
        f.store.putEffect({ ...f.effect(), id: `harness:${job.id}:${key}`,
            operation: deleting ? 'git-remote-branch-delete' : 'github-pr-create', expectedState: { key } });
    }

    const retired = await f.retire();
    const effect = f.effect();
    expect(f.pushes()).toBe(1);
    expect(effect.error).toBe(originalFailure);
    expect(f.state.calls.some(call => call.startsWith('gh api -X DELETE'))).toBe(false);
    if (scenario === 'retired') {
        expect(retired).toEqual([job.key]);
        expect(job.status).toBe('cancelled');
        expect(existsSync(job.worktree)).toBe(false);
        expect(f.state.localBranches.has(job.branch)).toBe(false);
        expect(effect).toMatchObject({ status: 'rejected', receipt: { kind: 'rejected-draft-push', head: job.head } });
        expect(effect.notLandedAt).toBeUndefined();
        expect(f.completion().error).toBe(originalFailure);
    } else {
        expect(retired).toEqual([]);
        expect(job.status).toBe('blocked');
        expect(existsSync(job.worktree)).toBe(true);
        expect(f.state.localBranches.has(job.branch)).toBe(true);
        expect(f.state.calls.some(call => /git (worktree prune|worktree remove|update-ref -d)/.test(call))).toBe(false);
        const cleanupDeferred = ['late-remote-ref', 'late-deletion', 'switched-registration', 'other-checkout', 'late-claim'].includes(scenario);
        expect(effect.status).toBe(cleanupDeferred ? 'rejected' : 'uncertain');
    }
});

test.each(['closed-head-pr', 'closed-base-pr', 'changed-capture', 'changed-head', 'cleared'])('a second Backlog poll revalidates a settled rejection: %s', async scenario => {
    const f = rejectedPublication('late-remote-ref'), { job } = f;
    await f.fail();
    const before = f.effect();
    expect(await f.retire()).toEqual([]);
    const rejected = f.effect();
    expect(rejected).toMatchObject({ status: 'rejected', dispatchedAt: before.dispatchedAt, error: before.error,
        receipt: { kind: 'rejected-draft-push', head: job.head, branch: job.branch, worktree: job.worktree } });
    expect(f.completion().error).toBe(before.error);

    if (scenario !== 'changed-head') delete f.state.remote[job.branch];
    if (scenario === 'closed-head-pr') f.state.prs.push({ number: 1, state: 'closed', head: { ref: job.branch }, base: { ref: 'main' } });
    if (scenario === 'closed-base-pr') f.state.prs.push({ number: 1, state: 'closed', head: { ref: 'other' }, base: { ref: job.branch } });
    if (scenario === 'changed-capture') writeFileSync(f.completionPath, JSON.stringify({ ...f.completion(), meaning: 'Changed capture' }));
    if (scenario === 'changed-head') job.head = 'c'.repeat(40);

    const cleared = scenario === 'cleared';
    expect(await f.retire()).toEqual(cleared ? [job.key] : []);
    expect(job.status).toBe(cleared ? 'cancelled' : 'blocked');
    expect(existsSync(job.worktree)).toBe(!cleared);
    expect(f.state.localBranches.has(job.branch)).toBe(!cleared);
    expect(f.effect()).toEqual(rejected);
    expect(f.pushes()).toBe(1);
    expect(f.state.calls.some(call => call.startsWith('gh api -X DELETE'))).toBe(false);
    if (scenario === 'changed-head') expect(f.state.remote[job.branch]).toBe((rejected.receipt as { head: string }).head);
});

test.each(['retained', 'missing'])('publication cannot resend the terminal rejection with a %s capture', async scenario => {
    const f = rejectedPublication('late-remote-ref');
    await f.fail();
    expect(await f.retire()).toEqual([]);
    const rejected = f.effect();
    expect(rejected.status).toBe('rejected');
    expect(rejected.notLandedAt).toBeUndefined();
    delete f.state.remote[f.job.branch];
    if (scenario === 'missing') rmSync(f.directory, { recursive: true });

    await expect(f.publish()).rejects.toThrow('Original hook failure');
    expect(f.pushes()).toBe(1);
    expect(f.effect()).toEqual(rejected);
    expect(f.store.getEffect(`${f.id}:retry-1`)).toBeUndefined();
    expect(f.state.prs).toHaveLength(0);
});

test('a checkout registered after worktree removal still protects the local branch', async () => {
    const f = rejectedPublication('late-other-checkout'), { job } = f;
    await f.fail();
    expect(await f.retire()).toEqual([]);
    expect(job.status).toBe('blocked');
    expect(existsSync(job.worktree)).toBe(false);
    expect(f.state.localBranches.has(job.branch)).toBe(true);
    expect(f.state.calls.some(call => call.startsWith('git update-ref -d'))).toBe(false);
});
