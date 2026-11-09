import { test, expect } from 'vitest';
import { assertResearchCapability, researchRead, RESEARCH_DISABLED_FEATURES } from '../../../server/workers/research-profile';
import { codexArguments } from '../../../server/workers/codex';
test('research has explicit restrictions and native incompatibility fails closed before model dispatch', async () => {
    const args = codexArguments('/public/schema.json', '/public/empty', true, undefined, true);
    expect(args).toContain('--ignore-user-config'); expect(args).toContain('--ignore-rules'); expect(args).toContain('web_search="live"');
    for (const feature of RESEARCH_DISABLED_FEATURES) expect(args).toContain(`features.${feature}=false`);
    let calls = 0; await expect(assertResearchCapability(async () => { calls++; return ''; }, '/public/empty')).rejects.toThrow('native fixture');
    expect(calls).toBe(0);
});
test('search activity, failed opens and model citations cannot manufacture a native source read', () => {
    const event = { type: 'item.completed', item: { id: 'native-1', type: 'web_search', action: { type: 'open', url: 'https://www.sqlite.org/transaction.html' } } };
    expect(researchRead(event)).toEqual({ url: event.item.action.url, receipt: 'native-1' });
    expect(researchRead({ ...event, item: { ...event.item, status: 'failed' } })).toBeUndefined();
    expect(researchRead({ ...event, item: { ...event.item, action: { type: 'search', url: event.item.action.url } } })).toBeUndefined();
});
