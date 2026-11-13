import { expect, test } from 'vitest';
import { DISCOVERY_GUIDANCE } from '../../../../../server/delivery/pipeline/prompts/discovery';

test('discovery sends a worker to the knowledge lookup before official documentation, only when one was issued', () => {
    const lookup = DISCOVERY_GUIDANCE.indexOf('OFFICE KNOWLEDGE LOOKUP'), docs = DISCOVERY_GUIDANCE.indexOf('primary official documentation');
    expect(lookup).toBeGreaterThan(-1);
    expect(lookup).toBeLessThan(docs);
    expect(DISCOVERY_GUIDANCE).toContain('when this assignment includes an OFFICE KNOWLEDGE LOOKUP section');
});
