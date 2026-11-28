import { afterEach, expect, test } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanupFakes, fakeMaintenanceGitHub } from './support/fake-maintenance-github';
import { vendorEvidencePacket } from '../../../../server/maintenance/publication/vendor-packet';
afterEach(cleanupFakes);

test('the harness downloads the latest full scan and the daily scans since the last review, and lists registered sources and profiles', async () => {
    const f = fakeMaintenanceGitHub(), root = resolve(f.store.dataRoot, 'runs', 'r'); mkdirSync(root, { recursive: true });
    mkdirSync(resolve(f.project.repo, 'sources', 'profiles'), { recursive: true });
    writeFileSync(resolve(f.project.repo, 'sources', 'official-sources.json'), '{}'); writeFileSync(resolve(f.project.repo, 'sources', 'profiles', 'contentstack.json'), '{}');
    const runs = [{ databaseId: 3, headSha: 'a'.repeat(40), status: 'completed', conclusion: 'success', createdAt: '2026-11-25T13:17:00Z', event: 'schedule' },
        { databaseId: 2, headSha: 'a'.repeat(40), status: 'completed', conclusion: 'success', createdAt: '2026-11-24T13:47:00Z', event: 'schedule' },
        { databaseId: 1, headSha: 'a'.repeat(40), status: 'completed', conclusion: 'success', createdAt: '2026-11-17T13:47:00Z', event: 'schedule' }];
    const downloaded: string[] = [];
    const execute = async (program: string, args: string[]) => {
        if (program === 'gh' && args[1] === 'list') return JSON.stringify(runs);
        if (program === 'gh' && args[1] === 'download') { const dir = args[args.indexOf('--dir') + 1]; downloaded.push(args[2]); writeFileSync(resolve(dir, args[2] === '2' ? 'full.json' : 'index.json'), '{}'); return ''; }
        if (args[0] === 'rev-parse') return 'a'.repeat(40);
        if (args[0] === 'status') return '';
        throw new Error(`unexpected ${program} ${args.join(' ')}`);
    };
    const packet: any = await vendorEvidencePacket(f.store, execute as any, root, '2026-11-24');
    expect(downloaded).toEqual(['3', '2']);
    expect(packet.fullScan.run).toBe(2);
    expect(packet.registered.map((entry: any) => entry.path)).toEqual([resolve(f.project.repo, 'sources', 'official-sources.json')]);
    expect(packet.profiles).toHaveLength(1);
    expect(packet.checkout).toMatchObject({ head: 'a'.repeat(40), dirty: false });
});

test('eight newer daily scans do not hide the latest full scan; more daily scans than the bound are reported as a coverage gap', async () => {
    const packet = async (daily: number) => {
        const f = fakeMaintenanceGitHub(), root = resolve(f.store.dataRoot, 'runs', 'r'); mkdirSync(root, { recursive: true });
        // Newest first: `daily` daily scans since the last review (2026-11-20), then the full scan from before it, then an older full scan.
        const runs = [...Array.from({ length: daily }, (_, i) => ({ databaseId: 100 - i, createdAt: `2026-11-${String(27 - Math.floor(i / 2)).padStart(2, '0')}T13:00:00Z` })),
            { databaseId: 50, createdAt: '2026-11-17T13:47:00Z' }, { databaseId: 40, createdAt: '2026-11-10T13:47:00Z' }]
            .map(run => ({ ...run, headSha: 'a'.repeat(40), status: 'completed', conclusion: 'success', event: 'schedule' }));
        const downloaded: string[] = [];
        const execute = async (program: string, args: string[]) => {
            if (program === 'gh' && args[1] === 'list') return JSON.stringify(runs);
            if (program === 'gh' && args[1] === 'download') { const dir = args[args.indexOf('--dir') + 1]; downloaded.push(args[2]); writeFileSync(resolve(dir, ['50', '40'].includes(args[2]) ? 'full.json' : 'index.json'), '{}'); return ''; }
            if (args[0] === 'rev-parse') return 'a'.repeat(40);
            if (args[0] === 'status') return '';
            throw new Error(`unexpected ${program} ${args.join(' ')}`);
        };
        return { result: await vendorEvidencePacket(f.store, execute as any, root, '2026-11-20') as any, downloaded };
    };
    const eight = await packet(8);
    expect(eight.result.fullScan.run).toBe(50);
    expect(eight.result.scans.map((scan: any) => scan.run)).toEqual([100, 99, 98, 97, 96, 95, 94, 93]);
    expect(eight.downloaded).not.toContain('40');
    expect(eight.result.coverage).toEqual({ complete: true, gaps: [] });
    const ten = await packet(10);
    expect(ten.result.fullScan.run).toBe(50);
    expect(ten.result.scans).toHaveLength(8);
    expect(ten.result.coverage.complete).toBe(false);
    expect(ten.result.coverage.gaps).toEqual([expect.stringMatching(/2 more daily scan\(s\) since 2026-11-20 are not in the packet's observations \(bound 8\): runs 92, 91/)]);
    // No full scan among the listed runs is stated, not silently null.
    const none = fakeMaintenanceGitHub(), root = resolve(none.store.dataRoot, 'runs', 'r'); mkdirSync(root, { recursive: true });
    const result: any = await vendorEvidencePacket(none.store, (async (program: string, args: string[]) => program === 'gh' && args[1] === 'list' ? '[]' : args[0] === 'rev-parse' ? 'a'.repeat(40) : '') as any, root, '2026-11-20');
    expect(result.fullScan).toBeNull();
    expect(result.coverage).toEqual({ complete: false, gaps: ['no completed full scan was found among the 0 listed run(s)'] });
});
