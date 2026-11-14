import { expect, test } from 'vitest';
import { z } from 'zod';
import { CECReadbackSchema } from '../../../server/cec/readback-schema';

test('native readback keeps its strict required shape and preserves historical values without adding fields', () => {
    const original = { key: 'CEC-999', assignee: 'fixture-account', subtask: false, boardMember: true, status: 'QA', statusId: 'qa', updated: 'fixture', existingPrId: 0, existingOwner: 'Retained original observation', blocker: 'Retained original blocker' };
    expect(CECReadbackSchema.parse(original)).toEqual(original);
    const json = z.toJSONSchema(CECReadbackSchema);
    expect(json.additionalProperties).toBe(false); expect([...json.required!].sort()).toEqual(Object.keys(original).sort());
    expect(CECReadbackSchema.safeParse({ ...original, stageAccepted: true }).success).toBe(false);
    expect(CECReadbackSchema.safeParse({ ...original, existingOwner: undefined }).success).toBe(false);
});

test('the model response fields distinguish a coordinated reader and pending QA from actual blocking uncertainty', () => {
    const properties = z.toJSONSchema(CECReadbackSchema).properties!;
    const owner = properties.existingOwner, blocker = properties.blocker;
    if (typeof owner !== 'object' || typeof blocker !== 'object') throw new Error('Native readback fields must have object schema metadata');
    expect(owner.description).toContain('verified current coordination');
    expect(owner.description).toContain('unknown actor or unavailable coverage still blocks');
    expect(blocker.description).toContain('stage work, not dispatch blockers');
    expect(blocker.description).toContain('before feature actions');
    expect(blocker.description).toContain('uncertain external action');
});
