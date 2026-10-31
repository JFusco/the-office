import { expect, test } from 'vitest';
import { RESOLUTION_GUIDANCE } from '../../../../server/workers/agents';
import { HANDS_OFF_RESOLUTION_GUIDANCE } from '../../../../server/delivery/harness/resolution-guidance';
import { repairDispositions } from '../../../../server/delivery/repairs/delivery-repairs';

test('hands-off reviewers are told to name only blocking findings for repair', () => {
    expect(RESOLUTION_GUIDANCE).toContain('with EVERY unresolved finding ID');
    expect(HANDS_OFF_RESOLUTION_GUIDANCE).not.toBe(RESOLUTION_GUIDANCE);
    expect(HANDS_OFF_RESOLUTION_GUIDANCE).toContain('ONLY the IDs of findings that block');
});
test('hands-off repair tracking needs a disposition for each named finding, not a closed status', () => {
    const cycle = { pendingFindingIds: ['coverage', 'drift'] } as any;
    const result = (status: string) => ({ findings: [{ id: 'coverage', status: 'fixed' }, { id: 'drift', status }] }) as any;
    expect(repairDispositions(cycle, result('open'))).toBe(false);
    expect(repairDispositions(cycle, result('open'), false, true)).toBe(true);
    expect(repairDispositions(cycle, result('fixed'), true)).toBe(false);
    expect(repairDispositions(cycle, { findings: [{ id: 'coverage', status: 'fixed' }] } as any, false, true)).toBe(false);
});
