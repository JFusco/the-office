import { afterEach, expect, test, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { z } from 'zod';
import { Store } from '../../../server/store/store';
import { projectById } from '../../../server/office/projects';
import { WorkerRuntime } from '../../../server/workers/worker-runtime';
import { DEVELOPER_MODEL } from '../../../server/workers/claude';
import { templateFor } from '../../../server/workers/maintenance-invocation';
import { readerPolicy } from '../../../server/workers/maintenance-launch';
import { currentPin, LaunchQualificationRefusal } from '../../../server/workers/launch-qualification';
import { fakeEnvironment, install, passingRecord, DIGEST } from './qualification/support';
import { CommandFailure } from '../../../server/workers/process';

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach(fn => fn()));
const schema = z.object({ outcome: z.enum(['passed', 'blocked']), summary: z.string() }).strict();

function setup(record = true) {
    const root = mkdtempSync(resolve(tmpdir(), 'office-runtime-maintenance-')), store = new Store(':memory:', projectById('cms-field-vocabulary'), root);
    store.state.paused = false;
    cleanup.push(() => { store.close(); rmSync(root, { recursive: true, force: true }); });
    if (record) install(store.dataRoot, passingRecord(templateFor('claude', { kind: 'reader' }, { officeData: '', home: '' }), ['draft-pr']), 'claude-reader');
    const calls: { program: string; args: string[]; options: any }[] = [];
    const execute = vi.fn(async (program: string, args: string[], options: any) => {
        calls.push({ program, args, options });
        if (options.failure) throw options.failure;
        const session = args[args.indexOf('--session-id') + 1];
        const events = [{ type: 'system', subtype: 'init', session_id: session, model: DEVELOPER_MODEL }, { type: 'assistant', session_id: session, message: { id: 'm', model: DEVELOPER_MODEL, content: [] } },
            { type: 'result', subtype: 'success', is_error: false, session_id: session, structured_output: { outcome: 'passed', summary: 'Draft content' }, modelUsage: { [DEVELOPER_MODEL]: {} }, usage: { input_tokens: 1, output_tokens: 1 } }];
        events.forEach(event => options.onLine?.(JSON.stringify(event)));
        return events.map(event => JSON.stringify(event)).join('\n');
    });
    const runtime = new WorkerRuntime(store, execute as any);
    runtime.qualification = fakeEnvironment();
    const run = () => runtime.run('developer', 'CMS maintenance · draft-pr\nWrite the draft content.', schema, { stage: 'draft-pr', readOnly: true, requestId: 'run-1', maintenance: { policy: readerPolicy(store.project.repo) } });
    return { store, calls, execute, run };
}

test('a qualified launch keeps the logical provider and starts the exact pin with the qualified arguments, for each fresh session', async () => {
    const f = setup();
    await expect(f.run()).resolves.toMatchObject({ outcome: 'passed' });
    await expect(f.run()).resolves.toMatchObject({ outcome: 'passed' });
    expect(f.calls.map(call => [call.program, call.options.executablePath, call.options.cwd])).toEqual([['claude', currentPin('claude').path, f.store.project.repo], ['claude', currentPin('claude').path, f.store.project.repo]]);
    const [first, second] = f.calls.map(call => call.args[call.args.indexOf('--session-id') + 1]);
    expect(first).not.toBe(second);
    expect(f.calls[0].args).toContain('Read,Glob,Grep');
    const input: string = f.calls[0].options.input;
    expect(input).toContain('Your harness-authored assignment is this input');
    expect(input).not.toMatch(/api\/sessions|api\/knowledge\/lookup|per-command approval|COMPLETION CHECKPOINT|TWG commands/);
    const work = f.store.state.workLog!.at(-1)!;
    expect(JSON.parse(readFileSync(resolve(f.store.dataRoot, 'sessions', work.id, 'assignment.json'), 'utf8')).maintenancePolicy).toMatchObject({ id: 'claude-reader', kind: 'reader', cwd: f.store.project.repo });
    expect(JSON.parse(readFileSync(resolve(f.store.dataRoot, 'sessions', work.id, 'maintenance-launch.json'), 'utf8'))).toMatchObject({ policy: 'claude-reader', executable: { sha256: DIGEST } });
});

test('a missing qualification, changed binary or changed argument refuses with zero worker spawns', async () => {
    const missing = setup(false);
    await expect(missing.run()).rejects.toBeInstanceOf(LaunchQualificationRefusal);
    const changed = setup(); changed.store.state.paused = false;
    (changed as any).execute.mockClear();
    const runtime = new WorkerRuntime(changed.store, changed.execute as any); runtime.qualification = fakeEnvironment({ sha256: 'e'.repeat(64) });
    await expect(runtime.run('developer', 'x', schema, { stage: 'draft-pr', readOnly: true, requestId: 'run-1', maintenance: { policy: readerPolicy(changed.store.project.repo) } })).rejects.toThrow(/binary digest changed/);
    const unbound = setup();
    await expect(new WorkerRuntime(unbound.store, unbound.execute as any).run('developer', 'x', schema, { stage: 'proposal-review', readOnly: true, requestId: 'run-1', maintenance: { policy: readerPolicy(unbound.store.project.repo) } }))
        .rejects.toBeInstanceOf(LaunchQualificationRefusal);
    for (const f of [missing, changed, unbound]) expect(f.execute).toHaveBeenCalledTimes(0);
    const work = missing.store.state.workLog!.at(-1)!;
    expect(work.processId).toBeUndefined();
    expect(existsSync(resolve(missing.store.dataRoot, 'sessions', work.id, 'maintenance-launch.json'))).toBe(false);
});

test('native Claude failure detail stays under the logical provider name', async () => {
    const f = setup();
    f.execute.mockImplementationOnce(async () => { throw new CommandFailure('claude exited 1: API overloaded', 'other', true); });
    await expect(f.run()).rejects.toThrow('claude exited 1: API overloaded');
});

test.each([
    ['tools', { tools: ['Read'] }],
    ['filesystem', { filesystem: { readable: ['/different'], writable: [], denied: [] } }],
    ['network', { network: { allowed: ['registry.example.test'] } }],
] as const)('a stale %s qualification refuses before the injected provider can start', async (field, change) => {
    const f = setup(false);
    const record = passingRecord(templateFor('claude', { kind: 'reader' }, { officeData: '', home: '' }), ['draft-pr']);
    install(f.store.dataRoot, { ...record, ...change }, 'claude-reader');
    await expect(f.run()).rejects.toMatchObject({ name: 'LaunchQualificationRefusal', mismatch: expect.stringContaining(field) });
    expect(f.execute).not.toHaveBeenCalled();
    expect(f.store.state.workLog!.at(-1)!.processId).toBeUndefined();
    install(f.store.dataRoot, record, 'claude-reader');
    await expect(f.run()).resolves.toMatchObject({ outcome: 'passed' });
    expect(f.execute).toHaveBeenCalledTimes(1);
});
