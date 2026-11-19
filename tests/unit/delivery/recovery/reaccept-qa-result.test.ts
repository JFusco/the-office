import { expect, test } from 'vitest';
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
