import { z } from 'zod';

/** A project's `policy` block from office-config.json: validated, not yet defaulted. */
export interface ProjectPolicyInput {
    merge?: 'human' | 'harness';
    handsOff?: boolean;
    checkpoint?: { hour?: number; weekends?: boolean };
}

const HOUR = 'must be an integer from 0 to 23';
const policySchema = z.strictObject({
    merge: z.enum(['human', 'harness'], { error: 'must be "human" or "harness"' }).optional(),
    handsOff: z.boolean({ error: 'must be a boolean' }).optional(),
    checkpoint: z.strictObject({
        hour: z.number({ error: HOUR }).int(HOUR).min(0, HOUR).max(23, HOUR).optional(),
        weekends: z.boolean({ error: 'must be a boolean' }).optional(),
    }, { error: 'must be an object' }).optional(),
}, { error: 'must be an object' });

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
    return parsed.data;
}
