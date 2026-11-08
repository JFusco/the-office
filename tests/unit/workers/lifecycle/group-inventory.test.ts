import { expect, test } from 'vitest';
import { groupInventory } from '../../../../server/workers/lifecycle/group-inventory';
import { row } from './fixture';
test('inventory retains bounded identities only from the owned group', async () => {
    const result = await groupInventory(100, async () => [row(1, 999), ...Array.from({ length: 12 }, (_, i) => row(101 + i))].join('\n'));
    expect(result.status).toBe('observed'); expect(result.truncated).toBe(true); expect(result.members).toHaveLength(8);
    expect(result.members[0]).toEqual({ pid: 101, ppid: 100, pgid: 100, startIdentity: 'Sun Nov 8 14:00:00 2026', executable: 'node' });
    expect(JSON.stringify(result)).not.toContain('/usr/local');
});
test('capture errors and stalled runners retain errno only and settle within a bound', async () => {
    expect(await groupInventory(100, async () => { throw { code: 'EPERM', message: 'PRIVATE' }; })).toEqual({ status: 'unavailable', errno: 'EPERM', truncated: false, members: [] });
    expect(await groupInventory(100, () => new Promise(() => {}))).toMatchObject({ status: 'unavailable', errno: 'CAPTURE_TIMEOUT' });
    expect(await groupInventory(100, async () => 'x'.repeat(2_000_001))).toMatchObject({ status: 'unavailable', errno: 'CAPTURE_LIMIT' });
});
