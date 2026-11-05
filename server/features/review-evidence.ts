import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Feature } from '../../src/contracts/features';
import { command } from '../workers/process';
const EvidenceSchema = z.object({
    run: z.string(), status: z.string(), stage: z.string(), revision: z.number().int(),
    fingerprint: z.string(), researchDigest: z.string(), timeout: z.number().positive().max(14400),
    profiles: z.record(z.string(), z.unknown()), fallbacks: z.record(z.string(), z.array(z.unknown())),
    error: z.string(), findings: z.array(z.object({ id: z.string(), disposition: z.string(), rationale: z.string(), evidence: z.string(), correction_recommended: z.string() }).passthrough()),
    plan: z.string(), artifact: z.string(), handoff: z.string().optional(), lockPath: z.string().optional(),
});
export type ReviewEvidence = z.infer<typeof EvidenceSchema>;
export function helperInstallation() {
    const skill = realpathSync(resolve(homedir(), '.agents/skills/review-plan/SKILL.md'));
    const root = resolve(dirname(skill), '../..');
    return { root, python: resolve(root, '.venv/bin/python'), helper: resolve(root, 'scripts/review_cli.py') };
}
export async function readReview(feature: Feature, execute: typeof command = command, install = helperInstallation()): Promise<ReviewEvidence> {
    if (!feature.review?.run || !feature.baseline) throw new Error('Review baseline is missing');
    if (install.helper !== feature.review.helper) throw new Error('Review installation changed');
    const commit = (await execute('git', ['rev-parse', 'HEAD'], { cwd: install.root, readOnly: true })).trim();
    if (commit !== feature.review.helperCommit) throw new Error('Review helper changed since this run started');
    const script = fileURLToPath(new URL('./helper-evidence.py', import.meta.url));
    return EvidenceSchema.parse(JSON.parse(await execute(install.python, [script, install.helper, feature.review.run, feature.baseline.path], { readOnly: true, timeout: 60000 })));
}
