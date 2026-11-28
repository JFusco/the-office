import { z } from 'zod';
import type { OfficeProject } from '../../../../src/shared';
import type { ProofComment } from '../../../delivery/closeout/proof-comment';
import type { QualifyEntry } from '../app-config';
import { canonicalDigest } from '../route-entry';
import { changeDigest } from '../write-boundary';
import { refuse } from './trial-refusal';

/** The fixed adapter of the trial: the checked proof-comment Effect operation on an issue. */
export const TRIAL_OPERATION = 'github-issue-comment';
/** Trial Effect ids are the command's own: never a harness id, and never a retry or writer-refusal successor. */
const TRIAL_ID = /^office-app-trial:[\w:.#@/+-]{1,280}$/;
const SUCCESSOR = /:(retry|writer)-\d+$/;
/** The whole suffix that `activeEffectId` retries and `writerSuccessor` refusals add to an id, possibly chained. */
const SUCCESSOR_SUFFIX = /^(?::(?:retry|writer)-\d+)+$/;
/** True when `candidate` is a retry or writer successor derived from `id`; an independently named `<id>:followup` is not. */
export const isSuccessorOf = (id: string, candidate: string) => candidate.startsWith(`${id}:`) && SUCCESSOR_SUFFIX.test(candidate.slice(id.length));
const positive = z.number().int().positive();
const digest = z.string().regex(/^[a-f0-9]{64}$/);

/** The public approval packet: every identifier the approved trial names. Nothing secret. */
export const AppTrialPacket = z.strictObject({
    projectId: z.string().min(1).max(100),
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    repositoryId: positive,
    appId: positive,
    installationId: positive,
    botLogin: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\[bot\]$/),
    botId: positive,
    effectId: z.string().regex(TRIAL_ID).refine(id => !SUCCESSOR.test(id), 'a successor id is never a trial'),
    issue: z.strictObject({ number: positive, id: positive, nodeId: z.string().min(1).max(100) }),
    marker: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    beforeDigest: digest,
    expectedDigest: digest,
});
export type AppTrialPacket = z.infer<typeof AppTrialPacket>;

/** The trial the packet binds: the entry it approves, the issue URL, the comment and the exact intent payload. */
export interface BoundTrial {
    packet: AppTrialPacket;
    entry: QualifyEntry;
    target: string;
    comment: ProofComment;
    /** Key order fixed (`number`, `marker`, `body`, `author`): Effects compares a saved payload as text. */
    payload: { number: number; marker: string; body: string; author: string };
}

/** The pending entry the packet approves, exactly as `parseGitHubApp` returns it: an initial trial, with no `revokes`. */
export function approvedEntry(packet: AppTrialPacket, target: string): QualifyEntry {
    return { mode: 'qualify', effectId: packet.effectId, installationId: packet.installationId, repositoryId: packet.repositoryId, adapter: TRIAL_OPERATION,
        target, beforeDigest: packet.beforeDigest, expectedDigest: packet.expectedDigest };
}

/**
 * What the packet alone binds, pure, with no config or provider read: this project and repository, a body that starts
 * with its marker exactly once, the absent-marker pre-state the adapter qualifies, and an intended change equal to the
 * approved digest. A saved attempt is compared with this binding whatever the config says now.
 */
export function bindPacket(project: Pick<OfficeProject, 'id' | 'provider' | 'repository'>, packet: AppTrialPacket): BoundTrial {
    const number = packet.issue.number, target = `https://github.com/${packet.repository}/issues/${number}`;
    if (project.provider !== 'github' || project.id !== packet.projectId || project.repository !== packet.repository)
        refuse('the project or repository is not the approved one');
    if (!packet.body.startsWith(packet.marker) || packet.body.indexOf(packet.marker, 1) >= 0) refuse('the body must start with its marker, exactly once');
    if (packet.beforeDigest !== canonicalDigest(null)) refuse('the trial must bind an issue without its marker');
    const payload = { number, marker: packet.marker, body: packet.body, author: packet.botLogin };
    if (changeDigest({ id: packet.effectId, operation: TRIAL_OPERATION, target, payload }) !== packet.expectedDigest)
        refuse('the body, marker or author does not match the approved change');
    return { packet, entry: approvedEntry(packet, target), target, payload, comment: { number, kind: 'issue', marker: packet.marker, body: packet.body } };
}
