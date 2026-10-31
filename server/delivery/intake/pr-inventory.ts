import type { GitHubDelivery } from '../../github-delivery';

/** Complete live open-PR inventory; a stale cache is never proof that no PR exists. */
export async function openPullInventory(delivery: GitHubDelivery): Promise<any[]> {
    const { store, execute } = delivery;
    const pages = JSON.parse(await execute('gh', ['api', `repos/${store.project.repository}/pulls?state=open&per_page=100`, '--paginate', '--slurp'], { cwd: store.project.repo, timeout: 60000, readOnly: true }));
    if (!Array.isArray(pages) || pages.some(page => !Array.isArray(page)))
        throw new Error('Open pull request inventory is incomplete');
    return pages.flat();
}
