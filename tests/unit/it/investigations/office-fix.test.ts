import { expect, test } from 'vitest';
import { z } from 'zod';
import { OfficeFixResult, validateOfficeFix } from '../../../../server/it/investigations/office-fix';
import { SubprocessReport } from '../../../../server/it/investigations/run';
import { assertStrictOutputSchema } from '../../../../server/workers/structured-output';
import { officeFix, sourceRef } from './subprocess-fixture';
const evidence = [{ ref: sourceRef, facts: {} }, { ref: 'artifact:sender/process-lifecycle.json', facts: {} }];
test('a concrete proposal needs original diagnostics, supplied code and regression tests; schema is provider-safe', () => {
    const schema = z.toJSONSchema(SubprocessReport); assertStrictOutputSchema(schema);
    expect(schema.properties?.officeFix).toHaveProperty('anyOf');
    expect(JSON.stringify(schema)).not.toContain('\"oneOf\"');
    expect(validateOfficeFix(officeFix, 'sender', evidence)).toEqual(officeFix);
    expect(() => validateOfficeFix(officeFix, 'other-worker', evidence)).toThrow('original lifecycle');
    expect(() => validateOfficeFix(officeFix, 'sender', evidence.slice(0, 1))).toThrow('original lifecycle');
    expect(() => validateOfficeFix({ ...officeFix, changes: [{ sourceRef: 'project:brain/file', change: 'Invented unrelated source change.' }] }, 'sender', evidence)).toThrow('supplied Office source');
    expect(OfficeFixResult.safeParse({ ...officeFix, tests: [] }).success).toBe(false);
    expect(validateOfficeFix({ status: 'blocked', reason: 'Child ownership cannot be established from the retained observations.', owner: 'Office runtime maintainer' }, 'sender', [])).toMatchObject({ status: 'blocked' });
});
