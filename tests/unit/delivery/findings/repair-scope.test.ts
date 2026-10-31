import { expect, test } from 'vitest';
import { namedRepairIds } from '../../../../server/delivery/findings/repair-scope';
import { repairFindingIds } from '../../../../server/delivery-repairs';
import type { StageResult } from '../../../../src/shared';

const head = 'a'.repeat(40);
const finding = (id: string, status: 'open' | 'fixed' | 'verified') => ({ id, summary: id, expected: '', actual: '', status, attempts: 0 });
const verdict = (named: string[]): StageResult => ({ outcome: 'blocked', summary: 'Two scoped defects', commit: head, blocker: 'defects', previewUrl: '', worktree: '/w', branch: 'b', prId: 0, qaRunDir: '', paidRuns: 0, receipts: [],
    evidence: [{ id: 'ev', kind: 'review', summary: 'r', path: '/r.json', commit: head, environment: 't', url: '', observedAt: '' }],
    findings: [finding('lock', 'fixed'), finding('drift', 'open'), finding('redirect', 'open'), finding('coverage', 'open')],
    resolution: { kind: 'source-repair', findingIds: named, evidenceIds: ['ev'] } });
test('hands-off repair uses the findings the reviewer names; the strict path still requires all of them', () => {
    expect(namedRepairIds(verdict(['redirect', 'coverage']))).toEqual(['redirect', 'coverage']);
    expect(repairFindingIds(verdict(['redirect', 'coverage']))).toBeNull();
    expect(repairFindingIds(verdict(['redirect', 'coverage']), true)).toEqual(['redirect', 'coverage']);
});
test('named findings must exist, be unresolved, unique, and cite current evidence', () => {
    expect(namedRepairIds(verdict(['missing']))).toBeNull();
    expect(namedRepairIds(verdict(['redirect', 'redirect']))).toBeNull();
    expect(namedRepairIds({ ...verdict(['redirect']), evidence: [] })).toBeNull();
    expect(namedRepairIds({ ...verdict(['redirect']), outcome: 'passed' })).toBeNull();
    expect(namedRepairIds({ ...verdict(['redirect']), resolution: { kind: 'human-hold', findingIds: ['redirect'], evidenceIds: ['ev'] } })).toBeNull();
});
