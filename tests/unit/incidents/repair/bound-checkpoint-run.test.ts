import { expect, test } from 'vitest';
import { requireBoundCheckpointRun } from '../../../../server/incidents/repair/bound-checkpoint-run';
import type { HarnessRequest } from '../../../../src/contracts/work';
import type { OfficeSnapshot } from '../../../../src/shared';
import { checkpoint } from './checkpoint-resume-fixture';

const state = (runId = 'original-1') => ({ coordination: { checkpoints: [checkpoint('cp-1', { runId })] } }) as unknown as Pick<OfficeSnapshot, 'coordination'>;
const marked = (stood: unknown) => ({ key: 'cp-1', repairResume: { stood } }) as Pick<HarnessRequest, 'key' | 'repairResume'>;
const STOOD = { steps: 1, stage: 'checkpoint', event: 7, run: 'original-1' };

test('a repair resume passes only while its checkpoint still links the original run it was admitted for', () => {
    expect(() => requireBoundCheckpointRun(state(), marked(STOOD))).not.toThrow();
    expect(() => requireBoundCheckpointRun(state('replacement'), marked(STOOD))).toThrow('Checkpoint cp-1 is no longer linked to the original run original-1 its repair resume was admitted for; no native read-back was made');
    // A checkpoint that is gone links nothing.
    expect(() => requireBoundCheckpointRun({ coordination: { checkpoints: [] } } as never, marked(STOOD))).toThrow('no longer linked');
    for (const stood of [undefined, { ...STOOD, run: undefined }, { ...STOOD, run: '' }])
        expect(() => requireBoundCheckpointRun(state(), marked(stood)), JSON.stringify(stood)).toThrow('The repair resume of checkpoint cp-1 records no original run; no native read-back was made');
});

test('an ordinary native read-back carries no binding and is not asked about its run', () => {
    expect(() => requireBoundCheckpointRun(state('replacement'), { key: 'cp-1' })).not.toThrow();
    expect(() => requireBoundCheckpointRun({ coordination: { checkpoints: [] } } as never, { key: 'cp-9' })).not.toThrow();
});
