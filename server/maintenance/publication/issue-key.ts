import { createHash } from 'node:crypto';

/**
 * A maintenance issue's stable identity, independent of the run that found it (#612, FIND-007): the same vendor
 * change or the same Brain defect found again under a new run id maps to the same key, so a later run finds the
 * earlier issue instead of filing a second one.
 */
export interface CmsIssueIdentity { source: string; locator: string; change: string; profile: string }
export interface BrainIssueIdentity { source: string; defect: string }

const IDENTITY = /^\S(?:[\s\S]{0,1998}\S)?$/;
const canonical = (value: string) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
const key = (prefix: string, parts: unknown[]) => `${prefix}-${createHash('sha256').update(JSON.stringify(parts)).digest('hex').slice(0, 32)}`;

export function cmsIssueKey(repository: string, identity: CmsIssueIdentity): string {
    for (const [name, value] of Object.entries(identity))
        if (typeof value !== 'string' || !IDENTITY.test(value.trim())) throw new Error(`The CMS issue identity needs its ${name}`);
    return key('cms', [repository.toLowerCase(), canonical(identity.source), canonical(identity.locator), canonical(identity.change), canonical(identity.profile)]);
}

export function brainIssueKey(repository: string, identity: BrainIssueIdentity): string {
    for (const [name, value] of Object.entries(identity))
        if (typeof value !== 'string' || !IDENTITY.test(value.trim())) throw new Error(`The Brain repair identity needs its ${name}`);
    return key('brain', [repository.toLowerCase(), canonical(identity.source), canonical(identity.defect)]);
}

/**
 * The identity must be grounded in the evidence the harness retained for the decision: every distinguishing part of
 * the key (for CMS the registered source, locator, change and profile; for Brain the source and the defect) literally
 * appears in it. A model cannot coin an identity, or a part of one, that the evidence never named.
 */
export function identityGrounded(identity: CmsIssueIdentity | BrainIssueIdentity, evidence: string): boolean {
    const text = canonical(evidence);
    return Object.values(identity).every(part => typeof part === 'string' && !!canonical(part) && text.includes(canonical(part)));
}
