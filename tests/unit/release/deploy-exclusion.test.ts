import { afterEach, expect, test } from 'vitest';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { exclusively, unfinishedDeployments } from '../../../server/release/deploy-exclusion';
import { startDeployJournal } from '../../../server/release/deploy-journal';
import { deployLockPath } from '../../../server/release/deploy-lock';
import { concludeOperation } from '../../../server/release/deploy-outcome';
import { deployPaths } from '../../../server/release/deploy-paths';
import { writeDeployStop } from '../../../server/release/deploy-stop';
import { sampleFacts } from './deploy-world';

const A = 'deploy-20261120t030000z-0a0b0c0d', B = 'deploy-20261120t040000z-0a0b0c0d', now = () => new Date('2026-11-20T05:00:00.000Z');
const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => rmSync(root, { recursive: true, force: true })));
const root = () => { const dir = mkdtempSync(resolve(tmpdir(), 'office-deploy-exclusion-')); roots.push(dir); return dir; };
const ran = (operation: string) => async () => ({ status: 'deployed' as const, operation, step: null, reason: 'ran' });

test('the operation runs under the deploy lock, which is gone afterwards', async () => {
    const dataRoot = root();
    let heldDuring = false;
    expect(await exclusively({ dataRoot, now }, A, async () => { heldDuring = existsSync(deployLockPath(dataRoot)); return ran(A)(); })).toMatchObject({ status: 'deployed' });
    expect(heldDuring).toBe(true);
    expect(existsSync(deployLockPath(dataRoot))).toBe(false);
});

test('a STOP record or a live lock owner refuses without running anything', async () => {
    const locked = root();
    writeFileSync(deployLockPath(locked), JSON.stringify({ pid: process.pid, operation: B, at: '2026-11-20T04:00:00.000Z' }));
    expect(await exclusively({ dataRoot: locked, now }, A, async () => { throw new Error('ran'); })).toMatchObject({ status: 'refused', reason: expect.stringContaining('holds the deploy lock') });
    const stopped = root();
    writeDeployStop(stopped, { operation: B, step: 'stop', reason: 'bootout unconfirmed', instruction: 'look' });
    expect(await exclusively({ dataRoot: stopped, now }, A, async () => { throw new Error('ran'); })).toMatchObject({ status: 'refused', reason: expect.stringContaining('bootout unconfirmed') });
    expect(existsSync(deployLockPath(stopped))).toBe(false);
});

test('a STOP published during lock acquisition refuses the contender and releases its lock', async () => {
    const dataRoot = root();
    const duringAcquire = () => {
        writeDeployStop(dataRoot, { operation: B, step: 'stop', reason: 'published during lock acquisition', instruction: 'inspect' }, now);
        return now();
    };
    expect(await exclusively({ dataRoot, now: duringAcquire }, A, async () => { throw new Error('ran'); }))
        .toMatchObject({ status: 'refused', reason: expect.stringContaining('published during lock acquisition') });
    expect(existsSync(deployLockPath(dataRoot))).toBe(false);
});

test('a deployment with a journal and no outcome is unfinished for every later attempt; rollbacks and finished ones are not', async () => {
    const dataRoot = root();
    startDeployJournal(dataRoot, A, ['fence'], sampleFacts('c'.repeat(40)));
    startDeployJournal(dataRoot, 'rollback-20261120t030000z-0a0b0c0d', ['halt'], { kind: 'rollback', of: A, reason: 'x', started: true });
    expect(unfinishedDeployments(dataRoot)).toEqual([A]);
    for (let attempt = 0; attempt < 3; attempt++)
        expect(await exclusively({ dataRoot, now }, B, async () => { throw new Error('ran'); })).toMatchObject({ status: 'refused', reason: expect.stringContaining(`deploy resume ${A}`) });
    // The unfinished deployment itself may run: that is its resume.
    expect(await exclusively({ dataRoot, now }, A, ran(A))).toMatchObject({ status: 'deployed' });
    concludeOperation({ dataRoot, now }, { status: 'ended', operation: A, step: null, reason: 'by a person' });
    expect(unfinishedDeployments(dataRoot)).toEqual([]);
    expect(await exclusively({ dataRoot, now }, B, ran(B))).toMatchObject({ status: 'deployed' });
});

test('a journal that cannot be read counts as unfinished', () => {
    const dataRoot = root();
    startDeployJournal(dataRoot, A, ['fence'], sampleFacts('c'.repeat(40)));
    writeFileSync(resolve(deployPaths(dataRoot).directory, `${B}.jsonl`), 'not a journal\n');
    expect(unfinishedDeployments(dataRoot)).toEqual([A, B]);
    expect(unfinishedDeployments(root())).toEqual([]);
});
