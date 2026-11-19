import { expect, test } from 'vitest';
import { deliveryInputSha256 } from '../../../../server/github/github-context';
import { requeueRefusedQAResults } from '../../../../server/delivery/recovery/refused-qa-result';
import { retireRefusedQA, savedQAResult } from '../../../../server/delivery/recovery/reaccept-qa-result';
import { finding, refused } from '../support/refused-qa';

const requeue = (f: ReturnType<typeof refused>, revision = 'release-1') => requeueRefusedQAResults(f.store, [f.job], revision);
test('the saved result is handed to acceptance once, without a QA run, and the refused copy is kept as history', async () => {
    const f = refused();
    expect(await savedQAResult(f.delivery, f.job)).toBeNull();
    requeue(f);
    const saved = await savedQAResult(f.delivery, f.job);
    expect(saved).toEqual(f.qa);
    expect(saved).not.toBe(f.qa);
    expect(f.job.qaReaccept!.usedAt).toBeTruthy();
    expect(await savedQAResult(f.delivery, f.job)).toBeNull();
    // Nothing is renamed until acceptance has recorded the result as a new step.
    retireRefusedQA(f.job);
    expect(f.job.steps.map(step => step.stage)).toEqual(['review', 'validate']);
    f.job.steps.push({ stage: 'validate', result: saved! });
    retireRefusedQA(f.job);
    expect(f.job.steps.map(step => step.stage)).toEqual(['review', 'refused-qa-result', 'validate']);
});

test('a result that no longer passes, or a step recorded since, is not reused: the ordinary stage runs', async () => {
    const changed = refused();
    requeue(changed);
    changed.qa.findings.push(finding('qa-found', 'open'));
    expect(await savedQAResult(changed.delivery, changed.job)).toBeNull();
    expect(changed.job.qaReaccept!.usedAt).toBeUndefined();
    const later = refused();
    requeue(later);
    later.job.steps.push({ stage: 'validate', result: later.qa });
    expect(await savedQAResult(later.delivery, later.job)).toBeNull();
});

test('a candidate that is no longer the checkout QA verified is not reused: the ordinary QA stage runs', async () => {
    const f = refused();
    requeue(f);
    f.setGitHead('e'.repeat(40));
    expect(await savedQAResult(f.delivery, f.job)).toBeNull();
    expect(f.job.qaReaccept!.usedAt).toBeUndefined();
});

test('a queued job that is not given its saved result says why, once, on the job and in the event log', async () => {
    const events = (f: ReturnType<typeof refused>) => f.store.state.events.filter(event => event.kind === 'qa-result-not-reused').map(event => event.message);
    const changed = refused();
    requeue(changed);
    changed.qa.findings.push(finding('qa-found', 'open'));
    expect(await savedQAResult(changed.delivery, changed.job)).toBeNull();
    expect(changed.job.qaReaccept!.declined).toBe('the QA gate still refuses it: QA has unresolved findings');
    expect(await savedQAResult(changed.delivery, changed.job)).toBeNull();
    expect(events(changed)).toEqual([`${changed.job.key}: saved QA result not reused: the QA gate still refuses it: QA has unresolved findings. The ordinary QA stage runs.`]);

    const moved = refused();
    requeue(moved);
    moved.setGitHead('e'.repeat(40));
    await savedQAResult(moved.delivery, moved.job);
    expect(moved.job.qaReaccept!.declined).toMatch(/^the candidate is not the clean checkout QA verified \(.+\)$/);
    expect(events(moved)).toHaveLength(1);
    // The record is history only: once the checkout reads back right, the saved result is still reused.
    moved.setGitHead(moved.job.head);
    expect(await savedQAResult(moved.delivery, moved.job)).toEqual(moved.qa);
    expect(moved.job.qaReaccept).toMatchObject({ declined: expect.any(String), usedAt: expect.any(String) });
    expect(events(moved)).toHaveLength(1);

    const later = refused();
    requeue(later);
    later.job.steps.push({ stage: 'validate', result: later.qa });
    await savedQAResult(later.delivery, later.job);
    expect(later.job.qaReaccept!.declined).toBe('a step was recorded after the job was queued for it');

    const inputs = refused();
    requeue(inputs);
    inputs.job.qaGateRefusal!.inputSha256 = 'f'.repeat(64);
    await savedQAResult(inputs.delivery, inputs.job);
    expect(inputs.job.qaReaccept!.declined).toBe('the human inputs QA ran on have changed');
    expect(events(inputs)).toHaveLength(1);

    // A later release queues it afresh, without the old reason.
    Object.assign(inputs.job, { status: 'blocked', stop: { kind: 'unclassified', at: '' } });
    inputs.job.qaGateRefusal!.inputSha256 = deliveryInputSha256(inputs.store, inputs.job.key);
    expect(requeueRefusedQAResults(inputs.store, [inputs.job], 'release-2')).toEqual([inputs.job.key]);
    expect(inputs.job.qaReaccept!.declined).toBeUndefined();

    // A job nobody queued for this says nothing.
    const plain = refused();
    expect(await savedQAResult(plain.delivery, plain.job)).toBeNull();
    expect(events(plain)).toEqual([]);
});
