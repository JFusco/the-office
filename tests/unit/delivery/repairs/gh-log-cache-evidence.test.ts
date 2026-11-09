import { expect, test } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { ghLogCacheEvidence } from '../../../../server/delivery/repairs/gh-log-cache-evidence';
import type { TicketJob } from '../../../../src/shared';

test('only small stable regular ZIP candidates for the saved run inside the original execution window supply facts', () => {
    const fixture = mkdtempSync(resolve(tmpdir(), 'office-gh-cache-')), root = resolve(fixture, 'cache'); mkdirSync(root);
    try {
        const bytes = Buffer.from('PK\x03\x04synthetic-cache'), path = resolve(root, 'run-log-123-456.zip'); writeFileSync(path, bytes);
        writeFileSync(resolve(root, 'run-log-999-456.zip'), bytes); writeFileSync(resolve(root, 'run-log-123-457.zip'), 'not a zip');
        writeFileSync(resolve(root, 'run-log-123-458.zip'), Buffer.alloc(1048577)); symlinkSync(path, resolve(root, 'run-log-123-459.zip'));
        const job = { mergeScannerRetry: { runId: 123 } } as TicketJob;
        const writer = { startedAt: new Date(Date.now() - 60000).toISOString(), endedAt: new Date(Date.now() + 60000).toISOString() };
        expect(ghLogCacheEvidence(job, writer)).toEqual([]); // Default unit execution cannot inspect the operator's real cache.
        const facts = ghLogCacheEvidence(job, writer, root);
        expect(facts).toEqual([{ path: resolve(realpathSync(root), 'run-log-123-456.zip'), runId: 123, sha256: createHash('sha256').update(bytes).digest('hex'), size: bytes.length, createdAt: expect.any(String), modifiedAt: expect.any(String) }]);
        expect(ghLogCacheEvidence(job, { ...writer, endedAt: new Date(Date.now() - 30000).toISOString() }, root)).toEqual([]);
        expect(ghLogCacheEvidence({} as TicketJob, writer, root)).toEqual([]);
        const alias = resolve(fixture, 'alias'); symlinkSync(root, alias, 'dir'); expect(ghLogCacheEvidence(job, writer, alias)).toEqual([]);
        expect(ghLogCacheEvidence(job, writer, resolve(fixture, 'missing'))).toEqual([]);
    } finally { rmSync(fixture, { recursive: true, force: true }); }
});
