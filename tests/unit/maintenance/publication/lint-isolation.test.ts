import { expect, test } from 'vitest';
import { DRAFT_LINT_ISOLATION, LintIsolationRefusal, UNREVIEWED_LINT_ISOLATION } from '../../../../server/maintenance/publication/lint-isolation';
import { maintenanceStopOf } from '../../../../server/maintenance/publication/maintenance-stop';
import { LaunchQualificationRefusal } from '../../../../server/workers/launch-qualification';

test('the production lint gate always refuses with a typed stop that names its own isolation qualification', () => {
    const refusal = UNREVIEWED_LINT_ISOLATION();
    expect(refusal).toBeInstanceOf(LintIsolationRefusal);
    expect(refusal).toBeInstanceOf(LaunchQualificationRefusal);
    expect(refusal).toMatchObject({ stage: 'draft-pr', qualification: DRAFT_LINT_ISOLATION, name: 'LintIsolationRefusal' });
    expect(refusal!.message).toMatch(/does not open it; it needs its own reviewed isolation qualification/);
    expect(maintenanceStopOf(refusal, 'now')).toEqual({ kind: 'authority', at: 'now', qualification: { stage: 'draft-pr', qualification: 'draft-lint-isolation', mismatch: refusal!.mismatch } });
    // It reads nothing: no record, host or project can change its answer.
    expect(UNREVIEWED_LINT_ISOLATION()).toBeInstanceOf(LintIsolationRefusal);
});
