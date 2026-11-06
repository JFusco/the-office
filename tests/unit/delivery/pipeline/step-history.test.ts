import { expect, test } from 'vitest';
import { compactSteps } from '../../../../server/delivery/pipeline/step-history';
import type { Finding, Receipt, StageResult, TicketJob } from '../../../../src/shared';

const finding = (id: string, status: Finding['status']): Finding => ({ id, summary: id, expected: '', actual: '', status, attempts: 0 });
const receipt = (id: string, verified = true, uncertain = false): Receipt => ({ id, action: 'a', target: 't', verified, uncertain, detail: '' });
function step(stage: TicketJob['stage'], findings: Finding[] = [], receipts: Receipt[] = []): TicketJob['steps'][number] {
    const result: StageResult = { outcome: 'passed', summary: `${stage} summary`, commit: 'a'.repeat(40), blocker: '', findings, receipts, evidence: [{ id: `${stage}-evidence`, kind: 'checks', summary: '', path: '/tmp/e.json', commit: 'a'.repeat(40), environment: '', url: '', observedAt: '' }], worktree: '', branch: '', prId: 0, previewUrl: '', qaRunDir: '', paidRuns: 0 };
    return { stage, result };
}
const full = (entry: ReturnType<typeof compactSteps>[number]) => 'evidence' in entry.result;

test('older settled steps collapse while the previous and latest-per-stage steps stay whole', () => {
    const steps = [step('implement'), step('review'), step('implement'), step('review'), step('validate')];
    const compact = compactSteps({ steps });
    expect(compact.map(full)).toEqual([false, false, true, true, true]);
    expect(compact[0]).toEqual({ stage: 'implement', result: { outcome: 'passed', summary: 'implement summary', commit: 'a'.repeat(40), blocker: '' } });
});

test('unverified findings, pending repair findings and unverified or uncertain receipts keep their step whole', () => {
    const steps = [
        step('review', [finding('open-once', 'open')]),
        step('review', [finding('fixed-not-verified', 'fixed')]),
        step('review', [finding('settled', 'open')]),
        step('implement', [], [receipt('unverified', false)]),
        step('implement', [], [receipt('uncertain', true, true)]),
        step('review', [finding('pending', 'verified')]),
        step('validate', [finding('settled', 'verified')]),
        step('implement'),
        step('validate'),
    ];
    const compact = compactSteps({ steps, repairCycle: { pendingFindingIds: ['pending'] } as any });
    expect(compact.map(full)).toEqual([true, true, false, true, true, true, false, true, true]);
});

test('durable job steps are never modified', () => {
    const steps = [step('implement'), step('review'), step('validate'), step('implement')];
    const before = structuredClone(steps);
    compactSteps({ steps });
    expect(steps).toEqual(before);
});

test.each(['open', 'fixed'] as const)('a finding reopened as %s after verification keeps its original evidence', status => {
    const steps = [
        step('review', [finding('F', 'verified')]),
        step('implement'),
        step('review', [finding('F', status)], [receipt('reopened-proof')]),
        step('implement'),
        step('review'),
        step('validate'),
    ];
    const compact = compactSteps({ steps });
    expect(compact[2].result).toMatchObject({ findings: steps[2].result.findings, receipts: steps[2].result.receipts, evidence: steps[2].result.evidence });
    expect(full(compact[0])).toBe(false);
    steps[5].result.findings = [finding('F', 'verified')];
    expect(full(compactSteps({ steps })[2])).toBe(false);
});
