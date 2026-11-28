import type { LaunchTemplate } from './maintenance-template';

/** One `-c key=value` override: the TOML literal Codex receives, and the value the record's settings show. */
type Override = readonly [key: string, toml: string, value: unknown];
const flag = (key: string, value: boolean): Override => [key, String(value), value];
const text = (key: string, value: string): Override => [key, JSON.stringify(value), value];

/** No delegation, desktop tools, web search, connectors, plugins or external notify program. */
const DISABLED: Override[] = [
    flag('agents.enabled', false), flag('features.multi_agent', false), flag('features.multi_agent_v2', false),
    ...['computer_use', 'browser_use', 'browser_use_external', 'in_app_browser'].map(feature => flag(`features.${feature}`, false)),
    text('web_search', 'disabled'), flag('features.apps', false), flag('features.plugins', false),
    ['mcp_servers', '{}', {}], ['notify', '[]', []],
];

function template(policy: string, cwd: string, sandbox: 'read-only' | 'workspace-write', overrides: Override[], tools: string[], filesystem: LaunchTemplate['filesystem'], network: string[]): LaunchTemplate {
    const all: Override[] = [text('approval_policy', 'never'), ...overrides, ...DISABLED];
    return {
        provider: 'codex', policy,
        // Explicit model and effort, no user configuration or rules, the schema through Codex's own read-only input, the assignment on stdin.
        arguments: ['exec', '--json', '--skip-git-repo-check', '--color', 'never', '--ignore-user-config', '--ignore-rules',
            '--output-schema', '{schemaPath}', '--cd', cwd, '--model', '{model}', '-c', 'model_reasoning_effort="{effort}"', '--sandbox', sandbox,
            ...all.flatMap(([key, toml]) => ['-c', `${key}=${toml}`]), '-'],
        settings: { sandbox, ...Object.fromEntries(all.map(([key, , value]) => [key, value])) },
        tools, filesystem, network: { allowed: network },
    };
}

/**
 * Codex reader for Brain `maintenance-blocker` and the weekly `vendor-review`, `proposal-plan-review` and
 * `proposal-review`: a read-only, network-denied shell that never escalates. No auto reviewer and no TWG approval
 * instruction: the harness supplies the live evidence.
 */
export const codexReaderTemplate = (): LaunchTemplate =>
    template('codex-reader', '{cwd}', 'read-only', [], ['shell'], { readable: ['{cwd}'], writable: [], denied: [] }, []);

/**
 * Codex checks for `package-verification` and `browser-verification`: a non-escalating command runner whose only
 * writable root is its private scratch (its cwd); the bound candidate is read from there. Network is denied unless
 * browser validation was selected, which permits the isolated test browser and its loopback fixture.
 */
export function codexChecksTemplate(browser: boolean): LaunchTemplate {
    const overrides: Override[] = [
        flag('sandbox_workspace_write.network_access', browser),
        ['sandbox_workspace_write.writable_roots', '[]', []],
        flag('sandbox_workspace_write.exclude_tmpdir_env_var', true),
        flag('sandbox_workspace_write.exclude_slash_tmp', true),
    ];
    return template(browser ? 'codex-checks-browser' : 'codex-checks', '{scratch}', 'workspace-write', overrides, ['shell'],
        { readable: ['{cwd}', '{scratch}'], writable: ['{scratch}'], denied: [] }, browser ? ['127.0.0.1 (isolated test fixture)'] : []);
}
