import { afterEach, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { concludeOperation, readOutcome } from '../../../server/release/deploy-outcome';
import { operationPaths } from '../../../server/release/deploy-paths';
import { readDeployStop } from '../../../server/release/deploy-stop';

const OP = 'deploy-20261120t030000z-0a0b0c0d', now = () => new Date('2026-11-20T03:00:00.000Z');
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-outcome-')); roots.push(dir); return dir; };

test('an outcome is saved and read back; only a stopped one leaves a STOP record', () => {
    const dataRoot = root();
    expect(readOutcome(dataRoot, OP)).toBeNull();
    const deployed = { status: 'deployed' as const, operation: OP, step: null, reason: 'serves' };
    expect(concludeOperation({ dataRoot, now }, deployed)).toEqual(deployed);
    expect(readOutcome(dataRoot, OP)).toEqual(deployed);
    expect(readDeployStop(dataRoot)).toBeNull();
    const other = 'deploy-20261120t040000z-0a0b0c0d';
    concludeOperation({ dataRoot, now }, { status: 'stopped', operation: other, step: 'stop', reason: 'bootout unconfirmed' });
    expect(readDeployStop(dataRoot)).toMatchObject({ operation: other, step: 'stop', reason: 'bootout unconfirmed', instruction: expect.stringContaining(`pnpm office deploy end ${other}`) });
    expect(readOutcome(dataRoot, other)).toMatchObject({ status: 'stopped' });
});

test('a malformed outcome is refused on write and on read', () => {
    const dataRoot = root();
    expect(() => concludeOperation({ dataRoot, now }, { status: 'finished' as any, operation: OP, step: null, reason: '' })).toThrow();
    expect(readOutcome(dataRoot, OP)).toBeNull();
    concludeOperation({ dataRoot, now }, { status: 'refused', operation: OP, step: null, reason: 'busy' });
    writeFileSync(operationPaths(dataRoot, OP).outcome, '{"status":"deployed"}');
    expect(() => readOutcome(dataRoot, OP)).toThrow();
});
