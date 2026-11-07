import { expect, test } from 'vitest';
import { codexPricedModels, codexPriceRef } from '../../../server/telemetry/price-table';

test('price rows are exact-model; an alias or unknown model never borrows another row', () => {
    expect(codexPricedModels().sort()).toEqual(['gpt-6-astra', 'gpt-6-luna', 'gpt-6-sol', 'gpt-6.1-sol']);
    expect(codexPriceRef('gpt-6-astra', 'short', null)?.rates).toEqual({ input: 10, cachedInput: 1, cacheWrite: null, output: 50 });
    expect(codexPriceRef('gpt-6-astra', 'long', null)?.rates).toEqual({ input: 20, cachedInput: 2, cacheWrite: null, output: 75 });
    for (const model of ['gpt-6', 'gpt-6-astra-law', 'codex-auto-review', 'constructor', '__proto__']) expect(codexPriceRef(model, 'short', null)).toBeNull();
});

test('a snapshot names its source, date, tier, band and region so history is never repriced', () => {
    expect(codexPriceRef('gpt-6-sol', 'short', '12h')).toMatchObject({
        id: 'openai:gpt-6-sol:standard:short:12h:global:2026-11-07', tier: 'standard', region: 'global',
        sourceUrl: 'https://developers.openai.com/api/docs/pricing', asOf: '2026-11-07', rates: { cacheWrite: 5 },
    });
});
