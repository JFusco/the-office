import type { command } from './process';
import type { Config } from '../knowledge/slack-intake/config';
import { IntakeConfig } from '../knowledge/slack-intake/config';
import { RESEARCH_CODEX_VERSION, RESEARCH_DISABLED_FEATURES } from './research-profile';

export const isSlackIntake = (stage?: string) => stage === 'knowledge-slack-intake' || stage === 'knowledge-slack-links';
/** Only explicit read tool keys are admitted; no inherited app or plugin configuration.
 * Classification of already-collected evidence (`tools: false`) keeps every isolation flag and disables apps entirely. */
export function slackIntakeConfiguration(config: Config, tools = true): string[] {
    IntakeConfig.parse(config);
    const app = `apps.${config.appId}`;
    const apps = tools ? ['features.apps=true', 'apps._default.enabled=false', `${app}.enabled=true`, `${app}.default_tools_enabled=false`,
        `${app}.destructive_enabled=false`, `${app}.tools={${Object.values(config.tools).map(tool => `${JSON.stringify(tool)}={enabled=true}`).join(',')}}`]
        : ['features.apps=false', 'apps._default.enabled=false'];
    const settings = ['approval_policy="never"', 'agents.enabled=false', 'web_search="disabled"', 'project_doc_max_bytes=0',
        'features.skip_host_skill_discovery=true', 'features.code_mode_host=true', 'features.code_mode.excluded_tool_namespaces=["functions"]',
        ...apps, ...RESEARCH_DISABLED_FEATURES.filter(feature => feature !== 'apps').map(feature => `features.${feature}=false`)];
    return ['--ephemeral', '--ignore-user-config', '--ignore-rules', '--strict-config', ...settings.flatMap(setting => ['-c', setting])];
}
/** Unknown CLI or missing native capability evidence never enables unattended reading. */
export async function assertSlackIntakeCapability(execute: typeof command, cwd: string, config: Config): Promise<void> {
    slackIntakeConfiguration(config);
    // Metadata startup can stall on a loaded host. Keep qualification strict with a bounded startup allowance.
    const probe = { cwd, readOnly: true, timeout: 30000 };
    const version = (await execute('codex', ['--version'], probe)).trim();
    if (version !== RESEARCH_CODEX_VERSION) throw Error('intake-capability-version');
    const features = await execute('codex', ['features', 'list'], probe);
    if ([...RESEARCH_DISABLED_FEATURES, 'code_mode_host'].some(feature => !new RegExp('^' + feature + '\\s', 'm').test(features))) throw Error('intake-capability-features');
    // Qualified on 0.163.0 with native channel/thread/search completion events.
    // The connector decoder separately rejects unknown formats and incomplete reads.
}
