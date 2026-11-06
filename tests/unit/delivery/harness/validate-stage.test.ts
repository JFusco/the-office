import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { cleanupFakes, fakeGitHub, HEAD } from '../support/fake-github';
import { harnessValidate } from '../../../../server/delivery/harness/validate-stage';
import { withHarnessWork } from '../../../../server/delivery/harness/harness-work';
import { teamReviewedHead } from '../../../../server/delivery/readiness/team-review';
import { CommandFailure } from '../../../../server/workers/process';
import type { StageResult } from '../../../../src/shared';
afterEach(cleanupFakes);

type Verify = (options: any) => Promise<string>;
function setup(options: { validation?: 'independent-checks' | 'browser'; script?: boolean; installed?: boolean } = {}) {
    const f = fakeGitHub();
    const job = f.candidate({ stage: 'validate', status: 'working' });
    job.approach = { ...job.approach!, validation: options.validation ?? 'independent-checks' };
    writeFileSync(resolve(job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@10.33.0', scripts: options.script === false ? {} : { 'verify:ci': 'vitest run' } }));
    if (options.installed !== false) mkdirSync(resolve(job.worktree, 'node_modules'), { recursive: true });
    const root = f.artifactRoot(job), calls: string[] = [], base = f.execute;
    let verify: Verify = async () => 'ok\n';
    f.delivery.execute = (async (program: string, args: string[], opts: any = {}) => {
        if (program === 'pnpm' && args.includes('verify:ci') || program === 'node') { calls.push(`${program} ${args.join(' ')}`); return verify(opts); }
        return base(program, args, opts);
    }) as any;
    return { f, job, root, calls, setVerify: (fn: Verify) => { verify = fn; } };
}
const harnessRecords = (f: ReturnType<typeof fakeGitHub>) => (f.store.state.workLog || []).filter(work => work.stage === 'harness-validate');
const events = (f: ReturnType<typeof fakeGitHub>, kind: string) => f.store.state.events.filter(event => event.kind === kind);

test('a passing check returns a harness validate step with exact-head checks evidence and full transcripts', async () => {
    const { f, job, root, setVerify } = setup();
    setVerify(async options => { options.onSpawn?.(4242); options.onOutput?.('stdout', 'all tests passed\n'); options.onOutput?.('stderr', 'a warning\n'); return 'all tests passed\n'; });
    const result = (await harnessValidate(f.delivery, job, root))!;
    expect(result).toMatchObject({ outcome: 'passed', commit: HEAD, findings: [], resolution: null });
    expect(result.evidence[0]).toMatchObject({ kind: 'checks', commit: HEAD, environment: 'Office harness' });
    expect(result.evidence[0].path.startsWith(root)).toBe(true);
    const dir = readdirSync(root).find(name => name.startsWith('harness-checks-'))!;
    expect(readFileSync(resolve(root, dir, 'verify_ci.stdout.log'), 'utf8')).toBe('all tests passed\n');
    expect(readFileSync(resolve(root, dir, 'verify_ci.stderr.log'), 'utf8')).toBe('a warning\n');
    expect(JSON.parse(readFileSync(resolve(root, dir, 'manifest.json'), 'utf8'))).toMatchObject({ commit: HEAD, runs: [{ name: 'verify:ci', exitCode: 0 }] });
    expect(harnessRecords(f)).toMatchObject([{ role: 'qa', provider: 'harness', effortKind: 'administrative', status: 'completed', processId: 4242, requestId: job.id }]);
    expect(f.engine.agents.active.size).toBe(0);
});

test('repeated runs keep every transcript', async () => {
    const { f, job, root } = setup();
    await harnessValidate(f.delivery, job, root);
    await harnessValidate(f.delivery, job, root);
    expect(readdirSync(root).filter(name => name.startsWith('harness-checks-'))).toHaveLength(2);
});

test('a failing check becomes a named source-repair finding with its evidence', async () => {
    const { f, job, root, setVerify } = setup();
    setVerify(async options => { options.onOutput?.('stderr', 'FAIL test/x.test.ts\n'); throw new CommandFailure('pnpm exited 1: FAIL test/x.test.ts', 'other', true); });
    const result = (await harnessValidate(f.delivery, job, root))!;
    expect(result.outcome).toBe('failed');
    expect(result.findings).toMatchObject([{ id: 'harness-check:verify:ci', status: 'open', actual: expect.stringContaining('exit 1') }]);
    expect(result.resolution).toEqual({ kind: 'source-repair', findingIds: ['harness-check:verify:ci'], evidenceIds: [result.evidence[0].id] });
    const dir = readdirSync(root).find(name => name.startsWith('harness-checks-'))!;
    expect(readFileSync(resolve(root, dir, 'verify_ci.stderr.log'), 'utf8')).toContain('FAIL test/x.test.ts');
});

test('a timeout or spawn failure is infrastructure: Riley validates and no repair budget is spent', async () => {
    const { f, job, root, setVerify } = setup();
    setVerify(async () => { throw new CommandFailure('pnpm read timed out; saved observations retained; safe to retry the read', 'transient-read', true); });
    expect(await harnessValidate(f.delivery, job, root)).toBeNull();
    expect(events(f, 'harness-checks-timeout')).toHaveLength(1);
    setVerify(async () => { throw new Error('spawn pnpm ENOENT'); });
    expect(await harnessValidate(f.delivery, job, root)).toBeNull();
    expect(f.engine.agents.active.size).toBe(0);
});

test('browser validation, disposition-bearing jobs and repositories without a check keep Riley', async () => {
    const browser = setup({ validation: 'browser' });
    expect(await harnessValidate(browser.f.delivery, browser.job, browser.root)).toBeNull();
    const repair = setup();
    repair.job.repairCycle = { pendingFindingIds: ['F1'] } as any;
    expect(await harnessValidate(repair.f.delivery, repair.job, repair.root)).toBeNull();
    const none = setup({ script: false });
    expect(await harnessValidate(none.f.delivery, none.job, none.root)).toBeNull();
    expect([browser, repair, none].every(s => s.calls.length === 0)).toBe(true);
});

test('a changed candidate is refused before running, and a dirtied one after', async () => {
    const moved = setup();
    moved.f.state.local.head = 'e'.repeat(40);
    await expect(harnessValidate(moved.f.delivery, moved.job, moved.root)).rejects.toThrow('changed or is dirty');
    expect(moved.calls).toEqual([]);
    const dirtied = setup();
    dirtied.setVerify(async () => { dirtied.f.state.local.dirty = true; return 'ok'; });
    await expect(harnessValidate(dirtied.f.delivery, dirtied.job, dirtied.root)).rejects.toThrow('changed or dirtied');
});

test('configured checks override the repository convention', async () => {
    const { f, job, root, calls } = setup({ script: false });
    f.store.project.checks = [{ name: 'unit', command: ['node', 'scripts/test.mjs'], timeoutMs: 60000 }];
    const result = (await harnessValidate(f.delivery, job, root))!;
    expect(calls).toEqual(['node scripts/test.mjs']);
    expect(result.summary).toContain('unit');
});

test('missing dependencies are installed first; an install failure hands validation to Riley', async () => {
    const { f, job, root, calls } = setup({ installed: false });
    const base = f.delivery.execute;
    let installs = 0;
    f.delivery.execute = (async (program: string, args: string[], opts: any) => {
        if (program === 'pnpm' && args[0] === '--version') return '10.33.0\n';
        if (program === 'pnpm' && args[0] === 'install') { installs++; throw new Error('registry unavailable'); }
        return (base as any)(program, args, opts);
    }) as any;
    expect(await harnessValidate(f.delivery, job, root)).toBeNull();
    expect(installs).toBe(1);
    expect(calls).toEqual([]);
    expect(events(f, 'harness-checks-skipped')[0].message).toContain('registry unavailable');
    expect(existsSync(resolve(job.worktree, 'node_modules'))).toBe(false);
});

test('Office pause aborts the running check and leaves the job for ordinary interruption handling', async () => {
    const { f, job, root, setVerify } = setup();
    setVerify(options => new Promise((_, reject) => {
        options.onSpawn?.(4343);
        options.signal.addEventListener('abort', () => reject(new CommandFailure('Worker paused; reconcile any external effects before resuming', 'cancelled', true)));
        queueMicrotask(() => f.engine.agents.pause());
    }));
    await expect(harnessValidate(f.delivery, job, root)).rejects.toThrow('Worker paused');
    expect(harnessRecords(f)).toMatchObject([{ status: 'interrupted', processId: 4343 }]);
    expect(f.engine.agents.active.size).toBe(0);
});

test('a passing harness validate advances to draft without a QA model and satisfies team review', async () => {
    const { f, job } = setup();
    const review: StageResult = { outcome: 'passed', summary: 'Reviewed', commit: HEAD, blocker: '', findings: [], receipts: [], evidence: [], worktree: job.worktree, branch: job.branch, prId: 0, previewUrl: '', qaRunDir: '', paidRuns: 0, approach: null, prerequisites: null, resolution: null };
    job.steps.push({ stage: 'review', result: review });
    f.engine.agents.run = (async (role: string) => { throw new Error(`No ${role} model expected`); }) as any;
    await f.delivery.step(job);
    expect(job.detail ?? '').not.toContain('No qa model');
    expect(job.steps.at(-1)).toMatchObject({ stage: 'validate', result: { outcome: 'passed' } });
    expect(job.steps.at(-1)!.workerId).toBeUndefined();
    expect(job.stage).toBe('draft');
    expect(teamReviewedHead(f.store, job)).toBeTruthy();
});

test('a failing harness validate queues a bounded source repair carrying the finding', async () => {
    const { f, job, setVerify } = setup();
    setVerify(async () => { throw new CommandFailure('pnpm exited 1: FAIL', 'other', true); });
    f.engine.agents.run = (async (role: string) => { throw new Error(`No ${role} model expected`); }) as any;
    await f.delivery.step(job);
    expect(job.stage).toBe('update-base');
    expect(job.repairCycle?.pendingFindingIds).toEqual(['harness-check:verify:ci']);
    expect(basename(job.steps.at(-1)!.result.evidence[0].path)).toMatch(/^harness-validate-/);
    rmSync(resolve(job.worktree, 'node_modules'), { recursive: true, force: true });
});

test.each([false, true])('a skipped dependency install keeps Riley even with configured checks=%s', async configured => {
    const { f, job, root, calls } = setup({ installed: false });
    writeFileSync(resolve(job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@9.1.0', scripts: { 'verify:ci': 'vitest run' } }));
    if (configured) f.store.project.checks = [{ name: 'unit', command: ['node', 'scripts/test.mjs'] }];
    const base = f.delivery.execute, installs: string[] = [];
    f.delivery.execute = (async (program: string, args: string[], opts: any) => {
        if (program === 'pnpm' && args[0] === '--version') return '10.33.0\n';
        if (program === 'pnpm' && args[0] === 'install') installs.push('install');
        return base(program, args, opts);
    }) as any;
    expect(await harnessValidate(f.delivery, job, root)).toBeNull();
    expect(calls).toEqual([]);
    expect(installs).toEqual([]);
    expect(events(f, 'harness-checks-skipped')).toHaveLength(1);
    let qaCalls = 0;
    f.engine.agents.run = (async (role: string) => { expect(role).toBe('qa'); qaCalls++; throw new Error('Synthetic QA fallback'); }) as any;
    await f.delivery.step(job);
    expect(qaCalls).toBe(1);
    expect(job.detail).toContain('Synthetic QA fallback');
    expect(job.stage).toBe('validate');
    expect(job.repairCycle).toBeUndefined();
    expect(calls).toEqual([]);
});

test.each(['dirty', 'head'] as const)('a timeout after changing candidate %s fails the fence before QA fallback', async change => {
    const { f, job, root, setVerify } = setup();
    setVerify(async () => {
        if (change === 'dirty') f.state.local.dirty = true;
        else f.state.local.head = 'e'.repeat(40);
        throw new CommandFailure('pnpm read timed out', 'transient-read', true);
    });
    await expect(harnessValidate(f.delivery, job, root)).rejects.toThrow('changed or dirtied');
    Object.assign(f.state.local, { head: HEAD, dirty: false });
    let qaCalls = 0;
    f.engine.agents.run = (async () => { qaCalls++; throw new Error('No QA fallback expected'); }) as any;
    await f.delivery.step(job);
    expect(qaCalls).toBe(0);
    expect(job).toMatchObject({ status: 'blocked', stage: 'validate', detail: expect.stringContaining('changed or dirtied') });
    expect(job.repairCycle).toBeUndefined();
});

test.each(['preflight', 'probe'] as const)('pause during %s interrupts delivery without checks or a QA model', async phase => {
    const { f, job, calls } = setup({ installed: false });
    writeFileSync(resolve(job.worktree, 'package.json'), JSON.stringify({ packageManager: 'pnpm@9.1.0', scripts: { 'verify:ci': 'vitest run' } }));
    const base = f.delivery.execute;
    let installs = 0, qaCalls = 0;
    f.delivery.execute = (async (program: string, args: string[], opts: any) => {
        if (program === 'pnpm' && args[0] === '--version') {
            expect(opts.signal).toBeInstanceOf(AbortSignal);
            f.engine.pause();
            return '10.33.0\n';
        }
        if (program === 'pnpm' && args[0] === 'install') installs++;
        const value = await base(program, args, opts);
        if (phase === 'preflight' && program === 'git' && args[0] === 'status') f.engine.pause();
        return value;
    }) as any;
    f.engine.agents.run = (async () => { qaCalls++; throw new Error('No QA fallback expected'); }) as any;
    await f.delivery.step(job);
    expect(job).toMatchObject({ status: 'interrupted', stage: 'validate' });
    expect(qaCalls).toBe(0);
    expect(installs).toBe(0);
    expect(calls).toEqual([]);
    expect(events(f, 'harness-checks-skipped')).toEqual([]);
    expect(harnessRecords(f)).toMatchObject(phase === 'probe' ? [{ status: 'interrupted' }] : []);
    expect(f.engine.agents.active.size).toBe(0);
});

test('an aborted harness callback returning the fallback sentinel still rejects as interruption', async () => {
    const { f, job } = setup();
    await expect(withHarnessWork(f.delivery, job, 'qa', 'harness-validate', async () => {
        f.engine.pause();
        return null;
    })).rejects.toMatchObject({ category: 'cancelled' });
    expect(harnessRecords(f)).toMatchObject([{ status: 'interrupted' }]);
    expect(f.engine.agents.active.size).toBe(0);
});

test.each([false, true])('the administrative harness record tracks both dependency processes with install failure=%s', async fail => {
    const { f, job, root, calls } = setup({ installed: false });
    const base = f.delivery.execute, snapshots: unknown[] = [];
    f.delivery.execute = (async (program: string, args: string[], opts: any) => {
        if (program === 'pnpm' && ['--version', 'install'].includes(args[0])) {
            const pid = args[0] === '--version' ? 5151 : 5252;
            opts.onSpawn?.(pid);
            await Promise.resolve();
            snapshots.push(structuredClone(harnessRecords(f).at(-1)));
            if (args[0] === '--version') return '10.33.0\n';
            if (fail) throw new Error('registry unavailable');
            mkdirSync(resolve(job.worktree, 'node_modules'), { recursive: true });
            return '';
        }
        return base(program, args, opts);
    }) as any;
    const result = await harnessValidate(f.delivery, job, root);
    expect(snapshots).toMatchObject([
        { status: 'running', provider: 'harness', effortKind: 'administrative', processId: 5151 },
        { status: 'running', provider: 'harness', effortKind: 'administrative', processId: 5252 },
    ]);
    if (fail) { expect(result).toBeNull(); expect(calls).toEqual([]); }
    else expect(result?.outcome).toBe('passed');
    expect(harnessRecords(f)[0].processId).toBe(5252);
});

test('checks with colliding normalized names keep separate complete transcripts', async () => {
    const { f, job, root, setVerify } = setup();
    f.store.project.checks = [
        { name: 'type:check', command: ['node', 'scripts/first.mjs'] },
        { name: 'type_check', command: ['node', 'scripts/second.mjs'] },
    ];
    let execution = 0;
    setVerify(async opts => {
        const ordinal = ++execution;
        for (const stream of ['stdout', 'stderr']) {
            opts.onOutput(stream, `${ordinal} ${stream} first\n`);
            opts.onOutput(stream, `${ordinal} ${stream} last\n`);
        }
        return '';
    });
    expect((await harnessValidate(f.delivery, job, root))?.outcome).toBe('passed');
    const dir = resolve(root, readdirSync(root).find(name => name.startsWith('harness-checks-'))!);
    for (const ordinal of [1, 2])
        for (const stream of ['stdout', 'stderr'])
            expect(readFileSync(resolve(dir, `${ordinal}-type_check.${stream}.log`), 'utf8')).toBe(`${ordinal} ${stream} first\n${ordinal} ${stream} last\n`);
    expect(JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8')).runs.map((run: any) => run.name)).toEqual(['type:check', 'type_check']);
});
