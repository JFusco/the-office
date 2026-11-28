import type { Execute } from '../../../delivery/board/project-graphql';
import type { Store } from '../../../store/store';
import { isPullPacket, type BoundTrial } from './trial-packet';
import { refuse } from './trial-refusal';

/**
 * The GitHub target as it stands, read-only: the repository's numeric id (an App token is scoped by it) and the
 * conversation's own identity at the approved URL. An issue must be open and unlocked. A pull request must be open,
 * unmerged and unlocked, in this repository, at the approved head and base. A moved or transferred issue answers with
 * another URL, a replaced one with another id. Read once before the intent exists, where a refusal creates and spends
 * nothing, and again as the write boundary's credential check, the last awaited step before the claim, where a
 * refusal rejects the prepared intent unsent. GitHub accepts comments on a closed issue or pull request, so only this
 * check keeps the approved open state.
 */
export async function observeTarget(store: Store, execute: Execute, trial: BoundTrial): Promise<void> {
    const { packet, target } = trial;
    const read = async (path: string) => JSON.parse(await execute('gh', ['api', path], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    const repository = await read(`repos/${packet.repository}`);
    if (repository?.id !== packet.repositoryId) refuse('GitHub reports a different repository id');
    if (isPullPacket(packet)) {
        const approved = packet.pull, pr = await read(`repos/${packet.repository}/pulls/${approved.number}`);
        if (pr?.number !== approved.number || pr.id !== approved.id || pr.node_id !== approved.nodeId || pr.html_url !== target ||
            pr.base?.repo?.full_name !== packet.repository || pr.head?.repo?.full_name !== packet.repository)
            refuse('GitHub reports a different pull request');
        if (pr.head.sha !== approved.head.sha || pr.head.ref !== approved.head.ref || pr.base.ref !== approved.base.ref)
            refuse('the pull request is not at the approved head and base');
        if (pr.state !== 'open' || pr.merged !== false || pr.locked !== false) refuse('the pull request is not open, unmerged and unlocked');
        return;
    }
    const issue = await read(`repos/${packet.repository}/issues/${packet.issue.number}`);
    if (issue?.number !== packet.issue.number || issue.id !== packet.issue.id || issue.node_id !== packet.issue.nodeId || issue.html_url !== target || issue.pull_request)
        refuse('GitHub reports a different issue');
    if (issue.state !== 'open' || issue.locked !== false) refuse('the issue is not open and unlocked');
}
