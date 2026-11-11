import { afterEach, expect, test } from 'vitest';
import { initialManualStart } from '../../../../server/delivery/board/manual-start';
import { moveLane } from '../../../../server/delivery/board/move-lane';
import { retireBacklogged } from '../../../../server/delivery/parking/retire-backlogged';
import { cleanupFakes, fakeGitHub } from '../support/fake-github';
afterEach(cleanupFakes);

function fixture() {
    const f = fakeGitHub(), job = f.candidate({ head: '', automaticStatus: undefined, status: 'working' });
    job.admission!.kind = 'manual';
    f.state.cards[0].status = 'backlog';
    return { ...f, job };
}

test('explicit manual Start moves its initial Backlog issue once with normal read-back', async () => {
    const f = fixture();
    expect(await moveLane(f.store, f.execute as any, f.job, 'In progress', () => {})).toBe('In progress');
    expect(f.state.cards[0].status).toBe('progress');
    expect(f.job.boardUpdates?.at(-1)?.status).toBe('verified');
    f.state.cards[0].status = 'backlog';
    await expect(moveLane(f.store, f.execute as any, f.job, 'In progress', () => {})).rejects.toThrow('human lane');
});

test('initial manual Start is not mistaken for a later human Backlog retirement', async () => {
    const f = fixture(); f.job.status = 'blocked';
    expect(await retireBacklogged(f.store, f.execute as any, [f.job], [{ key: f.job.key, pickupStatus: 'Backlog' }] as any)).toEqual([]);
    expect(f.job.status).toBe('blocked');
});

test('manual Start never moves Block, Done or a review transition out of Backlog', async () => {
    for (const lane of ['block', 'done', '']) {
        const f = fixture(); f.state.cards[0].status = lane;
        await expect(moveLane(f.store, f.execute as any, f.job, 'In progress', () => {})).rejects.toThrow('human lane');
    }
    const f = fixture();
    await expect(moveLane(f.store, f.execute as any, f.job, 'In review', () => {})).rejects.toThrow('human lane');
    await expect(moveLane(f.store, f.execute as any, f.job, 'In progress', () => { throw Error('paused'); })).rejects.toThrow('paused');
    expect(f.state.cards[0].status).toBe('backlog');
});

test('manual Start requires exact admission identity and no prior source or board work', () => {
    const cases = [
        (j: any) => { j.admission.kind = 'pickup'; },
        (j: any) => { j.admission.projectId = 'other'; },
        (j: any) => { j.admission.jobId = 'other'; },
        (j: any) => { j.admission.key = 'GH-999'; },
        (j: any) => { j.admission.reference = ''; },
        (j: any) => { j.admission.at = 'invalid'; },
        (j: any) => { j.stage = 'update-base'; },
        (j: any) => { j.pr = 123; },
        (j: any) => { j.existingPR = true; },
        (j: any) => { j.head = 'a'.repeat(40); },
        (j: any) => { j.steps = [{}]; },
        (j: any) => { j.boardUpdates = [{ status: 'uncertain' }]; },
    ];
    for (const change of cases) {
        const f = fixture(); change(f.job);
        expect(initialManualStart(f.store.project.id, f.job)).toBe(false);
    }
});
