import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { writeControllerPin } from '../../../server/release/controller-pin';
import { recordDeployStep, startDeployJournal } from '../../../server/release/deploy-journal';
import { concludeOperation, readOutcome } from '../../../server/release/deploy-outcome';
import { createDeployToken } from '../../../server/release/deploy-token';
import { operationPaths } from '../../../server/release/deploy-paths';
import { readDeployStop } from '../../../server/release/deploy-stop';
import { launchController } from '../../../server/release/launch-controller';
import { releaseDirectory } from '../../../server/release/release-paths';
import { buildFakeRelease, fakeRunner as runner, printedOutcome as outcome, sampleFacts as facts } from './deploy-world';

const PIN = 'c'.repeat(40), NEWER = 'd'.repeat(40), TARGET = 'b'.repeat(40), OP = 'deploy-20261120t030000z-0a0b0c0d';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
function dataRoot() {
    const root = mkdtempSync(resolve(tmpdir(), 'office-launch-')); roots.push(root);
    for (const commit of [PIN, NEWER, TARGET]) buildFakeRelease(root, commit);
    return root;
}

test('the controller runs from the pinned tree with the data root in its environment, and the launch is recorded first', async () => {
    const root = dataRoot();
    const { calls, execute } = runner(call => { expect(existsSync(operationPaths(root, OP).launch)).toBe(true); return outcome('deployed'); });
    const result = await launchController({ dataRoot: root, operation: OP, controller: PIN, args: ['deploy', TARGET], timeoutMs: 1000, execute, node: '/usr/local/bin/node' });
    expect(result).toMatchObject({ status: 'deployed', operation: OP });
    const pinned = releaseDirectory(root, PIN);
    expect(calls).toEqual([{ program: '/usr/local/bin/node', args: ['--import', 'tsx', resolve(pinned, 'server/release/controller-entry.ts'), 'deploy', TARGET], cwd: pinned, env: { OFFICE_DATA_ROOT: root }, timeout: 1000 }]);
    expect(JSON.parse(readFileSync(operationPaths(root, OP).launch, 'utf8'))).toMatchObject({ operation: OP, controller: PIN });
    expect(readDeployStop(root)).toBeNull();
});

test.each<[string, () => string | Promise<string>, RegExp]>([
    ['cannot start', () => { throw new Error('node exited 1: Cannot find module'); }, /did not finish.*Cannot find module/],
    ['hangs until its deadline', () => { throw new Error('node timed out; previous action outcome must be reconciled'); }, /did not finish.*timed out/],
    ['exits without an outcome', () => '{"step":"stop","phase":"intended"}\n', /without reporting an outcome/],
])('a controller that %s leaves a STOP record naming the last journaled step', async (_, answer, reason) => {
    const root = dataRoot();
    startDeployJournal(root, OP, ['fence', 'stop'], facts(PIN));
    recordDeployStep(root, OP, 'fence', 'intended'); recordDeployStep(root, OP, 'fence', 'done'); recordDeployStep(root, OP, 'stop', 'intended');
    const { calls, execute } = runner(answer);
    const result = await launchController({ dataRoot: root, operation: OP, controller: PIN, args: ['resume', OP], timeoutMs: 1000, execute });
    expect(result).toMatchObject({ status: 'stopped', step: 'stop' });
    expect(result.reason).toMatch(reason);
    expect(readDeployStop(root)).toMatchObject({ operation: OP, step: 'stop', instruction: expect.stringContaining(`deploy resume ${OP}`) });
    // One launch, never a retry.
    expect(calls).toHaveLength(1);
});

test('a controller that dies before journaling stops with no step, and an earlier STOP record is kept', async () => {
    const root = dataRoot(), { execute } = runner(() => { throw new Error('spawn failed'); });
    expect(await launchController({ dataRoot: root, operation: OP, controller: PIN, args: [], timeoutMs: 1000, execute })).toMatchObject({ status: 'stopped', step: null });
    const first = readDeployStop(root);
    expect(first?.instruction).toContain(operationPaths(root, OP).launch);
    expect(first?.instruction).toContain('pnpm office deploy status');
    expect(first?.instruction).not.toContain('deploy resume');
    const again = await launchController({ dataRoot: root, operation: 'deploy-20261120t040000z-0e0f0a0b', controller: PIN, args: [], timeoutMs: 1000, execute });
    expect(again.reason).toContain(`an earlier STOP for ${OP} stands`);
    expect(readDeployStop(root)).toEqual(first);
});

test('a pinned release that is missing, altered or without a controller runs nothing', async () => {
    const root = dataRoot(), { calls, execute } = runner(() => outcome('deployed'));
    writeFileSync(resolve(releaseDirectory(root, PIN), 'server/index.ts'), 'tampered\n');
    expect(await launchController({ dataRoot: root, operation: OP, controller: PIN, args: [], timeoutMs: 1000, execute })).toMatchObject({ status: 'refused', reason: expect.stringContaining('mismatch') });
    expect(await launchController({ dataRoot: root, operation: OP, controller: 'e'.repeat(40), args: [], timeoutMs: 1000, execute })).toMatchObject({ status: 'refused', reason: expect.stringContaining('missing') });
    expect(calls).toEqual([]);
    expect(readDeployStop(root)).toBeNull();
    expect(existsSync(operationPaths(root, OP).launch)).toBe(false);
    expect(() => writeControllerPin(root, PIN)).toThrow('mismatch');
});

test.each(['node timed out', 'node exited 1'])('an abnormal controller exit (%s) writes STOP and preserves the saved outcome', async message => {
    const root = dataRoot(), token = createDeployToken(root, OP);
    startDeployJournal(root, OP, ['release'], facts(PIN));
    recordDeployStep(root, OP, 'release', 'intended');
    recordDeployStep(root, OP, 'release', 'done');
    const saved = { status: 'deployed' as const, operation: OP, step: null, reason: 'serves' };
    const { execute } = runner(() => {
        concludeOperation({ dataRoot: root, now: () => new Date('2026-11-20T03:00:00.000Z') }, saved);
        throw new Error(message);
    });
    expect(await launchController({ dataRoot: root, operation: OP, controller: PIN, args: ['resume', OP], timeoutMs: 1000, execute }))
        .toMatchObject({ status: 'stopped', operation: OP, step: 'release', reason: expect.stringContaining(message) });
    expect(readOutcome(root, OP)).toEqual(saved);
    expect(readDeployStop(root)).toMatchObject({ operation: OP, step: 'release', instruction: expect.stringContaining(operationPaths(root, OP).outcome) });
    expect(readFileSync(operationPaths(root, OP).token, 'utf8')).toBe(token);
});

test('a zero exit reporting an outcome for another operation requires this operation’s saved result', async () => {
    const root = dataRoot(), { execute } = runner(() => outcome('deployed', 'deploy-20261120t040000z-0e0f0a0b'));
    const launch = { dataRoot: root, operation: OP, controller: PIN, args: ['resume', OP], timeoutMs: 1000, execute };
    const saved = { status: 'deployed' as const, operation: OP, step: null, reason: 'serves' };
    concludeOperation({ dataRoot: root, now: () => new Date('2026-11-20T03:00:00.000Z') }, saved);
    expect(await launchController(launch)).toEqual(saved);
    expect(readDeployStop(root)).toBeNull();
    rmSync(operationPaths(root, OP).outcome);
    expect(await launchController(launch)).toMatchObject({ status: 'stopped', reason: expect.stringContaining('without reporting an outcome') });
    expect(readDeployStop(root)).toMatchObject({ operation: OP });
});

test('a launch interrupted between steps identifies the journaled deployment to resume', async () => {
    const root = dataRoot(), { execute } = runner(() => { throw new Error('killed'); });
    startDeployJournal(root, OP, ['fence', 'stop'], facts(PIN));
    recordDeployStep(root, OP, 'fence', 'intended');
    recordDeployStep(root, OP, 'fence', 'done');
    expect(await launchController({ dataRoot: root, operation: OP, controller: PIN, args: ['deploy', TARGET], timeoutMs: 1000, execute }))
        .toMatchObject({ status: 'stopped', step: 'fence' });
    expect(readDeployStop(root)?.instruction).toContain(`deploy resume ${OP}`);
});

test('a failed end launch names the deployment whose fence needs checking', async () => {
    const root = dataRoot(), { execute } = runner(() => { throw new Error('spawn failed'); });
    const operation = 'end-20261120t040000z-0e0f0a0b';
    expect(await launchController({ dataRoot: root, operation, controller: PIN, args: ['end', OP, '--operation', operation], timeoutMs: 1000, execute }))
        .toMatchObject({ status: 'stopped', operation, step: null });
    const instruction = readDeployStop(root)?.instruction;
    expect(instruction).toContain(operationPaths(root, operation).launch);
    expect(instruction).toContain(`deploy end ${OP}`);
    expect(instruction).not.toContain('deploy resume');
});

test('a controller that died inside the rollback is stopped at the rollback step', async () => {
    const root = dataRoot(), { execute } = runner(() => { throw new Error('killed'); });
    startDeployJournal(root, OP, ['fence', 'stop'], facts(PIN));
    recordDeployStep(root, OP, 'fence', 'intended'); recordDeployStep(root, OP, 'fence', 'failed', { reason: 'x' });
    const undo = 'rollback-20261120t030000z-0a0b0c0d';
    startDeployJournal(root, undo, ['halt', 'start'], { kind: 'rollback', of: OP, reason: 'x', started: true });
    recordDeployStep(root, undo, 'halt', 'intended');
    expect(await launchController({ dataRoot: root, operation: OP, controller: PIN, args: ['resume', OP], timeoutMs: 1000, execute })).toMatchObject({ status: 'stopped', step: `${undo}:halt` });
    expect(readDeployStop(root)?.instruction).toContain(`deploy resume ${OP}`);
});
