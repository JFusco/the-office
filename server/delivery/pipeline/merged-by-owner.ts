import type { GitHubDelivery } from './github-delivery';

/** True when GitHub reports the pull request merged by the project owner (the board owner, else the repository owner). */
export function mergedByOwner(delivery: Pick<GitHubDelivery, 'store'>, pull: any): boolean {
    const { store } = delivery, owner = store.project.githubProject?.owner || store.project.repository.split('/')[0];
    return !!pull.merged_at && pull.merged_by?.login === owner;
}
