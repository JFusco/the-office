import { expect, test } from 'vitest';
import { z } from 'zod';
import { parseWorkerResult } from '../../../server/workers/parse-result';
const schema = z.object({ outcome: z.enum(['passed', 'failed', 'blocked']), evidence: z.array(z.string()) }).strict();
test('normalizes one whole JSON fence without changing a negative verdict', () => {
    const result = { outcome: 'blocked', evidence: ['saved-observation'] };
    expect(parseWorkerResult(`\n\`\`\`json\n${JSON.stringify(result)}\n\`\`\`\n`, schema, true)).toEqual({ result, normalization: 'single-json-fence' });
    expect(parseWorkerResult(result, schema)).toEqual({ result, normalization: null });
});
test.each(['preface\n```json\n{"outcome":"passed","evidence":[]}\n```',
    '```json\n{"outcome":"passed"}\n```', '{"outcome":"passed","evidence":[],"authority":"new"}',
    '{"outcome":"passed","evidence":[]}{"outcome":"blocked","evidence":[]}',
    '{"outcome":"passed","evidence":[', '"{\\"outcome\\":\\"passed\\",\\"evidence\\":[]}"'])('never extracts fragments, adds fields, unwraps double JSON or invents authority: %s', text => {
    expect(() => parseWorkerResult(text, schema, true)).toThrow();
});
