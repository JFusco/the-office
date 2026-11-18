import { expect, test } from 'vitest';
import { decidedResumeStep, resumeStep } from '../../../server/cec/resume-step';
import { cecReadbackPrompt } from '../../../server/cec/prompts/cec-reads';
import { cecStore, decision, ticket } from './parking/fixtures';

const assessed = (): any => ({ owner: 'developer', findingAttempts: { F1: 2 }, attempts: 6, pendingFindingIds: ['F1'], sourceStage: 'retest', sourceHead: 'a'.repeat(40), phase: 'diagnosis', diagnosisAttempted: true });

/** A code-review run that returned its result to the attempt record and not to the ticket. */
function returned(repairCycle?: any) {
    const { store, clock } = cecStore(), t = { ...ticket('QA'), stage: 'code-review' as const, activity: 'blocked' as const, repairCycle };
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

const look = (savedCompletion: boolean, continuable: boolean, asked: string[] = []) => ({ savedCompletion: () => { asked.push('saved'); return savedCompletion; }, continuableSession: async () => { asked.push('session'); return continuable; } });

test('a result already in hand comes first, then a saved completion, then a session, then the stage itself', async () => {
    const { store, t, attemptId } = returned(), asked: string[] = [];
    expect(await decidedResumeStep(store, t, look(true, true, asked))).toBe('apply-returned-result');
    t.recoveredAttemptId = attemptId;
    expect(await decidedResumeStep(store, t, look(true, true, asked))).toBe('accept-saved-completion');
    // A session is looked for only when no result is in hand.
    expect(asked).toEqual(['saved', 'saved']);
    expect(await decidedResumeStep(store, t, look(false, true))).toBe('continue-session');
    expect(await decidedResumeStep(store, t, look(false, false))).toBe('run-stage');
});

test('a stage whose outcome is unknown is reconstructed; one cut off by a provider limit runs again; a result in hand or a session outranks both', async () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'retest' as const, activity: 'blocked' as const, blocker: 'Interrupted stage; external effects require reconciliation.' };
    t.results.retest = decision('', { resolution: null, receipts: [{ id: 'x', action: 'retest', target: t.key, verified: false, uncertain: true, detail: 'Worker did not return a verified final result' }] });
    store.state.tickets = [t];
    for (const step of ['reconstruct', 'rerun-interrupted-qa'] as const) {
        if (step === 'rerun-interrupted-qa') store.state.workLog = [{ id: 'run-1', ticket: t.key, stage: 'retest', role: 'qa', status: 'failed', failure: { category: 'uncertain-effect', detail: 'You have hit your usage limit.', dispatched: true } } as any];
        expect(resumeStep(store, t)).toBe(step);
        expect(await decidedResumeStep(store, t, look(false, false))).toBe(step);
        expect(await decidedResumeStep(store, t, look(false, true))).toBe('continue-session');
        expect(await decidedResumeStep(store, t, look(true, true))).toBe('accept-saved-completion');
    }
});

test('the read-back is told about a returned assessment only while its saved result is unapplied', () => {
    const { store, t, attemptId } = returned(assessed());
    expect(cecReadbackPrompt(store, t.key)).toContain('RETURNED ASSESSMENT:');
    t.recoveredAttemptId = attemptId;
    expect(cecReadbackPrompt(store, t.key)).not.toContain('RETURNED ASSESSMENT:');
    delete t.recoveredAttemptId;
    t.stage = 'retest' as any;
    expect(cecReadbackPrompt(store, t.key)).not.toContain('RETURNED ASSESSMENT:');
    t.stage = 'code-review';
    for (const repairCycle of [undefined, { ...assessed(), phase: 'repair' }, { ...assessed(), diagnosisAttempted: false }]) {
        t.repairCycle = repairCycle;
        expect(cecReadbackPrompt(store, t.key)).not.toContain('RETURNED ASSESSMENT:');
    }
});

test('a parked decision Joe resolved, with a finding its last run left open: the read-back is told the stage runs and that the finding is not a blocker', () => {
    const { store } = cecStore(), t = { ...ticket('QA'), stage: 'retest' as const, activity: 'blocked' as const, blocker: 'Decision needed: approve the provider submission.',
        findings: [{ id: 'F2', summary: 'A recovery test fails when run directly', expected: '', actual: '', status: 'open' as const, attempts: 0 }],
        parked: { stage: 'retest' as const, reason: 'Approve the provider submission', at: '2026-11-18T03:45:00Z', fromStatus: 'QA', marker: 'Office decision x', published: true, resumeRequestedAt: '2026-11-18T05:00:00Z' } };
    t.results.retest = decision('permission', { paidRuns: 0, blocker: 'Approve the provider submission' });
    store.state.tickets = [t];
    expect(resumeStep(store, t)).toBe('run-stage');
    const prompt = cecReadbackPrompt(store, t.key);
    expect(prompt).toContain('RESOLVED OFFICE DECISION');
    expect(prompt).toContain('HARNESS NEXT STEP: Once this read-back passes, the harness runs the stage (retest).');
});
