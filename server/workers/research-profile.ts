import type { command } from './process';
/** Public-only reader. Keep the supported version explicit until its native fixture is rerun. */
export const RESEARCH_PROFILE_UNAVAILABLE = 'Research unavailable: Codex 0.163.0 native fixture reported hosted retrieval unavailable with code_mode_host disabled (2026-11-08). Restricted profile requires new native verification before activation.';
export const RESEARCH_CODEX_VERSION = 'codex-cli 0.163.0';
export const RESEARCH_DISABLED_FEATURES = ['shell_tool', 'apps', 'plugins', 'hooks', 'memories', 'multi_agent', 'multi_agent_v2', 'view_image', 'image_generation', 'browser_use', 'browser_use_external', 'computer_use', 'in_app_browser', 'code_mode_host', 'chronicle'];
export function researchConfiguration(): string[] {
    return ['--ignore-user-config', '--ignore-rules', '-c', 'approval_policy="never"', '-c', 'agents.enabled=false', '-c', 'web_search="live"', '-c', 'project_doc_max_bytes=0', '-c', 'features.skip_host_skill_discovery=true', ...RESEARCH_DISABLED_FEATURES.flatMap(feature => ['-c', `features.${feature}=false`])];
}
export async function assertResearchCapability(execute: typeof command, cwd: string): Promise<void> {
    // The public native fixture failed closed. Version/flag presence alone cannot establish this surface.
    if (RESEARCH_PROFILE_UNAVAILABLE) throw new Error(RESEARCH_PROFILE_UNAVAILABLE);
    const version = (await execute('codex', ['--version'], { cwd, readOnly: true, timeout: 10000 })).trim();
    if (version !== RESEARCH_CODEX_VERSION) throw new Error('Research unavailable: installed Codex version needs a restricted-profile capability check');
    const features = await execute('codex', ['features', 'list'], { cwd, readOnly: true, timeout: 10000 });
    if (RESEARCH_DISABLED_FEATURES.some(feature => !new RegExp('^' + feature + '\\s', 'm').test(features))) throw new Error('Research unavailable: restricted capabilities are unsupported');
}
/** Accept explicit native page-open completion only; search results and model claims are insufficient. */
export function researchRead(event: any): { url: string; receipt: string } | undefined {
    const item = event?.item;
    if (event.type !== 'item.completed' || item?.type !== 'web_search' || item.status === 'failed') return;
    const action = item.action;
    if (!['open_page', 'open'].includes(action?.type) || typeof action.url !== 'string' || !/^https:\/\//.test(action.url) || !item.id) return;
    return { url: action.url, receipt: item.id };
}
