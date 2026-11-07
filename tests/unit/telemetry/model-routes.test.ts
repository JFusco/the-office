import { expect, test } from 'vitest';
import { assertModelOverrides, resolveModelRoute } from '../../../server/telemetry/model-routes';
import { codexArguments } from '../../../server/workers/codex';

const policy = async () => JSON.stringify({ roles: { lead: { model: 'gpt-6-sol', reasoning_effort: 'medium' } } });

test('defaults reproduce what ran before pinning', async () => {
    expect(await resolveModelRoute('developer', {}, policy)).toMatchObject({ provider: 'claude', model: 'claude-opus-5-5', effort: 'medium' });
    expect(await resolveModelRoute('pm', {}, policy)).toMatchObject({ provider: 'codex', model: 'gpt-6-astra', effort: 'high', source: 'default' });
    expect(await resolveModelRoute('qa', {}, policy)).toMatchObject({ provider: 'codex', model: 'gpt-6-sol', effort: 'medium', source: 'qa-policy' });
});

test('overrides pin Codex roles only and are validated', async () => {
    expect(await resolveModelRoute('lead', { lead: { model: 'gpt-6.1-sol', effort: 'xhigh' } }, policy)).toMatchObject({ model: 'gpt-6.1-sol', effort: 'xhigh', source: 'config' });
    expect(() => assertModelOverrides({ developer: { model: 'gpt-6-astra', effort: 'high' } })).toThrow();
    expect(() => assertModelOverrides({ pm: { model: 'gpt 6', effort: 'high' } })).toThrow();
    expect(() => assertModelOverrides({ pm: { model: 'gpt-6-astra', effort: 'turbo' } })).toThrow();
    expect(() => assertModelOverrides({ pm: { model: 'gpt-6-astra', effort: 'high' } })).not.toThrow();
});

test('Codex receives exactly one model and one effort setting', () => {
    const args = codexArguments('/schema.json', '/cwd', true, { model: 'gpt-6-sol', effort: 'medium' });
    expect(args.filter(arg => arg === '--model')).toHaveLength(1);
    expect(args.filter(arg => arg.startsWith('model_reasoning_effort='))).toEqual(['model_reasoning_effort="medium"']);
});
