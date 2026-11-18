import { z } from 'zod';

/** A project's `policy` block from office-config.json: validated, not yet defaulted. */
export interface ProjectPolicyInput {
    merge?: 'human' | 'harness';
    handsOff?: boolean;
    checkpoint?: { hour?: number; weekends?: boolean };
    /** Human holds for this project only: ticket key to reason. */
    holds?: Record<string, string>;
}

const HOUR = 'must be an integer from 0 to 23';
const policySchema = z.strictObject({
    merge: z.enum(['human', 'harness'], { error: 'must be "human" or "harness"' }).optional(),
    handsOff: z.boolean({ error: 'must be a boolean' }).optional(),
    checkpoint: z.strictObject({
        hour: z.number({ error: HOUR }).int(HOUR).min(0, HOUR).max(23, HOUR).optional(),
        weekends: z.boolean({ error: 'must be a boolean' }).optional(),
    }, { error: 'must be an object' }).optional(),
    // Checked below from the raw block, so a key such as `__proto__` is rejected rather than dropped.
    holds: z.unknown().optional(),
}, { error: 'must be an object' });
const TICKET_KEY = /^[A-Z][A-Z0-9_]*-[1-9][0-9]*$/;

function parseHolds(raw: unknown, fail: (reason: string) => never): Record<string, string> {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return fail('policy.holds must be an object');
    for (const [key, reason] of Object.entries(raw)) {
        if (!TICKET_KEY.test(key)) fail(`policy.holds key "${key}" must be a ticket key`);
        if (typeof reason !== 'string' || !reason) fail(`policy.holds.${key} must be a non-empty reason`);
    }
    return Object.fromEntries(Object.entries(raw)) as Record<string, string>;
}

/** Validate one project's policy block. Errors name the project and the key path. */
export function parseProjectPolicy(project: { id: string; provider: string }, raw: unknown): ProjectPolicyInput {
    const fail = (reason: string): never => { throw new Error(`Project "${project.id}": ${reason}`); };
    const parsed = policySchema.safeParse(raw);
    if (!parsed.success) {
        const issue = parsed.error.issues[0], path = ['policy', ...issue.path].join('.');
        return fail(issue.code === 'unrecognized_keys' ? `${path}.${issue.keys[0]} is not supported` : `${path} ${issue.message}`);
    }
    // The Jira/Azure pipeline has no merge path and no harness mechanics; say so rather than accept a setting it cannot honor.
    if (project.provider === 'azure' && parsed.data.merge === 'harness') fail('policy.merge must be "human" for provider "azure"');
    if (project.provider === 'azure' && parsed.data.handsOff === true) fail('policy.handsOff must be false for provider "azure"');
    if (parsed.data.holds === undefined) return parsed.data as ProjectPolicyInput;
    return { ...parsed.data, holds: parseHolds((raw as { holds: unknown }).holds, fail) };
}
