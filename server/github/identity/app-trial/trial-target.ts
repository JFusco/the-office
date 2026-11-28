import type { Execute } from '../../../delivery/board/project-graphql';
import type { Store } from '../../../store/store';
import type { BoundTrial } from './trial-packet';
import { refuse } from './trial-refusal';

/**
 * The GitHub target as it stands, read-only: the repository's numeric id (an App token is scoped by it) and the
 * issue's own identity, open and unlocked at the approved URL. A moved or transferred issue answers with another URL,
 * a replaced one with another id. Read once before the intent exists, where a refusal creates and spends nothing, and
 * again as the write boundary's credential check, the last awaited step before the claim, where a refusal rejects the
 * prepared intent unsent. GitHub accepts comments on a closed issue, so only this check keeps the approved open state.
 */
export async function observeTarget(store: Store, execute: Execute, trial: BoundTrial): Promise<void> {
    const { packet, target } = trial;
    const read = async (path: string) => JSON.parse(await execute('gh', ['api', path], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    const repository = await read(`repos/${packet.repository}`);
    if (repository?.id !== packet.repositoryId) refuse('GitHub reports a different repository id');
    const issue = await read(`repos/${packet.repository}/issues/${packet.issue.number}`);
    if (issue?.number !== packet.issue.number || issue.id !== packet.issue.id || issue.node_id !== packet.issue.nodeId || issue.html_url !== target || issue.pull_request)
        refuse('GitHub reports a different issue');
    if (issue.state !== 'open' || issue.locked !== false) refuse('the issue is not open and unlocked');
}
