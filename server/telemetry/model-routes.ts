import type { Role } from '../../src/shared';
import { DEVELOPER_EFFORT, DEVELOPER_MODEL } from '../workers/claude';

/**
 * One model and effort per role, resolved once per invocation so the requested settings,
 * the CLI arguments and the price lookup all agree.
 *
 * The developer is pinned to Claude by identity validation in `ClaudeStream`. Every other role
 * runs Codex; until now those inherited `~/.codex/config.toml`, so the defaults below reproduce
 * what ran (gpt-6-astra / high). QA keeps its own `qa_harness` lead policy.
 */
export interface ModelRoute { provider: 'claude' | 'codex'; model: string; effort: string; source: 'default' | 'config' | 'qa-policy' }
export type ModelOverrides = Partial<Record<Role, { model: string; effort: string }>>;

export const CODEX_DEFAULT_MODEL = 'gpt-6-astra';
export const CODEX_DEFAULT_EFFORT = 'high';
export const CODEX_EFFORTS = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra'] as const;
const CODEX_ROLES: readonly Role[] = ['pm', 'lead', 'qa', 'cto', 'it', 'analyst', 'knowledge'];
const MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;

export function validModelSetting(value: unknown): value is { model: string; effort: string } {
    const v = value as { model?: unknown; effort?: unknown };
    return !!v && typeof v === 'object' && Object.keys(v).every(key => key === 'model' || key === 'effort')
        && typeof v.model === 'string' && MODEL_ID.test(v.model) && (CODEX_EFFORTS as readonly string[]).includes(v.effort as string);
}

/** Overrides may pin Codex roles only; the developer's provider and model are fixed. */
export function assertModelOverrides(value: unknown): asserts value is ModelOverrides {
    if (value === undefined) return;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Model overrides must be an object keyed by role');
    for (const [role, setting] of Object.entries(value))
        if (!(CODEX_ROLES as readonly string[]).includes(role) || !validModelSetting(setting))
            throw new Error(`Model override for ${role} must name a Codex role with {model, effort}`);
}

/** Reads the QA lead route from the `qa_harness model-policy` JSON. */
export function qaPolicyRoute(policyJson: string): ModelRoute {
    const lead = JSON.parse(policyJson)?.roles?.lead;
    if (!validModelSetting({ model: lead?.model, effort: lead?.reasoning_effort })) throw new Error('QA model policy has no valid lead route');
    return { provider: 'codex', model: lead.model, effort: lead.reasoning_effort, source: 'qa-policy' };
}

export async function resolveModelRoute(role: Role, overrides: ModelOverrides = {}, qaPolicy: () => Promise<string>): Promise<ModelRoute> {
    if (role === 'developer') return { provider: 'claude', model: DEVELOPER_MODEL, effort: DEVELOPER_EFFORT, source: 'default' };
    const override = overrides[role];
    if (override) return { provider: 'codex', ...override, source: 'config' };
    if (role === 'qa') return qaPolicyRoute(await qaPolicy());
    return { provider: 'codex', model: CODEX_DEFAULT_MODEL, effort: CODEX_DEFAULT_EFFORT, source: 'default' };
}
