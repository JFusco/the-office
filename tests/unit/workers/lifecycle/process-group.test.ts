import { expect, test } from 'vitest';
import { probeProcessGroup } from '../../../../server/workers/lifecycle/process-group';
test('only ESRCH proves group absence; permission and unknown errors remain conservative', () => {
    const calls: unknown[] = [];
    expect(probeProcessGroup(100, ((...args: unknown[]) => { calls.push(args); return true; }) as typeof process.kill)).toEqual({ state: 'alive' });
    expect(calls).toEqual([[-100, 0]]);
    for (const code of ['ESRCH', 'EPERM', 'EIO']) expect(probeProcessGroup(100, (() => { throw { code }; }) as typeof process.kill)).toEqual({ state: code === 'ESRCH' ? 'absent' : 'unknown', errno: code });
});
