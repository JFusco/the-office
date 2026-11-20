import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { deployPaths } from '../../../server/release/deploy-paths';
import { readDeployStop, standingStop, writeDeployStop } from '../../../server/release/deploy-stop';
import { writeDurable } from '../../../server/release/durable-file';

const OP = 'deploy-20261120t030000z-0a0b0c0d';
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-files-')); roots.push(dir); return dir; };

test('the first STOP record is kept; a later one does not replace it', () => {
    const dataRoot = root();
    expect(readDeployStop(dataRoot)).toBeNull();
    const first = writeDeployStop(dataRoot, { operation: OP, step: 'stop', reason: 'bootout unconfirmed', instruction: 'look' }, () => new Date('2026-11-20T03:00:00.000Z'));
    expect(first).toEqual({ version: 1, at: '2026-11-20T03:00:00.000Z', operation: OP, step: 'stop', reason: 'bootout unconfirmed', instruction: 'look' });
    expect(writeDeployStop(dataRoot, { operation: 'deploy-later-00000000', step: null, reason: 'later', instruction: 'x' })).toEqual(first);
    expect(readDeployStop(dataRoot)).toEqual(first);
    expect(statSync(deployPaths(dataRoot).stop).mode & 0o777).toBe(0o600);
});

test('a writer that loses publication returns the complete winning STOP record', () => {
    const dataRoot = root(), at = () => new Date('2026-11-20T03:00:00.000Z');
    const winner = { operation: OP, step: 'stop', reason: 'first', instruction: 'recover the first operation' };
    const returned = writeDeployStop(dataRoot, { operation: 'deploy-later-00000000', step: null, reason: 'second', instruction: 'later' }, () => {
        writeDeployStop(dataRoot, winner, at);
        return at();
    });
    expect(returned).toMatchObject(winner);
    expect(readDeployStop(dataRoot)).toEqual(returned);
});

test('an unreadable STOP record still stops', () => {
    const dataRoot = root();
    writeDurable(deployPaths(dataRoot).stop, '{not json');
    expect(readDeployStop(dataRoot)).toMatchObject({ operation: 'unknown', reason: expect.stringContaining('unreadable') });
});

test('a standing STOP is reported in its own words, with the step and the instruction', () => {
    const dataRoot = root();
    expect(standingStop(dataRoot)).toBeNull();
    writeDeployStop(dataRoot, { operation: OP, step: null, reason: 'the controller did not finish', instruction: 'read the journal' });
    expect(standingStop(dataRoot)).toBe(`Deployment ${OP} stopped for a person at start-up: the controller did not finish read the journal`);
});
