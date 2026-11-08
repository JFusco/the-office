import { expect, test } from 'vitest';
import { LifecycleDiagnostic, errno } from '../../../../server/workers/lifecycle/contract';
import { diagnostic } from './fixture';
test('closed diagnostic schema drops unknown private fields and rejects unsafe identities', () => {
    const input: any = diagnostic(); input.argv = 'PRIVATE'; input.snapshots[0].members[0].env = 'PRIVATE';
    expect(JSON.stringify(LifecycleDiagnostic.parse(input))).not.toContain('PRIVATE');
    input.snapshots[0].members[0].executable = '/private/path';
    expect(LifecycleDiagnostic.safeParse(input).success).toBe(false);
    expect(errno({ code: 'EPERM', message: 'PRIVATE' })).toBe('EPERM');
    expect(errno({ code: 'private path/error' })).toBe('UNKNOWN');
});
