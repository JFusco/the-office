import { isDeepStrictEqual } from 'node:util';
import { holdReason } from '../../../office/project-holds';
import type { Store } from '../../../store/store';
import { githubIdentity } from '../identity-runtime';
import { entryDigest } from '../route-entry';
import { resolveWrite } from '../write-identity';
import { bindPacket, type AppTrialPacket, type BoundTrial } from './trial-packet';
import { refuse } from './trial-refusal';

/**
 * Whether the Office admits the trial now, synchronous and read-only: the packet's binding; the project neither
 * paused, draining nor holding the issue or pull request; the configured App, bot, repository binding and pending `comment` entry
 * equal to the packet; and the route selecting this Effect id as the designated App trial. Any other selection,
 * including the operator the route gives an undesignated id, refuses. Runs before the intent exists and again in
 * its preflight, so a withdrawn approval rejects the intent unsent.
 */
export function admitTrial(store: Store, packet: AppTrialPacket): BoundTrial {
    const { project } = store, trial = bindPacket(project, packet), key = `GH-${trial.comment.number}`;
    if (store.state.paused || store.state.draining) refuse('the project is paused or draining');
    if (holdReason(project, key)) refuse(`${key} is held`);
    const config = githubIdentity(store).config();
    if (!config || config.appId !== packet.appId || config.installationId !== packet.installationId || config.botLogin !== packet.botLogin || config.botId !== packet.botId)
        refuse('the configured App, installation or bot is not the approved one');
    const repository = config!.repositories[project.id];
    if (repository?.repository !== packet.repository || repository.repositoryId !== packet.repositoryId)
        refuse('the configured repository binding is not the approved one');
    const entry = config!.writes[project.id]?.comment;
    if (!entry || entry === 'operator' || entry.mode !== 'qualify') return refuse('no pending comment trial is configured for this project');
    if (!isDeepStrictEqual(entry, trial.entry)) refuse('the configured trial does not name this Effect, issue and change');
    const decision = resolveWrite(store, config, { effectId: packet.effectId, operation: 'comment', binding: { adapter: trial.operation, target: trial.target, expectedDigest: packet.expectedDigest } }, { apply: false });
    if (decision.kind !== 'app' || decision.grant.kind !== 'trial' || decision.grant.entryDigest !== entryDigest(trial.entry))
        refuse(decision.kind === 'hold' ? `the route holds: ${decision.reason}` : 'the route would not send this Effect as the designated App trial');
    return trial;
}
