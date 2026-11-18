import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderCecPrompts } from './render-cec-prompts';

const GOLDEN = fileURLToPath(new URL('../../../fixtures/cec-prompts.golden.json', import.meta.url));

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-01T12:00:00Z')); });
afterEach(() => vi.useRealTimers());

// The cec customer's prompts are a contract: a binding-driven builder must render them byte for byte.
// Capture once against unchanged code with CEC_PROMPTS_GOLDEN=write; never rewrite it to make a change pass.
test('cec prompts render byte-identically to the captured golden text', () => {
    const rendered = renderCecPrompts();
    if (process.env.CEC_PROMPTS_GOLDEN === 'write') writeFileSync(GOLDEN, `${JSON.stringify(rendered, null, 2)}\n`);
    const golden: Record<string, string> = JSON.parse(readFileSync(GOLDEN, 'utf8'));
    expect(Object.keys(rendered)).toEqual(Object.keys(golden));
    for (const key of Object.keys(golden)) expect(rendered[key], key).toBe(golden[key]);
});
