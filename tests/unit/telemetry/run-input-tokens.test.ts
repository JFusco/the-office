import { describe, expect, it } from 'vitest';
import { runInputTokens } from '../../../server/telemetry/run-input-tokens';

describe('runInputTokens', () => {
    it('counts cached input that the legacy Claude field leaves out', () => {
        const usage = { uncachedInputTokens: 56, cacheReadInputTokens: 900_000, cacheWriteInputTokens: 40_000 };
        expect(runInputTokens({ inputTokens: 56, accounting: { usage } } as never)).toBe(940_056);
    });
    it('keeps the legacy total when normalized usage is unknown', () => {
        const usage = { uncachedInputTokens: null, cacheReadInputTokens: null, cacheWriteInputTokens: null };
        expect(runInputTokens({ inputTokens: 5000, accounting: { usage } } as never)).toBe(5000);
        expect(runInputTokens({ inputTokens: null } as never)).toBe(0);
    });
});
