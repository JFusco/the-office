import { expect, test, vi } from 'vitest';

/** The guarded leaf is replaced so the default base executor (`command`) is the real one above it. */
const children = vi.hoisted(() => [] as string[]);
vi.mock('../../../server/workers/spawn-command', () => ({
    spawnCommand: async (program: string, _args: string[], options: { onSpawn?: (pid: number) => void; onOutput?: (stream: 'stdout' | 'stderr', chunk: string) => void } = {}) => {
        children.push(program);
        options.onSpawn?.(4100);
        const out = program === 'gh' ? JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'success', login: 'fixture' }] } })
            : program === 'claude' ? JSON.stringify({ loggedIn: true }) : program === 'twg' ? JSON.stringify({ data: { accountId: 'a', name: 'Fixture' } }) : program === 'az' ? '"project-id"' : '';
        options.onOutput?.('stdout', out);
        return out;
    },
}));
import { GitHubCalls } from '../../../server/github/github-calls';
import { ServiceHealthChecks } from '../../../server/office/service-health';
import type { OfficeSnapshot } from '../../../src/shared';

const state = { project: { id: 'brain', name: 'Brain' }, paused: false, coordination: { listener: { lastCheckedAt: new Date().toISOString(), error: '' } }, workLog: [], slackDeliveries: [] } as unknown as OfficeSnapshot;

test('with production executors the GitHub probe is metered once as health and no public-status curl is dispatched', async () => {
    const calls = new GitHubCalls();
    const report = await new ServiceHealthChecks(undefined, calls.run).report([state]);
    expect(children.filter(program => program === 'gh')).toHaveLength(1);
    expect(children).not.toContain('curl');
    expect(report.services.find(s => s.id === 'github')).toMatchObject({ status: 'connected', identity: 'fixture' });
    expect(report.services.filter(s => s.id.startsWith('provider:')).every(s => s.status === 'unknown')).toBe(true);
    expect(calls.report().sources).toMatchObject([{ source: 'health', invocations: 1, opaque: 1, unknown: 1, families: [{ family: 'gh-auth' }] }]);
});

test('one injected fake executor still runs every probe, the GitHub one included', async () => {
    const programs: string[] = [], leaf = children.length;
    const fake = async (program: string) => { programs.push(program); return program === 'curl' ? JSON.stringify({ status: { indicator: 'none', description: 'ok' }, components: [] }) : program === 'gh' ? JSON.stringify({ hosts: { 'github.com': [{ active: true, state: 'success', login: 'fixture' }] } }) : program === 'claude' ? '{"loggedIn":true}' : program === 'twg' ? '{"data":{"accountId":"a"}}' : '"id"'; };
    const report = await new ServiceHealthChecks(fake as any).report([state]);
    expect(programs.filter(p => p === 'gh')).toHaveLength(1);
    expect(programs.filter(p => p === 'curl')).toHaveLength(2);
    expect(report.services.find(s => s.id === 'github')?.status).toBe('connected');
    expect(children).toHaveLength(leaf);
});
