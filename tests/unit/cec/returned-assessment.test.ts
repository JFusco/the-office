import { expect, test } from 'vitest';
import { returnedAssessment } from '../../../server/cec/returned-assessment';
import { cecStore, decision, ticket } from './parking/fixtures';

const cycle = (): any => ({ owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'retest', sourceHead: 'a'.repeat(40), phase: 'diagnosis', diagnosisAttempted: true });

function saved() {
    const { store, clock } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'blocked' as const, repairCycle: cycle() };
    store.state.tickets = [t];
    const attemptId = store.begin(t, 'code-review');
    clock.advance(1000);
    const startedAt = clock.now().toISOString();
    clock.advance(1000);
    store.state.workLog = [{ id: 'run-1', ticket: t.key, stage: 'code-review', role: 'lead', status: 'blocked', executionStatus: 'completed', startedAt, endedAt: clock.now().toISOString() } as any];
    clock.advance(1000);
    store.finish(attemptId, decision('', { summary: 'Trim the bundle.' }));
    return { store, t, attemptId };
}

test('an attempted assessment whose saved result is not on the ticket is a returned assessment', () => {
    const { store, t } = saved();
    expect(returnedAssessment(store, t)).toBe(true);
});

test('it is not one before the assessment ran, outside the assessment, or once that result was applied', () => {
    const { store, t, attemptId } = saved();
    expect(returnedAssessment(store, { ...t, repairCycle: { ...cycle(), diagnosisAttempted: false } })).toBe(false);
    expect(returnedAssessment(store, { ...t, repairCycle: { ...cycle(), phase: 'repair' } })).toBe(false);
    expect(returnedAssessment(store, { ...t, repairCycle: undefined })).toBe(false);
    expect(returnedAssessment(store, { ...t, stage: 'retest' })).toBe(false);
    expect(returnedAssessment(store, { ...t, recoveredAttemptId: attemptId })).toBe(false);
});
