import { test, expect } from 'vitest';
import { assertResearchCapability, researchRead, RESEARCH_DISABLED_FEATURES, RESEARCH_CODEX_VERSION } from '../../../server/workers/research-profile';
import { codexArguments } from '../../../server/workers/codex';

test('research enables its tool host while excluding local tools and inherited context', async () => {
    const args = codexArguments('/public/schema.json', '/public/empty', true, undefined, true);
    for (const flag of ['--ephemeral', '--ignore-user-config', '--ignore-rules', 'web_search="live"', 'features.code_mode_host=true', 'features.code_mode.excluded_tool_namespaces=["functions"]', 'project_doc_max_bytes=0']) expect(args).toContain(flag);
    for (const feature of RESEARCH_DISABLED_FEATURES) expect(args).toContain(`features.${feature}=false`);
    const calls: string[][] = [];
    await assertResearchCapability(async (program, argv, options) => {
        expect(program).toBe('codex'); expect(options?.cwd).toBe('/public/empty'); calls.push(argv);
        return argv[0] === '--version' ? RESEARCH_CODEX_VERSION : [...RESEARCH_DISABLED_FEATURES, 'code_mode_host'].map(feature => `${feature} stable false`).join('\n');
    }, '/public/empty');
    expect(calls).toEqual([['--version'], ['features', 'list']]);
    expect(codexArguments('/private/schema.json', '/private/repo', true)).not.toContain('features.code_mode_host=true');
});
test('unverified CLI versions and missing feature controls block before worker dispatch', async () => {
    let calls = 0;
    await expect(assertResearchCapability(async () => { calls++; return 'codex-cli other'; }, '/public')).rejects.toThrow('version');
    expect(calls).toBe(1);
    await expect(assertResearchCapability(async (_, args) => args[0] === '--version' ? RESEARCH_CODEX_VERSION : 'shell_tool stable false', '/public')).rejects.toThrow('unsupported');
});
test('search activity, failed opens and model citations cannot manufacture a native source read', () => {
    const event = { type: 'item.completed', item: { id: 'native-1', type: 'web_search', action: { type: 'open_page', url: 'https://www.sqlite.org/lang_transaction.html' } } };
    expect(researchRead(event)).toEqual({ url: event.item.action.url, receipt: 'native-1' });
    expect(researchRead({ ...event, item: { ...event.item, status: 'failed' } })).toBeUndefined();
    expect(researchRead({ ...event, item: { ...event.item, action: { type: 'search', url: event.item.action.url } } })).toBeUndefined();
});
