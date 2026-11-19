import { afterEach, expect, test } from 'vitest';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { archiveOldReports, RETAINED_REPORTS } from '../../../server/it/report-retention';

const roots: string[] = [];
afterEach(() => roots.splice(0).forEach(root => { try { chmodSync(resolve(root, 'archive'), 0o700); } catch { /* none */ } rmSync(root, { recursive: true, force: true }); }));
const root = () => { const path = mkdtempSync(resolve(tmpdir(), 'office-reports-')); roots.push(path); return path; };
const NOW = new Date('2026-11-19T12:00:00Z');
const reports = (count: number) => Array.from({ length: count }, (_, index) => ({ id: `r${index}`, at: new Date(Date.UTC(2026, 9, 28) + index * 3600000).toISOString(), status: 'monitoring', summary: `Report ${index}`, actions: [], followUps: [], notified: [], fingerprint: '' })) as any[];
const archived = (data: string, month: string) => readFileSync(resolve(data, 'archive', `it-reports-${month}.jsonl`), 'utf8').trim().split('\n').map(line => JSON.parse(line).id);

test('the latest reports stay in state and the older ones are archived, oldest first, by month', () => {
    const data = root(), all = reports(RETAINED_REPORTS + 120), last = all.at(-1);
    expect(archiveOldReports(data, all, NOW)).toBe(120);
    expect(all).toHaveLength(RETAINED_REPORTS);
    expect([all[0].id, all.at(-1)]).toEqual(['r120', last]);
    // 28 October 00:00 UTC plus one report an hour: 96 fall in October, the next 24 in November.
    expect(archived(data, '2026-10')).toEqual(Array.from({ length: 96 }, (_, index) => `r${index}`));
    expect(archived(data, '2026-11')).toEqual(Array.from({ length: 24 }, (_, index) => `r${index + 96}`));
});

test('nothing happens at or under the limit, and each later report archives exactly the one it displaces', () => {
    const data = root(), all = reports(RETAINED_REPORTS);
    expect(archiveOldReports(data, all, NOW)).toBe(0);
    all.push(...reports(RETAINED_REPORTS + 1).slice(-1));
    expect(archiveOldReports(data, all, NOW)).toBe(1);
    expect(archived(data, '2026-10')).toEqual(['r0']);
    expect(archiveOldReports(data, all, NOW)).toBe(0);
    expect(archived(data, '2026-10')).toEqual(['r0']);
});

test('when the archive cannot be written no report leaves state, and the next attempt archives them', () => {
    const data = root(), all = reports(RETAINED_REPORTS + 5);
    mkdirSync(resolve(data, 'archive'));
    chmodSync(resolve(data, 'archive'), 0o500);
    expect(archiveOldReports(data, all, NOW)).toBe(0);
    expect(all).toHaveLength(RETAINED_REPORTS + 5);
    chmodSync(resolve(data, 'archive'), 0o700);
    expect(archiveOldReports(data, all, NOW)).toBe(5);
    expect(all).toHaveLength(RETAINED_REPORTS);
});
