import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { workerProfile } from './worker-profiles';

/** Filesystem capability and external-write disposition are different policies. */
export function workerLaunchPolicy(profile: ReturnType<typeof workerProfile>, stage: string, slackSend: boolean, privateIntake: boolean, handsOff: boolean) {
    return { readOnly: profile.name === 'reader' || profile.name === 'slack-native' && profile.readOnly && !slackSend && ['slack-recipient', 'slack-verify'].includes(stage),
        terminateStragglers: privateIntake || handsOff && profile.name !== 'slack-native' };
}

const LaunchPolicy = z.object({ version: z.literal(1), workerId: z.string().min(1).max(80), stage: z.string().max(100), program: z.enum(['codex', 'claude']),
    profile: z.object({ name: z.string().max(40), readOnly: z.boolean() }).strict(),
    effective: z.object({ readOnly: z.boolean(), terminateStragglers: z.boolean() }).strict(), workspaceRoot: z.string().max(5000).optional(), at: z.iso.datetime() }).strict();
export type LaunchPolicyReceipt = z.infer<typeof LaunchPolicy>;

/** Immutable diagnostics only; this is never completion or proof of an external effect. */
export function retainLaunchPolicy(directory: string, receipt: LaunchPolicyReceipt, write = writeFileSync): boolean {
    try { write(resolve(directory, 'launch-policy.json'), JSON.stringify(LaunchPolicy.parse(receipt)), { flag: 'wx', mode: 0o600 }); return true; }
    catch { return false; }
}

export function launchPolicyFacts(input: unknown, workerId: string, stage: string, provider?: string) {
    const parsed = LaunchPolicy.safeParse(input);
    if (!parsed.success || parsed.data.workerId !== workerId || parsed.data.stage !== stage || parsed.data.program !== provider) return;
    return parsed.data;
}
