import { expect, test } from 'vitest';
import { z } from 'zod';
import { FreshDiscoverySchema, FreshPlanSchema } from '../../../../server/features/feature-schema';
import { assertStrictOutputSchema } from '../../../../server/workers/structured-output';
import { normalizeQuestion } from '../../../../src/features/questions/normalize-question';
test('current discovery and plan schemas are recursively strict with required nullable fields', () => {
    for (const schema of [FreshDiscoverySchema, FreshPlanSchema]) expect(() => assertStrictOutputSchema(z.toJSONSchema(schema, { target: 'draft-7' }))).not.toThrow();
    const question = { id: null, question: 'Which audience?', recommendation: 'Editors', choices: null, options: [{ id: 'all', label: 'Everyone', tradeoff: null }, { id: 'editors', label: 'Editors', tradeoff: 'Smallest scope' }], recommendedOptionId: 'editors' };
    expect(FreshDiscoverySchema.parse({ summary: 's', brief: 'b', ready: false, questions: [question] }).questions[0]).toEqual(question);
    const q = normalizeQuestion(question, 'stable'); expect(q.options?.map(option => option.label)).toEqual(['Editors', 'Everyone']); expect(q.recommendedOptionId).toBe(q.options?.[0].id);
});
