import type { GitHubPR } from '../../src/shared';
import { boundedEvidence, GOAL_EVIDENCE_LIMITS } from '../leadership/goal-evidence';

/** Keep the provider's PR narrative as attributed evidence, bounded and redacted. */
export function githubPRDescription(value: unknown): Pick<GitHubPR, 'description' | 'descriptionTruncated'> {
    const body = boundedEvidence(typeof value === 'string' ? value : '', GOAL_EVIDENCE_LIMITS.bodyBytes);
    return { description: body.text, descriptionTruncated: body.truncated };
}
