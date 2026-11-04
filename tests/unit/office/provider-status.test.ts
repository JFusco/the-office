import { expect, test, vi } from 'vitest';
import { ProviderStatusChecks } from '../../../server/office/provider-status';

const healthy = { status: { indicator: 'none', description: 'All Systems Operational' }, components: [{ name: 'Codex', status: 'operational' }], incidents: [] };
test('public status uses bounded read-only commands, coalesces, caches and refreshes without model calls', async () => {
    let now = Date.parse('2026-11-04T20:00:00Z');
    const execute = vi.fn(async () => JSON.stringify(healthy));
    const checks = new ProviderStatusChecks(execute, () => now);
    const [a, b] = await Promise.all([checks.report(), checks.report()]);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(a).toEqual(b);
    expect(a.every(s => s.status === 'connected' && s.statusLabel === 'Operational' && s.kind === 'provider')).toBe(true);
    expect(execute).toHaveBeenCalledWith('curl', expect.arrayContaining(['https://status.openai.com/api/v2/summary.json']), { readOnly: true, timeout: 15000 });
    expect(execute).toHaveBeenCalledWith('curl', expect.arrayContaining(['https://status.claude.com/api/v2/summary.json']), { readOnly: true, timeout: 15000 });
    await checks.report(); expect(execute).toHaveBeenCalledTimes(2);
    now += 60000; await checks.report(); expect(execute).toHaveBeenCalledTimes(4);
});
test('active incidents or affected components override an operational aggregate', async () => {
    const checks = new ProviderStatusChecks(async (_program, args) => JSON.stringify(args.at(-1)?.includes('openai') ? { ...healthy, incidents: [{ name: 'Codex errors', status: 'monitoring' }] } : { ...healthy, components: [{ name: 'Claude Code', status: 'degraded_performance' }] }));
    const rows = await checks.report();
    expect(rows.every(s => s.status === 'warning')).toBe(true);
    expect(rows[0].detail).toContain('Codex errors'); expect(rows[1].detail).toContain('Claude Code: degraded performance');
});
test('failed or malformed reads replace green with unknown and retain the real last success time', async () => {
    let now = Date.parse('2026-11-04T20:00:00Z'), fail = false;
    const checks = new ProviderStatusChecks(async (_program, args) => {
        if (!fail) return JSON.stringify(healthy);
        if (args.at(-1)?.includes('openai')) throw new Error('timeout');
        return '{"status":{"indicator":"none"}}';
    }, () => now);
    await checks.report(); fail = true; now += 60000;
    for (const row of await checks.report()) {
        expect(row).toMatchObject({ status: 'unknown', checkedAt: '2026-11-04T20:01:00.000Z', lastSuccessAt: '2026-11-04T20:00:00.000Z' });
        expect(row.detail).toContain('does not establish an outage');
    }
});
