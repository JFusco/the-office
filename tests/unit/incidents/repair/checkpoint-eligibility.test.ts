import { expect, test } from 'vitest';
import { checkpointEligibility } from '../../../../server/incidents/repair/checkpoint-eligibility';
import type { OfficeSnapshot } from '../../../../src/shared';
import { checkpoint, original } from './checkpoint-resume-fixture';

/** Brain's store as the native handler reads it for `cp-1`. Each refusal is table-tested against saved state in dispatch-checkpoint-resume.test.ts. */
function brain() {
    return { coordination: { checkpoints: [checkpoint('cp-1'), checkpoint('cp-2')] }, maintenance: { runs: [original('cp-1'), original('cp-2')] }, workLog: [] } as unknown as Pick<OfficeSnapshot, 'coordination' | 'maintenance' | 'workLog'>;
}

test('a checkpoint the native read-back could act on yields its original run, read and changed nothing', () => {
    const state = brain(), before = JSON.stringify(state), [cp] = state.coordination!.checkpoints;
    const eligible = checkpointEligibility(state, cp);
    expect(eligible).toEqual({ original: state.maintenance!.runs[0] });
    expect((eligible as { original: unknown }).original).toBe(state.maintenance!.runs[0]);
    expect(JSON.stringify(state)).toBe(before);
});

test('a checkpoint is never refused for sharing a run with itself, only with another checkpoint', () => {
    const state = brain(), [cp] = state.coordination!.checkpoints;
    // The same checkpoint saved twice is still one checkpoint.
    state.coordination!.checkpoints.push({ ...cp });
    expect(checkpointEligibility(state, cp)).toHaveProperty('original');
    state.coordination!.checkpoints.push(checkpoint('cp-3', { runId: 'original-1' }));
    expect(checkpointEligibility(state, cp)).toEqual({ fault: 'Another checkpoint (cp-3) points to the run original-1; a retry queued for that run could not be told apart.' });
    expect(checkpointEligibility(state, state.coordination!.checkpoints[1])).toHaveProperty('original');
});

test('the checkpoint must stand stopped, and the first failed condition is the one named', () => {
    const state = brain(), [cp] = state.coordination!.checkpoints;
    for (const status of ['queued', 'working', 'completed'] as const) expect(checkpointEligibility(state, { ...cp, status }), status).toEqual({ fault: `The checkpoint is ${status}, not blocked or interrupted.` });
    expect(checkpointEligibility(state, { ...cp, status: 'interrupted' })).toHaveProperty('original');
    // Unreconciled with a blocker follow-up as well: the status is named first.
    Object.assign(state.maintenance!.runs[0], { status: 'blocked', blockerFollowup: { status: 'blocked', detail: 'x' } });
    expect(checkpointEligibility(state, cp)).toEqual({ fault: 'The run original-1 is blocked, not reconciled.' });
});
