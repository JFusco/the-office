import { expect, test } from 'vitest';
import { config } from '../knowledge/slack-intake/fixture';
import { assertSlackIntakeCapability, slackIntakeConfiguration } from '../../../server/workers/slack-intake-profile';
import { assertWorkerLane } from '../../../server/workers/worker-lanes';
import { RESEARCH_CODEX_VERSION, RESEARCH_DISABLED_FEATURES } from '../../../server/workers/research-profile';
import { workerProfile } from '../../../server/workers/worker-profiles';
import type { command } from '../../../server/workers/process';

test('Slack intake capability flags never inherit apps, shell, web or write tools', () => {
    const args = slackIntakeConfiguration(config);
    for (const expected of ['--ignore-user-config', '--ignore-rules', '--strict-config', 'web_search="disabled"', 'apps._default.enabled=false', 'apps.fixture.default_tools_enabled=false', 'features.shell_tool=false']) expect(args).toContain(expected);
    // CLI override keys split on every dot; quoted tool keys must be inside the TOML value.
    const tools = args.find(arg => arg.startsWith('apps.fixture.tools='))!;
    expect(tools).toBe('apps.fixture.tools={' + Object.values(config.tools).map(name => `${JSON.stringify(name)}={enabled=true}`).join(',') + '}');
    expect(args.some(arg => arg.includes('.tools.'))).toBe(false);
    expect(() => slackIntakeConfiguration({ ...config, tools: { ...config.tools, file: 'slack.slack_delete_file' } })).toThrow();
    expect(workerProfile('knowledge-slack-intake', true, true).name).toBe('reader');
    expect(() => assertWorkerLane('knowledge', 'knowledge-slack-intake', false)).toThrow();
    expect(() => assertWorkerLane('knowledge', 'knowledge-slack-intake', true, { lane: 'delivery', claim: { work: { kind: 'knowledge-slack-intake' } } } as never)).toThrow();
});
test('classification profile keeps isolation and exposes no app or tool capability', () => {
    const args = slackIntakeConfiguration(config, false);
    for (const expected of ['--ignore-user-config', '--ignore-rules', '--strict-config', 'web_search="disabled"', 'features.apps=false', 'apps._default.enabled=false', 'features.shell_tool=false']) expect(args).toContain(expected);
    expect(args.some(arg => arg.startsWith('apps.fixture.'))).toBe(false); expect(args).not.toContain('features.apps=true');
});
test('qualified CLI profile passes version and feature checks; unqualified upgrades stay blocked', async () => {
    let calls = 0;
    const execute = (async (_, args) => { calls++; return args[0] === '--version' ? RESEARCH_CODEX_VERSION : [...RESEARCH_DISABLED_FEATURES, 'code_mode_host'].map(f => `${f} stable false`).join('\n'); }) as typeof command;
    await expect(assertSlackIntakeCapability(execute, '/tmp', config)).resolves.toBeUndefined(); expect(calls).toBe(2);
    await expect(assertSlackIntakeCapability((async () => 'codex-cli 0.999.0') as typeof command, '/tmp', config)).rejects.toThrow('intake-capability-version');
});
