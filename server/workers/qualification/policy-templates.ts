import { homedir } from 'node:os';
import { DATA } from '../../office/config';
import { templateFor } from '../maintenance-invocation';
import { DEFAULT_REGISTRY } from '../maintenance-launch';
import type { ProtectedRoots } from '../claude-maintenance-arguments';
import type { MaintenanceProvider } from '../launch-qualification';
import type { LaunchTemplate } from '../maintenance-template';

/** Every maintenance launch policy and the stages it covers (#612). */
export const POLICIES: Readonly<Record<string, { provider: MaintenanceProvider; kind: 'reader' | 'editor' | 'checks'; browser?: boolean; stages: string[] }>> = {
    'claude-reader': { provider: 'claude', kind: 'reader', stages: ['proposal-issue', 'proposal-plan', 'draft-pr'] },
    'claude-editor': { provider: 'claude', kind: 'editor', stages: ['proposal'] },
    'codex-reader': { provider: 'codex', kind: 'reader', stages: ['vendor-review', 'proposal-plan-review', 'proposal-review', 'maintenance-blocker'] },
    'codex-checks': { provider: 'codex', kind: 'checks', stages: ['package-verification'] },
    'codex-checks-browser': { provider: 'codex', kind: 'checks', browser: true, stages: ['browser-verification'] },
};

/** The host paths every maintenance launch protects: the live Office data root and the operator's home. */
export const maintenanceRoots = (): ProtectedRoots => ({ officeData: DATA, home: homedir() });

/** The exact launch template this build uses for a policy: the one the runtime launches and a record must equal. */
export function policyTemplate(policy: string, roots: ProtectedRoots = maintenanceRoots()): LaunchTemplate {
    const entry = POLICIES[policy];
    if (!entry) throw new Error(`Unknown policy ${policy}; one of ${Object.keys(POLICIES).join(', ')}`);
    return templateFor(entry.provider, { kind: entry.kind, browser: entry.browser, registry: DEFAULT_REGISTRY }, roots);
}
