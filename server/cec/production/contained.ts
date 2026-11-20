import type { AzureBinding } from '../../office/project-bindings-config';

export type AzureRead = <T>(args: string[]) => Promise<T>;
type Azure = Pick<AzureBinding, 'project' | 'repositoryId'>;

/**
 * Whether `commit` is contained in `base` (a branch name or a commit): Azure counts the commits the
 * target has that the base does not, and none means contained. A squashed or rewritten copy of the
 * commit is not the commit, and is not contained.
 */
export async function containedIn(read: AzureRead, azure: Azure, base: { branch: string } | { commit: string }, commit: string): Promise<boolean> {
    const [version, type] = 'branch' in base ? [base.branch, 'branch'] : [base.commit, 'commit'];
    const diff = await read<{ aheadCount?: unknown }>(['devops', 'invoke', '--area', 'git', '--resource', 'commitDiffs', '--route-parameters', `project=${azure.project}`, `repositoryId=${azure.repositoryId}`,
        '--query-parameters', `baseVersion=${version}`, `baseVersionType=${type}`, `targetVersion=${commit}`, 'targetVersionType=commit', '$top=1', '--api-version', '7.1', '--http-method', 'GET']);
    if (!Number.isInteger(diff?.aheadCount)) throw new Error('Azure did not say how the commit compares');
    return diff.aheadCount === 0;
}
