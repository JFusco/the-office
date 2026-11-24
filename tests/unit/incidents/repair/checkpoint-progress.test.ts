import { expect, test } from 'vitest';
import { checkpointProgress } from '../../../../server/incidents/repair/checkpoint-progress';
import type { RepairBoundary } from '../../../../src/contracts/incidents';
import type { MaintenanceRun, OfficeSnapshot } from '../../../../src/shared';
import { checkpoint, original } from './checkpoint-resume-fixture';

const SETTLED: RepairBoundary = { kind: 'record-settled' };
/** How the checkpoint stood at its admission: linked to `original-1`, which had one step. */
const STOOD = { steps: 1, stage: 'checkpoint', event: 7, run: 'original-1' };
type Step = MaintenanceRun['steps'][number];
type Receipt = Step['result']['receipts'][number];
/** The step the native writer saves (server/maintenance/brain/brain-checkpoint.ts), for this checkpoint and run unless told otherwise. */
const native = (over: { receipt?: Partial<Receipt>; detail?: unknown; outcome?: Step['result']['outcome']; stage?: string } = {}): Step => ({
    role: 'pm', stage: over.stage ?? 'checkpoint-native-readback', at: 'later', result: { outcome: over.outcome ?? 'passed', summary: 'Native run already completed', ledger: '', blocker: '', candidates: [],
        receipts: [{ id: 'checkpoint:cp-1:native', action: 'native-checkpoint-readback', target: 'native', verified: true, uncertain: false,
            detail: typeof over.detail === 'string' ? over.detail : JSON.stringify(over.detail ?? { checkpointId: 'cp-1', originalRunId: 'original-1', completedWrapperId: 'completed-wrapper' }), ...over.receipt }] },
});
/** The step the ordinary completion read-back saves (server/maintenance/completed-checkpoints.ts). */
const ordinary = (): Step => ({ role: 'pm', stage: 'checkpoint-completion-readback', at: 'later', result: { outcome: 'passed', summary: 'verified complete', ledger: '', blocker: '', candidates: [],
    receipts: [{ id: 'checkpoint:cp-1:original-1', action: 'checkpoint-completion-readback', target: 'original-1', verified: true, uncertain: false, detail: JSON.stringify({ originalRunId: 'original-1' }) }] } });
/** Brain as it holds `cp-1` now: completed unless told otherwise, with these steps saved on its original run after the admission. */
function brain({ status = 'completed', after = [] as Step[], runId = 'original-1', more = {} as Partial<MaintenanceRun> } = {}) {
    const run = original('cp-1', more);
    run.steps.push(...after);
    return { coordination: { checkpoints: [checkpoint('cp-1', { status: status as never, runId })] }, maintenance: { runs: [run, original('cp-2')] } } as unknown as Pick<OfficeSnapshot, 'coordination' | 'maintenance'>;
}
const read = (state: ReturnType<typeof brain>, boundary: RepairBoundary = SETTLED, stood: typeof STOOD | Omit<typeof STOOD, 'run'> = STOOD) => checkpointProgress(state, 'cp-1', boundary, stood);

test('record-settled is crossed by the native read-back\'s own proof, saved on the original run after the admission, for a completed checkpoint', () => {
    expect(read(brain({ after: [native()] }))).toEqual({ exists: true, crossing: { crossed: true, detail: 'The native read-back completed the checkpoint from the original run original-1 after its resume.' } });
    // Whatever else was saved beside it, the ordinary completion included.
    expect(read(brain({ after: [ordinary(), native()] })).crossing).toMatchObject({ crossed: true });
    // Not yet completed: nothing is crossed, whatever was saved.
    for (const status of ['blocked', 'interrupted', 'queued', 'working']) expect(read(brain({ status, after: [native()] })), status).toEqual({ exists: true, crossing: { crossed: false } });
});

test('only an attributable, verified and certain native receipt saved after the admission counts', () => {
    const untested = { exists: true, crossing: { unjudged: 'The checkpoint completed with no native read-back of the original run original-1 after its resume.' } };
    const cases: [string, Step[], typeof STOOD?][] = [
        ['nothing saved since', []],
        // The step the run already had at the admission is not one.
        ['a native step from before the admission', [native()], { ...STOOD, steps: 2 }],
        ['another checkpoint\'s receipt', [native({ detail: { checkpointId: 'cp-2', originalRunId: 'original-1' } })]],
        ['another run\'s receipt', [native({ detail: { checkpointId: 'cp-1', originalRunId: 'original-2' } })]],
        ['a receipt naming neither', [native({ detail: { completedWrapperId: 'completed-wrapper' } })]],
        ['a detail that is not JSON', [native({ detail: 'checkpoint cp-1 of original-1' })]],
        ['a detail that is JSON but no record', [native({ detail: 'null' })]],
        ['a detail that is a number', [native({ detail: '7' })]],
        ['an unverified receipt', [native({ receipt: { verified: false } })]],
        ['an uncertain receipt', [native({ receipt: { uncertain: true } })]],
        ['a receipt that does not say it is certain', [native({ receipt: { uncertain: undefined } })]],
        ['a receipt verified only in words', [native({ receipt: { verified: 'true' as never } })]],
        ['a receipt of another action', [native({ receipt: { action: 'checkpoint-completion-readback' } })]],
        ['a step that did not pass', [native({ outcome: 'blocked' })]],
        ['the proof under another step', [native({ stage: 'maintenance-readback' })]],
    ];
    for (const [name, after, stood] of cases) expect(read(brain({ after }), SETTLED, stood ?? STOOD), name).toEqual(untested);
    // On another run of the project, the proof is not this run's.
    const elsewhere = brain();
    elsewhere.maintenance!.runs[1].steps.push(native({ detail: { checkpointId: 'cp-1', originalRunId: 'original-2' } }));
    expect(read(elsewhere)).toEqual(untested);
});

test('a checkpoint the ordinary completion read-back closed is untested, and says so', () => {
    expect(read(brain({ after: [ordinary()] }))).toEqual({ exists: true, crossing: { unjudged: 'The ordinary completion read-back completed the checkpoint, not the native one; that says nothing of the native boundary.' } });
});

test('a checkpoint whose original run is gone, shorter than it was, or no longer linked to it cannot be judged', () => {
    const missing = brain({ after: [native()] });
    missing.maintenance!.runs.shift();
    expect(read(missing)).toEqual({ exists: true, crossing: { unjudged: 'The project no longer holds the original run original-1.' } });
    expect(read(brain({ after: [native()] }), SETTLED, { ...STOOD, steps: 3 })).toEqual({ exists: true, crossing: { unjudged: 'The original run original-1 has 2 steps and had 3 when the checkpoint was resumed.' } });
    // The pump linked the checkpoint to a fresh run, or the run names another checkpoint: the proof can no longer be put to this checkpoint.
    const lost = { exists: true, crossing: { unjudged: 'The checkpoint and the original run original-1 no longer name each other.' } };
    expect(read(brain({ after: [native()], runId: 'original-9' }))).toEqual(lost);
    expect(read(brain({ after: [native()], more: { checkpointId: 'cp-9' } }))).toEqual(lost);
    // Even for a checkpoint still open.
    expect(read(brain({ status: 'blocked', runId: 'original-9' }))).toEqual(lost);
});

test('a checkpoint that is gone has crossed nothing; the stage boundaries and a binding without the run cannot be judged, gone or not', () => {
    const gone = brain({ after: [native()] });
    gone.coordination!.checkpoints.length = 0;
    expect(read(gone)).toEqual({ exists: false, crossing: { crossed: false } });
    for (const state of [brain({ after: [native()] }), gone]) {
        const exists = state.coordination!.checkpoints.length > 0;
        for (const boundary of [{ kind: 'stage-left', stage: 'checkpoint' }, { kind: 'stage-result-passed', stage: 'checkpoint-native-readback' }] as RepairBoundary[])
            expect(read(state, boundary), boundary.kind).toEqual({ exists, crossing: { unjudged: `A checkpoint has no stage of its own to leave or pass; only record-settled can be judged for it, not ${boundary.kind}.` } });
        const { run: _, ...historical } = STOOD;
        expect(read(state, SETTLED, historical)).toEqual({ exists, crossing: { unjudged: 'The resume was admitted before the checkpoint\'s original run was recorded.' } });
    }
});

test('the reading changes nothing it was given', () => {
    const state = brain({ after: [native(), ordinary()] }), before = JSON.stringify(state);
    read(state);
    expect(JSON.stringify(state)).toBe(before);
});
