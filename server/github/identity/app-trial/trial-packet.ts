import { z } from 'zod';
import type { OfficeProject } from '../../../../src/shared';
import type { ProofComment } from '../../../delivery/closeout/proof-comment';
import type { QualifyEntry } from '../app-config';
import { canonicalDigest } from '../route-entry';
import { changeDigest } from '../write-boundary';
import { refuse } from './trial-refusal';

/**
 * The fixed adapter of the trial on each conversation: the checked issue comment operation on an issue, and the pull
 * request comment operation (`rest-pr-comment`, with its Pull requests grant) on a pull request's conversation.
 */
export const TRIAL_OPERATION = 'github-issue-comment';
export const PR_TRIAL_OPERATION = 'github-pr-comment';
export type TrialOperation = typeof TRIAL_OPERATION | typeof PR_TRIAL_OPERATION;
/** Trial Effect ids are the command's own: never a harness id, and never a retry or writer-refusal successor. */
const TRIAL_ID = /^office-app-trial:[\w:.#@/+-]{1,280}$/;
const SUCCESSOR = /:(retry|writer)-\d+$/;
/** The whole suffix that `activeEffectId` retries and `writerSuccessor` refusals add to an id, possibly chained. */
const SUCCESSOR_SUFFIX = /^(?::(?:retry|writer)-\d+)+$/;
/** True when `candidate` is a retry or writer successor derived from `id`; an independently named `<id>:followup` is not. */
export const isSuccessorOf = (id: string, candidate: string) => candidate.startsWith(`${id}:`) && SUCCESSOR_SUFFIX.test(candidate.slice(id.length));
const positive = z.number().int().positive();
const digest = z.string().regex(/^[a-f0-9]{64}$/);

const common = {
    projectId: z.string().min(1).max(100),
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    repositoryId: positive,
    appId: positive,
    installationId: positive,
    botLogin: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,38}\[bot\]$/),
    botId: positive,
    effectId: z.string().regex(TRIAL_ID).refine(id => !SUCCESSOR.test(id), 'a successor id is never a trial'),
    marker: z.string().min(1).max(200),
    body: z.string().min(1).max(2000),
    beforeDigest: digest,
    expectedDigest: digest,
};
const nodeId = z.string().min(1).max(100), ref = z.string().min(1).max(255);
/** An issue trial: its packet is unchanged, so a saved issue trial keeps its packet digest. */
const IssueTrialPacket = z.strictObject({ ...common, issue: z.strictObject({ number: positive, id: positive, nodeId }) });
/** A pull request conversation trial: the PR's own id and node id, and the head and base it was approved at. */
const PullTrialPacket = z.strictObject({ ...common, pull: z.strictObject({
    number: positive, id: positive, nodeId, head: z.strictObject({ sha: z.string().regex(/^[a-f0-9]{40}$/), ref }), base: z.strictObject({ ref }),
}) });
/** The public approval packet: every identifier the approved trial names, on an issue or a pull request. Nothing secret. */
export const AppTrialPacket = z.union([IssueTrialPacket, PullTrialPacket]);
export type AppTrialPacket = z.infer<typeof AppTrialPacket>;
export type PullTrialPacket = z.infer<typeof PullTrialPacket>;
/** The approved pull request facts a PR trial's payload carries: its own ids, head and base. */
export interface PullTarget { id: number; nodeId: string; head: { sha: string; ref: string }; base: { ref: string } }
export const isPullPacket = (packet: AppTrialPacket): packet is PullTrialPacket => 'pull' in packet;

/** The trial the packet binds: the entry it approves, its adapter, the conversation URL, the comment and the exact intent payload. */
export interface BoundTrial {
    packet: AppTrialPacket;
    entry: QualifyEntry;
    operation: TrialOperation;
    target: string;
    comment: ProofComment;
    /**
     * Key order fixed (`number`, `marker`, `body`, `author`, then a pull request's `pull`): Effects compares a saved payload
     * as text. A pull request trial's payload also carries the PR's own ids and the approved head and base, so the
     * approved `expectedDigest` binds them; an issue trial's payload is unchanged.
     */
    payload: { number: number; marker: string; body: string; author: string; pull?: PullTarget };
}

/** The pending entry the packet approves, exactly as `parseGitHubApp` returns it: an initial trial, with no `revokes`. */
export function approvedEntry(packet: AppTrialPacket, target: string): QualifyEntry {
    return { mode: 'qualify', effectId: packet.effectId, installationId: packet.installationId, repositoryId: packet.repositoryId,
        adapter: isPullPacket(packet) ? PR_TRIAL_OPERATION : TRIAL_OPERATION, target, beforeDigest: packet.beforeDigest, expectedDigest: packet.expectedDigest };
}

/**
 * What the packet alone binds, pure, with no config or provider read: this project and repository, a body that starts
 * with its marker exactly once, the absent-marker pre-state the adapter qualifies, and an intended change equal to the
 * approved digest. A saved attempt is compared with this binding whatever the config says now.
 */
export function bindPacket(project: Pick<OfficeProject, 'id' | 'provider' | 'repository'>, packet: AppTrialPacket): BoundTrial {
    const pull = isPullPacket(packet), number = pull ? packet.pull.number : packet.issue.number, operation = pull ? PR_TRIAL_OPERATION : TRIAL_OPERATION;
    const target = `https://github.com/${packet.repository}/${pull ? 'pull' : 'issues'}/${number}`;
    if (project.provider !== 'github' || project.id !== packet.projectId || project.repository !== packet.repository)
        refuse('the project or repository is not the approved one');
    if (!packet.body.startsWith(packet.marker) || packet.body.indexOf(packet.marker, 1) >= 0) refuse('the body must start with its marker, exactly once');
    if (packet.beforeDigest !== canonicalDigest(null)) refuse('the trial must bind an issue without its marker');
    const payload: BoundTrial['payload'] = { number, marker: packet.marker, body: packet.body, author: packet.botLogin };
    if (pull) payload.pull = { id: packet.pull.id, nodeId: packet.pull.nodeId, head: { sha: packet.pull.head.sha, ref: packet.pull.head.ref }, base: { ref: packet.pull.base.ref } };
    if (changeDigest({ id: packet.effectId, operation, target, payload }) !== packet.expectedDigest)
        refuse('the body, marker or author does not match the approved change');
    return { packet, entry: approvedEntry(packet, target), operation, target, payload, comment: { number, kind: pull ? 'pull' : 'issue', marker: packet.marker, body: packet.body } };
}
