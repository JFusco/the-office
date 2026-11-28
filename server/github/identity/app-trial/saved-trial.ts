import { isDeepStrictEqual } from 'node:util';
import type { EffectIntent } from '../../../../src/shared';
import type { EffectWriter } from '../../../../src/contracts/write-identity';
import { canonicalDigest, entryDigest } from '../route-entry';
import { TRIAL_OPERATION, type BoundTrial } from './trial-packet';
import { refuse } from './trial-refusal';

/** The authorization saved on the trial intent: Joe's approval of this exact packet and configured entry. */
export const TRIAL_AUTHORIZATION = 'joe-approved-app-trial';

/**
 * The trial's expected state: the entry it is granted under and the digest of the whole approved packet, so a saved
 * intent stays bound to every approved identifier, including the issue's id and node id, across restart and read-back.
 */
export const trialExpectedState = (trial: BoundTrial) => ({ entryDigest: entryDigest(trial.entry), packetDigest: canonicalDigest(trial.packet) });

/** True for the one writer the trial may use: every field pinned, the approved App and bot under this entry's trial grant and exact binding. */
export function isTrialWriter(writer: EffectWriter | undefined, trial: BoundTrial): boolean {
    const { packet } = trial;
    return isDeepStrictEqual(writer, {
        principal: 'app', projectId: packet.projectId, repository: packet.repository, operation: 'comment', login: packet.botLogin,
        appId: packet.appId, installationId: packet.installationId, botId: packet.botId, repositoryId: packet.repositoryId,
        grant: { kind: 'trial', entryDigest: entryDigest(trial.entry) },
        binding: { adapter: TRIAL_OPERATION, target: trial.target, expectedDigest: packet.expectedDigest, beforeDigest: packet.beforeDigest },
    } satisfies EffectWriter);
}

/** A saved intent under the trial id must be this trial: same work, operation, payload, authorization and packet, pinned to the trial writer. */
export function assertSavedTrial(intent: Readonly<EffectIntent>, trial: BoundTrial): void {
    const { packet } = trial;
    if (intent.operation !== TRIAL_OPERATION || intent.target !== trial.target || intent.authorization !== TRIAL_AUTHORIZATION || intent.attemptId !== packet.effectId ||
        !isDeepStrictEqual(intent.work, { projectId: packet.projectId, kind: 'issue', id: String(packet.issue.number) }) ||
        JSON.stringify(intent.payload) !== JSON.stringify(trial.payload) || !isDeepStrictEqual(intent.expectedState, trialExpectedState(trial)) || !isTrialWriter(intent.writer, trial))
        refuse('the saved Effect with this id is not the approved App trial');
}
