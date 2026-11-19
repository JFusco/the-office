import { expect, test } from 'vitest';
import { harnessDelivers, legacyRecovery } from '../../../../server/delivery/harness/scope';
import { projectById } from '../../../../server/office/projects';

const job = (extra: Record<string, unknown> = {}) => ({ id: 'job', key: 'GH-1', stage: 'draft', status: 'blocked', steps: [], ...extra }) as any;
const handsOff = { project: projectById('cms-field-vocabulary') };

test('a conflict the ordinary repair verified does not take a job off harness delivery', () => {
    const repaired = job({ steps: [{ stage: 'lead-pr', result: {} }, { stage: 'conflict-readback', result: {} }, { stage: 'update-base', result: {} }] });
    expect(legacyRecovery(repaired)).toBe(false);
    expect(harnessDelivers(handsOff, repaired)).toBe(true);
});

test('every genuine recovery record still keeps a job on its own contract', () => {
    for (const record of ['initialDraftConflict', 'closeoutRecovery', 'implementationRecovery', 'discoveryRecovery', 'savedPrerequisiteHandoff', 'scopeRepairReadback', 'implementationContinuation', 'candidateRecovery']) {
        const marked = job({ [record]: { id: 'x' } });
        expect(legacyRecovery(marked), record).toBe(true);
        expect(harnessDelivers(handsOff, marked), record).toBe(false);
    }
    expect(legacyRecovery(job({ scopeRepairResumes: [{ id: 'x' }] }))).toBe(true);
    expect(legacyRecovery(job({ scopeRepairResumes: [] }))).toBe(false);
    // An initial draft conflict writes the same step, bound to the worker it adopted, and is recognised by its own record…
    expect(legacyRecovery(job({ initialDraftConflict: { id: 'x' }, steps: [{ stage: 'conflict-readback', workerId: 'original', result: {} }] }))).toBe(true);
    // …and by that step alone when the record has gone missing, so the recovery's own checks stop it.
    const lost = job({ steps: [{ stage: 'conflict-readback', workerId: 'original', nativeResultSha256: 'x', result: {} }] });
    expect(legacyRecovery(lost)).toBe(true);
    expect(harnessDelivers(handsOff, lost)).toBe(false);
});

test('a project that is not hands-off never has harness delivery, whatever the job carries', () => {
    expect(harnessDelivers({ project: projectById() }, job())).toBe(false);
});
