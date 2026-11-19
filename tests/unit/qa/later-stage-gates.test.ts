import { expect, test } from 'vitest';
import { officeQAGuidance } from '../../../server/qa/assignment';
import { LATER_STAGE_GATES } from '../../../server/qa/later-stage-gates';

test('every Office QA assignment says a gate only a later stage can observe is not QA\'s to wait for', () => {
    for (const stage of ['qa', 'retest', 'staging-qa', 'github-validate'])
        expect(officeQAGuidance('CEC-900', 'a'.repeat(40), stage, '/runs/qa', { plan: 'none', review: 'none', validation: 'independent-checks', checks: ['Build and hosted CI'], reason: 'Unit' }), stage).toContain(LATER_STAGE_GATES);
});

test('the rule covers the part that can be observed, routes out a check with no observable part, settles a not-yet-run finding and still reports a gate that ran', () => {
    expect(LATER_STAGE_GATES).toContain('Cover the part of a required check you can observe now');
    expect(LATER_STAGE_GATES).toContain('do not report the case failed, blocked or not-tested for that remainder alone');
    expect(LATER_STAGE_GATES).toContain('An earlier finding that records only that such a gate has not run yet is returned verified with that reason');
    expect(LATER_STAGE_GATES).toContain('If a required check has no part you can observe now, do not invent a case for it: before executing, return reroute with the checks restated without that gate and the reason.');
    expect(LATER_STAGE_GATES).toContain('A gate that has run and failed, or one that is running now, is not a later-stage gate: report what you observe.');
    // A deployment is staging QA's own subject, so it is not offered as a later-stage example.
    expect(LATER_STAGE_GATES).not.toContain('deployment');
});
