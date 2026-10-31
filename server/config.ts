import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { localBindings } from './local-config';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const DATA = resolve(process.env.OFFICE_DATA_ROOT || resolve(ROOT, '.local'));
export const LOCAL_BINDINGS = localBindings(DATA);
// Examples are inert until configured; existing installations use private bindings.
export const CEC = LOCAL_BINDINGS.cec || {
    site: 'https://example.atlassian.net', cloudId: 'configure-locally', board: 0,
    account: 'office-account', repo: resolve(homedir(), 'Projects/example-project'),
    organization: 'https://dev.azure.com/example', project: 'example',
    repository: 'example', repositoryId: 'configure-locally', target: 'staging',
};
export const SKILLS = { jira: resolve(homedir(), '.agents/skills/jira-ticket-creator'), qa: resolve(homedir(), '.agents/skills/qa-team') };
export const LEGACY_AUTOMATION = LOCAL_BINDINGS.legacyAutomation || resolve(homedir(), '.codex/automations/cec-nightly-jira-fixes/automation.toml');
export const HOLDS: Record<string, string> = LOCAL_BINDINGS.holds || {
    'CEC-108': 'Existing admin/access hold. Requires an explicit unblock update; do not probe or retry the production repair.',
    'CEC-120': 'Existing issue-specific draft/readiness hold. Requires explicit readiness approval.',
};
export const PORT = Number(process.env.OFFICE_PORT || 4318);
