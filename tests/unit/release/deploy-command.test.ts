import { afterEach, expect, test } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { writeControllerPin } from '../../../server/release/controller-pin';
import { deployCommand } from '../../../server/release/deploy-command';
import { recordDeployStep, startDeployJournal } from '../../../server/release/deploy-journal';
import { concludeOperation } from '../../../server/release/deploy-outcome';
import { deployPaths, operationPaths } from '../../../server/release/deploy-paths';
import { newOperationId } from '../../../server/release/operation-id';
import { writeDeployStop } from '../../../server/release/deploy-stop';
import { releaseDirectory } from '../../../server/release/release-paths';
import { buildFakeRelease, fakeRunner as runner, printedOutcome as outcome, sampleFacts as facts, type RunnerCall as Call } from './deploy-world';

const PIN = 'c'.repeat(40), NEWER = 'd'.repeat(40), TARGET = 'b'.repeat(40), OP = 'deploy-20261120t030000z-0a0b0c0d';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-launch-')); roots.push(root);
    for (const commit of [PIN, NEWER, TARGET]) buildFakeRelease(root, commit);
    return root;
}

const command = async (root: string, args: string[], answer: (call: Call) => string = () => outcome('deployed')) => {
    const lines: string[] = [], { calls, execute } = runner(call => answer(call));
    const code = await deployCommand(args, { execute, dataRoot: root, log: line => lines.push(line), now: () => new Date('2026-11-20T03:00:00.000Z') });
    return { code, calls, text: lines.join('\n') };
};

test('deploy COMMIT launches the pinned controller, even when the target carries newer controller code', async () => {
    const root = dataRoot();
    writeControllerPin(root, PIN);
    writeFileSync(resolve(releaseDirectory(root, TARGET), 'marker'), 'the target tree is never executed\n');
    const operation = newOperationId('deploy', new Date('2026-11-20T03:00:00.000Z'), () => '00000000').slice(0, -8);
    const { code, calls } = await command(root, [TARGET], call => outcome('deployed', call.args[call.args.indexOf('--operation') + 1]));
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0].cwd).toBe(releaseDirectory(root, PIN));
    expect(calls[0].args.slice(2)).toEqual([resolve(releaseDirectory(root, PIN), 'server/release/controller-entry.ts'), 'deploy', TARGET, '--operation', expect.stringContaining(operation), '--controller', PIN, '--idle-minutes', '5']);
    expect(calls[0].timeout).toBe(35 * 60_000);
});

test('deploy is refused without a pin, under a STOP record, or with a malformed commit or idle wait', async () => {
    const root = dataRoot();
    expect(await command(root, [TARGET])).toMatchObject({ code: 1, calls: [], text: expect.stringContaining('No controller is pinned') });
    writeControllerPin(root, PIN);
    expect(await command(root, ['main'])).toMatchObject({ code: 1, calls: [], text: expect.stringContaining('40-character') });
    expect(await command(root, [TARGET, '--idle-minutes', '0'])).toMatchObject({ code: 1, calls: [] });
    writeDeployStop(root, { operation: OP, step: 'stop', reason: 'bootout unconfirmed', instruction: 'look first' });
    expect(await command(root, [TARGET])).toMatchObject({ code: 1, calls: [], text: expect.stringContaining('bootout unconfirmed') });
    expect(await command(root, ['resume', OP])).toMatchObject({ code: 1, calls: [] });
});

test('resume and end run under the controller the operation recorded, not a newer pin', async () => {
    const root = dataRoot();
    startDeployJournal(root, OP, ['fence', 'stop'], facts(PIN));
    writeControllerPin(root, NEWER);
    const resumed = await command(root, ['resume', OP], () => outcome('deployed'));
    expect(resumed.code).toBe(0);
    expect(resumed.calls[0].cwd).toBe(releaseDirectory(root, PIN));
    expect(resumed.calls[0].args.slice(3)).toEqual(['resume', OP, '--idle-minutes', '5']);
    expect(await command(root, ['resume', 'deploy-20261120t050000z-ffffffff'])).toMatchObject({ code: 1, calls: [], text: expect.stringContaining('no journal') });
    // Ending is allowed while a STOP record stands; it is how a person clears the fence.
    writeDeployStop(root, { operation: OP, step: 'stop', reason: 'x', instruction: 'y' });
    const ended = await command(root, ['end', OP], call => outcome('ended', call.args.at(-1)));
    expect(ended.code).toBe(0);
    expect(ended.calls[0].cwd).toBe(releaseDirectory(root, PIN));
    expect(ended.calls[0].args.slice(3, 5)).toEqual(['end', OP]);
});

test('status reports the pin, STOP record, lock and recent operations from files alone; any outcome but deployed exits non-zero', async () => {
    const root = dataRoot();
    writeControllerPin(root, PIN);
    startDeployJournal(root, OP, ['fence', 'stop'], facts(PIN));
    recordDeployStep(root, OP, 'fence', 'intended');
    mkdirSync(deployPaths(root).directory, { recursive: true });
    const { code, text, calls } = await command(root, ['status']);
    expect(code).toBe(0);
    expect(calls).toEqual([]);
    expect(JSON.parse(text)).toMatchObject({ pin: { commit: PIN }, stop: null, lock: null, operations: [{ operation: OP, kind: 'deploy', last: { step: 'fence', state: 'intended' }, outcome: null }] });
    expect((await command(root, [TARGET], call => outcome('rolled-back', call.args[call.args.indexOf('--operation') + 1]))).code).toBe(1);
    expect((await command(root, [])).code).toBe(0);
});

test('status includes outcomes and launches without journals, and joins records for the same operation', async () => {
    const root = dataRoot(), now = () => new Date('2026-11-20T03:00:00.000Z');
    const refused = 'deploy-20261120t040000z-0a0b0c0d', failed = 'deploy-20261120t050000z-0a0b0c0d';
    startDeployJournal(root, OP, ['fence'], facts(PIN));
    writeFileSync(operationPaths(root, OP).launch, JSON.stringify({ operation: OP, controller: PIN }));
    concludeOperation({ dataRoot: root, now }, { status: 'deployed', operation: OP, step: null, reason: 'serves' });
    concludeOperation({ dataRoot: root, now }, { status: 'refused', operation: refused, step: null, reason: 'target is missing' });
    writeFileSync(operationPaths(root, failed).launch, JSON.stringify({ operation: failed, controller: PIN }));
    writeDeployStop(root, { operation: failed, step: null, reason: 'spawn failed', instruction: 'inspect launch' }, now);
    const { calls, text, code } = await command(root, ['status']);
    expect(code).toBe(0);
    expect(calls).toEqual([]);
    expect(JSON.parse(text).operations).toMatchObject([
        { operation: OP, kind: 'deploy', launch: { operation: OP }, outcome: { status: 'deployed' } },
        { operation: refused, launch: null, outcome: { status: 'refused', reason: 'target is missing' } },
        { operation: failed, launch: { operation: failed, controller: PIN }, outcome: null },
    ]);
});

test('status lists the most recent operations of every kind, newest last', async () => {
    const root = dataRoot(), stamp = (day: number) => `202611${String(day).padStart(2, '0')}t030000z-0a0b0c0d`;
    for (let day = 10; day <= 15; day++) startDeployJournal(root, `deploy-${stamp(day)}`, ['fence'], facts(PIN));
    startDeployJournal(root, `rollback-${stamp(10)}`, ['halt'], { kind: 'rollback', of: `deploy-${stamp(10)}`, reason: 'x', started: true });
    const { text } = await command(root, ['status']);
    expect(JSON.parse(text).operations.map((entry: { operation: string }) => entry.operation)).toEqual([11, 12, 13, 14, 15].map(day => `deploy-${stamp(day)}`));
});
