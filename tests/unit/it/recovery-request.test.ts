import { expect, test } from 'vitest';
import { itRecoveryRequest } from '../../../server/it/recovery-request';

const it = (requestId?: string) => ({ checkedAt: '', nextCheckAt: '', status: 'monitoring' as const, reports: [], services: [], recoveries: { 'project-progress': { requestId, attempts: 1, nextAt: '', status: 'retrying' as const, detail: 'saved error' } } });

test('a request is IT’s only when an IT recovery saved its id', () => {
    expect(itRecoveryRequest({ it: it('request-1') }, 'request-1')).toBe(true);
    expect(itRecoveryRequest({ it: it('request-1') }, 'request-2')).toBe(false);
    expect(itRecoveryRequest({ it: it() }, 'request-1')).toBe(false);
    expect(itRecoveryRequest({}, 'request-1')).toBe(false);
});
