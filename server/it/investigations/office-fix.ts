import { z } from 'zod';
import type { OfficeFix } from '../../../src/contracts/it-investigations';

export const OfficeFixResult = z.discriminatedUnion('status', [
    z.object({ status: z.literal('proposed'), title: z.string().trim().min(12).max(160),
        changes: z.array(z.object({ sourceRef: z.string().max(200), change: z.string().trim().min(12).max(800) }).strict()).min(1).max(5),
        tests: z.array(z.string().trim().min(12).max(500)).min(1).max(5), evidenceRefs: z.array(z.string().max(200)).min(1).max(8) }).strict(),
    z.object({ status: z.literal('blocked'), reason: z.string().trim().min(12).max(1000), owner: z.string().trim().min(1).max(120) }).strict(),
]);
export const OFFICE_FIX_PROMPT = `This is a subprocess-root-cause investigation for JFusco/the-office, independent of whether the original delivery is confirmed. Use the retained lifecycle facts and supplied current Office source. Return officeFix: either status proposed with a concrete title, specific sourceRef/change entries, a reproducible regression-test plan, and supporting evidenceRefs; or status blocked with the exact missing evidence and responsible owner. A proposed fix must cite the original worker's process-lifecycle artifact and supplied Office source. Explain the causal evidence; a child identity or provider terminal event alone never proves a cause. Do not invent a fix when evidence is insufficient. Regression tests must use isolated stores, injected runners or locally owned subprocess fixtures, never live Slack or provider actions. All source changes, test execution, implementation, issue filing and deployment require a separate harness/operator handoff. Proposed fixes must preserve Slack writer uncertainty, independent delivery read-back, no replay, and capacity until group shutdown. Do not enable terminateStragglers for Slack writers. Never resend the original action. Missing code coverage or a need for provider internals is a valid blocker.`;

/** Schema validity is not evidence: proposed changes must be tied to the actual bounded packet. */
export function validateOfficeFix(input: unknown, originalId: string, evidence: { ref: string; facts: unknown }[]): OfficeFix {
    const fix = OfficeFixResult.parse(input);
    if (fix.status === 'blocked') return fix;
    const refs = new Set(evidence.map(item => item.ref));
    if (!fix.evidenceRefs.includes(`artifact:${originalId}/process-lifecycle.json`) || fix.evidenceRefs.some(ref => !refs.has(ref))) throw new Error('Office fix requires original lifecycle evidence from the bounded packet');
    const sources = new Set(evidence.filter(item => item.ref.startsWith('office-source:')).map(item => item.ref));
    if (fix.changes.some(change => !sources.has(change.sourceRef))) throw new Error('Office fix changes must reference supplied Office source');
    return fix;
}
