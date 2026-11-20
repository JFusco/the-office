import { expect, test } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { readActiveRelease, recordActive, type ActiveRelease } from '../../../server/release/record-active';
import { releasePaths } from '../../../server/release/release-paths';
import { FROM, TO } from './deploy-world';
import { make, OP } from './step-fixture';

const record = (over: Partial<ActiveRelease> = {}): ActiveRelease => ({
    version: 1, commit: TO, hash: '1'.repeat(64), manifestDigest: '2'.repeat(64), previous: FROM, operation: OP, serviceInstanceId: 'instance-2', activatedAt: '2026-11-20T03:00:09.000Z', ...over,
});

test('the receipt of a verified activation is written once and read back whole', async () => {
    const w = make();
    expect(readActiveRelease(w.dataRoot)).toBeNull();
    expect(await recordActive(w.ctx, OP, record())).toEqual({ status: 'verified', receipt: { commit: TO } });
    expect(readActiveRelease(w.dataRoot)).toEqual(record());
    const saved = readFileSync(releasePaths(w.dataRoot).active, 'utf8');
    expect(await recordActive(w.ctx, OP, record())).toMatchObject({ status: 'verified' });
    expect(readFileSync(releasePaths(w.dataRoot).active, 'utf8')).toBe(saved);
});

test('a record written by hand before deployments existed is not mistaken for a receipt, and is replaced', async () => {
    const w = make();
    writeFileSync(releasePaths(w.dataRoot).active, JSON.stringify({ commit: FROM, verified: true, validation: 'by hand' }));
    expect(readActiveRelease(w.dataRoot)).toBeNull();
    expect(await recordActive(w.ctx, OP, record())).toMatchObject({ status: 'verified' });
    expect(readActiveRelease(w.dataRoot)?.commit).toBe(TO);
});

test('a malformed record is refused before anything is written', async () => {
    const w = make();
    await expect(recordActive(w.ctx, OP, record({ commit: 'short' }))).rejects.toThrow();
    expect(readActiveRelease(w.dataRoot)).toBeNull();
});
