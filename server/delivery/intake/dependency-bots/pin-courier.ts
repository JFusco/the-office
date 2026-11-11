import { readRepo } from '../dependabot/qualify';
import type { DependencyBot } from './adopt';
import type { Store } from '../../../store/store';

const LOGIN = 'pin-courier[bot]', USER_ID = 351979519;
export function pinCourierIdentityRefusal(store: Store, pull: any): string {
    if (pull.user?.login !== LOGIN || pull.user.id !== USER_ID) return 'the installed pin-courier author identity does not match';
    if (pull.draft) return 'it is a draft';
    if (!pull.head?.ref?.startsWith('renovate/')) return 'it is not a Renovate branch';
    if (pull.head.repo?.full_name !== store.project.repository) return 'it comes from another repository';
    if (pull.base?.ref !== store.project.target) return 'it does not target the configured base';
    return '';
}

export function pinCourierVerifiedCommit(commit: any): boolean {
    return commit.author?.login === LOGIN && commit.author.id === USER_ID &&
        commit.committer?.login === 'web-flow' && commit.commit?.verification?.verified === true;
}

/** The installed GitHub App's numeric author identity and GitHub-verified commits are both required. */
export const pinCourier: DependencyBot = {
    id: 'pin-courier', label: 'pin-courier',
    async openPulls(store, execute) {
        return (await readRepo(store, execute, 'pulls?state=open&per_page=100', true))
            .filter((pull: any) => pull.user?.login === LOGIN && pull.user.id === USER_ID);
    },
    async refusal(store, execute, pull) {
        const refusal = pinCourierIdentityRefusal(store, pull);
        if (refusal) return refusal;
        const commits = await readRepo(store, execute, `pulls/${pull.number}/commits?per_page=100`, true);
        if (!commits.length || commits.some((commit: any) => !pinCourierVerifiedCommit(commit)))
            return 'commits are not exclusively pin-courier authored and GitHub verified';
        return '';
    },
};
